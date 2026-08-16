import AsyncStorage from '@react-native-async-storage/async-storage';
import * as db from '../data/localDb';
import { getCurrentUserId } from './session';
import { clampPage } from '../utils/pagination';
import { publicUser } from '../utils/publicUser';

const RECENT_KEY_PREFIX = '@campuspulse/recentSearches/';
const MAX_RECENT = 6;

// Sanitized — see postService.js's usersMap for why.
const usersMap = async () => {
  const users = await db.getAll('users');
  return new Map(users.map((u) => [u._id, publicUser(u)]));
};

const recordRecent = async (q) => {
  const userId = await getCurrentUserId();
  if (!userId || typeof q !== 'string' || !q.trim()) return;
  const key = `${RECENT_KEY_PREFIX}${userId}`;
  const stored = await AsyncStorage.getItem(key);
  const list = stored ? JSON.parse(stored) : [];
  const next = [q, ...list.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
  await AsyncStorage.setItem(key, JSON.stringify(next));
};

const search = async (q, page = 1) => {
  await db.ready();
  const [posts, byId] = await Promise.all([db.getAll('posts'), usersMap()]);
  const needle = (typeof q === 'string' ? q : '').trim().toLowerCase();
  const matches = posts
    .filter((p) => p.status !== 'deleted')
    .filter((p) => [p.title, p.description, p.category].some((field) => (field || '').toLowerCase().includes(needle)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  await recordRecent(q);

  const safePage = clampPage(page);
  const limit = 20;
  const start = (safePage - 1) * limit;
  return {
    data: matches.slice(start, start + limit).map((p) => ({ ...p, user: byId.get(p.user) || p.user })),
    meta: { hasMore: start + limit < matches.length },
  };
};

const trending = async () => {
  await db.ready();
  const categories = await db.getAll('categories');
  return [...categories].sort((a, b) => (b.postCount || 0) - (a.postCount || 0)).slice(0, 6);
};

const recent = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const stored = await AsyncStorage.getItem(`${RECENT_KEY_PREFIX}${userId}`);
  return stored ? JSON.parse(stored) : [];
};

export default { search, trending, recent };
