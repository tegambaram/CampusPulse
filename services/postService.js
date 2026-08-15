import api from './api';

const getFeed = async ({ page = 1, limit = 10, category } = {}) =>
  (await api.get('/posts', { params: { page, limit, category } })).data;

const getPost = async (id) => (await api.get(`/posts/${id}`)).data;

const createPost = async (payload) => (await api.post('/posts', payload)).data;

const updatePost = async (id, payload) => (await api.put(`/posts/${id}`, payload)).data;

const deletePost = async (id) => (await api.delete(`/posts/${id}`)).data;

const toggleLike = async (id) => (await api.post(`/posts/${id}/like`)).data;

const toggleBookmark = async (id) => (await api.post(`/posts/${id}/bookmark`)).data;

const getBookmarked = async (page = 1) => (await api.get('/posts/bookmarked', { params: { page } })).data;

export default { getFeed, getPost, createPost, updatePost, deletePost, toggleLike, toggleBookmark, getBookmarked };
