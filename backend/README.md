# CampusPulse Backend

Express + MongoDB + Socket.io API for the CampusPulse app. Real-time chat (with instant
replies), notifications, and Expo push notifications when the app is backgrounded/closed.

## 1. Set up MongoDB Atlas (free)

1. Create a free account/cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (the free **M0** tier is enough).
2. **Database Access** → add a database user + password.
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere) — fine for development.
4. **Connect your application** → copy the `mongodb+srv://...` connection string.

## 2. Configure

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
- `MONGODB_URI` — the Atlas connection string from step 1 (fill in the real username/password).
- `JWT_SECRET` — any long random string. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## 3. Install, seed, run

```bash
npm install
npm run seed   # optional — populates demo users/categories/posts (same accounts as before, password123)
npm run dev    # starts the API + Socket.io on http://localhost:4000
```

Visit `http://localhost:4000/health` — should return `{"ok":true}`.

## 4. Point the app at it

Edit `../constants/config.js` — set `LOCAL_HOST` to your machine's LAN IP (for a phone on the
same Wi-Fi via Expo Go), `10.0.2.2` (Android emulator), or `localhost` (iOS simulator). See the
comments in that file for details.

## 5. Verify end-to-end (optional but recommended)

With `.env` filled in and the server **not** already running on port 4123:

```bash
node smoketest.js
```

This boots the real server, registers two throwaway users, and exercises the exact reply +
notification flow the app uses (send a message over the socket → the other user receives it
live + gets a notification). Cleans up its own test data.

## Deploying (Render or Railway)

1. Push this repo to GitHub (the `backend/` folder can be deployed as its own service — set
   the service's **root directory** to `backend`).
2. New Web Service → connect the repo → root directory `backend` → build command `npm install`
   → start command `npm start`.
3. Add environment variables `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` (your app's origin, or
   leave as `*` for now) in the host's dashboard — **do not** commit `.env`.
4. Once deployed, copy the service's public URL into `../constants/config.js`'s
   `PRODUCTION_URL` and flip `USE_PRODUCTION` to `true`.

## API overview

| Resource | Routes |
|---|---|
| Auth | `POST /api/auth/{register,login,google-login,forgot-password,logout}`, `GET /api/auth/me`, `POST /api/auth/push-token` |
| Posts | `GET /api/posts`, `GET /api/posts/bookmarked`, `GET/PUT/DELETE /api/posts/:id`, `POST /api/posts`, `POST /api/posts/:id/{like,bookmark}` |
| Bookings | `GET/POST /api/bookings`, `PATCH /api/bookings/:id/status`, `POST /api/bookings/:id/review` |
| Users | `GET /api/users/:id`, `PUT /api/users/me`, `POST /api/users/me/avatar`, `GET /api/users/:id/{reviews,posts}` |
| Conversations | `GET/POST /api/conversations`, `GET/POST /api/conversations/:id/messages` |
| Notifications | `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all` |
| Categories/Search | `GET /api/categories`, `GET /api/search`, `GET /api/search/trending` |

Real-time (Socket.io, connect with `auth: { token: <jwt> }`):

| Client emits | Server emits |
|---|---|
| `join_conversation(id)` / `leave_conversation(id)` | `receive_message(message)` |
| `message_read({conversationId})` | `typing` / `stop_typing({conversationId})` |
| `typing` / `stop_typing({conversationId})` | `user_online` / `user_offline({userId})` |
| `send_message({conversationId, text})` | `notification(notification)` |
