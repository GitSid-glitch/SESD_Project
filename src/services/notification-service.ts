const notificationFactory = require("../patterns/notification-factory");
const notificationRepository = require("../repositories/notification-repository");

class NotificationService {
  async sendNotification(type, message, userId) {
    const notification = notificationFactory.createNotification(type, message, userId);
    notification.send();
    return notificationRepository.create(notification);
  }

  async listForUser(userId) {
    return (await notificationRepository.findByUserId(userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

module.exports = new NotificationService();
