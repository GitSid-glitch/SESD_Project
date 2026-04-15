const BaseRepository = require("./base-repository");
const ActivityLog = require("../models/activity-log");

class ActivityLogRepository extends BaseRepository {
  constructor() {
    super("activityLogs", ActivityLog);
  }
}

module.exports = new ActivityLogRepository();
