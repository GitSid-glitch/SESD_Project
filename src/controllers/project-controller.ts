const projectService = require("../services/project-service");

class ProjectController {
  list(req) {
    return projectService.listProjects(req.user);
  }

  get(req) {
    return projectService.getProject(req.params.id, req.user);
  }

  create(req) {
    return projectService.createProject(req.body, req.user);
  }

  update(req) {
    return projectService.updateProject(req.params.id, req.body, req.user);
  }

  archive(req) {
    return projectService.archiveProject(req.params.id, req.user);
  }

  addMember(req) {
    return projectService.addMember(req.params.id, req.body.userId, req.user);
  }

  removeMember(req) {
    return projectService.removeMember(req.params.id, req.params.userId, req.user);
  }
}

module.exports = new ProjectController();
