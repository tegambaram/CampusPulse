const User = require('../models/User');

// True if either user has blocked the other. Checked before letting two users start a
// new conversation or send a message, in both the REST routes (routes/conversations.js)
// and the socket layer (sockets/index.js), so blocking can't be bypassed via either path.
const isBlockedEitherWay = async (userAId, userBId) => {
  const [a, b] = await Promise.all([
    User.findById(userAId).select('blockedUsers'),
    User.findById(userBId).select('blockedUsers'),
  ]);
  if (!a || !b) return false;
  const aBlockedB = a.blockedUsers.some((id) => id.toString() === userBId);
  const bBlockedA = b.blockedUsers.some((id) => id.toString() === userAId);
  return aBlockedB || bBlockedA;
};

module.exports = { isBlockedEitherWay };
