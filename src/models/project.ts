class Project {
  id;
  title;
  description;
  status;
  createdBy;
  archived;
  createdAt;
  updatedAt;

  constructor({
    id,
    title,
    description,
    status = "ACTIVE",
    createdBy,
    archived = false,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.createdBy = createdBy;
    this.archived = archived;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  updateProject({ title, description, status }) {
    this.title = title ?? this.title;
    this.description = description ?? this.description;
    this.status = status ?? this.status;
    this.updatedAt = new Date().toISOString();
  }

  archiveProject() {
    this.archived = true;
    this.status = "ARCHIVED";
    this.updatedAt = new Date().toISOString();
  }

  isOwnedBy(userId) {
    return Number(this.createdBy) === Number(userId);
  }
}

module.exports = Project;
