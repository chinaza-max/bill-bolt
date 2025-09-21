import Notification from '../db/models/notification';

class NotificationService {
  /**
   * Add a new notification
   */
  async addNotification({ userId, title, body, type, metaData }) {
    return await Notification.create({
      userId,
      title,
      body,
      type,
      metaData,
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.isRead = true;
    await notification.save();
    return notification;
  }

  async toggleDelete(notificationId) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isDeleted = !notification.isDeleted;
    await notification.save();

    return notification;
  }

  /**
   * Fetch notifications with pagination
   */
  async fetchNotifications(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Notification.findAndCountAll({
      where: { userId, isDeleted: false },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Count unread notifications
   */
  async countUnreadNotifications(userId) {
    return await Notification.count({
      where: { userId, isDeleted: false, isRead: false },
    });
  }

  /**
   * Fetch notifications filtered by type
   */
  async fetchNotificationsByType(userId, type, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Notification.findAndCountAll({
      where: { userId, type, isDeleted: false },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

export default NotificationService;
