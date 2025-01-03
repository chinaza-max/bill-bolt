import admin from '../config/firebase.js';

export const sendPushNotification = async (fcmToken, payload) => {
  try {
    await admin.messaging().sendToDevice(fcmToken, payload);
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new Error('Notification failed');
  }
};
