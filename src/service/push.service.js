import admin from '../config/firebase.js';

export default class NotificationService {
  /**
   * Send push notification to a single device
   * @param {string} token - FCM device token
   * @param {Object} notification - Notification payload
   * @param {Object} data - Optional data payload
   * @returns {Promise<Object>} - Response from FCM
   */
  async sendToDevice(token, notification, data = {}) {
    if (!token) {
      throw new Error('Device token is required to send notification');
    }
    if (!notification || !notification.title || !notification.body) {
      throw new Error('Notification payload must include title and body');
    }

    const stringifiedData = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        stringifiedData[key] = String(data[key]);
      }
    }
    //console.log('Notification data:', data);
    try {
      const message = {
        token: token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl:
            'https://res.cloudinary.com/dvznn9s4g/image/upload/v1744585559/icon_yelohe.png',
        },
        data: stringifiedData,
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Notification sent successfully:', response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {Array<string>} tokens - Array of FCM device tokens
   * @param {Object} notification - Notification payload
   * @param {Object} data - Optional data payload
   * @returns {Promise<Object>} - Response from FCM
   */
  async sendToMultiple(tokens, notification, data = {}) {
    try {
      const message = {
        tokens: tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl || null,
        },
        data: data,
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log(
        'Bulk notification sent:',
        response.successCount,
        'successful,',
        response.failureCount,
        'failed'
      );

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw new Error(`Failed to send bulk notification: ${error.message}`);
    }
  }

  /**
   * Send notification to a topic (group of users)
   * @param {string} topic - Topic name
   * @param {Object} notification - Notification payload
   * @param {Object} data - Optional data payload
   * @returns {Promise<Object>} - Response from FCM
   */
  async sendToTopic(topic, notification, data = {}) {
    try {
      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl || null,
        },
        data: data,
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Topic notification sent successfully:', response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw new Error(`Failed to send topic notification: ${error.message}`);
    }
  }

  /**
   * Subscribe user to a topic
   * @param {Array<string>} tokens - Device tokens to subscribe
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} - Subscription response
   */
  async subscribeToTopic(tokens, topic) {
    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log('Successfully subscribed to topic:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw new Error(`Failed to subscribe to topic: ${error.message}`);
    }
  }

  /**
   * Unsubscribe user from a topic
   * @param {Array<string>} tokens - Device tokens to unsubscribe
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} - Unsubscription response
   */
  async unsubscribeFromTopic(tokens, topic) {
    try {
      const response = await admin
        .messaging()
        .unsubscribeFromTopic(tokens, topic);
      console.log('Successfully unsubscribed from topic:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw new Error(`Failed to unsubscribe from topic: ${error.message}`);
    }
  }
}
