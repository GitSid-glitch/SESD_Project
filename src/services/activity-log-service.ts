const activityLogRepository = require("../repositories/activity-log-repository");
const userRepository = require("../repositories/user-repository");

class ActivityLogService {
  async logAction(action, userId) {
    return activityLogRepository.create({ action, userId });
  }

  async listAll() {
    return (await activityLogRepository.findAll()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async listVisible(actor) {
    const items = await this.listAll();
    const visibleItems = actor.role === "MEMBER" ? items.filter((item) => item.userId === actor.id) : items;

    return Promise.all(visibleItems.map(async (item) => {
      const actorUser = await userRepository.findById(item.userId);
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
    }));
  }
}

module.exports = new ActivityLogService();
