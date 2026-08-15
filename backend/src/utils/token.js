const jwt = require('jsonwebtoken');

const signToken = (userId) => jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

const verifyToken = (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return payload.sub;
};

module.exports = { signToken, verifyToken };
