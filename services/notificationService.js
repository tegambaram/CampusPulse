import api from './api';

const getNotifications = async (page = 1) => (await api.get('/notifications', { params: { page } })).data;

const markRead = async (id) => (await api.post(`/notifications/${id}/read`)).data;

const markAllRead = async () => (await api.post('/notifications/read-all')).data;

export default { getNotifications, markRead, markAllRead };
