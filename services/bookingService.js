import * as db from '../data/localDb';
import { requireCurrentUserId } from './session';

const populate = (booking, usersById, postsById) => ({
  ...booking,
  post: postsById.get(booking.post) || booking.post,
  requester: usersById.get(booking.requester) || booking.requester,
  provider: usersById.get(booking.provider) || booking.provider,
});

const lookups = async () => {
  const [users, posts] = await Promise.all([db.getAll('users'), db.getAll('posts')]);
  return { usersById: new Map(users.map((u) => [u._id, u])), postsById: new Map(posts.map((p) => [p._id, p])) };
};

const getMine = async (status) => {
  const userId = await requireCurrentUserId();
  await db.ready();
  const [bookings, { usersById, postsById }] = await Promise.all([db.getAll('bookings'), lookups()]);
  let mine = bookings.filter((b) => b.requester === userId || b.provider === userId);
  if (status) mine = mine.filter((b) => b.status === status);
  mine = [...mine].sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
  return mine.map((b) => populate(b, usersById, postsById));
};

const create = async ({ postId }) => {
  const userId = await requireCurrentUserId();
  const post = await db.findById('posts', postId);
  if (!post) throw { message: 'This post no longer exists.' };
  if (post.user === userId) throw { message: "You can't book your own post." };

  const record = await db.insert('bookings', {
    post: postId,
    requester: userId,
    provider: post.user,
    status: 'upcoming',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
  const { usersById, postsById } = await lookups();
  return populate(record, usersById, postsById);
};

const updateStatus = async (id, status) => {
  await requireCurrentUserId();
  const updated = await db.update('bookings', id, { status });
  if (!updated) throw { message: 'This booking no longer exists.' };
  const { usersById, postsById } = await lookups();
  return populate(updated, usersById, postsById);
};

const addReview = async (id, { rating, comment }) => {
  const userId = await requireCurrentUserId();
  const booking = await db.findById('bookings', id);
  if (!booking) throw { message: 'This booking no longer exists.' };

  const review = await db.insert('reviews', {
    booking: id,
    fromUser: userId,
    toUser: booking.provider,
    rating,
    comment: comment || '',
  });

  const users = await db.getAll('users');
  const provider = users.find((u) => u._id === booking.provider);
  if (provider) {
    const newCount = (provider.ratingCount || 0) + 1;
    const newRating = Math.round((((provider.rating || 0) * (provider.ratingCount || 0) + rating) / newCount) * 10) / 10;
    await db.update('users', provider._id, { rating: newRating, ratingCount: newCount });
  }

  return review;
};

export default { getMine, create, updateStatus, addReview };
