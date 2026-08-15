import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import { disconnectSocket } from '../utils/socketClient';
import { registerForPushNotificationsAsync } from '../utils/pushToken';

const AuthContext = createContext(null);

// Every screen reads `user.id`, but the local auth service returns Mongo-shaped user objects
// keyed `_id` (to keep mappers/data-layer parity with the old backend). Normalize once here so
// the rest of the app can rely on `user.id` always being present.
const normalizeUser = (u) => (u ? { ...u, id: u._id || u.id } : u);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bootstrapped = useRef(false);

  // Best-effort: ask for notification permission and hand the backend a device push token
  // so it can reach this user even when the app is backgrounded/closed. Never blocks login.
  const syncPushToken = () => {
    registerForPushNotificationsAsync()
      .then((expoPushToken) => expoPushToken && authService.registerPushToken(expoPushToken))
      .catch(() => {});
  };

  const persist = async (nextToken, nextUser) => {
    const normalized = normalizeUser(nextUser);
    await AsyncStorage.multiSet([['token', nextToken], ['user', JSON.stringify(normalized)]]);
    setToken(nextToken);
    setUser(normalized);
    setIsGuest(false);
    syncPushToken();
  };

  const clearSession = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    (async () => {
      try {
        const [storedToken, storedUser] = await AsyncStorage.multiGet(['token', 'user']);
        const tokenValue = storedToken[1];
        const userValue = storedUser[1] ? JSON.parse(storedUser[1]) : null;

        if (tokenValue) {
          setToken(tokenValue);
          setUser(normalizeUser(userValue));
          try {
            const freshUser = await authService.getMe();
            setUser(normalizeUser(freshUser));
            syncPushToken();
          } catch (error) {
            await clearSession();
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async ({ email, password, rememberMe }) => {
    const data = await authService.login({ email, password, rememberMe });
    await persist(data.token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    await persist(data.token, data.user);
    return data.user;
  };

  const googleLogin = async (payload) => {
    const data = await authService.googleLogin(payload);
    await persist(data.token, data.user);
    return data.user;
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    setToken(null);
  };

  const logout = async () => {
    try {
      if (token) await authService.logout();
    } catch (error) {
      // ignore network errors on logout, still clear local session
    }
    await clearSession();
    setIsGuest(false);
  };

  const updateLocalUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isGuest,
        isLoading,
        isAuthenticated: Boolean(token),
        login,
        register,
        googleLogin,
        continueAsGuest,
        logout,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
