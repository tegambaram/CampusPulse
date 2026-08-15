const { Server } = require('socket.io');
const { verifyToken } = require('../utils/token');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { notifyUser } = require('../utils/notify');
const { isBlockedEitherWay } = require('../utils/blocking');

// Event names/payloads here are dictated by the frontend (context/AuthContext.js,
// utils/socketClient.js, hooks/useSocket.js, screens/ChatScreen.js, MessagesScreen.js,
// NotificationsScreen.js) which were already built against this exact contract:
//   client -> server: join_conversation(id), leave_conversation(id), message_read({conversationId}),
//                      typing({conversationId}), stop_typing({conversationId}), send_message({conversationId, text})
//   server -> client: receive_message(message), typing/stop_typing({conversationId}),
//                      user_online/user_offline({userId}), notification(notification)

// Tracks how many active sockets each user has open, so we only flip offline once their
// *last* connection (e.g. closing one of two tabs) drops.
const onlineCounts = new Map();

const attachSocket = (httpServer, corsOrigin) => {
  const io = new Server(httpServer, { cors: { origin: corsOrigin } });

  io.use((socket, next) => {
    try {
      socket.userId = verifyToken(socket.handshake.auth?.token);
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const { userId } = socket;
    socket.join(`user:${userId}`);

    const count = (onlineCounts.get(userId) || 0) + 1;
    onlineCounts.set(userId, count);
    if (count === 1) {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('user_online', { userId });
    }

    socket.on('join_conversation', (conversationId) => socket.join(`conversation:${conversationId}`));
    socket.on('leave_conversation', (conversationId) => socket.leave(`conversation:${conversationId}`));

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', { conversationId });
    });
    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('stop_typing', { conversationId });
    });

    // Clears the badge for this user when they open a conversation.
    socket.on('message_read', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        conversation.unreadCount.set(userId, 0);
        await conversation.save();
      } catch (err) {
        console.error('[socket] message_read failed', err);
      }
    });

    // The core "reply" flow: save the message, bump the recipient's unread count, and
    // notify them (in-app instantly if online, real device push if they're not).
    socket.on('send_message', async ({ conversationId, text }) => {
      try {
        if (!text || !text.trim()) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some((p) => p.toString() === userId)) return;

        const otherId = conversation.participants.find((p) => p.toString() !== userId)?.toString();
        if (otherId && (await isBlockedEitherWay(userId, otherId))) {
          socket.emit('send_message_error', { conversationId, message: "You can't message this user." });
          return;
        }

        const message = await Message.create({ conversation: conversationId, sender: userId, text });

        conversation.lastMessage = text;
        conversation.lastMessageAt = message.createdAt;
        if (otherId) conversation.unreadCount.set(otherId, (conversation.unreadCount.get(otherId) || 0) + 1);
        await conversation.save();

        io.to(`conversation:${conversationId}`).emit('receive_message', message);

        if (otherId) {
          const sender = await User.findById(userId);
          await notifyUser({ io, userId: otherId, type: 'new_message', title: sender.name, body: text, data: { conversationId } });
        }
      } catch (err) {
        console.error('[socket] send_message failed', err);
      }
    });

    socket.on('disconnect', async () => {
      const remaining = (onlineCounts.get(userId) || 1) - 1;
      onlineCounts.set(userId, remaining);
      if (remaining <= 0) {
        onlineCounts.delete(userId);
        await User.findByIdAndUpdate(userId, { isOnline: false });
        io.emit('user_offline', { userId });
      }
    });
  });

  return io;
};

module.exports = attachSocket;
