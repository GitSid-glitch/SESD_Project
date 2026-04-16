const BaseRepository = require("./base-repository");
const Project = require("../models/project");

class ProjectRepository extends BaseRepository {
  constructor() {
    super("projects", Project);
  }
}

module.exports = new ProjectRepository();
