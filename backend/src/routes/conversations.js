const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');
const { isBlockedEitherWay } = require('../utils/blocking');

const router = express.Router();

const populate = (conversation, myId) => {
  const other = conversation.participants.find((p) => p._id.toString() !== myId);
  return {
    id: conversation._id.toString(),
    user: other ? other.toPublicJSON() : null,
    lastMessage: conversation.lastMessage,
    time: conversation.lastMessageAt,
    unreadCount: conversation.unreadCount?.get?.(myId) || 0,
    online: other?.isOnline || false,
  };
};

router.get('/', requireAuth, async (req, res) => {
  const myId = req.userId;
  const conversations = await Conversation.find({ participants: myId })
    .populate('participants')
    .sort({ lastMessageAt: -1 });
  res.json(conversations.map((c) => populate(c, myId)));
});

router.post('/', requireAuth, async (req, res) => {
  const myId = req.userId;
  const { userId } = req.body;
  if (userId === myId) return res.status(400).json({ message: "You can't start a conversation with yourself." });
  if (await isBlockedEitherWay(myId, userId)) {
    return res.status(403).json({ message: "You can't message this user." });
  }

  let conversation = await Conversation.findOne({ participants: { $all: [myId, userId], $size: 2 } }).populate('participants');
  if (!conversation) {
    conversation = await Conversation.create({ participants: [myId, userId], lastMessage: '', unreadCount: {} });
    conversation = await conversation.populate('participants');
  }
  res.json(populate(conversation, myId));
});

router.get('/:id/messages', requireAuth, async (req, res) => {
  const messages = await Message.find({ conversation: req.params.id }).sort({ createdAt: 1 });
  res.json({ data: messages });
});

// REST fallback for sending a message (ChatScreen normally sends via the socket 'send_message'
// event for instant delivery and only falls back to this when the socket isn't connected).
router.post('/:id/messages', requireAuth, async (req, res) => {
  const myId = req.userId;
  const { text } = req.body;
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: 'This conversation no longer exists.' });

  const otherId = conversation.participants.find((p) => p.toString() !== myId)?.toString();
  if (otherId && (await isBlockedEitherWay(myId, otherId))) {
    return res.status(403).json({ message: "You can't message this user." });
  }

  const message = await Message.create({ conversation: conversation._id, sender: myId, text });
  conversation.lastMessage = text;
  conversation.lastMessageAt = message.createdAt;
  if (otherId) conversation.unreadCount.set(otherId, (conversation.unreadCount.get(otherId) || 0) + 1);
  await conversation.save();

  if (otherId) {
    const sender = await User.findById(myId);
    const io = req.app.get('io');
    await notifyUser({
      io,
      userId: otherId,
      type: 'new_message',
      title: sender.name,
      body: text,
      data: { conversationId: conversation._id.toString() },
    });
    io?.to(`conversation:${conversation._id}`).emit('receive_message', message);
  }

  res.json(message);
});

module.exports = router;
