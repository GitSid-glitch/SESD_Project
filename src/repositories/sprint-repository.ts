const BaseRepository = require("./base-repository");
const Sprint = require("../models/sprint");

class SprintRepository extends BaseRepository {
  constructor() {
    super("sprints", Sprint);
  }

  findByProjectId(projectId) {
    return this.findAll().filter((sprint) => Number(sprint.projectId) === Number(projectId));
  }
}

module.exports = new SprintRepository();
