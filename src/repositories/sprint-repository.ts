const BaseRepository = require("./base-repository");
const Sprint = require("../models/sprint");

class SprintRepository extends BaseRepository {
  constructor() {
    super("sprints", Sprint);
  }

  async findByProjectId(projectId) {
    return (await this.findAll()).filter((sprint) => Number(sprint.projectId) === Number(projectId));
  }
}

module.exports = new SprintRepository();
