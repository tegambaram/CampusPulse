import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_PREFIX = 'local-token-';

// Every local service needs to know "who is currently logged in" to filter/attribute data,
// mirroring what the old JWT-authenticated backend derived from the Authorization header.
export const getCurrentUserId = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  return token.slice(TOKEN_PREFIX.length);
};

export const requireCurrentUserId = async () => {
  const id = await getCurrentUserId();
  if (!id) throw { message: 'You need to be logged in to do that.' };
  return id;
};
