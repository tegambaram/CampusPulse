import api from './api';

const getUser = async (id) => (await api.get(`/users/${id}`)).data;

const updateProfile = async (payload) => (await api.put('/users/me', payload)).data;

const uploadAvatar = async (uri) => (await api.post('/users/me/avatar', { uri })).data;

const getUserReviews = async (id, page = 1) => (await api.get(`/users/${id}/reviews`, { params: { page } })).data;

const getUserPosts = async (id, page = 1) => (await api.get(`/users/${id}/posts`, { params: { page } })).data;

export default { getUser, updateProfile, uploadAvatar, getUserReviews, getUserPosts };
