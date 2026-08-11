import * as db from '../data/localDb';
import { requireCurrentUserId } from './session';

const getNotifications = async (page = 1) => {
  const myId = await requireCurrentUserId();
  await db.ready();
  const notifications = await db.getAll('notifications');
  const mine = notifications.filter((n) => n.user === myId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const limit = 20;
  const start = (page - 1) * limit;
  return { data: mine.slice(start, start + limit), meta: { hasMore: start + limit < mine.length } };
};

const markRead = async (id) => {
  await requireCurrentUserId();
  const updated = await db.update('notifications', id, { isRead: true });
  if (!updated) throw { message: 'Notification not found.' };
  return updated;
};

const markAllRead = async () => {
  const myId = await requireCurrentUserId();
  await db.ready();
  const notifications = await db.getAll('notifications');
  await Promise.all(
    notifications.filter((n) => n.user === myId && !n.isRead).map((n) => db.update('notifications', n._id, { isRead: true }))
  );
  return { message: 'All notifications marked as read' };
};

export default { getNotifications, markRead, markAllRead };
