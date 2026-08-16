import * as db from '../data/localDb';
import { requireCurrentUserId } from './session';
import { publicUser } from '../utils/publicUser';

const populate = (booking, usersById, postsById) => ({
  ...booking,
  post: postsById.get(booking.post) || booking.post,
  requester: usersById.get(booking.requester) || booking.requester,
  provider: usersById.get(booking.provider) || booking.provider,
});

// Sanitized — requester/provider is another user's data attached to the other party's view of the
// booking, so it must never carry passwordHash/passwordSalt (or a legacy plaintext password).
const lookups = async () => {
  const [users, posts] = await Promise.all([db.getAll('users'), db.getAll('posts')]);
  return { usersById: new Map(users.map((u) => [u._id, publicUser(u)])), postsById: new Map(posts.map((p) => [p._id, p])) };
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

  // The duplicate-booking check and the insert happen inside one write-queue task so two
  // concurrent booking attempts on the same post can't both pass the check against the same
  // pre-insert snapshot.
  const record = await db.insertWith('bookings', (bookings) => {
    const alreadyBooked = bookings.some(
      (b) => b.post === postId && b.requester === userId && b.status === 'upcoming'
    );
    if (alreadyBooked) throw { message: "You've already got an upcoming booking for this post." };
    return {
      post: postId,
      requester: userId,
      provider: post.user,
      status: 'upcoming',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  });
  const { usersById, postsById } = await lookups();
  return populate(record, usersById, postsById);
};

const updateStatus = async (id, status) => {
  const userId = await requireCurrentUserId();
  const booking = await db.findById('bookings', id);
  if (!booking) throw { message: 'This booking no longer exists.' };
  if (booking.requester !== userId && booking.provider !== userId) {
    throw { message: "You can't update a booking you're not part of." };
  }
  // Only the provider (the peer actually delivering the service) can mark a booking complete;
  // either side can cancel their own booking.
  if (status === 'completed' && booking.provider !== userId) {
    throw { message: 'Only the provider can mark a booking as completed.' };
  }
  const updated = await db.update('bookings', id, { status });
  const { usersById, postsById } = await lookups();
  return populate(updated, usersById, postsById);
};

const addReview = async (id, { rating, comment }) => {
  const userId = await requireCurrentUserId();
  const booking = await db.findById('bookings', id);
  if (!booking) throw { message: 'This booking no longer exists.' };
  if (booking.requester !== userId) throw { message: 'Only the requester can review this booking.' };
  if (booking.status !== 'completed') throw { message: 'You can only review completed bookings.' };

  // Same pattern as bookingService.create above: check-and-insert inside one write-queue task.
  const review = await db.insertWith('reviews', (reviews) => {
    if (reviews.some((r) => r.booking === id)) throw { message: 'This booking has already been reviewed.' };
    return {
      booking: id,
      fromUser: userId,
      toUser: booking.provider,
      rating,
      comment: comment || '',
    };
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
