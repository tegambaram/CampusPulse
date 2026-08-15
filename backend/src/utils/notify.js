const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification } = require('./pushNotifications');

// Single place that does all three steps of "tell a user something happened":
// persist it, push it live over the socket if they're online, and send a real
// device push if they have a token registered. Used by both REST routes and
// the socket layer so booking/message notifications behave identically.
const notifyUser = async ({ io, userId, type, title, body, data = {} }) => {
  const notification = await Notification.create({ user: userId, type, title, body, data });

  // Event name must match screens/NotificationsScreen.js's socket.on('notification', ...).
  if (io) io.to(`user:${userId}`).emit('notification', notification);

  const recipient = await User.findById(userId);
  if (recipient?.expoPushToken) {
    await sendPushNotification({ to: recipient.expoPushToken, title, body, data });
  }

  return notification;
};

module.exports = { notifyUser };
