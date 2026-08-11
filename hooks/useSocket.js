// This build runs entirely on a local, on-device data store (see data/localDb.js) — there's no
// real-time server to connect to. Every screen that used this hook already has a REST-style
// fallback for when the socket is unavailable, so we simply always return null instead of
// endlessly retrying a connection that can never succeed.
export default function useSocket() {
  return null;
}
