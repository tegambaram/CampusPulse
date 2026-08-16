import AsyncStorage from '@react-native-async-storage/async-storage';
import * as db from '../data/localDb';
import { hashPassword, randomToken } from '../utils/crypto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const publicUser = (user) => {
  const { passwordHash, passwordSalt, ...rest } = user;
  return rest;
};

// Creates an opaque session token (unrelated to the user id — see services/session.js for why)
// and records it in the sessions collection so later requests can resolve token -> user.
const createSession = async (userId) => {
  const token = await randomToken();
  await db.insert('sessions', { token, userId });
  return token;
};

const register = async ({ name, collegeEmail, department, semester, password, confirmPassword }) => {
  await db.ready();
  if (!name || !collegeEmail || !department || !semester || !password) {
    throw { message: 'Please fill in all the fields to create your account.' };
  }
  if (!EMAIL_RE.test(collegeEmail.trim())) {
    throw { message: 'Please enter a valid email address.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` };
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw { message: 'Password and Confirm Password do not match.' };
  }
  const email = collegeEmail.trim().toLowerCase();
  const passwordSalt = await randomToken(16);
  const passwordHash = await hashPassword(password, passwordSalt);

  // The "email not taken" check and the insert must happen inside the same write-queue task —
  // otherwise two concurrent registrations for the same email could both pass the check against
  // the same pre-insert snapshot and both succeed.
  const user = await db.insertWith('users', (users) => {
    if (users.some((u) => u.collegeEmail.toLowerCase() === email)) {
      throw { message: 'An account with this email already exists. Try logging in instead.' };
    }
    return {
      name,
      collegeEmail: email,
      department,
      semester,
      passwordHash,
      passwordSalt,
      profileImage: `https://i.pravatar.cc/300?u=${encodeURIComponent(email)}`,
      bio: '',
      skills: [],
      availability: [],
      rating: 0,
      ratingCount: 0,
      isOnline: true,
    };
  });

  const token = await createSession(user._id);
  return { token, user: publicUser(user) };
};

const login = async ({ email, password }) => {
  await db.ready();
  const users = await db.getAll('users');
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = users.find((u) => u.collegeEmail.toLowerCase() === normalizedEmail);
  // Always hash something, even on a miss, so an attacker can't tell "no such user" apart from
  // "wrong password" by response timing alone.
  const hashToCheck = user ? await hashPassword(password, user.passwordSalt) : await hashPassword(password, 'no-such-user');
  if (!user || !user.passwordHash || hashToCheck !== user.passwordHash) {
    throw { message: 'Incorrect email or password. Please try again.' };
  }
  const token = await createSession(user._id);
  return { token, user: publicUser(user) };
};

const forgotPassword = async (email) => {
  await db.ready();
  const users = await db.getAll('users');
  const exists = users.some((u) => u.collegeEmail.toLowerCase() === (email || '').trim().toLowerCase());
  return {
    message: exists
      ? 'This is a local demo build, so no email is actually sent — just log in with your existing password.'
      : "We couldn't find an account with that email.",
  };
};

const googleLogin = async ({ email, name, avatar }) => {
  await db.ready();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await db.findOrCreate(
    'users',
    (u) => u.collegeEmail.toLowerCase() === normalizedEmail,
    () => ({
      name: name || 'Google User',
      collegeEmail: normalizedEmail,
      department: 'Undeclared',
      semester: '1st Semester',
      passwordHash: null,
      passwordSalt: null,
      profileImage: avatar || `https://i.pravatar.cc/300?u=${encodeURIComponent(normalizedEmail)}`,
      bio: '',
      skills: [],
      availability: [],
      rating: 0,
      ratingCount: 0,
      isOnline: true,
    })
  );
  const token = await createSession(user._id);
  return { token, user: publicUser(user) };
};

const getMe = async (token) => {
  await db.ready();
  const activeToken = token || (await AsyncStorage.getItem('token'));
  const sessions = await db.getAll('sessions');
  const session = activeToken ? sessions.find((s) => s.token === activeToken) : null;
  const user = session ? await db.findById('users', session.userId) : null;
  if (!user) throw { message: 'Session expired, please log in again.' };
  return publicUser(user);
};

const logout = async () => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    const sessions = await db.getAll('sessions');
    await db.setCollection('sessions', sessions.filter((s) => s.token !== token));
  }
  return { message: 'Logged out' };
};

export default { register, login, forgotPassword, googleLogin, getMe, logout };
