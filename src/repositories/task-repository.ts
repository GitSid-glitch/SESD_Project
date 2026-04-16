const BaseRepository = require("./base-repository");
const Task = require("../models/task");

class TaskRepository extends BaseRepository {
  constructor() {
    super("tasks", Task);
  }

  findByProjectId(projectId) {
    return this.findAll().filter((task) => Number(task.projectId) === Number(projectId) && !task.deleted);
  }

  findVisibleTasks() {
    return this.findAll().filter((task) => !task.deleted);
  }
}

module.exports = new TaskRepository();
