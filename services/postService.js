import * as db from '../data/localDb';
import { getCurrentUserId, requireCurrentUserId } from './session';

const populate = (post, usersById) => ({ ...post, user: usersById.get(post.user) || post.user });

const usersMap = async () => {
  const users = await db.getAll('users');
  return new Map(users.map((u) => [u._id, u]));
};

const sortByNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

const getFeed = async ({ page = 1, limit = 10, category } = {}) => {
  await db.ready();
  const [posts, byId] = await Promise.all([db.getAll('posts'), usersMap()]);
  let filtered = posts.filter((p) => p.status !== 'deleted');
  if (category && category !== 'All') filtered = filtered.filter((p) => p.category === category);
  filtered = [...filtered].sort(sortByNewest);

  const start = (page - 1) * limit;
  const pageItems = filtered.slice(start, start + limit);

  return {
    data: pageItems.map((p) => populate(p, byId)),
    meta: { hasMore: start + limit < filtered.length, page, total: filtered.length },
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
  const record = await db.insert('posts', {
    user: authorId,
    type: payload.type,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    compensationType: payload.compensationType || 'free',
    compensationAmount: payload.compensationAmount ? Number(payload.compensationAmount) : undefined,
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
  const patch = { ...payload };
  if (payload.compensationAmount !== undefined) patch.compensationAmount = payload.compensationAmount ? Number(payload.compensationAmount) : undefined;
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
  const post = await db.findById('posts', id);
  if (!post) throw { message: 'This post no longer exists.' };
  const liked = post.likedBy.includes(userId);
  const likedBy = liked ? post.likedBy.filter((u) => u !== userId) : [...post.likedBy, userId];
  const updated = await db.update('posts', id, { likedBy, likesCount: likedBy.length });
  return { liked: !liked, likesCount: updated.likesCount };
};

const toggleBookmark = async (id) => {
  const userId = await requireCurrentUserId();
  const post = await db.findById('posts', id);
  if (!post) throw { message: 'This post no longer exists.' };
  const bookmarked = post.bookmarkedBy.includes(userId);
  const bookmarkedBy = bookmarked ? post.bookmarkedBy.filter((u) => u !== userId) : [...post.bookmarkedBy, userId];
  const updated = await db.update('posts', id, { bookmarkedBy });
  return { bookmarked: !bookmarked, bookmarkedCount: updated.bookmarkedBy.length };
};

const getBookmarked = async (page = 1) => {
  const userId = await getCurrentUserId();
  await db.ready();
  const [posts, byId] = await Promise.all([db.getAll('posts'), usersMap()]);
  const mine = posts.filter((p) => userId && p.bookmarkedBy.includes(userId)).sort(sortByNewest);
  const limit = 10;
  const start = (page - 1) * limit;
  return {
    data: mine.slice(start, start + limit).map((p) => populate(p, byId)),
    meta: { hasMore: start + limit < mine.length, page, total: mine.length },
  };
};

export default { getFeed, getPost, createPost, updatePost, deletePost, toggleLike, toggleBookmark, getBookmarked };
