import api from './api';

const getMine = async (status) => (await api.get('/bookings', { params: status ? { status } : undefined })).data;

const create = async ({ postId }) => (await api.post('/bookings', { postId })).data;

const updateStatus = async (id, status) => (await api.patch(`/bookings/${id}/status`, { status })).data;

const addReview = async (id, { rating, comment }) => (await api.post(`/bookings/${id}/review`, { rating, comment })).data;

export default { getMine, create, updateStatus, addReview };
