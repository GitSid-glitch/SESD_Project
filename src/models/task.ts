class Task {
  id;
  title;
  description;
  status;
  priority;
  dueDate;
  projectId;
  sprintId;
  assignedTo;
  createdBy;
  createdAt;
  updatedAt;
  deleted;

  constructor({
    id,
    title,
    description,
    status = "TODO",
    priority = "MEDIUM",
    dueDate = null,
    projectId,
    sprintId = null,
    assignedTo = null,
    createdBy,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    deleted = false
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.dueDate = dueDate;
    this.projectId = projectId;
    this.sprintId = sprintId;
    this.assignedTo = assignedTo;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deleted = deleted;
  }

  updateStatus(status) {
    this.status = status;
    this.updatedAt = new Date().toISOString();
  }

  updateDetails({ title, description, priority, dueDate, sprintId }) {
    this.title = title ?? this.title;
    this.description = description ?? this.description;
    this.priority = priority ?? this.priority;
    this.dueDate = dueDate ?? this.dueDate;
    this.sprintId = sprintId ?? this.sprintId;
    this.updatedAt = new Date().toISOString();
  }

  assignUser(userId) {
    this.assignedTo = userId ?? null;
    this.updatedAt = new Date().toISOString();
  }

  softDelete() {
    this.deleted = true;
    this.updatedAt = new Date().toISOString();
  }

  isAssignedTo(userId) {
    return Number(this.assignedTo) === Number(userId);
  }

  isOwnedBy(userId) {
    return Number(this.createdBy) === Number(userId);
  }
}

module.exports = Task;
