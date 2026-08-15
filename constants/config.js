// --- Fill these in once the backend is deployed / running locally --------------------------
//
// LOCAL DEV: Platform.OS can't tell an emulator apart from a physical device, so set this
// manually for how you're testing (find your PC's LAN IP with `ipconfig` on Windows —
// the "Wi-Fi" adapter's IPv4 address — your phone and PC must be on the same Wi-Fi network):
//   - Physical device via Expo Go (same Wi-Fi as this PC) -> your PC's LAN IP
//   - Android Studio Emulator                              -> '10.0.2.2'
//   - iOS Simulator                                          -> 'localhost'
const LOCAL_HOST = '10.253.88.201';
const LOCAL_PORT = 4000; // matches backend/.env's PORT

// PRODUCTION: once the backend is deployed (e.g. to Render/Railway), put its URL here.
const PRODUCTION_URL = 'https://campuspulse-2wwh.onrender.com';

// Flip this to true once PRODUCTION_URL is set, to point the app at the deployed backend
// instead of your local dev machine.
const USE_PRODUCTION = true;
// ---------------------------------------------------------------------------------------------

const BASE = USE_PRODUCTION && PRODUCTION_URL ? PRODUCTION_URL : `http://${LOCAL_HOST}:${LOCAL_PORT}`;

export const API_BASE_URL = `${BASE}/api`;
export const SOCKET_URL = BASE;

// Cloudinary unsigned upload — picked images (post photos, avatars) are uploaded directly
// from the client to Cloudinary before the resulting permanent https:// URL is sent to our
// backend. Direct-from-client keeps large image payloads off our API server entirely; the
// preset is set to unsigned mode in the Cloudinary dashboard so no API secret is needed here.
export const CLOUDINARY_CLOUD_NAME = 'obykkgpd';
export const CLOUDINARY_UPLOAD_PRESET = 'CampusPulse';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
