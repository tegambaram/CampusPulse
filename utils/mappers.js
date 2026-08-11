import relativeTime from './relativeTime';

const COMPENSATION_LABEL = { free: 'Free', paid: 'Paid', rent: 'Rent', exchange: 'Exchange' };

export const mapUser = (user) => {
  if (!user) return null;
  return {
    id: user._id || user.id,
    name: user.name,
    department: user.department,
    semester: user.semester,
    avatar: user.profileImage,
    rating: user.rating || 0,
    online: user.isOnline || false,
  };
};

export const mapPost = (post, currentUserId) => {
  const id = post._id || post.id;
  return {
    id,
    type: post.type,
    user: mapUser(post.user),
    title: post.title,
    description: post.description,
    category: post.category,
    compensation: COMPENSATION_LABEL[post.compensationType] || 'Free',
    price: post.compensationAmount ? `₹${post.compensationAmount}` : undefined,
    location: post.location,
    postedAt: relativeTime(post.createdAt),
    likes: post.likesCount || 0,
    liked: currentUserId ? (post.likedBy || []).some((u) => (u._id || u).toString() === currentUserId) : false,
    bookmarked: currentUserId ? (post.bookmarkedBy || []).some((u) => (u._id || u).toString() === currentUserId) : false,
    image: post.images && post.images.length > 0 ? post.images[0] : null,
    status: post.status,
  };
};

export const mapConversation = (conversation) => ({
  id: conversation.id || conversation._id,
  user: mapUser(conversation.user),
  lastMessage: conversation.lastMessage,
  time: relativeTime(conversation.time),
  unreadCount: conversation.unreadCount || 0,
  online: conversation.online || false,
});

export const mapMessage = (message, myUserId) => ({
  id: message._id || message.id,
  text: message.text,
  sender: (message.sender?._id || message.sender || '').toString() === myUserId ? 'me' : 'them',
  time: new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
});

const NOTIFICATION_TYPE_MAP = {
  booking_accepted: { category: 'booking', icon: 'checkmark-circle-outline' },
  booking_completed: { category: 'booking', icon: 'checkmark-done-outline' },
  new_message: { category: 'message', icon: 'chatbubble-ellipses-outline' },
  new_request: { category: 'request', icon: 'hand-left-outline' },
  profile_viewed: { category: 'profile', icon: 'eye-outline' },
};

export const mapNotification = (notification) => {
  const meta = NOTIFICATION_TYPE_MAP[notification.type] || { category: 'message', icon: 'notifications-outline' };
  return {
    id: notification._id || notification.id,
    type: meta.category,
    icon: meta.icon,
    title: notification.title,
    message: notification.body,
    time: relativeTime(notification.createdAt),
    read: notification.isRead,
  };
};

export const mapBooking = (booking, myUserId) => {
  const providerId = (booking.provider?._id || booking.provider || '').toString();
  const iAmProvider = providerId === myUserId;
  const withUser = iAmProvider ? booking.requester : booking.provider;
  const scheduled = new Date(booking.scheduledDate);

  return {
    id: booking._id || booking.id,
    title: booking.post?.title || 'Booking',
    category: booking.post?.category || 'Other',
    withUser: mapUser(withUser),
    date: scheduled.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    time: scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: booking.status,
    isProvider: iAmProvider,
    postId: booking.post?._id || booking.post,
  };
};

export default { mapUser, mapPost, mapConversation, mapMessage, mapNotification, mapBooking };
