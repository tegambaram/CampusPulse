const { verifyToken } = require('../utils/token');
const User = require('../models/User');

// Reads "Authorization: Bearer <token>", verifies it, and attaches req.userId / req.user.
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'You need to be logged in to do that.' });

    const userId = verifyToken(token);
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'Session expired, please log in again.' });

    req.userId = userId;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired, please log in again.' });
  }
};

module.exports = { requireAuth };
