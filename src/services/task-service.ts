const BaseService = require("../core/base-service");
const taskRepository = require("../repositories/task-repository");
const projectRepository = require("../repositories/project-repository");
const userRepository = require("../repositories/user-repository");
const sprintRepository = require("../repositories/sprint-repository");
const projectMemberRepository = require("../repositories/project-member-repository");
const commentRepository = require("../repositories/comment-repository");
const taskStatusStrategyResolver = require("../patterns/status-strategy");
const activityLogService = require("./activity-log-service");
const notificationService = require("./notification-service");
const projectService = require("./project-service");
const taskValidator = require("./validators/task-validator");

class TaskService extends BaseService {
  async listTasks(filters, actor) {
    let tasks = await taskRepository.findVisibleTasks();

    if (actor.role !== "ADMIN") {
      const memberships = new Set((await projectMemberRepository.findByUserId(actor.id)).map((member) => member.projectId));
      tasks = tasks.filter(
        (task) => task.createdBy === actor.id || task.assignedTo === actor.id || memberships.has(task.projectId)
      );
    }

    if (filters.projectId) {
      tasks = tasks.filter((task) => Number(task.projectId) === Number(filters.projectId));
    }
    if (filters.status) {
      tasks = tasks.filter((task) => task.status === filters.status);
    }
    if (filters.assignedTo) {
      tasks = tasks.filter((task) => Number(task.assignedTo) === Number(filters.assignedTo));
    }

    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 10);
    const startIndex = (page - 1) * limit;
    const paginated = tasks.slice(startIndex, startIndex + limit);

    return {
      items: await Promise.all(paginated.map((task) => this.enrichTask(task))),
      pagination: {
        page,
        limit,
        total: tasks.length
      }
    };
  }

  async getTaskById(taskId, actor) {
    const task = await this.ensureVisibleTask(taskId);

    await projectService.ensureProjectAccess(task.projectId, actor);
    return this.enrichTask(task);
  }

  async createTask(payload, actor) {
    projectService.ensureManagerOrAdmin(actor);
    await projectService.ensureProjectAccess(payload.projectId, actor);
    taskValidator.validate(payload);

    this.ensureFound(await projectRepository.findById(payload.projectId), "Project not found");

    if (payload.sprintId) {
      const sprint = await sprintRepository.findById(payload.sprintId);
      this.ensureFound(sprint, "Sprint not found");
      this.ensure(Number(sprint.projectId) === Number(payload.projectId), 400, "Task sprint must belong to the selected project");
    }

    if (payload.assignedTo) {
      await this.ensureAssignableMember(payload.projectId, payload.assignedTo);
    }

    const task = await taskRepository.create({
      ...payload,
      createdBy: actor.id
    });

    await activityLogService.logAction(`Created task ${task.title}`, actor.id);

    if (task.assignedTo) {
      await notificationService.sendNotification("IN_APP", `You were assigned task "${task.title}"`, task.assignedTo);
    }

    return this.enrichTask(task);
  }

  async updateTask(taskId, payload, actor) {
    const existingTask = await this.ensureVisibleTask(taskId);

    await projectService.ensureProjectAccess(existingTask.projectId, actor);

    const canManageTask = ["ADMIN", "MANAGER"].includes(actor.role) || existingTask.isOwnedBy(actor.id);
    const isAssignee = existingTask.isAssignedTo(actor.id);

    this.ensureAuthorized(canManageTask || isAssignee, "You are not allowed to update this task");

    if (!canManageTask) {
      const allowedKeys = ["status"];
      const receivedKeys = Object.keys(payload).filter((key) => payload[key] !== undefined && payload[key] !== "");
      const hasInvalidKey = receivedKeys.some((key) => !allowedKeys.includes(key));
      this.ensureAuthorized(!hasInvalidKey, "Members can only update the status of their assigned tasks");
    }

    if (payload.status && payload.status !== existingTask.status) {
      taskStatusStrategyResolver.validateTransition(existingTask.status, payload.status);
    }

    if (payload.assignedTo) {
      await this.ensureAssignableMember(existingTask.projectId, payload.assignedTo);
    }

    if (payload.sprintId) {
      const sprint = await sprintRepository.findById(payload.sprintId);
      this.ensure(sprint && Number(sprint.projectId) === Number(existingTask.projectId), 400, "Updated sprint must belong to the same project as the task");
    }

    const updatedTask = await taskRepository.update(taskId, (task) => {
      task.updateDetails(payload);
      if (payload.status) {
        task.updateStatus(payload.status);
      }
      if (Object.prototype.hasOwnProperty.call(payload, "assignedTo")) {
        task.assignUser(payload.assignedTo);
      }
      return task;
    });

    await activityLogService.logAction(`Updated task ${updatedTask.title}`, actor.id);

    if (payload.assignedTo && payload.assignedTo !== existingTask.assignedTo) {
      await notificationService.sendNotification("IN_APP", `You were assigned task "${updatedTask.title}"`, payload.assignedTo);
    }

    if (payload.status && payload.status !== existingTask.status) {
      const recipients = new Set([existingTask.createdBy, existingTask.assignedTo].filter(Boolean));
      recipients.delete(actor.id);
      await Promise.all(Array.from(recipients).map((userId) =>
        notificationService.sendNotification(
          "IN_APP",
          `Task "${updatedTask.title}" moved to ${updatedTask.status.replaceAll("_", " ")}`,
          userId
        )
      ));
    }

    return this.enrichTask(updatedTask);
  }

  async softDelete(taskId, actor) {
    const task = await this.ensureVisibleTask(taskId);

    projectService.ensureManagerOrAdmin(actor);
    await projectService.ensureProjectAccess(task.projectId, actor);

    const deletedTask = await taskRepository.update(taskId, (entry) => {
      entry.softDelete();
      return entry;
    });

    await activityLogService.logAction(`Soft deleted task ${deletedTask.title}`, actor.id);
    return this.enrichTask(deletedTask);
  }

  async addComment(taskId, content, actor) {
    const task = await this.ensureVisibleTask(taskId);

    await projectService.ensureProjectAccess(task.projectId, actor);

    const comment = await commentRepository.create({
      content,
      taskId,
      userId: actor.id
    });

    await activityLogService.logAction(`Commented on task ${task.title}`, actor.id);

    const recipients = new Set([task.assignedTo, task.createdBy].filter(Boolean));
    recipients.delete(actor.id);
    await Promise.all(Array.from(recipients).map((userId) =>
      notificationService.sendNotification("IN_APP", `New comment added to "${task.title}"`, userId)
    ));

    return comment;
  }

  async ensureAssignableMember(projectId, userId) {
    const user = await userRepository.findById(userId);
    const member = await projectMemberRepository.findByProjectAndUser(projectId, userId);
    this.ensure(user && !user.isDeleted && member, 400, "Assigned user must belong to the project");
  }

  async ensureVisibleTask(taskId) {
    const task = await taskRepository.findById(taskId);
    this.ensure(task && !task.deleted, 404, "Task not found");
    return task;
  }

  async enrichTask(task) {
    const assignee = task.assignedTo ? await userRepository.findById(task.assignedTo) : null;
    const creator = await userRepository.findById(task.createdBy);
    const comments = await Promise.all((await commentRepository.findByTaskId(task.id)).map(async (comment) => {
      const author = await userRepository.findById(comment.userId);
      return {
        ...comment,
        author: author
          ? {
              id: author.id,
              name: author.name,
              email: author.email
            }
          : null
      };
    }));

    return {
      ...task,
      isOverdue: Boolean(task.dueDate) && task.status !== "DONE" && new Date(task.dueDate) < new Date(),
      assignedUser: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
      createdByUser: creator ? { id: creator.id, name: creator.name, email: creator.email } : null,
      comments
    };
  }
}

module.exports = new TaskService();
