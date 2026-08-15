const express = require('express');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 20;
  const [data, total] = await Promise.all([
    Notification.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ user: req.userId }),
  ]);
  res.json({ data, meta: { hasMore: page * limit < total } });
});

router.post('/:id/read', requireAuth, async (req, res) => {
  const updated = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isRead: true }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Notification not found.' });
  res.json(updated);
});

router.post('/read-all', requireAuth, async (req, res) => {
  await Notification.updateMany({ user: req.userId, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;
