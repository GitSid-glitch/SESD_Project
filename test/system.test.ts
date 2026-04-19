const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

function fresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

async function bootSystem(testName) {
  const dataFile = path.join(process.cwd(), "tmp", `${testName.replace(/\s+/g, "-").toLowerCase()}.sqlite`);
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  if (fs.existsSync(dataFile)) {
    fs.unlinkSync(dataFile);
  }

  process.env.DATA_FILE = dataFile;
  delete process.env.DATABASE_URL;

  Object.keys(require.cache)
    .filter((cacheKey) => cacheKey.includes(`${path.sep}src${path.sep}`))
    .forEach((cacheKey) => {
      delete require.cache[cacheKey];
    });

  const dataStore = fresh("../src/repositories/data-store");
  await dataStore.initialize();

  const authService = fresh("../src/services/auth-service");
  const projectService = fresh("../src/services/project-service");
  const sprintService = fresh("../src/services/sprint-service");
  const taskService = fresh("../src/services/task-service");
  const notificationService = fresh("../src/services/notification-service");
  const userService = fresh("../src/services/user-service");
  const activityLogService = fresh("../src/services/activity-log-service");

  await authService.ensureDefaultRoles();

  return {
    authService,
    projectService,
    sprintService,
    taskService,
    notificationService,
    userService,
    activityLogService
  };
}

test("manager can create project, sprint, task, and member receives notification", async () => {
  const system = await bootSystem("manager flow");

  const manager = (await system.authService.register({
    name: "Manager",
    email: "manager@test.local",
    password: "Manager@123",
    roleName: "MANAGER"
  })).user;

  const member = (await system.authService.register({
    name: "Member",
    email: "member@test.local",
    password: "Member@123",
    roleName: "MEMBER"
  })).user;

  const project = await system.projectService.createProject(
    { title: "SESD Platform", description: "Backend-first implementation" },
    manager
  );

  await system.projectService.addMember(project.id, member.id, manager);

  const sprint = await system.sprintService.createSprint(
    {
      projectId: project.id,
      name: "Sprint A",
      startDate: "2026-04-20",
      endDate: "2026-04-27"
    },
    manager
  );

  const task = await system.taskService.createTask(
    {
      projectId: project.id,
      sprintId: sprint.id,
      title: "Build task service",
      description: "Implement validation and transitions",
      assignedTo: member.id,
      priority: "HIGH"
    },
    manager
  );

  assert.equal(project.title, "SESD Platform");
  assert.equal(sprint.projectId, project.id);
  assert.equal(task.assignedUser.email, "member@test.local");

  const notifications = await system.notificationService.listForUser(member.id);
  assert.ok(notifications.length >= 1);
  assert.ok(notifications.some((notification) => /assigned task/i.test(notification.message)));
});

test("task status strategy blocks invalid transitions", async () => {
  const system = await bootSystem("task transitions");

  const manager = (await system.authService.register({
    name: "Manager",
    email: "manager2@test.local",
    password: "Manager@123",
    roleName: "MANAGER"
  })).user;

  const member = (await system.authService.register({
    name: "Member",
    email: "member2@test.local",
    password: "Member@123",
    roleName: "MEMBER"
  })).user;

  const project = await system.projectService.createProject(
    { title: "Flow", description: "Transition validation" },
    manager
  );
  await system.projectService.addMember(project.id, member.id, manager);

  const task = await system.taskService.createTask(
    {
      projectId: project.id,
      title: "Model task states",
      description: "Ensure strategy pattern is applied",
      assignedTo: member.id
    },
    manager
  );

  await assert.rejects(
    system.taskService.updateTask(task.id, { status: "DONE" }, member),
    /Invalid task status transition/
  );

  const updated = await system.taskService.updateTask(task.id, { status: "IN_PROGRESS" }, member);
  assert.equal(updated.status, "IN_PROGRESS");
});

test("members can update assigned task status but cannot edit task definition", async () => {
  const system = await bootSystem("member restrictions");

  const manager = (await system.authService.register({
    name: "Manager",
    email: "manager3@test.local",
    password: "Manager@123",
    roleName: "MANAGER"
  })).user;

  const member = (await system.authService.register({
    name: "Member",
    email: "member4@test.local",
    password: "Member@123",
    roleName: "MEMBER"
  })).user;

  const project = await system.projectService.createProject(
    { title: "Restrictions", description: "Member execution rules" },
    manager
  );
  await system.projectService.addMember(project.id, member.id, manager);

  const task = await system.taskService.createTask(
    {
      projectId: project.id,
      title: "Implement UI polish",
      description: "Improve the workspace",
      assignedTo: member.id
    },
    manager
  );

  const progressed = await system.taskService.updateTask(task.id, { status: "IN_PROGRESS" }, member);
  assert.equal(progressed.status, "IN_PROGRESS");

  await assert.rejects(
    system.taskService.updateTask(task.id, { title: "Completely different title" }, member),
    /Members can only update the status/
  );

  const comment = await system.taskService.addComment(task.id, "This is blocked on final copy review.", member);
  assert.equal(comment.content, "This is blocked on final copy review.");

  const reloaded = await system.taskService.getTaskById(task.id, manager);
  assert.equal(reloaded.comments[0].author.name, "Member");
});

test("admin can assign roles and user listing returns enriched role names", async () => {
  const system = await bootSystem("admin role assignment");

  const admin = (await system.authService.register({
    name: "Admin",
    email: "admin@test.local",
    password: "Admin@123",
    roleName: "ADMIN"
  })).user;

  const member = (await system.authService.register({
    name: "Member",
    email: "member3@test.local",
    password: "Member@123",
    roleName: "MEMBER"
  })).user;

  const updated = await system.userService.assignRole(member.id, "MANAGER", admin);
  assert.equal(updated.role, "MANAGER");

  const users = await system.userService.listUsers();
  assert.equal(users.length, 2);
  assert.equal(users.find((user) => user.email === "member3@test.local").role, "MANAGER");
});

test("backend validations reject invalid sprint dates and cross-project sprint assignment", async () => {
  const system = await bootSystem("backend validations");

  const manager = (await system.authService.register({
    name: "Manager",
    email: "manager4@test.local",
    password: "Manager@123",
    roleName: "MANAGER"
  })).user;

  const member = (await system.authService.register({
    name: "Member",
    email: "member5@test.local",
    password: "Member@123",
    roleName: "MEMBER"
  })).user;

  const projectA = await system.projectService.createProject(
    { title: "Project Alpha", description: "First valid project description" },
    manager
  );
  const projectB = await system.projectService.createProject(
    { title: "Project Beta", description: "Second valid project description" },
    manager
  );

  await system.projectService.addMember(projectA.id, member.id, manager);

  await assert.rejects(
    system.sprintService.createSprint(
      {
        projectId: projectA.id,
        name: "Broken Sprint",
        startDate: "2026-05-10",
        endDate: "2026-05-01"
      },
      manager
    ),
    /end date cannot be before/i
  );

  const sprintB = await system.sprintService.createSprint(
    {
      projectId: projectB.id,
      name: "Project B Sprint",
      startDate: "2026-05-01",
      endDate: "2026-05-10"
    },
    manager
  );

  await assert.rejects(
    system.taskService.createTask(
      {
        projectId: projectA.id,
        sprintId: sprintB.id,
        title: "Bad mapping",
        description: "This task tries to use a sprint from another project",
        assignedTo: member.id
      },
      manager
    ),
    /must belong to the selected project/i
  );
});

test("project member removal enforces task reassignment first", async () => {
  const system = await bootSystem("member removal rules");

  const manager = (await system.authService.register({
    name: "Manager",
    email: "manager5@test.local",
    password: "Manager@123",
    roleName: "MANAGER"
  })).user;

  const member = (await system.authService.register({
    name: "Member",
    email: "member6@test.local",
    password: "Member@123",
    roleName: "MEMBER"
  })).user;

  const project = await system.projectService.createProject(
    { title: "Removal Test", description: "Ensure members cannot be removed unsafely" },
    manager
  );
  await system.projectService.addMember(project.id, member.id, manager);

  const task = await system.taskService.createTask(
    {
      projectId: project.id,
      title: "Assigned Task",
      description: "This task is still assigned to the member",
      assignedTo: member.id
    },
    manager
  );

  await assert.rejects(
    system.projectService.removeMember(project.id, member.id, manager),
    /Reassign them before removal/i
  );

  await system.taskService.updateTask(task.id, { assignedTo: null }, manager);
  const result = await system.projectService.removeMember(project.id, member.id, manager);
  assert.equal(result.removed, true);
});

test("admin deactivation rules protect self-deactivation and last active admin", async () => {
  const system = await bootSystem("admin deactivation rules");

  const adminA = (await system.authService.register({
    name: "Admin A",
    email: "admin-a@test.local",
    password: "Admin@123",
    roleName: "ADMIN"
  })).user;

  await assert.rejects(
    system.userService.softDelete(adminA.id, adminA),
    /cannot deactivate their own account/i
  );

  const adminB = (await system.authService.register({
    name: "Admin B",
    email: "admin-b@test.local",
    password: "Admin@123",
    roleName: "ADMIN"
  })).user;

  const deleted = await system.userService.softDelete(adminB.id, adminA);
  assert.equal(deleted.isDeleted, true);

  await assert.rejects(
    system.userService.softDelete(adminA.id, adminB),
    /cannot deactivate their own account|At least one active admin/i
  );
});
