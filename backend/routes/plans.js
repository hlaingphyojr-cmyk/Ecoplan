const express = require('express');
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function withAuthor(query) {
  return query.populate('author', 'name email').populate('commentsCount');
}

// GET /api/plans?q=&type=&saved=1&mine=1&sort=newest
router.get('/', async (req, res, next) => {
  try {
    const { q, type, sort } = req.query;
    const filter = {};

    if (type && type !== 'all') filter.productType = type;
    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { productType: rx }];
    }

    let query = Plan.find(filter);
    if (sort === 'oldest') query = query.sort({ createdAt: 1 });
    else query = query.sort({ createdAt: -1 });

    const plans = await withAuthor(query);
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

// GET /api/plans/saved - current user's bookmarks
router.get('/saved', authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const plans = await withAuthor(Plan.find({ _id: { $in: user.savedPlans } }).sort({ createdAt: -1 }));
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

// GET /api/plans/mine - current user's own plans
router.get('/mine', authRequired, async (req, res, next) => {
  try {
    const plans = await withAuthor(Plan.find({ author: req.userId }).sort({ createdAt: -1 }));
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

// GET /api/plans/types - distinct product types for the filter
router.get('/types', async (req, res, next) => {
  try {
    const types = await Plan.distinct('productType');
    res.json({ types: types.filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

// GET /api/plans/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const plan = await Plan.findById(req.params.id).populate('author', 'name email').populate('commentsCount');
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    const comments = await Comment.find({ plan: plan._id }).populate('author', 'name').sort({ createdAt: 1 });
    res.json({ plan, comments });
  } catch (err) {
    next(err);
  }
});

// POST /api/plans
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { title, productType, description, materials, steps, baseline, optimized } = req.body || {};
    if (!title || !productType || !description || !baseline || !optimized) {
      return res.status(400).json({ error: 'title, productType, description, baseline and optimized are required' });
    }
    const plan = await Plan.create({
      title,
      productType,
      description,
      materials: materials || [],
      steps: steps || [],
      baseline,
      optimized,
      author: req.userId,
    });
    const populated = await Plan.findById(plan._id).populate('author', 'name email');
    res.status(201).json({ plan: populated });
  } catch (err) {
    next(err);
  }
});

// PUT /api/plans/:id
router.put('/:id', authRequired, async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    if (plan.author.toString() !== req.userId) return res.status(403).json({ error: 'Not your plan' });

    const { title, productType, description, materials, steps, baseline, optimized } = req.body || {};
    if (title) plan.title = title;
    if (productType) plan.productType = productType;
    if (description) plan.description = description;
    if (materials) plan.materials = materials;
    if (steps) plan.steps = steps;
    if (baseline) plan.baseline = baseline;
    if (optimized) plan.optimized = optimized;
    await plan.save();

    const populated = await Plan.findById(plan._id).populate('author', 'name email');
    res.json({ plan: populated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/plans/:id
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    if (plan.author.toString() !== req.userId) return res.status(403).json({ error: 'Not your plan' });
    await Comment.deleteMany({ plan: plan._id });
    await plan.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/plans/:id/save
router.post('/:id/save', authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.savedPlans.includes(req.params.id)) user.savedPlans.push(req.params.id);
    await user.save();
    res.json({ ok: true, saved: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/plans/:id/save
router.delete('/:id/save', authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    user.savedPlans = user.savedPlans.filter((id) => id.toString() !== req.params.id);
    await user.save();
    res.json({ ok: true, saved: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;