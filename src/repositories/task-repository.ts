const BaseRepository = require("./base-repository");
const Task = require("../models/task");

class TaskRepository extends BaseRepository {
  constructor() {
    super("tasks", Task);
  }

  async findByProjectId(projectId) {
    return (await this.findAll()).filter((task) => Number(task.projectId) === Number(projectId) && !task.deleted);
  }

  async findVisibleTasks() {
    return (await this.findAll()).filter((task) => !task.deleted);
  }
}

module.exports = new TaskRepository();
