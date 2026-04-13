class ActivityLog {
  id;
  action;
  userId;
  timestamp;

  constructor({
    id,
    action,
    userId,
    timestamp = new Date().toISOString()
  }) {
    this.id = id;
    this.action = action;
    this.userId = userId;
    this.timestamp = timestamp;
  }

  logAction(action) {
    this.action = action;
    this.timestamp = new Date().toISOString();
  }
}

module.exports = ActivityLog;
