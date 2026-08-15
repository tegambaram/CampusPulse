const express = require('express');
const Post = require('../models/Post');
const Category = require('../models/Category');

const router = express.Router();

// Escapes regex metacharacters so a search like "C++ (intro)" is treated as a literal
// string instead of crashing new RegExp() with an unbalanced-parenthesis SyntaxError.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  const page = Number(req.query.page) || 1;
  const limit = 20;
  const needle = new RegExp(escapeRegex(q), 'i');
  const filter = {
    status: { $ne: 'deleted' },
    $or: [{ title: needle }, { description: needle }, { category: needle }],
  };

  const [data, total] = await Promise.all([
    Post.find(filter)
      .populate('user')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Post.countDocuments(filter),
  ]);

  res.json({ data, meta: { hasMore: page * limit < total } });
});

router.get('/trending', async (req, res) => {
  const categories = await Category.find().sort({ postCount: -1 }).limit(6);
  res.json(categories);
});

module.exports = router;
