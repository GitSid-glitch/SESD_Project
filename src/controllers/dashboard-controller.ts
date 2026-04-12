const activityLogService = require("../services/activity-log-service");
const notificationService = require("../services/notification-service");
const projectService = require("../services/project-service");
const taskService = require("../services/task-service");

class DashboardController {
  summary(req) {
    const projects = projectService.listProjects(req.user);
    const tasks = taskService.listTasks({ page: 1, limit: 100 }, req.user);
    const notifications = notificationService.listForUser(req.user.id);
    const activities = activityLogService.listVisible(req.user).slice(0, 10);
    const statusBreakdown = tasks.items.reduce(
      (accumulator, task) => {
        accumulator[task.status] = (accumulator[task.status] || 0) + 1;
        return accumulator;
      },
      { TODO: 0, IN_PROGRESS: 0, BLOCKED: 0, DONE: 0 }
    );
    const overdueTasks = tasks.items.filter((task) => task.isOverdue).length;
    const blockedTasks = tasks.items.filter((task) => task.status === "BLOCKED").length;
    const teamWorkload = tasks.items.reduce((accumulator, task) => {
      const key = task.assignedUser ? task.assignedUser.name : "Unassigned";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return {
      user: req.user,
      metrics: {
        totalProjects: projects.length,
        totalTasks: tasks.pagination.total,
        assignedTasks: tasks.items.filter((task) => task.assignedTo === req.user.id).length,
        completedTasks: tasks.items.filter((task) => task.status === "DONE").length,
        overdueTasks,
        blockedTasks
      },
      statusBreakdown,
      teamWorkload,
      projectHealth: projects
        .map((project) => ({
          id: project.id,
          title: project.title,
          progressPercentage: project.progressPercentage,
          taskCount: project.taskCount,
          completedTaskCount: project.completedTaskCount,
          activeSprintCount: project.activeSprintCount
        }))
        .sort((left, right) => right.progressPercentage - left.progressPercentage),
      recentProjects: projects.slice(0, 5),
      recentTasks: tasks.items.slice(0, 8),
      notifications: notifications.slice(0, 10),
      activities
    };
  }
}

module.exports = new DashboardController();
