import * as db from '../data/localDb';
import { requireCurrentUserId } from './session';
import { clampPage } from '../utils/pagination';
import { publicUser } from '../utils/publicUser';

// Sanitized — a booking/review/post's `fromUser`/`user` field is another user's data attached to
// someone else's response, so it must never carry passwordHash/passwordSalt (or a legacy plaintext
// password — see authService.login) through to the caller.
const usersMap = async () => {
  const users = await db.getAll('users');
  return new Map(users.map((u) => [u._id, publicUser(u)]));
};

const getUser = async (id) => {
  await db.ready();
  const [user, posts, reviews] = await Promise.all([db.findById('users', id), db.getAll('posts'), db.getAll('reviews')]);
  if (!user) throw { message: 'User not found.' };
  const postsCount = posts.filter((p) => p.user === id && p.status !== 'deleted').length;
  const reviewsCount = reviews.filter((r) => r.toUser === id).length;
  return { ...publicUser(user), stats: { postsCount, reviewsCount } };
};

// Only these fields are user-editable via this endpoint. Everything else on the user record
// (rating, ratingCount, passwordHash/passwordSalt, collegeEmail, isOnline, ...) is
// server/system-managed and must never be settable through a profile-update payload, even though
// today's only caller (EditProfileScreen) happens to send a safe subset.
const EDITABLE_PROFILE_FIELDS = ['name', 'bio', 'department', 'semester', 'skills', 'availability', 'profileImage'];
const BIO_MAX = 300;

const updateProfile = async (payload) => {
  const myId = await requireCurrentUserId();
  if (payload.bio !== undefined && payload.bio.length > BIO_MAX) {
    throw { message: `Bio must be ${BIO_MAX} characters or fewer.` };
  }
  const patch = {};
  EDITABLE_PROFILE_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) patch[field] = payload[field];
  });
  const updated = await db.update('users', myId, patch);
  if (!updated) throw { message: 'User not found.' };
  return publicUser(updated);
};

// Takes a local image URI (from expo-image-picker) directly instead of a multipart upload — there's
// no server to upload to, so the device URI is stored and rendered as-is.
const uploadAvatar = async (uri) => {
  const myId = await requireCurrentUserId();
  const updated = await db.update('users', myId, { profileImage: uri });
  if (!updated) throw { message: 'User not found.' };
  return { profileImage: updated.profileImage };
};

const getUserReviews = async (id, page = 1) => {
  await db.ready();
  const [reviews, byId] = await Promise.all([db.getAll('reviews'), usersMap()]);
  const mine = reviews.filter((r) => r.toUser === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const safePage = clampPage(page);
  const limit = 10;
  const start = (safePage - 1) * limit;
  return { data: mine.slice(start, start + limit).map((r) => ({ ...r, fromUser: byId.get(r.fromUser) || r.fromUser })) };
};

const getUserPosts = async (id, page = 1) => {
  await db.ready();
  const [posts, byId] = await Promise.all([db.getAll('posts'), usersMap()]);
  const mine = posts.filter((p) => p.user === id && p.status !== 'deleted').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const safePage = clampPage(page);
  const limit = 10;
  const start = (safePage - 1) * limit;
  return { data: mine.slice(start, start + limit).map((p) => ({ ...p, user: byId.get(p.user) || p.user })) };
};

export default { getUser, updateProfile, uploadAvatar, getUserReviews, getUserPosts };
