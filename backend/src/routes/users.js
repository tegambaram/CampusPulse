const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Review = require('../models/Review');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const [postsCount, reviewsCount] = await Promise.all([
    Post.countDocuments({ user: req.params.id, status: { $ne: 'deleted' } }),
    Review.countDocuments({ toUser: req.params.id }),
  ]);
  res.json({ ...user.toPublicJSON(), stats: { postsCount, reviewsCount } });
});

router.put('/me', requireAuth, async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json(req.user.toPublicJSON());
});

// Takes a local/remote image URI directly (no upload storage backend yet) and saves it as-is,
// same behavior as the local-only build. Swap this for real object storage (e.g. Cloudinary) later.
router.post('/me/avatar', requireAuth, async (req, res) => {
  req.user.profileImage = req.body.uri;
  await req.user.save();
  res.json({ profileImage: req.user.profileImage });
});

router.get('/:id/reviews', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const reviews = await Review.find({ toUser: req.params.id })
    .populate('fromUser')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ data: reviews });
});

router.get('/:id/posts', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const posts = await Post.find({ user: req.params.id, status: { $ne: 'deleted' } })
    .populate('user')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ data: posts });
});

module.exports = router;
