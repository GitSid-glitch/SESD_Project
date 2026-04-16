const BaseRepository = require("./base-repository");
const ProjectMember = require("../models/project-member");

class ProjectMemberRepository extends BaseRepository {
  constructor() {
    super("projectMembers", ProjectMember);
  }

  findByProjectId(projectId) {
    return this.findAll().filter((member) => Number(member.projectId) === Number(projectId));
  }

  findByUserId(userId) {
    return this.findAll().filter((member) => Number(member.userId) === Number(userId));
  }

  findByProjectAndUser(projectId, userId) {
    return (
      this.findAll().find(
        (member) => Number(member.projectId) === Number(projectId) && Number(member.userId) === Number(userId)
      ) || null
    );
  }
}

module.exports = new ProjectMemberRepository();
