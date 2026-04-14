class Sprint {
  id;
  name;
  startDate;
  endDate;
  projectId;
  status;

  constructor({
    id,
    name,
    startDate,
    endDate,
    projectId,
    status = "PLANNED"
  }) {
    this.id = id;
    this.name = name;
    this.startDate = startDate;
    this.endDate = endDate;
    this.projectId = projectId;
    this.status = status;
  }

  startSprint() {
    this.status = "ACTIVE";
  }

  completeSprint() {
    this.status = "COMPLETED";
  }

  planSprint() {
    this.status = "PLANNED";
  }
}

module.exports = Sprint;
