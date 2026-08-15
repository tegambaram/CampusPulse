const express = require('express');
const Post = require('../models/Post');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Feed/post-detail are public (guests can browse); the frontend computes each viewer's
// own liked/bookmarked state client-side from the raw likedBy/bookmarkedBy id arrays below.
router.get('/', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const filter = { status: { $ne: 'deleted' } };
  if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;

  const [data, total] = await Promise.all([
    Post.find(filter)
      .populate('user')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Post.countDocuments(filter),
  ]);

  res.json({ data, meta: { hasMore: page * limit < total, page, total } });
});

router.get('/bookmarked', requireAuth, async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const filter = { bookmarkedBy: req.userId, status: { $ne: 'deleted' } };
  const [data, total] = await Promise.all([
    Post.find(filter)
      .populate('user')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Post.countDocuments(filter),
  ]);
  res.json({ data, meta: { hasMore: page * limit < total, page, total } });
});

router.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id).populate('user');
  if (!post) return res.status(404).json({ message: 'This post no longer exists.' });
  res.json(post);
});

router.post('/', requireAuth, async (req, res) => {
  const { type, title, description, category, compensationType, compensationAmount, location, imageUri } = req.body;
  const post = await Post.create({
    user: req.userId,
    type,
    title,
    description,
    category,
    compensationType: compensationType || 'free',
    compensationAmount: compensationAmount ? Number(compensationAmount) : undefined,
    location: location || '',
    images: imageUri ? [imageUri] : [],
  });
  res.json(await post.populate('user'));
});

router.put('/:id', requireAuth, async (req, res) => {
  const patch = { ...req.body };
  if (patch.compensationAmount !== undefined) patch.compensationAmount = patch.compensationAmount ? Number(patch.compensationAmount) : undefined;
  if (patch.imageUri !== undefined) {
    patch.images = patch.imageUri ? [patch.imageUri] : [];
    delete patch.imageUri;
  }
  const updated = await Post.findOneAndUpdate({ _id: req.params.id, user: req.userId }, patch, { new: true }).populate('user');
  if (!updated) return res.status(404).json({ message: 'This post no longer exists.' });
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await Post.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ message: 'Post deleted' });
});

router.post('/:id/like', requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'This post no longer exists.' });
  const liked = post.likedBy.some((id) => id.toString() === req.userId);
  post.likedBy = liked ? post.likedBy.filter((id) => id.toString() !== req.userId) : [...post.likedBy, req.userId];
  await post.save();
  res.json({ liked: !liked, likesCount: post.likedBy.length });
});

router.post('/:id/bookmark', requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'This post no longer exists.' });
  const bookmarked = post.bookmarkedBy.some((id) => id.toString() === req.userId);
  post.bookmarkedBy = bookmarked ? post.bookmarkedBy.filter((id) => id.toString() !== req.userId) : [...post.bookmarkedBy, req.userId];
  await post.save();
  res.json({ bookmarked: !bookmarked, bookmarkedCount: post.bookmarkedBy.length });
});

module.exports = router;
