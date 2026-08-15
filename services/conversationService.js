import api from './api';

const getConversations = async () => (await api.get('/conversations')).data;

const getMessages = async (conversationId) => (await api.get(`/conversations/${conversationId}/messages`)).data;

// Fallback only — ChatScreen sends via the socket's 'send_message' event for instant
// delivery and only calls this when the socket isn't connected.
const sendMessage = async (conversationId, text) => (await api.post(`/conversations/${conversationId}/messages`, { text })).data;

const startConversation = async (userId) => (await api.post('/conversations', { userId })).data;

export default { getConversations, getMessages, sendMessage, startConversation };
