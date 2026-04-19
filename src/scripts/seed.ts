const dataStore = require("../repositories/data-store");
const authService = require("../services/auth-service");
const projectService = require("../services/project-service");
const sprintService = require("../services/sprint-service");
const taskService = require("../services/task-service");
const projectRepository = require("../repositories/project-repository");
const userRepository = require("../repositories/user-repository");
const roleRepository = require("../repositories/role-repository");

async function ensureUser(details) {
  const existing = await userRepository.findByEmail(details.email);
  if (existing) {
    const role = await roleRepository.findById(existing.roleId);
    return {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: role ? role.name : "MEMBER"
    };
  }

  return (await authService.register(details)).user;
}

async function runSeed() {
  await dataStore.initialize();
  await authService.ensureDefaultRoles();

  const admin = await ensureUser({
    name: "Admin User",
    email: "admin@sesd.local",
    password: "Admin@123",
    roleName: "ADMIN"
  });

  const manager = await ensureUser({
    name: "Project Manager",
    email: "manager@sesd.local",
    password: "Manager@123",
    roleName: "MANAGER"
  });

  const member = await ensureUser({
    name: "Team Member",
    email: "member@sesd.local",
    password: "Member@123",
    roleName: "MEMBER"
  });

  if ((await projectRepository.findAll()).length === 0) {
    const createdProject = await projectService.createProject(
      {
        title: "Smart PM Core Platform",
        description: "Backend-focused project planning and task orchestration platform."
      },
      manager
    );

    await projectService.addMember(createdProject.id, member.id, manager);

    const sprint = await sprintService.createSprint(
      {
        name: "Sprint 1",
        startDate: "2026-04-20",
        endDate: "2026-04-30",
        projectId: createdProject.id
      },
      manager
    );

    await sprintService.updateStatus(sprint.id, "ACTIVE", manager);

    const task = await taskService.createTask(
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

    await taskService.addComment(task.id, "Initial auth module drafted and ready for review.", member);
  }
}

runSeed()
  .then(() => {
    console.log("Seed completed. Demo credentials created.");
  })
  .catch((error) => {
    console.error("Seed failed.", error);
    process.exit(1);
  });
