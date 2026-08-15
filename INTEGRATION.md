# CampusPulse Frontend ↔ Backend Integration

The app talks to the `backend/` Express/MongoDB/Socket.io API (in this same repo) instead of
the local AsyncStorage-only data layer. `data/localDb.js` and `data/dummyData.js` are kept for
reference but no longer imported anywhere.

## 1. Set up and start the backend first

See `backend/README.md` for full setup (MongoDB Atlas account, `.env`, seeding). Short version:

```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI + JWT_SECRET
npm install
npm run seed            # optional demo data
npm run dev              # starts the API + Socket.io on http://localhost:4000
```

## 2. Point the app at your backend

`constants/config.js` has a `LOCAL_HOST` constant. Since `Platform.OS` can't tell an emulator
apart from a physical device, set it manually for how you're testing:

| Running on... | `LOCAL_HOST` value |
|---|---|
| Physical device via Expo Go (same Wi-Fi) | your PC's LAN IP |
| Android Studio Emulator | `10.0.2.2` |
| iOS Simulator | `localhost` |

Find your LAN IP with `ipconfig` (Windows — the "Wi-Fi" adapter's IPv4 address) or `ifconfig`
(Mac/Linux). Your phone and PC must be on the same Wi-Fi network. Once the backend is deployed
(Render/Railway), set `PRODUCTION_URL` and flip `USE_PRODUCTION` to `true` instead.

`API_BASE_URL` and `SOCKET_URL` are both derived from this one config file.

## 3. Install frontend packages

```bash
npm install
```

New packages beyond the original local-only build: `expo-notifications`, `expo-device`,
`expo-constants` (for Expo push notifications — `axios` and `socket.io-client` were already
present).

## 4. Run the app

```bash
npx expo start
```

## 5. Test the end-to-end flow

1. **Login** — a seeded account, e.g. `aarav.mehta@campuspulse.edu` / `password123` (after
   running `npm run seed` in `backend/`).
2. **Feed** — Home screen loads real posts from the backend; pull-to-refresh / infinite scroll work.
3. **Like / Bookmark** — updates instantly (optimistic) and persists in MongoDB Atlas.
4. **Chat** — open a conversation, send a message. Open the same conversation as the other user
   on a second device/simulator to see it arrive instantly via Socket.io, plus a notification.
5. **Notifications** — new messages, booking requests, and status changes create notifications
   (bell icon), delivered live in-app and, if the recipient's app is backgrounded/closed, as a
   real device push notification (Expo push — no Firebase/Apple account needed).
6. **Bookings** — book a post as one user, then log in as the post's owner and mark it completed.
7. **Logout** — clears the stored token/session and returns to the Welcome screen.

## What the mobile app talks to

- `services/` — one Axios-based file per backend resource, plus the shared `services/api.js`
  client (JWT request interceptor, 401 response handling).
- `context/AuthContext.js` — persists the JWT + user in AsyncStorage, registers the device's
  Expo push token with the backend after login, restores the session on launch.
- `hooks/useSocket.js` + `utils/socketClient.js` — one shared Socket.io connection, created once
  authenticated, used by MessagesScreen/ChatScreen/NotificationsScreen.
- `utils/mappers.js` — translates backend Mongo documents into the exact shape the existing UI
  components expect — none of `components/` needed to change.
- `utils/pushToken.js` — requests notification permission and registers the Expo push token.

## Known trade-offs (kept deliberately simple for now)

- Google login hits the backend's **stub** endpoint (no real OAuth).
- Dark Mode and the Notifications toggle in Settings stay local-only (AsyncStorage) — no backend
  settings endpoint.
- Post/profile images are stored as whatever URI the client sends (device URI or remote URL) —
  no object storage (e.g. Cloudinary/S3) wired up yet, so a locally-picked image won't be visible
  from a different device. Worth adding before a real multi-user deployment.
- Expo push notifications need an EAS project to work outside of local dev in Expo Go
  (`eas init`) — until then, in-app socket notifications still work fully, just not OS-level push
  when the app is fully closed.
