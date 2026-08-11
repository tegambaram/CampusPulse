import AsyncStorage from '@react-native-async-storage/async-storage';
import * as db from '../data/localDb';

const TOKEN_PREFIX = 'local-token-';
const idFromToken = (token) => (token && token.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null);

const publicUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

const register = async ({ name, collegeEmail, department, semester, password, confirmPassword }) => {
  await db.ready();
  if (!name || !collegeEmail || !department || !semester || !password) {
    throw { message: 'Please fill in all the fields to create your account.' };
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw { message: 'Password and Confirm Password do not match.' };
  }
  const users = await db.getAll('users');
  const email = collegeEmail.trim().toLowerCase();
  if (users.some((u) => u.collegeEmail.toLowerCase() === email)) {
    throw { message: 'An account with this email already exists. Try logging in instead.' };
  }

  const user = await db.insert('users', {
    name,
    collegeEmail: email,
    department,
    semester,
    password,
    profileImage: `https://i.pravatar.cc/300?u=${encodeURIComponent(email)}`,
    bio: '',
    skills: [],
    availability: [],
    rating: 0,
    ratingCount: 0,
    isOnline: true,
  });

  return { token: `${TOKEN_PREFIX}${user._id}`, user: publicUser(user) };
};

const login = async ({ email, password }) => {
  await db.ready();
  const users = await db.getAll('users');
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = users.find((u) => u.collegeEmail.toLowerCase() === normalizedEmail);
  if (!user || user.password !== password) {
    throw { message: 'Incorrect email or password. Please try again.' };
  }
  return { token: `${TOKEN_PREFIX}${user._id}`, user: publicUser(user) };
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
  const users = await db.getAll('users');
  const normalizedEmail = (email || '').trim().toLowerCase();
  let user = users.find((u) => u.collegeEmail.toLowerCase() === normalizedEmail);
  if (!user) {
    user = await db.insert('users', {
      name: name || 'Google User',
      collegeEmail: normalizedEmail,
      department: 'Undeclared',
      semester: '1st Semester',
      password: null,
      profileImage: avatar || `https://i.pravatar.cc/300?u=${encodeURIComponent(normalizedEmail)}`,
      bio: '',
      skills: [],
      availability: [],
      rating: 0,
      ratingCount: 0,
      isOnline: true,
    });
  }
  return { token: `${TOKEN_PREFIX}${user._id}`, user: publicUser(user) };
};

const getMe = async (token) => {
  await db.ready();
  const activeToken = token || (await AsyncStorage.getItem('token'));
  const id = idFromToken(activeToken);
  const user = id ? await db.findById('users', id) : null;
  if (!user) throw { message: 'Session expired, please log in again.' };
  return publicUser(user);
};

const logout = async () => ({ message: 'Logged out' });

export default { register, login, forgotPassword, googleLogin, getMe, logout };
