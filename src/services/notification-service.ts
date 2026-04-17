const notificationFactory = require("../patterns/notification-factory");
const notificationRepository = require("../repositories/notification-repository");

class NotificationService {
  sendNotification(type, message, userId) {
    const notification = notificationFactory.createNotification(type, message, userId);
    notification.send();
    return notificationRepository.create(notification);
  }

  listForUser(userId) {
    return notificationRepository
      .findByUserId(userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

module.exports = new NotificationService();
