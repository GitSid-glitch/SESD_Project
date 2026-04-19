const BaseRepository = require("./base-repository");
const ProjectMember = require("../models/project-member");

class ProjectMemberRepository extends BaseRepository {
  constructor() {
    super("projectMembers", ProjectMember);
  }

  async findByProjectId(projectId) {
    return (await this.findAll()).filter((member) => Number(member.projectId) === Number(projectId));
  }

  async findByUserId(userId) {
    return (await this.findAll()).filter((member) => Number(member.userId) === Number(userId));
  }

  async findByProjectAndUser(projectId, userId) {
    return (
      (await this.findAll()).find(
        (member) => Number(member.projectId) === Number(projectId) && Number(member.userId) === Number(userId)
      ) || null
    );
  }
}

module.exports = new ProjectMemberRepository();
