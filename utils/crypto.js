import * as Crypto from 'expo-crypto';

// Small crypto helpers shared by the local auth/session layer. Uses expo-crypto so we get real
// device randomness (getRandomBytesAsync) and a native SHA-256 digest instead of Math.random-based
// "random" tokens or comparing passwords in plaintext.

const bytesToHex = (bytes) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

// Opaque, unguessable random token (hex string). Used for both session tokens and per-user
// password salts — long enough that it can't be brute-forced or derived from a user id.
export const randomToken = async (byteLength = 32) => {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return bytesToHex(bytes);
};

// Salted SHA-256. Not as strong as a dedicated password-hashing KDF (bcrypt/argon2/scrypt), but
// this is a client-only local demo store with no server round-trip to run those on — this is a
// meaningful step up from the plaintext comparison it replaces, not a claim of production-grade
// password storage.
export const hashPassword = async (password, salt) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
