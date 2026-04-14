class ProjectMember {
  id;
  projectId;
  userId;

  constructor({ id, projectId, userId }) {
    this.id = id;
    this.projectId = projectId;
    this.userId = userId;
  }
}

module.exports = ProjectMember;
