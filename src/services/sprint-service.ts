const BaseService = require("../core/base-service");
const sprintRepository = require("../repositories/sprint-repository");
const projectRepository = require("../repositories/project-repository");
const activityLogService = require("./activity-log-service");
const projectService = require("./project-service");
const sprintValidator = require("./validators/sprint-validator");

class SprintService extends BaseService {
  async listByProject(projectId, actor) {
    await projectService.ensureProjectAccess(projectId, actor);
    return sprintRepository.findByProjectId(projectId);
  }

  async createSprint(payload, actor) {
    projectService.ensureManagerOrAdmin(actor);
    await projectService.ensureProjectAccess(payload.projectId, actor);
    sprintValidator.validate(payload);

    this.ensureFound(await projectRepository.findById(payload.projectId), "Project not found");

    const sprint = await sprintRepository.create(payload);
    await activityLogService.logAction(`Created sprint ${sprint.name}`, actor.id);
    return sprint;
  }

  async updateStatus(id, status, actor) {
    const sprint = this.ensureFound(await sprintRepository.findById(id), "Sprint not found");

    projectService.ensureManagerOrAdmin(actor);
    await projectService.ensureProjectAccess(sprint.projectId, actor);

    const updatedSprint = await sprintRepository.update(id, (entry) => {
      if (status === "ACTIVE") {
        entry.startSprint();
      } else if (status === "COMPLETED") {
        entry.completeSprint();
      } else if (status === "PLANNED") {
        entry.planSprint();
      } else {
        this.ensure(false, 400, "Invalid sprint status");
      }
      return entry;
    });

    await activityLogService.logAction(`Updated sprint ${updatedSprint.name} to ${status}`, actor.id);
    return updatedSprint;
  }
}

module.exports = new SprintService();
