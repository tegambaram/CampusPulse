import AsyncStorage from '@react-native-async-storage/async-storage';

// AuthContext persists the logged-in user object (JSON) alongside the JWT under the 'user'
// key — read that directly rather than trying to decode a real JWT client-side, which is
// unnecessary here and would need a separate base64/JWT-decode dependency.
export const getCurrentUserId = async () => {
  const stored = await AsyncStorage.getItem('user');
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    return user?.id || user?._id || null;
  } catch (err) {
    return null;
  }
};

export const requireCurrentUserId = async () => {
  const id = await getCurrentUserId();
  if (!id) throw { message: 'You need to be logged in to do that.' };
  return id;
};
