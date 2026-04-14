class Notification {
  id;
  message;
  type;
  userId;
  deliveryStatus;
  createdAt;

  constructor({
    id,
    message,
    type,
    userId,
    deliveryStatus = "PENDING",
    createdAt = new Date().toISOString()
  }) {
    this.id = id;
    this.message = message;
    this.type = type;
    this.userId = userId;
    this.deliveryStatus = deliveryStatus;
    this.createdAt = createdAt;
  }

  send() {
    this.deliveryStatus = "SENT";
  }
}

class EmailNotification extends Notification {
  send() {
    this.deliveryStatus = "EMAIL_SENT";
  }
}

class InAppNotification extends Notification {
  send() {
    this.deliveryStatus = "IN_APP_SENT";
  }
}

module.exports = {
  Notification,
  EmailNotification,
  InAppNotification
};
