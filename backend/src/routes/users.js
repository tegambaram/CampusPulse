const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Review = require('../models/Review');
const Report = require('../models/Report');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// NOTE: routes with a fixed prefix (/me/*, /blocked) must be declared before the
// /:id catch-all below, or Express would match "blocked"/"me" as an :id value instead.

router.get('/blocked', requireAuth, async (req, res) => {
  await req.user.populate('blockedUsers');
  res.json(req.user.blockedUsers.map((u) => u.toPublicJSON()));
});

router.post('/:id/block', requireAuth, async (req, res) => {
  if (req.params.id === req.userId) return res.status(400).json({ message: "You can't block yourself." });
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found.' });

  const alreadyBlocked = req.user.blockedUsers.some((id) => id.toString() === req.params.id);
  req.user.blockedUsers = alreadyBlocked
    ? req.user.blockedUsers.filter((id) => id.toString() !== req.params.id)
    : [...req.user.blockedUsers, req.params.id];
  await req.user.save();

  res.json({ blocked: !alreadyBlocked });
});

router.post('/:id/report', requireAuth, async (req, res) => {
  if (req.params.id === req.userId) return res.status(400).json({ message: "You can't report yourself." });
  const { reason, details, postId } = req.body;
  const validReasons = ['spam', 'harassment', 'scam', 'inappropriate_content', 'fake_profile', 'other'];
  if (!validReasons.includes(reason)) {
    return res.status(400).json({ message: 'Please choose a valid reason for the report.' });
  }
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found.' });

  const report = await Report.create({
    reporter: req.userId,
    reportedUser: req.params.id,
    post: postId || null,
    reason,
    details: details || '',
  });
  res.json({ message: 'Thanks — we\'ve received your report and will look into it.', reportId: report._id });
});

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
