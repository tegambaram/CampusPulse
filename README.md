# 📡 CampusPulse

**Connecting Students. Sharing Skills.**

CampusPulse is a campus community app where students can ask for help, offer their skills, lend or borrow items, and connect with each other — all in one place. Built with React Native + Expo. 🎓✨

---

## 🚀 Features

- 🙋 **Need / Offer Posts** — ask for help or offer your skills, notes, or items to the campus
- 🗂️ **Categories** — browse posts by subject, skill, or category
- 🔍 **Search** — find skills, items, and people fast, with trending & recent searches
- 📅 **Bookings** — request and manage sessions (upcoming, completed, cancelled)
- 💬 **Real-time Chat** — message other students directly, with typing indicators & online status
- 🔔 **Notifications** — stay updated on bookings, messages, and requests
- 👤 **Profiles** — showcase your skills, ratings, reviews, and posts
- ✏️ **Full Post CRUD** — create, edit, and delete your own posts
- 🌗 **Dark Mode** — full light/dark theme support across the entire app
- 👻 **Guest Mode** — browse without an account, prompted to log in when needed

---

## 🛠️ Tech Stack

| Layer          | Tech                                             |
|----------------|---------------------------------------------------|
| 📱 Framework    | React Native + Expo (SDK 51)                      |
| 🧭 Navigation   | React Navigation (Bottom Tabs + Native Stack)      |
| 🎨 UI           | React Native Paper, Expo Linear Gradient, Ionicons |
| 🔌 Backend      | Node.js, Express, MongoDB (Atlas), Socket.io       |
| 🔔 Push         | Expo push notifications                            |
| 💾 Local Cache  | AsyncStorage (JWT session, recent searches)        |
| 🖼️ Media        | Expo Image Picker                                  |
| 🌓 Theming      | Custom light/dark ThemeContext                     |

> 💡 CampusPulse talks to a real backend (`backend/`) for posts, bookings, chat and notifications — including **real-time replies over Socket.io** and **push notifications** when the app is backgrounded. See `INTEGRATION.md` and `backend/README.md` to set it up (needs a free MongoDB Atlas account).

---

## 📲 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npx expo start

# 3. Scan the QR code with Expo Go (Android/iOS)
```

### 🔑 Demo Login

```
Email:    aarav.mehta@campuspulse.edu
Password: password123
```

*(All 10 seeded users share the password `password123`)*

---

## 📦 Building a Standalone APK

```bash
npx expo prebuild -p android
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

The signed APK will be at `android/app/build/outputs/apk/release/app-release.apk` — installable directly on any Android device, no dev server required. 🎉

---

## 📁 Project Structure

```
CampusPulse/
├── backend/          🔌 Express + MongoDB + Socket.io API (see backend/README.md)
├── components/     🧩 Reusable UI components
├── screens/        🖥️ App screens
├── navigation/      🧭 Tab & stack navigators
├── context/         🌐 Auth & Theme providers
├── services/        🔌 Axios services calling the backend API
├── hooks/            🔗 useSocket — shared real-time connection
├── data/             💾 Legacy local mock store (kept for reference, unused)
├── constants/        🎨 Colors, spacing, typography, API config
└── utils/             🛠️ Mappers, socket client, push token helpers
```

---

## 👨‍💻 Author

Made with ☕ and 💙 for campus communities everywhere.

---

⭐ If you like this project, consider giving it a star!
