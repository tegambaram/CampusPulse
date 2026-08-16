# CampusPulse — How the app is wired up

This app runs entirely on-device — there is **no backend server**. `data/localDb.js` is a small
local "database" that lives in AsyncStorage and fully replaces what would otherwise be a
REST/WebSocket API. On first launch it seeds itself with demo users, posts, conversations,
bookings, notifications, and reviews, so the app is immediately populated with no server, no
MongoDB, and no network connection required.

> Earlier versions of this doc described a real Express/MongoDB/Socket.io backend
> (`CampusPulse-backend`) that the app talked to over the network. That integration was removed;
> `services/api.js` and the Axios request/response interceptors it describes no longer exist. If a
> real backend integration is reintroduced, this file should be rewritten to match — don't take the
> steps below as a guide for standing up a server, because there isn't one to stand up.

## Architecture

- `data/localDb.js` — the local data store. Each collection (`users`, `posts`, `bookings`, etc.) is
  a JSON array kept in AsyncStorage, shaped the way a document-database backend would return it
  (`_id`, `createdAt`, id-reference fields) so the rest of the app doesn't need backend-shaped vs.
  local-shaped branching.
- `services/` — one file per resource (`authService`, `userService`, `postService`,
  `categoryService`, `searchService`, `conversationService`, `notificationService`,
  `bookingService`), each reading/writing `data/localDb.js` directly and enforcing the same kind of
  authorization a server would (e.g. only a booking's participants can change its status, only a
  post's author can edit/delete it — see `services/session.js` for how "the current user" is
  resolved).
- `services/session.js` — resolves the current AsyncStorage `token` to a user id via a `sessions`
  collection (token -> userId), *not* by decoding the token itself. `utils/crypto.js` generates the
  random token and hashes passwords.
- `context/AuthContext.js` — persists the session token + user object in AsyncStorage, exposes
  `login`/`register`/`googleLogin`/`continueAsGuest`/`logout`, and restores the session on app
  launch (used by the Splash screen to decide whether to route to `MainTabs` or `Welcome`).
- `hooks/useSocket.js` — deliberately stubbed to always return `null`. There's no real-time server
  to connect to, so every screen that would otherwise subscribe to a socket already has a
  REST-style fallback (poll/refetch) for when the socket is unavailable.
- `utils/mappers.js` — translates the local-db document shape (`_id`, `profileImage`,
  `compensationType: 'paid'`, `likedBy: [ids]`, ...) into the exact shape the UI components expect
  (`id`, `avatar`, `compensation: 'Paid'`, `liked: true/false`, ...).
- "Continue as Guest" sets an `isGuest` flag; the Create Post and Messages tabs, plus the Profile
  screen, prompt for login when a guest tries to use them.

## Running it

```bash
npm install
npx expo start
```

No `HOST`/IP configuration, no separate backend process — the app is fully self-contained. Log in
with any seeded account, e.g. `aarav.mehta@campuspulse.edu` / `password123` (every seeded user
shares that password; see `USER_SEED` in `data/localDb.js` for the full name list — email is
`firstname.lastname@campuspulse.edu`).

## Test the end-to-end flow

1. **Login** — use a seeded account (see above), or **Register** a new one.
2. **Feed** — Home screen loads posts from local storage; pull-to-refresh and infinite scroll work
   against the seeded data.
3. **Like / Bookmark** — tap the heart/bookmark icon on a post; it updates instantly and persists
   across app restarts (stored on-device).
4. **Chat** — open a post from a different seeded user, tap **Connect**, send a message.
5. **Create Post** — post something with an image; it appears at the top of the Home feed after a
   pull-to-refresh.
6. **Notifications** — seeded notifications show up on the bell icon on Home.
7. **Bookings** — book a post as one user, log out, log in as the post's owner, and mark it
   completed from the Booking screen.
8. **Logout** — clears the stored session and returns to the Welcome screen.

## Known trade-offs (kept deliberately simple for this MVP)

- Google login has no real OAuth — tapping "Continue with Google" logs in with a fixed demo Google
  account.
- Dark Mode and the Notifications toggle in Settings are local-only (AsyncStorage) — there's no
  server-side settings concept to sync to.
- Password hashing (`utils/crypto.js`) uses salted SHA-256 via `expo-crypto`, not a dedicated
  password-hashing KDF (bcrypt/argon2/scrypt) — reasonable for on-device demo data, not a claim of
  production-grade credential storage. If this app ever grows a real backend, auth should move
  there entirely rather than trusting the client to be its own identity provider.
- `npm audit` reports vulnerabilities in older transitive dependencies (mostly from the Expo SDK 51
  toolchain). Not addressed here since fixing them requires breaking upgrades outside this task's
  scope — worth revisiting before any real deployment.
