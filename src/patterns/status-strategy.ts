const HttpError = require("../core/http-error");

class StatusStrategy {
  canTransition(nextStatus) {
    return false;
  }
}

class TodoStatusStrategy extends StatusStrategy {
  canTransition(nextStatus) {
    return ["IN_PROGRESS", "BLOCKED"].includes(nextStatus);
  }
}

class InProgressStatusStrategy extends StatusStrategy {
  canTransition(nextStatus) {
    return ["DONE", "BLOCKED", "TODO"].includes(nextStatus);
  }
}

class BlockedStatusStrategy extends StatusStrategy {
  canTransition(nextStatus) {
    return ["TODO", "IN_PROGRESS"].includes(nextStatus);
  }
}

class DoneStatusStrategy extends StatusStrategy {
  canTransition(nextStatus) {
    return false;
  }
}

class TaskStatusStrategyResolver {
  map;

  constructor() {
    this.map = {
      TODO: new TodoStatusStrategy(),
      IN_PROGRESS: new InProgressStatusStrategy(),
      BLOCKED: new BlockedStatusStrategy(),
      DONE: new DoneStatusStrategy()
    };
  }

  validateTransition(currentStatus, nextStatus) {
    const strategy = this.map[currentStatus];
    if (!strategy || !strategy.canTransition(nextStatus)) {
      throw new HttpError(400, `Invalid task status transition from ${currentStatus} to ${nextStatus}`);
    }
  }
}

module.exports = new TaskStatusStrategyResolver();
