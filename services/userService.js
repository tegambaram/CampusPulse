import api from './api';

const getUser = async (id) => (await api.get(`/users/${id}`)).data;

const updateProfile = async (payload) => (await api.put('/users/me', payload)).data;

const uploadAvatar = async (uri) => (await api.post('/users/me/avatar', { uri })).data;

const getUserReviews = async (id, page = 1) => (await api.get(`/users/${id}/reviews`, { params: { page } })).data;

const getUserPosts = async (id, page = 1) => (await api.get(`/users/${id}/posts`, { params: { page } })).data;

const toggleBlock = async (id) => (await api.post(`/users/${id}/block`)).data;

const getBlockedUsers = async () => (await api.get('/users/blocked')).data;

const reportUser = async (id, { reason, details, postId }) => (await api.post(`/users/${id}/report`, { reason, details, postId })).data;

export default { getUser, updateProfile, uploadAvatar, getUserReviews, getUserPosts, toggleBlock, getBlockedUsers, reportUser };
