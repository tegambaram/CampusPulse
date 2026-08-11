// NOTE: Platform.OS is "android"/"ios" for BOTH emulators and physical devices, so it can't
// be used to auto-detect which one you're running on. Set HOST manually for your setup:
//
// - Physical device via Expo Go (same Wi-Fi as this PC) -> your PC's LAN IP (current default)
// - Android Studio Emulator                              -> '10.0.2.2'
// - iOS Simulator                                          -> 'localhost'
const HOST = '10.253.88.201'; // this machine's current Wi-Fi IPv4 address

const PORT = 5000;

export const API_BASE_URL = `http://${HOST}:${PORT}/api`;
export const SOCKET_URL = `http://${HOST}:${PORT}`;
