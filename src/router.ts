const HttpError = require("./core/http-error");
const { authenticate } = require("./middleware/auth-middleware");
const authController = require("./controllers/auth-controller");
const userController = require("./controllers/user-controller");
const projectController = require("./controllers/project-controller");
const taskController = require("./controllers/task-controller");
const sprintController = require("./controllers/sprint-controller");
const dashboardController = require("./controllers/dashboard-controller");

class Router {
  routes;

  constructor() {
    this.routes = [];
  }

  register(method, pattern, handler, options = {}) {
    const tokens = pattern.split("/").filter(Boolean);
    this.routes.push({ method, pattern, tokens, handler, options });
  }

  async handle(req) {
    const [pathName] = req.url.split("?");
    const requestTokens = pathName.split("/").filter(Boolean);

    for (const route of this.routes) {
      if (route.method !== req.method) {
        continue;
      }

      if (route.tokens.length !== requestTokens.length) {
        continue;
      }

      const params = {};
      let isMatch = true;

      route.tokens.forEach((token, index) => {
        const requestToken = requestTokens[index];
        if (token.startsWith(":")) {
          params[token.slice(1)] = requestToken;
          return;
        }
        if (token !== requestToken) {
          isMatch = false;
        }
      });

      if (!isMatch) {
        continue;
      }

      req.params = params;
      if (route.options.authenticated) {
        await authenticate(req);
      }

      return route.handler(req);
    }

    throw new HttpError(404, "Route not found");
  }
}

const router = new Router();

router.register("POST", "/api/auth/register", (req) => authController.register(req));
router.register("POST", "/api/auth/login", (req) => authController.login(req));
router.register("GET", "/api/users", (req) => userController.list(req), { authenticated: true });
router.register("GET", "/api/users/me", (req) => userController.getMe(req), { authenticated: true });
router.register("PUT", "/api/users/me", (req) => userController.updateMe(req), { authenticated: true });
router.register("PATCH", "/api/users/:id/role", (req) => userController.assignRole(req), { authenticated: true });
router.register("DELETE", "/api/users/:id", (req) => userController.deactivate(req), { authenticated: true });
router.register("GET", "/api/projects", (req) => projectController.list(req), { authenticated: true });
router.register("GET", "/api/projects/:id", (req) => projectController.get(req), { authenticated: true });
router.register("POST", "/api/projects", (req) => projectController.create(req), { authenticated: true });
router.register("PUT", "/api/projects/:id", (req) => projectController.update(req), { authenticated: true });
router.register("PATCH", "/api/projects/:id/archive", (req) => projectController.archive(req), { authenticated: true });
router.register("POST", "/api/projects/:id/members", (req) => projectController.addMember(req), { authenticated: true });
router.register("DELETE", "/api/projects/:id/members/:userId", (req) => projectController.removeMember(req), { authenticated: true });
router.register("GET", "/api/tasks", (req) => taskController.list(req), { authenticated: true });
router.register("GET", "/api/tasks/:id", (req) => taskController.get(req), { authenticated: true });
router.register("POST", "/api/tasks", (req) => taskController.create(req), { authenticated: true });
router.register("PUT", "/api/tasks/:id", (req) => taskController.update(req), { authenticated: true });
router.register("DELETE", "/api/tasks/:id", (req) => taskController.delete(req), { authenticated: true });
router.register("POST", "/api/tasks/:id/comments", (req) => taskController.addComment(req), { authenticated: true });
router.register("GET", "/api/projects/:projectId/sprints", (req) => sprintController.listByProject(req), { authenticated: true });
router.register("POST", "/api/sprints", (req) => sprintController.create(req), { authenticated: true });
router.register("PATCH", "/api/sprints/:id/status", (req) => sprintController.updateStatus(req), { authenticated: true });
router.register("GET", "/api/dashboard/summary", (req) => dashboardController.summary(req), { authenticated: true });

module.exports = router;
