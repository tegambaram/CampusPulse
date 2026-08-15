const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: true, validate: (v) => v.length === 2 },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    // Map of userId -> unread count for that user in this conversation.
    unreadCount: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
