const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const { authRequired } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const comments = await Comment.find({ plan: req.params.planId })
      .populate('author', 'name')
      .sort({ createdAt: 1 });
    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.planId)) {
      return res.status(400).json({ error: 'Invalid plan id' });
    }
    const { text, parentId } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text is required' });

    let parent = null;
    if (parentId) {
      if (!mongoose.isValidObjectId(parentId)) {
        return res.status(400).json({ error: 'Invalid parent comment id' });
      }
      const parentComment = await Comment.findOne({
        _id: parentId,
        plan: req.params.planId,
      });
      if (!parentComment) return res.status(400).json({ error: 'Parent comment not found for this plan' });
      // Unlimited nesting: replies attach directly to the targeted comment.
      parent = parentComment._id;
    }

    const comment = await Comment.create({
      plan: req.params.planId,
      author: req.userId,
      parent,
      text,
    });
    const populated = await Comment.findById(comment._id).populate('author', 'name');
    res.status(201).json({ comment: populated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;