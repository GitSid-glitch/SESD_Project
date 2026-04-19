type UserRole = "ADMIN" | "MANAGER" | "MEMBER";
type FormValues = Record<string, string>;
type ApiOptions = {
  method?: string;
  body?: unknown;
};

let toastTimeoutId: number | undefined;

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element as T;
}

function asElement(target: EventTarget | null): Element | null {
  return target instanceof Element ? target : null;
}

function asForm(target: EventTarget | null): HTMLFormElement {
  if (!(target instanceof HTMLFormElement)) {
    throw new Error("Expected form target");
  }
  return target;
}

function toFormValues(form: HTMLFormElement): FormValues {
  return Object.fromEntries(Array.from(new FormData(form).entries()).map(([key, value]) => [key, String(value)]));
}

const state = {
  token: localStorage.getItem("spms_token") || null,
  currentUser: JSON.parse(localStorage.getItem("spms_user") || "null"),
  dashboard: null,
  users: [],
  projects: [],
  tasks: [],
  sprintsByProject: {},
  activePanel: "overview",
  taskFilter: localStorage.getItem("spms_task_filter") || "all"
};

const elements = {
  landingView: getRequiredElement<HTMLElement>("landing-view"),
  workspaceView: getRequiredElement<HTMLElement>("workspace-view"),
  toast: getRequiredElement<HTMLElement>("toast"),
  panelNav: getRequiredElement<HTMLElement>("panel-nav"),
  workspaceUserName: getRequiredElement<HTMLElement>("workspace-user-name"),
  workspaceRoleChip: getRequiredElement<HTMLElement>("workspace-role-chip"),
  roleBriefHeading: getRequiredElement<HTMLElement>("role-brief-heading"),
  roleBriefCopy: getRequiredElement<HTMLElement>("role-brief-copy"),
  overviewProjects: getRequiredElement<HTMLElement>("overview-projects"),
  roleFocusList: getRequiredElement<HTMLElement>("role-focus-list"),
  overviewNotifications: getRequiredElement<HTMLElement>("overview-notifications"),
  projectHealthList: getRequiredElement<HTMLElement>("project-health-list"),
  insightsList: getRequiredElement<HTMLElement>("insights-list"),
  notificationsList: getRequiredElement<HTMLElement>("notifications-list"),
  activityList: getRequiredElement<HTMLElement>("activity-list"),
  projectManagementList: getRequiredElement<HTMLElement>("project-management-list"),
  sprintManagementList: getRequiredElement<HTMLElement>("sprint-management-list"),
  tasksBoard: getRequiredElement<HTMLElement>("tasks-board"),
  taskFilters: getRequiredElement<HTMLElement>("task-filters"),
  teamContent: getRequiredElement<HTMLElement>("team-content"),
  teamPanelTitle: getRequiredElement<HTMLElement>("team-panel-title"),
  teamPanelCopy: getRequiredElement<HTMLElement>("team-panel-copy"),
  workPanelTitle: getRequiredElement<HTMLElement>("work-panel-title"),
  workPanelCopy: getRequiredElement<HTMLElement>("work-panel-copy"),
  profileForm: getRequiredElement<HTMLFormElement>("profile-form"),
  projectForm: getRequiredElement<HTMLFormElement>("project-form"),
  sprintForm: getRequiredElement<HTMLFormElement>("sprint-form"),
  taskForm: getRequiredElement<HTMLFormElement>("task-form"),
  memberForm: getRequiredElement<HTMLFormElement>("member-form"),
  sprintProjectSelect: getRequiredElement<HTMLSelectElement>("sprint-project-select"),
  taskProjectSelect: getRequiredElement<HTMLSelectElement>("task-project-select"),
  taskSprintSelect: getRequiredElement<HTMLSelectElement>("task-sprint-select"),
  taskAssigneeSelect: getRequiredElement<HTMLSelectElement>("task-assignee-select"),
  memberProjectSelect: getRequiredElement<HTMLSelectElement>("member-project-select"),
  memberUserSelect: getRequiredElement<HTMLSelectElement>("member-user-select"),
  profileName: getRequiredElement<HTMLInputElement>("profile-name"),
  profileEmail: getRequiredElement<HTMLInputElement>("profile-email")
};

const roleConfig = {
  ADMIN: {
    panels: ["overview", "team", "work", "inbox"],
    labels: {
      overview: "Overview",
      team: "People",
      work: "Execution",
      inbox: "Inbox"
    },
    briefHeading: "Control the workspace",
    briefCopy: "Admins oversee users, permissions, and cross-project visibility.",
    workTitle: "Cross-team task visibility",
    workCopy: "Monitor tasks across the workspace, adjust ownership, and respond inside task threads.",
    teamTitle: "User administration",
    teamCopy: "Assign roles and review how people are participating across projects.",
    focus: [
      "Review users and promote the right people into manager or admin roles.",
      "Monitor project health and activity across the full workspace.",
      "Step into execution when ownership or access needs to change."
    ]
  },
  MANAGER: {
    panels: ["overview", "planning", "work", "team", "inbox"],
    labels: {
      overview: "Overview",
      planning: "Planning",
      work: "Execution",
      team: "Team",
      inbox: "Inbox"
    },
    briefHeading: "Drive delivery forward",
    briefCopy: "Managers create the plan, assign work, and keep the team moving sprint by sprint.",
    workTitle: "Delivery board",
    workCopy: "Track every task across your projects, reassign work, and keep conversations attached to the task.",
    teamTitle: "Project rosters",
    teamCopy: "See who belongs to each project and how workload is distributed.",
    focus: [
      "Create projects and sprints that reflect the delivery plan.",
      "Add the right teammates to each project before assigning work.",
      "Own task creation, assignment, and follow-through through comments and status changes."
    ]
  },
  MEMBER: {
    panels: ["overview", "work", "team", "inbox"],
    labels: {
      overview: "Overview",
      work: "My Work",
      team: "Collaborators",
      inbox: "Inbox"
    },
    briefHeading: "Stay focused on execution",
    briefCopy: "Members work from a personal board, update progress, and communicate through task comments.",
    workTitle: "Your task board",
    workCopy: "Update the tasks assigned to you, share blockers, and add context directly where the work lives.",
    teamTitle: "People you work with",
    teamCopy: "See collaborators on shared projects and know who is involved in the same delivery stream.",
    focus: [
      "Concentrate on assigned tasks instead of planning controls.",
      "Move work through status transitions to reflect real progress.",
      "Use task comments to ask questions, add updates, and surface blockers."
    ]
  }
};

initializeAuthTabs();
bindStaticEvents();
loadWorkspace().catch(() => logout(false));

function initializeAuthTabs() {
  document.querySelectorAll<HTMLElement>(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll("#login-form, #register-form").forEach((form) => form.classList.add("hidden"));
      button.classList.add("active");
      getRequiredElement<HTMLElement>(button.dataset.target || "").classList.remove("hidden");
    });
  });
}

function bindStaticEvents() {
  getRequiredElement<HTMLButtonElement>("jump-to-auth").addEventListener("click", () => {
    getRequiredElement<HTMLElement>("auth-anchor").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  getRequiredElement<HTMLButtonElement>("hero-login-button").addEventListener("click", () => {
    getRequiredElement<HTMLElement>("auth-anchor").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  getRequiredElement<HTMLFormElement>("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = toFormValues(asForm(event.target));
    await authenticate("/api/auth/login", formData);
  });

  getRequiredElement<HTMLFormElement>("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = toFormValues(asForm(event.target));
    await authenticate("/api/auth/register", formData);
  });

  getRequiredElement<HTMLButtonElement>("refresh-dashboard").addEventListener("click", () => loadWorkspace());
  getRequiredElement<HTMLButtonElement>("logout-button").addEventListener("click", () => logout(true));

  elements.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = toFormValues(asForm(event.target));
    const updatedUser = await api("/api/users/me", { method: "PUT", body });
    state.currentUser = updatedUser;
    localStorage.setItem("spms_user", JSON.stringify(updatedUser));
    showToast("Profile updated");
    await loadWorkspace();
  });

  elements.projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = asForm(event.target);
    const body = toFormValues(form);
    await api("/api/projects", { method: "POST", body });
    form.reset();
    showToast("Project created");
    await loadWorkspace();
  });

  elements.sprintForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = asForm(event.target);
    const body = toFormValues(form);
    await api("/api/sprints", { method: "POST", body });
    form.reset();
    showToast("Sprint created");
    await loadWorkspace();
  });

  elements.taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = asForm(event.target);
    const body = toFormValues(form);
    ["sprintId", "assignedTo", "dueDate"].forEach((field) => {
      if (!body[field]) {
        delete body[field];
      }
    });
    await api("/api/tasks", { method: "POST", body });
    form.reset();
    syncPlanningSelects();
    showToast("Task created");
    await loadWorkspace();
  });

  elements.memberForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = asForm(event.target);
    const body = toFormValues(form);
    await api(`/api/projects/${body.projectId}/members`, { method: "POST", body: { userId: body.userId } });
    form.reset();
    syncPlanningSelects();
    showToast("Member added to project");
    await loadWorkspace();
  });

  elements.panelNav.addEventListener("click", (event) => {
    const button = asElement(event.target)?.closest<HTMLElement>(".nav-button");
    if (!button) {
      return;
    }
    state.activePanel = button.dataset.panel;
    renderWorkspace();
  });

  elements.taskFilters.addEventListener("click", (event) => {
    const button = asElement(event.target)?.closest<HTMLElement>(".filter-chip");
    if (!button) {
      return;
    }
    state.taskFilter = button.dataset.filter;
    localStorage.setItem("spms_task_filter", state.taskFilter);
    renderWorkPanel();
  });

  elements.workspaceView.addEventListener("change", async (event) => {
    const target = asElement(event.target);
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.id === "task-project-select" && target instanceof HTMLSelectElement) {
      syncTaskProjectContext(target.value);
      return;
    }

    if (target.id === "member-project-select" && target instanceof HTMLSelectElement) {
      syncMemberProjectContext(target.value);
      return;
    }

    if (target.classList.contains("task-status-select") && target instanceof HTMLSelectElement) {
      await handleTaskStatusChange(target);
      return;
    }

    if (target.classList.contains("task-assignee-select") && target instanceof HTMLSelectElement) {
      await handleTaskAssigneeChange(target);
      return;
    }

    if (target.classList.contains("role-select") && target instanceof HTMLSelectElement) {
      await handleRoleChange(target);
      return;
    }

    if (target.classList.contains("project-status-select") && target instanceof HTMLSelectElement) {
      await handleProjectStatusChange(target);
      return;
    }

    if (target.classList.contains("sprint-status-select") && target instanceof HTMLSelectElement) {
      await handleSprintStatusChange(target);
    }
  });

  elements.workspaceView.addEventListener("click", async (event) => {
    const eventElement = asElement(event.target);
    const archiveButton = eventElement?.closest<HTMLElement>("[data-action='archive-project']");
    if (archiveButton) {
      await handleProjectArchive(archiveButton.dataset.projectId);
      return;
    }

    const deleteTaskButton = eventElement?.closest<HTMLElement>("[data-action='delete-task']");
    if (deleteTaskButton) {
      await handleTaskDelete(deleteTaskButton.dataset.taskId);
      return;
    }

    const deactivateUserButton = eventElement?.closest<HTMLElement>("[data-action='deactivate-user']");
    if (deactivateUserButton) {
      await handleUserDeactivate(deactivateUserButton.dataset.userId);
    }
  });

  elements.workspaceView.addEventListener("submit", async (event) => {
    const eventElement = asElement(event.target);
    const commentForm = eventElement?.closest<HTMLFormElement>(".task-comment-form");
    if (!commentForm) {
      return;
    }

    event.preventDefault();
    const taskId = commentForm.dataset.taskId;
    const content = new FormData(commentForm).get("content");
    const commentText = typeof content === "string" ? content.trim() : "";
    if (!commentText) {
      showToast("Comment cannot be empty", true);
      return;
    }

    await api(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      body: { content: commentText }
    });

    showToast("Comment added");
    await loadWorkspace();
  });
}

async function authenticate(url, payload) {
  const response = await api(url, { method: "POST", body: payload }, false);
  state.token = response.token;
  state.currentUser = response.user;
  state.taskFilter = response.user.role === "MEMBER" ? "mine" : "all";
  localStorage.setItem("spms_token", state.token);
  localStorage.setItem("spms_user", JSON.stringify(state.currentUser));
  localStorage.setItem("spms_task_filter", state.taskFilter);
  showToast("Welcome back");
  await loadWorkspace();
}

async function api(url: string, options: ApiOptions = {}, authRequired = true) {
  const request: RequestInit = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (authRequired && state.token) {
    (request.headers as Record<string, string>).Authorization = `Bearer ${state.token}`;
  }

  if (options.body) {
    request.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, request);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    showToast(data.error || "Something went wrong", true);
    throw new Error(data.error || "Request failed");
  }

  return data.data;
}

async function loadWorkspace() {
  if (!state.token) {
    toggleViews(false);
    return;
  }

  const [dashboard, users, projects, taskResult] = await Promise.all([
    api("/api/dashboard/summary"),
    api("/api/users"),
    api("/api/projects"),
    api("/api/tasks?limit=100")
  ]);

  const sprintEntries = await Promise.all(
    projects.map(async (project) => {
      const sprints = await api(`/api/projects/${project.id}/sprints`);
      return [project.id, sprints];
    })
  );

  state.dashboard = dashboard;
  state.users = users;
  state.projects = projects;
  state.tasks = taskResult.items;
  state.sprintsByProject = Object.fromEntries(sprintEntries);
  state.currentUser = {
    ...(state.currentUser || {}),
    ...dashboard.user
  };

  const panels = allowedPanels();
  if (!panels.includes(state.activePanel)) {
    state.activePanel = panels[0];
  }
  if (state.currentUser.role === "MEMBER" && !state.taskFilter) {
    state.taskFilter = "mine";
  }

  toggleViews(true);
  renderWorkspace();
}

function toggleViews(isAuthenticated) {
  elements.landingView.classList.toggle("hidden", isAuthenticated);
  elements.workspaceView.classList.toggle("hidden", !isAuthenticated);
}

function renderWorkspace() {
  const config = roleConfig[state.currentUser.role];

  elements.workspaceUserName.textContent = `${state.currentUser.name}`;
  elements.workspaceRoleChip.textContent = state.currentUser.role;
  elements.roleBriefHeading.textContent = config.briefHeading;
  elements.roleBriefCopy.textContent = config.briefCopy;
  elements.workPanelTitle.textContent = config.workTitle;
  elements.workPanelCopy.textContent = config.workCopy;
  elements.teamPanelTitle.textContent = config.teamTitle;
  elements.teamPanelCopy.textContent = config.teamCopy;

  renderPanelNav();
  renderOverview();
  renderPlanningPanel();
  renderWorkPanel();
  renderTeamPanel();
  renderInboxPanel();
  updatePanelVisibility();
}

function renderPanelNav() {
  const config = roleConfig[state.currentUser.role];
  elements.panelNav.innerHTML = allowedPanels()
    .map((panel) => {
      const isActive = panel === state.activePanel;
      return `<button type="button" class="nav-button ${isActive ? "active" : ""}" data-panel="${panel}">${config.labels[panel]}</button>`;
    })
    .join("");
}

function updatePanelVisibility() {
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `${state.activePanel}-panel`);
  });
}

function renderOverview() {
  const metrics = state.dashboard.metrics;
  getRequiredElement<HTMLElement>("metric-projects").textContent = String(metrics.totalProjects);
  getRequiredElement<HTMLElement>("metric-tasks").textContent = String(metrics.totalTasks);
  getRequiredElement<HTMLElement>("metric-assigned").textContent = String(metrics.assignedTasks);
  getRequiredElement<HTMLElement>("metric-completed").textContent = String(metrics.completedTasks);

  elements.profileName.value = state.currentUser.name || "";
  elements.profileEmail.value = state.currentUser.email || "";

  elements.overviewProjects.innerHTML = state.projects.length
    ? state.projects.slice(0, 6).map(renderOverviewProjectCard).join("")
    : emptyState("No projects are available for this role yet.");

  elements.roleFocusList.innerHTML = roleConfig[state.currentUser.role].focus
    .map((item) => `<article class="list-card"><p>${escapeHtml(item)}</p></article>`)
    .join("");

  elements.overviewNotifications.innerHTML = state.dashboard.notifications.length
    ? state.dashboard.notifications.slice(0, 4).map(renderNotificationCard).join("")
    : emptyState("No new notifications right now.");

  elements.projectHealthList.innerHTML = state.dashboard.projectHealth.length
    ? state.dashboard.projectHealth.map(renderProjectHealthCard).join("")
    : emptyState("Project health insights will appear once projects exist.");

  elements.insightsList.innerHTML = renderInsightCards();
}

function renderPlanningPanel() {
  const canPlan = ["ADMIN", "MANAGER"].includes(state.currentUser.role);
  getRequiredElement<HTMLElement>("planning-panel").classList.toggle("hidden", !canPlan || state.activePanel !== "planning");
  if (!canPlan) {
    return;
  }

  populateProjectOptions(elements.sprintProjectSelect, "Select project");
  populateProjectOptions(elements.taskProjectSelect, "Select project");
  populateProjectOptions(elements.memberProjectSelect, "Select project");
  syncPlanningSelects();
  elements.projectManagementList.innerHTML = state.projects.length
    ? state.projects.map(renderProjectManagementCard).join("")
    : emptyState("Create a project to unlock planning controls.");
  elements.sprintManagementList.innerHTML = renderSprintManagementCards();
}

function renderWorkPanel() {
  const filters = getTaskFilters();
  elements.taskFilters.innerHTML = filters
    .map(
      (filter) => `
        <button type="button" class="filter-chip ${state.taskFilter === filter.value ? "active" : ""}" data-filter="${filter.value}">
          ${escapeHtml(filter.label)}
        </button>
      `
    )
    .join("");

  const filteredTasks = getFilteredTasks();
  const grouped = {
    TODO: [],
    IN_PROGRESS: [],
    BLOCKED: [],
    DONE: []
  };

  filteredTasks.forEach((task) => {
    grouped[task.status] = grouped[task.status] || [];
    grouped[task.status].push(task);
  });

  elements.tasksBoard.innerHTML = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]
    .map((status) => renderTaskColumn(status, grouped[status] || []))
    .join("");
}

function renderTeamPanel() {
  if (state.currentUser.role === "ADMIN") {
    elements.teamContent.innerHTML = renderAdminTeamCards();
    return;
  }

  if (state.currentUser.role === "MANAGER") {
    elements.teamContent.innerHTML = renderManagerTeamCards();
    return;
  }

  elements.teamContent.innerHTML = renderMemberCollaborators();
}

function renderInboxPanel() {
  elements.notificationsList.innerHTML = state.dashboard.notifications.length
    ? state.dashboard.notifications.map(renderNotificationCard).join("")
    : emptyState("No notifications yet.");

  elements.activityList.innerHTML = state.dashboard.activities.length
    ? state.dashboard.activities.map(renderActivityCard).join("")
    : emptyState("No activity to show.");
}

function renderOverviewProjectCard(project) {
  const memberNames = project.members.map((member) => member.name).join(", ");
  return `
    <article class="list-card">
      <h4>${escapeHtml(project.title)}</h4>
      <p>${escapeHtml(project.description)}</p>
      <div class="chip-row">
        <span class="chip">${escapeHtml(project.status)}</span>
        <span class="chip">${project.taskCount} tasks</span>
        <span class="chip">${project.sprintCount} sprints</span>
      </div>
      <p class="project-meta">Members: ${escapeHtml(memberNames || "No members yet")}</p>
    </article>
  `;
}

function renderTaskColumn(status, tasks) {
  return `
    <section class="kanban-column">
      <h4>${escapeHtml(formatStatus(status))} <span class="chip">${tasks.length}</span></h4>
      <div class="task-stack">
        ${tasks.length ? tasks.map(renderTaskCard).join("") : emptyState("No tasks here.")}
      </div>
    </section>
  `;
}

function renderTaskCard(task) {
  const project = getProject(task.projectId);
  const canManage = ["ADMIN", "MANAGER"].includes(state.currentUser.role) || task.createdBy === state.currentUser.id;
  const canUpdateStatus = canManage || task.assignedTo === state.currentUser.id;
  const projectMembers = project ? project.members : [];

  return `
    <article class="task-card">
      <h4>${escapeHtml(task.title)}</h4>
      <div class="task-meta">
        <span>${escapeHtml(task.description)}</span>
        <span>Project: ${escapeHtml(project ? project.title : "Unknown project")}</span>
        <span>Assignee: ${escapeHtml(task.assignedUser ? task.assignedUser.name : "Unassigned")}</span>
        <span>Due: ${escapeHtml(task.dueDate || "No due date")}</span>
      </div>
      <div class="chip-row">
        <span class="chip">${escapeHtml(formatStatus(task.status))}</span>
        <span class="chip">${escapeHtml(task.priority)}</span>
        ${task.isOverdue ? '<span class="chip danger">Overdue</span>' : ""}
      </div>
      <div class="task-controls">
        <label class="inline-control">
          Status
          <select class="task-status-select" data-task-id="${task.id}" ${canUpdateStatus ? "" : "disabled"}>
            ${renderStatusOptions(task.status)}
          </select>
        </label>
        <label class="inline-control">
          Assignee
          <select class="task-assignee-select" data-task-id="${task.id}" ${canManage ? "" : "disabled"}>
            <option value="">Unassigned</option>
            ${projectMembers
              .map(
                (member) => `
                  <option value="${member.id}" ${Number(task.assignedTo) === Number(member.id) ? "selected" : ""}>
                    ${escapeHtml(member.name)} (${escapeHtml(member.role || "Member")})
                  </option>
                `
              )
              .join("")}
          </select>
        </label>
      </div>
      ${
        canManage
          ? `<div class="action-row"><button type="button" class="small-button ghost-button" data-action="delete-task" data-task-id="${task.id}">Delete Task</button></div>`
          : ""
      }
      <div class="comment-thread">
        <div class="comment-list">
          ${(task.comments || []).length
            ? task.comments
                .map(
                  (comment) => `
                    <article class="comment-item">
                      <span class="comment-meta">${escapeHtml(comment.author ? comment.author.name : "Unknown")} · ${escapeHtml(formatDate(comment.createdAt))}</span>
                      <p>${escapeHtml(comment.content)}</p>
                    </article>
                  `
                )
                .join("")
            : `<div class="empty-state">No comments yet.</div>`}
        </div>
        <form class="inline-comment-form task-comment-form" data-task-id="${task.id}">
          <input type="text" name="content" placeholder="Add an update or ask a question" />
          <button type="submit">Comment</button>
        </form>
      </div>
    </article>
  `;
}

function renderNotificationCard(notification) {
  return `
    <article class="list-card">
      <h4>${escapeHtml(notification.type)}</h4>
      <p>${escapeHtml(notification.message)}</p>
      <span class="activity-meta">${escapeHtml(formatDate(notification.createdAt))}</span>
    </article>
  `;
}

function renderActivityCard(activity) {
  const actorName = activity.actor ? activity.actor.name : "System";
  return `
    <article class="list-card">
      <h4>${escapeHtml(activity.action)}</h4>
      <p class="activity-meta">${escapeHtml(actorName)} · ${escapeHtml(formatDate(activity.timestamp))}</p>
    </article>
  `;
}

function renderAdminTeamCards() {
  const cards = state.users.map((user) => {
    const projectCount = state.projects.filter((project) => project.members.some((member) => member.id === user.id)).length;
    const assignedCount = state.tasks.filter((task) => Number(task.assignedTo) === Number(user.id)).length;
    return `
      <article class="user-card">
        <div class="user-row">
          <div>
            <h4>${escapeHtml(user.name)}</h4>
            <p class="project-meta">${escapeHtml(user.email)}</p>
          </div>
          <span class="chip">${escapeHtml(user.role)}</span>
        </div>
        <div class="chip-row">
          <span class="chip">${projectCount} projects</span>
          <span class="chip">${assignedCount} assigned tasks</span>
        </div>
        <label class="inline-control">
          Change role
          <select class="role-select" data-user-id="${user.id}" ${user.id === state.currentUser.id ? "disabled" : ""}>
            ${["ADMIN", "MANAGER", "MEMBER"]
              .map((role) => `<option value="${role}" ${user.role === role ? "selected" : ""}>${role}</option>`)
              .join("")}
          </select>
        </label>
        ${
          user.id !== state.currentUser.id
            ? `<div class="action-row"><button type="button" class="small-button ghost-button" data-action="deactivate-user" data-user-id="${user.id}">Deactivate User</button></div>`
            : ""
        }
      </article>
    `;
  });

  return cards.length ? cards.join("") : emptyState("No users found.");
}

function renderManagerTeamCards() {
  const workloadByUser = new Map();
  state.tasks.forEach((task) => {
    const key = task.assignedTo || "unassigned";
    workloadByUser.set(key, (workloadByUser.get(key) || 0) + 1);
  });

  const cards = state.projects.map((project) => {
    const members = project.members
      .map(
        (member) => `
          <span class="chip">${escapeHtml(member.name)} · ${escapeHtml(member.role || "Member")} · ${workloadByUser.get(member.id) || 0} tasks</span>
        `
      )
      .join("");

    return `
      <article class="project-roster">
        <div class="project-roster-header">
          <div>
            <h4>${escapeHtml(project.title)}</h4>
            <p class="project-meta">${escapeHtml(project.description)}</p>
          </div>
          <span class="chip">${project.members.length} members</span>
        </div>
        <div class="chip-row">${members || '<span class="chip">No members yet</span>'}</div>
      </article>
    `;
  });

  return cards.length ? cards.join("") : emptyState("Create a project to start building team rosters.");
}

function renderMemberCollaborators() {
  const collaboratorMap = new Map();

  state.projects.forEach((project) => {
    if (!project.members.some((member) => member.id === state.currentUser.id)) {
      return;
    }

    project.members
      .filter((member) => member.id !== state.currentUser.id)
      .forEach((member) => {
        const existing = collaboratorMap.get(member.id) || { ...member, sharedProjects: [] };
        existing.sharedProjects.push(project.title);
        collaboratorMap.set(member.id, existing);
      });
  });

  const cards = Array.from(collaboratorMap.values()).map(
    (member) => `
      <article class="user-card">
        <div class="user-row">
          <div>
            <h4>${escapeHtml(member.name)}</h4>
            <p class="project-meta">${escapeHtml(member.email)}</p>
          </div>
          <span class="chip">${escapeHtml(member.role || "Member")}</span>
        </div>
        <p class="project-meta">Shared projects: ${escapeHtml(member.sharedProjects.join(", "))}</p>
      </article>
    `
  );

  return cards.length ? cards.join("") : emptyState("You will see collaborators here once you join projects.");
}

function renderProjectHealthCard(project) {
  return `
    <article class="list-card">
      <h4>${escapeHtml(project.title)}</h4>
      <p class="project-meta">${project.completedTaskCount}/${project.taskCount} tasks completed · ${project.activeSprintCount} active sprints</p>
      <div class="progress-bar"><span style="width:${project.progressPercentage}%"></span></div>
      <p class="project-meta">${project.progressPercentage}% complete</p>
    </article>
  `;
}

function renderInsightCards() {
  const statusBreakdown = state.dashboard.statusBreakdown || {};
  const workload = state.dashboard.teamWorkload || {};
  const topWorkload = (Object.entries(workload) as Array<[string, number]>)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, count]) => `<span class="chip">${escapeHtml(name)} · ${count} tasks</span>`)
    .join("");

  return `
    <article class="list-card">
      <h4>Status Breakdown</h4>
      <div class="chip-row">
        <span class="chip">Todo · ${statusBreakdown.TODO || 0}</span>
        <span class="chip">In Progress · ${statusBreakdown.IN_PROGRESS || 0}</span>
        <span class="chip">Blocked · ${statusBreakdown.BLOCKED || 0}</span>
        <span class="chip">Done · ${statusBreakdown.DONE || 0}</span>
      </div>
      <p class="project-meta">Overdue tasks: ${state.dashboard.metrics.overdueTasks || 0} · Blocked tasks: ${state.dashboard.metrics.blockedTasks || 0}</p>
    </article>
    <article class="list-card">
      <h4>Workload Snapshot</h4>
      <div class="chip-row">${topWorkload || '<span class="chip">No workload data yet</span>'}</div>
    </article>
  `;
}

function renderProjectManagementCard(project) {
  return `
    <article class="list-card">
      <h4>${escapeHtml(project.title)}</h4>
      <p class="project-meta">${escapeHtml(project.description)}</p>
      <div class="chip-row">
        <span class="chip">${project.progressPercentage}% complete</span>
        <span class="chip">${project.activeSprintCount} active sprints</span>
      </div>
      <label class="inline-control">
        Status
        <select class="project-status-select" data-project-id="${project.id}">
          ${["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]
            .map((status) => `<option value="${status}" ${project.status === status ? "selected" : ""}>${status.replaceAll("_", " ")}</option>`)
            .join("")}
        </select>
      </label>
      <div class="action-row">
        <button type="button" class="small-button ghost-button" data-action="archive-project" data-project-id="${project.id}">Archive</button>
      </div>
    </article>
  `;
}

function renderSprintManagementCards() {
  const cards = state.projects.flatMap((project) =>
    (state.sprintsByProject[project.id] || []).map(
      (sprint) => `
        <article class="list-card">
          <h4>${escapeHtml(sprint.name)}</h4>
          <p class="project-meta">${escapeHtml(project.title)} · ${escapeHtml(sprint.startDate)} to ${escapeHtml(sprint.endDate)}</p>
          <label class="inline-control">
            Sprint Status
            <select class="sprint-status-select" data-sprint-id="${sprint.id}">
              ${["PLANNED", "ACTIVE", "COMPLETED"]
                .map((status) => `<option value="${status}" ${sprint.status === status ? "selected" : ""}>${status}</option>`)
                .join("")}
            </select>
          </label>
        </article>
      `
    )
  );

  return cards.length ? cards.join("") : emptyState("No sprints yet. Create one to manage delivery cadence.");
}

function populateProjectOptions(select, placeholder) {
  select.innerHTML = [`<option value="">${escapeHtml(placeholder)}</option>`]
    .concat(state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.title)}</option>`))
    .join("");
}

function syncPlanningSelects() {
  const taskProjectId = elements.taskProjectSelect.value || state.projects[0]?.id || "";
  const memberProjectId = elements.memberProjectSelect.value || state.projects[0]?.id || "";
  const sprintProjectId = elements.sprintProjectSelect.value || state.projects[0]?.id || "";

  if (taskProjectId) {
    elements.taskProjectSelect.value = String(taskProjectId);
  }
  if (memberProjectId) {
    elements.memberProjectSelect.value = String(memberProjectId);
  }
  if (sprintProjectId) {
    elements.sprintProjectSelect.value = String(sprintProjectId);
  }

  syncTaskProjectContext(taskProjectId);
  syncMemberProjectContext(memberProjectId);
}

function syncTaskProjectContext(projectId) {
  const project = getProject(projectId);
  const sprints = state.sprintsByProject[projectId] || [];

  elements.taskSprintSelect.innerHTML = [`<option value="">Backlog / No Sprint</option>`]
    .concat(sprints.map((sprint) => `<option value="${sprint.id}">${escapeHtml(sprint.name)}</option>`))
    .join("");

  elements.taskAssigneeSelect.innerHTML = [`<option value="">Unassigned</option>`]
    .concat(
      (project?.members || []).map(
        (member) => `<option value="${member.id}">${escapeHtml(member.name)} (${escapeHtml(member.role || "Member")})</option>`
      )
    )
    .join("");
}

function syncMemberProjectContext(projectId) {
  const project = getProject(projectId);
  const existingMembers = new Set((project?.members || []).map((member) => Number(member.id)));

  const eligibleUsers = state.users.filter((user) => !existingMembers.has(Number(user.id)));
  elements.memberUserSelect.innerHTML = eligibleUsers.length
    ? eligibleUsers
        .map((user) => `<option value="${user.id}">${escapeHtml(user.name)} (${escapeHtml(user.role)})</option>`)
        .join("")
    : `<option value="">No eligible users</option>`;
}

async function handleTaskStatusChange(select: HTMLSelectElement) {
  await api(`/api/tasks/${select.dataset.taskId}`, {
    method: "PUT",
    body: { status: select.value }
  });
  showToast("Task status updated");
  await loadWorkspace();
}

async function handleTaskAssigneeChange(select: HTMLSelectElement) {
  const value = select.value || null;
  await api(`/api/tasks/${select.dataset.taskId}`, {
    method: "PUT",
    body: { assignedTo: value }
  });
  showToast(value ? "Task reassigned" : "Task unassigned");
  await loadWorkspace();
}

async function handleRoleChange(select: HTMLSelectElement) {
  await api(`/api/users/${select.dataset.userId}/role`, {
    method: "PATCH",
    body: { roleName: select.value }
  });
  showToast("User role updated");
  await loadWorkspace();
}

async function handleProjectStatusChange(select: HTMLSelectElement) {
  await api(`/api/projects/${select.dataset.projectId}`, {
    method: "PUT",
    body: { status: select.value }
  });
  showToast("Project status updated");
  await loadWorkspace();
}

async function handleSprintStatusChange(select: HTMLSelectElement) {
  await api(`/api/sprints/${select.dataset.sprintId}/status`, {
    method: "PATCH",
    body: { status: select.value }
  });
  showToast("Sprint status updated");
  await loadWorkspace();
}

async function handleProjectArchive(projectId) {
  await api(`/api/projects/${projectId}/archive`, {
    method: "PATCH",
    body: {}
  });
  showToast("Project archived");
  await loadWorkspace();
}

async function handleTaskDelete(taskId) {
  await api(`/api/tasks/${taskId}`, { method: "DELETE" });
  showToast("Task deleted");
  await loadWorkspace();
}

async function handleUserDeactivate(userId) {
  await api(`/api/users/${userId}`, { method: "DELETE" });
  showToast("User deactivated");
  await loadWorkspace();
}

function getTaskFilters() {
  const filters = [
    { label: state.currentUser.role === "MEMBER" ? "Assigned to Me" : "All Tasks", value: state.currentUser.role === "MEMBER" ? "mine" : "all" },
    { label: "Todo", value: "todo" },
    { label: "In Progress", value: "in_progress" },
    { label: "Blocked", value: "blocked" },
    { label: "Done", value: "done" }
  ];

  if (state.currentUser.role !== "MEMBER") {
    filters.splice(1, 0, { label: "Assigned", value: "assigned" });
  }

  if (!filters.some((filter) => filter.value === state.taskFilter)) {
    state.taskFilter = filters[0].value;
  }

  return filters;
}

function getFilteredTasks() {
  const taskFilterMap = {
    all: () => true,
    mine: (task) => Number(task.assignedTo) === Number(state.currentUser.id),
    assigned: (task) => Boolean(task.assignedTo),
    todo: (task) => task.status === "TODO",
    in_progress: (task) => task.status === "IN_PROGRESS",
    blocked: (task) => task.status === "BLOCKED",
    done: (task) => task.status === "DONE"
  };

  const predicate = taskFilterMap[state.taskFilter] || taskFilterMap.all;
  return state.tasks.filter(predicate);
}

function renderStatusOptions(currentStatus) {
  return ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]
    .map((status) => `<option value="${status}" ${currentStatus === status ? "selected" : ""}>${escapeHtml(formatStatus(status))}</option>`)
    .join("");
}

function allowedPanels() {
  return roleConfig[state.currentUser.role]?.panels || ["overview"];
}

function getProject(projectId) {
  return state.projects.find((project) => Number(project.id) === Number(projectId)) || null;
}

function formatStatus(status) {
  return status.replaceAll("_", " ");
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.background = isError ? "var(--danger)" : "var(--success)";
  elements.toast.classList.remove("hidden");
  window.clearTimeout(toastTimeoutId);
  toastTimeoutId = window.setTimeout(() => elements.toast.classList.add("hidden"), 2600);
}

function logout(showMessage = true) {
  state.token = null;
  state.currentUser = null;
  state.dashboard = null;
  state.users = [];
  state.projects = [];
  state.tasks = [];
  localStorage.removeItem("spms_token");
  localStorage.removeItem("spms_user");
  toggleViews(false);
  if (showMessage) {
    showToast("Logged out");
  }
}
