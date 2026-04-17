const BaseService = require("../core/base-service");
const projectRepository = require("../repositories/project-repository");
const projectMemberRepository = require("../repositories/project-member-repository");
const taskRepository = require("../repositories/task-repository");
const sprintRepository = require("../repositories/sprint-repository");
const userRepository = require("../repositories/user-repository");
const activityLogService = require("./activity-log-service");
const roleRepository = require("../repositories/role-repository");
const notificationService = require("./notification-service");
const projectValidator = require("./validators/project-validator");

class ProjectService extends BaseService {
  listProjects(actor) {
    const projects = projectRepository.findAll();
    const memberProjectIds = new Set(projectMemberRepository.findByUserId(actor.id).map((member) => member.projectId));

    return projects
      .filter((project) => {
        if (actor.role === "ADMIN") {
          return true;
        }

        return project.createdBy === actor.id || memberProjectIds.has(project.id);
      })
      .map((project) => this.toProjectDetails(project));
  }

  getProject(projectId, actor) {
    const project = this.ensureFound(projectRepository.findById(projectId), "Project not found");
    this.ensureProjectAccess(projectId, actor);
    return this.toProjectDetails(project);
  }

  createProject(payload, actor) {
    this.ensureManagerOrAdmin(actor);
    projectValidator.validate(payload);
    const project = projectRepository.create({
      title: payload.title,
      description: payload.description,
      createdBy: actor.id
    });

    projectMemberRepository.create({ projectId: project.id, userId: actor.id });
    activityLogService.logAction(`Created project ${project.title}`, actor.id);
    return this.toProjectDetails(project);
  }

  updateProject(projectId, payload, actor) {
    this.ensureManagerOrAdmin(actor);
    this.ensureProjectAccess(projectId, actor);
    projectValidator.validate(payload, true);

    const updatedProject = projectRepository.update(projectId, (project) => {
      project.updateProject(payload);
      return project;
    });

    activityLogService.logAction(`Updated project ${updatedProject.title}`, actor.id);
    return this.toProjectDetails(updatedProject);
  }

  archiveProject(projectId, actor) {
    this.ensureManagerOrAdmin(actor);
    this.ensureProjectAccess(projectId, actor);

    const archivedProject = projectRepository.update(projectId, (project) => {
      project.archiveProject();
      return project;
    });

    activityLogService.logAction(`Archived project ${archivedProject.title}`, actor.id);
    return this.toProjectDetails(archivedProject);
  }

  addMember(projectId, userId, actor) {
    this.ensureManagerOrAdmin(actor);
    this.ensureProjectAccess(projectId, actor);
    const project = projectRepository.findById(projectId);
    const user = userRepository.findById(userId);

    this.ensureFound(project, "Project or user not found");
    this.ensure(user && !user.isDeleted, 404, "Project or user not found");

    if (projectMemberRepository.findByProjectAndUser(projectId, userId)) {
      this.ensure(false, 409, "User is already a project member");
    }

    const member = projectMemberRepository.create({ projectId, userId });
    activityLogService.logAction(`Added ${user.email} to project ${project.title}`, actor.id);
    notificationService.sendNotification("IN_APP", `You were added to project "${project.title}"`, user.id);
    return member;
  }

  removeMember(projectId, userId, actor) {
    this.ensureManagerOrAdmin(actor);
    this.ensureProjectAccess(projectId, actor);

    const project = projectRepository.findById(projectId);
    const member = projectMemberRepository.findByProjectAndUser(projectId, userId);
    this.ensure(project && member, 404, "Project membership not found");

    this.ensure(!project.isOwnedBy(userId), 400, "Project owner cannot be removed from the project");

    const assignedTasks = taskRepository.findByProjectId(projectId).filter((task) => Number(task.assignedTo) === Number(userId));
    this.ensure(assignedTasks.length === 0, 400, "User still has assigned tasks in this project. Reassign them before removal.");

    projectMemberRepository.delete(member.id);
    activityLogService.logAction(`Removed user ${userId} from project ${project.title}`, actor.id);
    return { projectId: Number(projectId), userId: Number(userId), removed: true };
  }

  ensureProjectAccess(projectId, actor) {
    if (actor.role === "ADMIN") {
      return true;
    }

    const project = projectRepository.findById(projectId);
    const membership = projectMemberRepository.findByProjectAndUser(projectId, actor.id);
    this.ensure(project && (project.isOwnedBy(actor.id) || membership), 403, "You do not have access to this project");

    return true;
  }

  ensureManagerOrAdmin(actor) {
    this.ensureAuthorized(["ADMIN", "MANAGER"].includes(actor.role), "Only managers or admins can perform this action");
  }

  toProjectDetails(project) {
    const members = projectMemberRepository.findByProjectId(project.id).map((member) => {
      const user = userRepository.findById(member.userId);
      return user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: roleRepository.findById(user.roleId)?.name || "UNKNOWN"
          }
        : null;
    }).filter(Boolean);

    const tasks = taskRepository.findByProjectId(project.id);
    const sprints = sprintRepository.findByProjectId(project.id);
    const doneTasks = tasks.filter((task) => task.status === "DONE").length;
    const activeSprintCount = sprints.filter((sprint) => sprint.status === "ACTIVE").length;

    return {
      ...project,
      members,
      taskCount: tasks.length,
      sprintCount: sprints.length,
      completedTaskCount: doneTasks,
      activeSprintCount,
      progressPercentage: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0
    };
  }
}

module.exports = new ProjectService();
