const BaseRepository = require("./base-repository");
const { Notification } = require("../models/notification");

class NotificationRepository extends BaseRepository {
  constructor() {
    super("notifications", Notification);
  }

  findByUserId(userId) {
    return this.findAll().filter((notification) => Number(notification.userId) === Number(userId));
  }
}

module.exports = new NotificationRepository();
