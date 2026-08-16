import * as db from '../data/localDb';
import { getCurrentUserId, requireCurrentUserId } from './session';
import { clampPage, clampLimit } from '../utils/pagination';
import { publicUser } from '../utils/publicUser';

const populate = (post, usersById) => ({ ...post, user: usersById.get(post.user) || post.user });

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 1000;
const LOCATION_MAX = 100;

const validateTextFields = ({ title, description, location }) => {
  if (title !== undefined && title.length > TITLE_MAX) {
    throw { message: `Title must be ${TITLE_MAX} characters or fewer.` };
  }
  if (description !== undefined && description.length > DESCRIPTION_MAX) {
    throw { message: `Description must be ${DESCRIPTION_MAX} characters or fewer.` };
  }
  if (location && location.length > LOCATION_MAX) {
    throw { message: `Location must be ${LOCATION_MAX} characters or fewer.` };
  }
};

// `Number('abc')` is NaN, and NaN silently round-trips to `null` the moment it's JSON-persisted
// (data/localDb.js's `persist()`), leaving the in-memory cache and stored value disagreeing until
// the next reload. Validate instead of trusting the cast.
const parseCompensationAmount = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw { message: 'Compensation amount must be a positive number.' };
  }
  return amount;
};

// Sanitized — post.user is another user's data attached to whoever's viewing the feed, so it must
// never carry passwordHash/passwordSalt (or a legacy plaintext password) through.
const usersMap = async () => {
  const users = await db.getAll('users');
  return new Map(users.map((u) => [u._id, publicUser(u)]));
};

const sortByNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

const getFeed = async ({ page = 1, limit = 10, category } = {}) => {
  await db.ready();
  const [posts, byId] = await Promise.all([db.getAll('posts'), usersMap()]);
  let filtered = posts.filter((p) => p.status !== 'deleted');
  if (category && category !== 'All') filtered = filtered.filter((p) => p.category === category);
  filtered = [...filtered].sort(sortByNewest);

  const safePage = clampPage(page);
  const safeLimit = clampLimit(limit, 10);
  const start = (safePage - 1) * safeLimit;
  const pageItems = filtered.slice(start, start + safeLimit);

  return {
    data: pageItems.map((p) => populate(p, byId)),
    meta: { hasMore: start + safeLimit < filtered.length, page: safePage, total: filtered.length },
  };
};

const getPost = async (id) => {
  await db.ready();
  const [post, byId] = await Promise.all([db.findById('posts', id), usersMap()]);
  if (!post) throw { message: 'This post no longer exists.' };
  return populate(post, byId);
};

const createPost = async (payload) => {
  const authorId = await requireCurrentUserId();
  await db.ready();
  validateTextFields(payload);
  const record = await db.insert('posts', {
    user: authorId,
    type: payload.type,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    compensationType: payload.compensationType || 'free',
    compensationAmount: parseCompensationAmount(payload.compensationAmount),
    location: payload.location || '',
    images: payload.imageUri ? [payload.imageUri] : [],
    likedBy: [],
    likesCount: 0,
    bookmarkedBy: [],
    status: 'active',
  });
  const byId = await usersMap();
  return populate(record, byId);
};

const updatePost = async (id, payload) => {
  const userId = await requireCurrentUserId();
  await db.ready();
  const existing = await db.findById('posts', id);
  if (!existing) throw { message: 'This post no longer exists.' };
  if (existing.user !== userId) throw { message: 'You can only edit your own posts.' };
  validateTextFields(payload);
  const patch = { ...payload };
  if (payload.compensationAmount !== undefined) patch.compensationAmount = parseCompensationAmount(payload.compensationAmount);
  if (payload.imageUri !== undefined) {
    patch.images = payload.imageUri ? [payload.imageUri] : [];
    delete patch.imageUri;
  }
  const updated = await db.update('posts', id, patch);
  if (!updated) throw { message: 'This post no longer exists.' };
  const byId = await usersMap();
  return populate(updated, byId);
};

const deletePost = async (id) => {
  const userId = await requireCurrentUserId();
  const existing = await db.findById('posts', id);
  if (!existing) throw { message: 'This post no longer exists.' };
  if (existing.user !== userId) throw { message: 'You can only delete your own posts.' };
  await db.remove('posts', id);
  return { message: 'Post deleted' };
};

const toggleLike = async (id) => {
  const userId = await requireCurrentUserId();
  // updateWith recomputes `liked`/`likedBy` from the record's current state inside the DB's write
  // queue, so two rapid toggles (e.g. a double-tap) can't both read the same stale snapshot and
  // silently undo each other.
  const updated = await db.updateWith('posts', id, (post) => {
    const liked = post.likedBy.includes(userId);
    const likedBy = liked ? post.likedBy.filter((u) => u !== userId) : [...post.likedBy, userId];
    return { likedBy, likesCount: likedBy.length };
  });
  if (!updated) throw { message: 'This post no longer exists.' };
  return { liked: updated.likedBy.includes(userId), likesCount: updated.likesCount };
};

const toggleBookmark = async (id) => {
  const userId = await requireCurrentUserId();
  const updated = await db.updateWith('posts', id, (post) => {
    const bookmarked = post.bookmarkedBy.includes(userId);
    const bookmarkedBy = bookmarked ? post.bookmarkedBy.filter((u) => u !== userId) : [...post.bookmarkedBy, userId];
    return { bookmarkedBy };
  });
  if (!updated) throw { message: 'This post no longer exists.' };
  return { bookmarked: updated.bookmarkedBy.includes(userId), bookmarkedCount: updated.bookmarkedBy.length };
};

const getBookmarked = async (page = 1) => {
  const userId = await getCurrentUserId();
  await db.ready();
  const [posts, byId] = await Promise.all([db.getAll('posts'), usersMap()]);
  const mine = posts.filter((p) => userId && p.bookmarkedBy.includes(userId)).sort(sortByNewest);
  const safePage = clampPage(page);
  const limit = 10;
  const start = (safePage - 1) * limit;
  return {
    data: mine.slice(start, start + limit).map((p) => populate(p, byId)),
    meta: { hasMore: start + limit < mine.length, page: safePage, total: mine.length },
  };
};

export default { getFeed, getPost, createPost, updatePost, deletePost, toggleLike, toggleBookmark, getBookmarked };
