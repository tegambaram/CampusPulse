const express = require('express');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Post = require('../models/Post');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const filter = { $or: [{ requester: req.userId }, { provider: req.userId }] };
  if (req.query.status) filter.status = req.query.status;
  const bookings = await Booking.find(filter)
    .populate('post')
    .populate('requester')
    .populate('provider')
    .sort({ scheduledDate: -1 });
  res.json(bookings);
});

router.post('/', requireAuth, async (req, res) => {
  const { postId } = req.body;
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: 'This post no longer exists.' });
  if (post.user.toString() === req.userId) return res.status(400).json({ message: "You can't book your own post." });

  const booking = await Booking.create({
    post: postId,
    requester: req.userId,
    provider: post.user,
    status: 'upcoming',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await booking.populate(['post', 'requester', 'provider']);

  const io = req.app.get('io');
  await notifyUser({
    io,
    userId: post.user.toString(),
    type: 'new_request',
    title: 'New Request',
    body: `${booking.requester.name} wants to book "${post.title}"`,
    data: { bookingId: booking._id.toString(), postId },
  });

  res.json(booking);
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'This booking no longer exists.' });

  booking.status = status;
  await booking.save();
  await booking.populate(['post', 'requester', 'provider']);

  if (status === 'completed' || status === 'cancelled' || status === 'upcoming') {
    const io = req.app.get('io');
    const notifyTarget = req.userId === booking.requester._id.toString() ? booking.provider._id.toString() : booking.requester._id.toString();
    await notifyUser({
      io,
      userId: notifyTarget,
      type: 'booking_accepted',
      title: 'Booking Update',
      body: `Booking for "${booking.post.title}" is now ${status}.`,
      data: { bookingId: booking._id.toString() },
    });
  }

  res.json(booking);
});

router.post('/:id/review', requireAuth, async (req, res) => {
  const { rating, comment } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'This booking no longer exists.' });

  const review = await Review.create({ booking: booking._id, fromUser: req.userId, toUser: booking.provider, rating, comment: comment || '' });

  const provider = await User.findById(booking.provider);
  if (provider) {
    const newCount = (provider.ratingCount || 0) + 1;
    provider.rating = Math.round((((provider.rating || 0) * (provider.ratingCount || 0) + rating) / newCount) * 10) / 10;
    provider.ratingCount = newCount;
    await provider.save();
  }

  res.json(review);
});

module.exports = router;
