import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { getCurrentUserId } from './session';

// Recent searches are a per-device convenience, not shared data — kept local, same as before.
const RECENT_KEY_PREFIX = '@campuspulse/recentSearches/';
const MAX_RECENT = 6;

const recordRecent = async (q) => {
  const userId = await getCurrentUserId();
  if (!userId || !q.trim()) return;
  const key = `${RECENT_KEY_PREFIX}${userId}`;
  const stored = await AsyncStorage.getItem(key);
  const list = stored ? JSON.parse(stored) : [];
  const next = [q, ...list.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
  await AsyncStorage.setItem(key, JSON.stringify(next));
};

const search = async (q, page = 1) => {
  const result = (await api.get('/search', { params: { q, page } })).data;
  await recordRecent(q);
  return result;
};

const trending = async () => (await api.get('/search/trending')).data;

const recent = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const stored = await AsyncStorage.getItem(`${RECENT_KEY_PREFIX}${userId}`);
  return stored ? JSON.parse(stored) : [];
};

export default { search, trending, recent };
