const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Comment = require('../models/Comment');
const { adminRequired } = require('../middleware/auth');

const router = express.Router();
router.use(adminRequired);

async function collectCommentIds(seedIds) {
  const all = new Set(seedIds.map(String));
  let added = true;
  while (added) {
    added = false;
    const children = await Comment.find({ parent: { $in: [...all] } }).select('_id');
    for (const c of children) {
      const k = c._id.toString();
      if (!all.has(k)) {
        all.add(k);
        added = true;
      }
    }
  }
  return [...all];
}

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalAdmins, totalPlans, totalComments, saveAgg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Plan.countDocuments(),
      Comment.countDocuments(),
      User.aggregate([{ $group: { _id: null, total: { $sum: { $size: '$savedPlans' } } } }]),
    ]);

    const [plansByType, recentPlans, recentUsers, recentComments, topUsers] = await Promise.all([
      Plan.aggregate([
        { $group: { _id: '$productType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Plan.find().populate('author', 'name email').populate('commentsCount').sort({ createdAt: -1 }).limit(5),
      User.find().sort({ createdAt: -1 }).limit(5),
      Comment.find().populate('author', 'name').populate('plan', 'title').sort({ createdAt: -1 }).limit(5),
      Plan.aggregate([
        { $group: { _id: '$author', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
        { $unwind: '$u' },
        { $project: { name: '$u.name', email: '$u.email', count: 1 } },
      ]),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalAdmins,
        totalPlans,
        totalComments,
        totalSaves: saveAgg[0]?.total || 0,
      },
      plansByType,
      recentPlans,
      recentUsers,
      recentComments,
      topUsers,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users?q=&limit=
router.get('/users', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
    const filter = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const users = await User.aggregate([
      { $match: filter },
      { $lookup: { from: 'plans', localField: '_id', foreignField: 'author', as: 'plans' } },
      { $lookup: { from: 'comments', localField: '_id', foreignField: 'author', as: 'comments' } },
      {
        $addFields: {
          planCount: { $size: '$plans' },
          commentCount: { $size: '$comments' },
          saveCount: { $size: '$savedPlans' },
        },
      },
      { $project: { name: 1, email: 1, role: 1, createdAt: 1, planCount: 1, commentCount: 1, saveCount: 1 } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ]);
    res.json({ users: users.map((u) => ({ ...u, id: u._id.toString() })) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role  { role: 'admin' | 'user' }
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const { role } = req.body || {};
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'role must be admin or user' });
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Cannot change your own role' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (target.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) return res.status(400).json({ error: 'Cannot demote the last admin' });
    }

    target.role = role;
    await target.save();
    res.json({ ok: true, user: { id: target.id, role: target.role } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Cannot delete your own account' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const planIds = (await Plan.find({ author: user._id }).select('_id')).map((p) => p._id);
    const commentSeeds = await Comment.find({
      $or: [{ author: user._id }, ...(planIds.length ? [{ plan: { $in: planIds } }] : [])],
    }).select('_id');
    const commentIds = await collectCommentIds(commentSeeds.map((c) => c._id));
    if (commentIds.length) await Comment.deleteMany({ _id: { $in: commentIds } });
    if (planIds.length) await Plan.deleteMany({ _id: { $in: planIds } });
    await User.updateMany({ savedPlans: user._id }, { $pull: { savedPlans: user._id } });
    await user.deleteOne();

    res.json({ ok: true, removed: { plans: planIds.length, comments: commentIds.length } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/plans?q=&type=&limit=
router.get('/plans', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const type = req.query.type;
    const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
    const filter = {};
    if (type && type !== 'all') filter.productType = type;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { productType: rx }];
    }
    const plans = await Plan.find(filter)
      .populate('author', 'name email')
      .populate('commentsCount')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/plans/:id
router.delete('/plans/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const commentSeeds = await Comment.find({ plan: plan._id }).select('_id');
    const commentIds = await collectCommentIds(commentSeeds.map((c) => c._id));
    if (commentIds.length) await Comment.deleteMany({ _id: { $in: commentIds } });
    await User.updateMany({ savedPlans: plan._id }, { $pull: { savedPlans: plan._id } });
    await plan.deleteOne();

    res.json({ ok: true, removed: { comments: commentIds.length } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/comments?limit=
router.get('/comments', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
    const comments = await Comment.find()
      .populate('author', 'name')
      .populate('plan', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/comments/:id
router.delete('/comments/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const ids = await collectCommentIds([req.params.id]);
    await Comment.deleteMany({ _id: { $in: ids } });
    res.json({ ok: true, removed: { comments: ids.length } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;