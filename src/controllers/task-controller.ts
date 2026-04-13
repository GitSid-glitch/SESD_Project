const taskService = require("../services/task-service");

class TaskController {
  list(req) {
    return taskService.listTasks(req.query, req.user);
  }

  get(req) {
    return taskService.getTaskById(req.params.id, req.user);
  }

  create(req) {
    return taskService.createTask(req.body, req.user);
  }

  update(req) {
    return taskService.updateTask(req.params.id, req.body, req.user);
  }

  delete(req) {
    return taskService.softDelete(req.params.id, req.user);
  }

  addComment(req) {
    return taskService.addComment(req.params.id, req.body.content, req.user);
  }
}

module.exports = new TaskController();
