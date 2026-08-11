# CampusPulse Frontend ↔ Backend Integration

This app now talks to the `CampusPulse-backend` Express/MongoDB/Socket.io API instead of static dummy data. `data/dummyData.js` is kept in the repo for reference but is no longer imported anywhere.

## 1. Start the backend first

No MongoDB install, no Atlas signup — the backend auto-creates and auto-seeds an in-memory database on every startup.

```bash
cd ../CampusPulse-backend
npm install     # first time only
npm run dev      # starts the API on http://0.0.0.0:5000 and seeds itself automatically
```

See `CampusPulse-backend/README.md` for full details. All seeded users share the password **`password123`**.

## 2. Point the app at your backend

`constants/config.js` has a `HOST` constant. Since `Platform.OS` can't tell an emulator apart from a physical device, set it manually for how you're testing:

```js
const HOST = '10.253.88.201'; // <-- set to your machine's current Wi-Fi IPv4 address
```

| Running on...                          | `HOST` value |
|------------------------------------------|--------------|
| Physical device via Expo Go (same Wi-Fi) | your PC's LAN IP (the current default) |
| Android Studio Emulator                 | `10.0.2.2` |
| iOS Simulator                           | `localhost` |

Find your LAN IP with `ipconfig` (Windows — look for the "Wi-Fi" adapter's IPv4 address, not VirtualBox/Ethernet ones) or `ifconfig` / `ip addr` (Mac/Linux). **Your phone and PC must be on the same Wi-Fi network.** If your PC's IP changes (e.g. after reconnecting to Wi-Fi), update this value and restart Expo.

`API_BASE_URL` and `SOCKET_URL` are both derived from this one `HOST` value.

## 3. Install the new frontend packages

Already added to `package.json` — just run:

```bash
npm install
```

New packages: `axios`, `@react-native-async-storage/async-storage`, `socket.io-client`, `expo-image-picker`, `@react-native-community/netinfo`.

## 4. Run the app

```bash
npx expo start
```

## 5. Test the end-to-end flow

1. **Login** — use a seeded account, e.g. `aarav.mehta@campuspulse.edu` / `password123` (see `CampusPulse-backend/seed/seedData.js` for the full name list — email is `firstname.lastname@campuspulse.edu`).
2. **Feed** — Home screen should load real posts from the backend, pull-to-refresh and infinite scroll should work.
3. **Like / Bookmark** — tap the heart/bookmark icon on a post; it updates instantly (optimistic) and persists for as long as the backend server keeps running (data lives in-memory on the server by default — restarting the *backend*, not the app, resets it and reseeds fresh demo data).
4. **Chat** — open a post from a different seeded user, tap **Connect**, send a message. Open the same conversation from a second device/simulator logged in as that other user to see the message arrive in real time via Socket.io.
5. **Create Post** — post something with an image; it should appear at the top of the Home feed after a pull-to-refresh.
6. **Notifications** — booking requests, new messages, and profile views should generate notifications (check the bell icon on Home).
7. **Bookings** — book a post as one user, then log in as the post's owner and mark it completed from the Booking screen.
8. **Logout** — clears the stored token and returns to the Welcome screen.

## What changed in the mobile app

- `services/` — one Axios-based file per backend resource (`authService`, `userService`, `postService`, `categoryService`, `searchService`, `conversationService`, `notificationService`, `bookingService`), plus the shared `services/api.js` client with a request interceptor (attaches the JWT) and a response interceptor (handles 401 by logging out).
- `context/AuthContext.js` — persists the JWT + user object in AsyncStorage, exposes `login`/`register`/`googleLogin`/`continueAsGuest`/`logout`, and restores the session on app launch (used by the Splash screen to decide whether to route to `MainTabs` or `Welcome`).
- `hooks/useSocket.js` + `utils/socketClient.js` — a single shared Socket.io connection (created once the user is authenticated) that any screen can subscribe to.
- `utils/mappers.js` — translates backend Mongo documents (`_id`, `profileImage`, `compensationType: 'paid'`, `likedBy: [ids]`, ...) into the exact shape the existing UI components already expect (`id`, `avatar`, `compensation: 'Paid'`, `liked: true/false`, ...) — this is why none of the components in `components/` needed to change.
- Every screen that previously read from `data/dummyData.js` now fetches from its matching service, with loading spinners, retry-on-error empty states, and (where relevant) pull-to-refresh / infinite scroll / optimistic like-bookmark updates.
- "Continue as Guest" sets an `isGuest` flag; the Create Post and Messages tabs, plus the Profile screen, prompt for login when a guest tries to use them.

## Known trade-offs (kept deliberately simple for this MVP)

- Google login is wired to the backend's **stub** endpoint (no real OAuth) — tapping "Continue with Google" logs in with a fixed demo Google account, matching the backend's mock-payload design.
- Dark Mode and the Notifications toggle in Settings are local-only (AsyncStorage), as scoped in the integration request — there's no backend settings endpoint.
- `npm audit` reports vulnerabilities in older transitive dependencies (mostly from the Expo SDK 51 toolchain and `multer` 1.x). Not addressed here since fixing them requires breaking upgrades outside this task's scope — worth revisiting before any real deployment.
