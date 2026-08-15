// Sends push notifications through Expo's push service. No account/API key needed for
// Expo push tokens (ExponentPushToken[...]) — just POST to Expo's endpoint.
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendPushNotification = async ({ to, title, body, data }) => {
  if (!to || !to.startsWith('ExponentPushToken')) return; // no/invalid token registered for this user

  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, title, body, data, sound: 'default' }),
    });
  } catch (err) {
    console.warn('[push] failed to send notification', err.message);
  }
};

module.exports = { sendPushNotification };
