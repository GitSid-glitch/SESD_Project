const activityLogRepository = require("../repositories/activity-log-repository");
const userRepository = require("../repositories/user-repository");

class ActivityLogService {
  logAction(action, userId) {
    return activityLogRepository.create({ action, userId });
  }

  listAll() {
    return activityLogRepository.findAll().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  listVisible(actor) {
    const items = this.listAll();
    const visibleItems = actor.role === "MEMBER" ? items.filter((item) => item.userId === actor.id) : items;

    return visibleItems.map((item) => {
      const actorUser = userRepository.findById(item.userId);
      return {
        ...item,
        actor: actorUser
          ? {
              id: actorUser.id,
              name: actorUser.name,
              email: actorUser.email
            }
          : null
      };
    });
  }
}

module.exports = new ActivityLogService();
