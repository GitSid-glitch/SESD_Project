const sprintService = require("../services/sprint-service");

class SprintController {
  listByProject(req) {
    return sprintService.listByProject(req.params.projectId, req.user);
  }

  create(req) {
    return sprintService.createSprint(req.body, req.user);
  }

  updateStatus(req) {
    return sprintService.updateStatus(req.params.id, req.body.status, req.user);
  }
}

module.exports = new SprintController();
