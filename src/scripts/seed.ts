const dataStore = require("../repositories/data-store");
const authService = require("../services/auth-service");
const projectService = require("../services/project-service");
const sprintService = require("../services/sprint-service");
const taskService = require("../services/task-service");
const projectRepository = require("../repositories/project-repository");
const userRepository = require("../repositories/user-repository");
const roleRepository = require("../repositories/role-repository");

function ensureUser(details) {
  const existing = userRepository.findByEmail(details.email);
  if (existing) {
    const role = roleRepository.findById(existing.roleId);
    return {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: role ? role.name : "MEMBER"
    };
  }

  return authService.register(details).user;
}

function runSeed() {
  dataStore.initialize();
  authService.ensureDefaultRoles();

  const admin = ensureUser({
    name: "Admin User",
    email: "admin@sesd.local",
    password: "Admin@123",
    roleName: "ADMIN"
  });

  const manager = ensureUser({
    name: "Project Manager",
    email: "manager@sesd.local",
    password: "Manager@123",
    roleName: "MANAGER"
  });

  const member = ensureUser({
    name: "Team Member",
    email: "member@sesd.local",
    password: "Member@123",
    roleName: "MEMBER"
  });

  if (projectRepository.findAll().length === 0) {
    const createdProject = projectService.createProject(
      {
        title: "Smart PM Core Platform",
        description: "Backend-focused project planning and task orchestration platform."
      },
      manager
    );

    projectService.addMember(createdProject.id, member.id, manager);

    const sprint = sprintService.createSprint(
      {
        name: "Sprint 1",
        startDate: "2026-04-20",
        endDate: "2026-04-30",
        projectId: createdProject.id
      },
      manager
    );

    sprintService.updateStatus(sprint.id, "ACTIVE", manager);

    const task = taskService.createTask(
      {
        title: "Implement authentication module",
        description: "Build signed-token auth, secure password hashing, and login flows.",
        priority: "HIGH",
        dueDate: "2026-04-24",
        projectId: createdProject.id,
        sprintId: sprint.id,
        assignedTo: member.id
      },
      manager
    );

    taskService.addComment(task.id, "Initial auth module drafted and ready for review.", member);
  }
}

runSeed();
console.log("Seed completed. Demo credentials created.");
