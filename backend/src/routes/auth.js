const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/token');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, collegeEmail, department, semester, password, confirmPassword } = req.body;
  if (!name || !collegeEmail || !department || !semester || !password) {
    return res.status(400).json({ message: 'Please fill in all the fields to create your account.' });
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ message: 'Password and Confirm Password do not match.' });
  }

  const email = collegeEmail.trim().toLowerCase();
  const existing = await User.findOne({ collegeEmail: email });
  if (existing) {
    return res.status(400).json({ message: 'An account with this email already exists. Try logging in instead.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    collegeEmail: email,
    department,
    semester,
    password: hashed,
    profileImage: `https://i.pravatar.cc/300?u=${encodeURIComponent(email)}`,
    isOnline: true,
  });

  res.json({ token: signToken(user._id.toString()), user: user.toPublicJSON() });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await User.findOne({ collegeEmail: normalizedEmail });
  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: 'Incorrect email or password. Please try again.' });
  }
  res.json({ token: signToken(user._id.toString()), user: user.toPublicJSON() });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const exists = await User.exists({ collegeEmail: (email || '').trim().toLowerCase() });
  res.json({
    message: exists
      ? "If that email is registered, we've sent password reset instructions."
      : "We couldn't find an account with that email.",
  });
});

// Stub Google login (no real OAuth) — finds or creates a user for the given email, same
// mock-payload contract the frontend's "Continue with Google" button already sends.
router.post('/google-login', async (req, res) => {
  const { email, name, avatar } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  let user = await User.findOne({ collegeEmail: normalizedEmail });
  if (!user) {
    user = await User.create({
      name: name || 'Google User',
      collegeEmail: normalizedEmail,
      department: 'Undeclared',
      semester: '1st Semester',
      password: null,
      profileImage: avatar || `https://i.pravatar.cc/300?u=${encodeURIComponent(normalizedEmail)}`,
      isOnline: true,
    });
  }
  res.json({ token: signToken(user._id.toString()), user: user.toPublicJSON() });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json(req.user.toPublicJSON());
});

// Client calls this right after login (and whenever the Expo push token changes) so the
// server knows where to deliver push notifications for this user.
router.post('/push-token', requireAuth, async (req, res) => {
  const { expoPushToken } = req.body;
  req.user.expoPushToken = expoPushToken || null;
  await req.user.save();
  res.json({ message: 'Push token saved' });
});

router.post('/logout', requireAuth, async (req, res) => {
  req.user.isOnline = false;
  await req.user.save();
  res.json({ message: 'Logged out' });
});

module.exports = router;
