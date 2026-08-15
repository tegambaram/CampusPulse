import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

// Attach the stored JWT to every request, same as the old local-token scheme's
// requireCurrentUserId() but now as a real Authorization header for the server to verify.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Every screen already expects errors as `{ message }` (see services/*.js call sites),
// so unwrap axios's response envelope here rather than in every service function.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Session expired/invalid — clear it so the next app load routes to Welcome instead
      // of retrying with a dead token. AuthContext's own 401 handling (via getMe()) covers
      // the app-launch case; this covers a token expiring mid-session.
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong, please try again.';
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;
