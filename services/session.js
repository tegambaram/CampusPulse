import AsyncStorage from '@react-native-async-storage/async-storage';
import * as db from '../data/localDb';

// Every local service needs to know "who is currently logged in" to filter/attribute data,
// mirroring what a JWT-authenticated backend derives from the Authorization header.
//
// The token itself is an opaque random string (see utils/crypto.js) that carries no identity
// information — it's just a lookup key into the `sessions` collection, which maps token -> userId.
// This is deliberate: a token that directly encodes a user id (e.g. `local-token-<id>`) lets anyone
// who knows or guesses another student's id log in as them by writing that string into storage.
export const getCurrentUserId = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) return null;
  await db.ready();
  const sessions = await db.getAll('sessions');
  const session = sessions.find((s) => s.token === token);
  return session ? session.userId : null;
};

export const requireCurrentUserId = async () => {
  const id = await getCurrentUserId();
  if (!id) throw { message: 'You need to be logged in to do that.' };
  return id;
};
