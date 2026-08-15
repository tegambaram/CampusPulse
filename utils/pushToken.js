import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Shows a banner/sound for notifications that arrive while the app is open in the foreground
// (by default Expo suppresses these — the in-app socket 'notification' event already updates
// the UI live, but this also gives a system-level toast/sound to match).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Requests permission and returns an Expo push token to register with the backend, or null
// if unavailable (simulator, permission denied, or no EAS project configured yet — none of
// these should block login, so callers should treat null as "skip push for now").
export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) return null; // push tokens don't work on simulators/emulators

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const result = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return result.data;
  } catch (err) {
    // Most commonly: no EAS project linked yet (run `eas init`). Not fatal — the app still
    // works fully via the in-app socket notifications, just without OS-level push for now.
    console.warn('[push] could not get Expo push token:', err.message);
    return null;
  }
};
