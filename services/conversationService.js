import * as db from '../data/localDb';
import { requireCurrentUserId } from './session';

const populate = (conversation, myId, usersById) => {
  const otherId = conversation.participants.find((p) => p !== myId) || conversation.participants[0];
  const other = usersById.get(otherId);
  return {
    id: conversation._id,
    user: other,
    lastMessage: conversation.lastMessage,
    time: conversation.lastMessageAt,
    unreadCount: (conversation.unreadCount || {})[myId] || 0,
    online: other?.isOnline || false,
  };
};

const usersMap = async () => {
  const users = await db.getAll('users');
  return new Map(users.map((u) => [u._id, u]));
};

const getConversations = async () => {
  const myId = await requireCurrentUserId();
  await db.ready();
  const [conversations, byId] = await Promise.all([db.getAll('conversations'), usersMap()]);
  const mine = conversations
    .filter((c) => c.participants.includes(myId))
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  return mine.map((c) => populate(c, myId, byId));
};

const getMessages = async (conversationId, page = 1) => {
  const myId = await requireCurrentUserId();
  await db.ready();
  const conversation = await db.findById('conversations', conversationId);
  if (!conversation) throw { message: 'This conversation no longer exists.' };
  if (!conversation.participants.includes(myId)) {
    throw { message: "You don't have access to this conversation." };
  }
  const messages = await db.getAll('messages');
  const mine = messages.filter((m) => m.conversation === conversationId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return { data: mine };
};

const sendMessage = async (conversationId, text) => {
  const myId = await requireCurrentUserId();
  const conversation = await db.findById('conversations', conversationId);
  if (!conversation) throw { message: 'This conversation no longer exists.' };
  if (!conversation.participants.includes(myId)) {
    throw { message: "You don't have access to this conversation." };
  }

  const message = await db.insert('messages', { conversation: conversationId, sender: myId, text });

  const otherId = conversation.participants.find((p) => p !== myId);
  const unreadCount = { ...(conversation.unreadCount || {}) };
  if (otherId) unreadCount[otherId] = (unreadCount[otherId] || 0) + 1;
  await db.update('conversations', conversationId, { lastMessage: text, lastMessageAt: message.createdAt, unreadCount });

  return message;
};

const startConversation = async (userId) => {
  const myId = await requireCurrentUserId();
  if (userId === myId) throw { message: "You can't start a conversation with yourself." };
  await db.ready();
  const conversations = await db.getAll('conversations');
  let conversation = conversations.find((c) => c.participants.includes(myId) && c.participants.includes(userId));

  if (!conversation) {
    conversation = await db.insert('conversations', {
      participants: [myId, userId],
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [myId]: 0, [userId]: 0 },
    });
  }

  const byId = await usersMap();
  return populate(conversation, myId, byId);
};

export default { getConversations, getMessages, sendMessage, startConversation };
