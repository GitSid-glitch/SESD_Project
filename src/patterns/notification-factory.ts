const { EmailNotification, InAppNotification } = require("../models/notification");

class NotificationFactory {
  createNotification(type, message, userId) {
    const common = { message, type, userId };
    if (type === "EMAIL") {
      return new EmailNotification(common);
    }

    return new InAppNotification(common);
  }
}

module.exports = new NotificationFactory();
