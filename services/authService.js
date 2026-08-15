import api from './api';

const register = async (payload) => (await api.post('/auth/register', payload)).data;

const login = async ({ email, password }) => (await api.post('/auth/login', { email, password })).data;

const forgotPassword = async (email) => (await api.post('/auth/forgot-password', { email })).data;

// Stub Google login (no real OAuth) — matches the backend's mock endpoint. Kept as its own
// function so a real Google Sign-In flow can be dropped in later without touching call sites.
const googleLogin = async (payload) => (await api.post('/auth/google-login', payload)).data;

const getMe = async () => (await api.get('/auth/me')).data;

const registerPushToken = async (expoPushToken) => (await api.post('/auth/push-token', { expoPushToken })).data;

const logout = async () => (await api.post('/auth/logout')).data;

export default { register, login, forgotPassword, googleLogin, getMe, registerPushToken, logout };
