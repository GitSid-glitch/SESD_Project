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
  async listProjects(actor) {
    const projects = await projectRepository.findAll();
    const memberProjectIds = new Set((await projectMemberRepository.findByUserId(actor.id)).map((member) => member.projectId));

    return Promise.all(projects
      .filter((project) => {
        if (actor.role === "ADMIN") {
          return true;
        }

        return project.createdBy === actor.id || memberProjectIds.has(project.id);
      })
      .map((project) => this.toProjectDetails(project)));
  }

  async getProject(projectId, actor) {
    const project = this.ensureFound(await projectRepository.findById(projectId), "Project not found");
    await this.ensureProjectAccess(projectId, actor);
    return this.toProjectDetails(project);
  }

  async createProject(payload, actor) {
    this.ensureManagerOrAdmin(actor);
    projectValidator.validate(payload);
    const project = await projectRepository.create({
      title: payload.title,
      description: payload.description,
      createdBy: actor.id
    });

    await projectMemberRepository.create({ projectId: project.id, userId: actor.id });
    await activityLogService.logAction(`Created project ${project.title}`, actor.id);
    return this.toProjectDetails(project);
  }

  async updateProject(projectId, payload, actor) {
    this.ensureManagerOrAdmin(actor);
    await this.ensureProjectAccess(projectId, actor);
    projectValidator.validate(payload, true);

    const updatedProject = await projectRepository.update(projectId, (project) => {
      project.updateProject(payload);
      return project;
    });

    await activityLogService.logAction(`Updated project ${updatedProject.title}`, actor.id);
    return this.toProjectDetails(updatedProject);
  }

  async archiveProject(projectId, actor) {
    this.ensureManagerOrAdmin(actor);
    await this.ensureProjectAccess(projectId, actor);

    const archivedProject = await projectRepository.update(projectId, (project) => {
      project.archiveProject();
      return project;
    });

    await activityLogService.logAction(`Archived project ${archivedProject.title}`, actor.id);
    return this.toProjectDetails(archivedProject);
  }

  async addMember(projectId, userId, actor) {
    this.ensureManagerOrAdmin(actor);
    await this.ensureProjectAccess(projectId, actor);
    const project = await projectRepository.findById(projectId);
    const user = await userRepository.findById(userId);

    this.ensureFound(project, "Project or user not found");
    this.ensure(user && !user.isDeleted, 404, "Project or user not found");

    if (await projectMemberRepository.findByProjectAndUser(projectId, userId)) {
      this.ensure(false, 409, "User is already a project member");
    }

    const member = await projectMemberRepository.create({ projectId, userId });
    await activityLogService.logAction(`Added ${user.email} to project ${project.title}`, actor.id);
    await notificationService.sendNotification("IN_APP", `You were added to project "${project.title}"`, user.id);
    return member;
  }

  async removeMember(projectId, userId, actor) {
    this.ensureManagerOrAdmin(actor);
    await this.ensureProjectAccess(projectId, actor);

    const project = await projectRepository.findById(projectId);
    const member = await projectMemberRepository.findByProjectAndUser(projectId, userId);
    this.ensure(project && member, 404, "Project membership not found");

    this.ensure(!project.isOwnedBy(userId), 400, "Project owner cannot be removed from the project");

    const assignedTasks = (await taskRepository.findByProjectId(projectId)).filter((task) => Number(task.assignedTo) === Number(userId));
    this.ensure(assignedTasks.length === 0, 400, "User still has assigned tasks in this project. Reassign them before removal.");

    await projectMemberRepository.delete(member.id);
    await activityLogService.logAction(`Removed user ${userId} from project ${project.title}`, actor.id);
    return { projectId: Number(projectId), userId: Number(userId), removed: true };
  }

  async ensureProjectAccess(projectId, actor) {
    if (actor.role === "ADMIN") {
      return true;
    }

    const project = await projectRepository.findById(projectId);
    const membership = await projectMemberRepository.findByProjectAndUser(projectId, actor.id);
    this.ensure(project && (project.isOwnedBy(actor.id) || membership), 403, "You do not have access to this project");

    return true;
  }

  ensureManagerOrAdmin(actor) {
    this.ensureAuthorized(["ADMIN", "MANAGER"].includes(actor.role), "Only managers or admins can perform this action");
  }

  async toProjectDetails(project) {
    const members = (await Promise.all((await projectMemberRepository.findByProjectId(project.id)).map(async (member) => {
      const user = await userRepository.findById(member.userId);
      return user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: (await roleRepository.findById(user.roleId))?.name || "UNKNOWN"
          }
        : null;
    }))).filter(Boolean);

    const tasks = await taskRepository.findByProjectId(project.id);
    const sprints = await sprintRepository.findByProjectId(project.id);
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
