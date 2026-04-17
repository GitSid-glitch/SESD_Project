const fs = require("fs");
const http = require("http");
const path = require("path");
const config = require("./config");
const router = require("./router");
const HttpError = require("./core/http-error");
const dataStore = require("./repositories/data-store");
const authService = require("./services/auth-service");
const { json, noContent, parseBody, parseQuery } = require("./utils/http");

dataStore.initialize();
authService.ensureDefaultRoles();

const publicDir = path.join(__dirname, "..", "..", "public");

function serveStaticFile(req, res) {
  const targetPath = req.url === "/" ? path.join(publicDir, "index.html") : path.join(publicDir, req.url);
  const safePath = path.normalize(targetPath);

  if (!safePath.startsWith(publicDir) || !fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
    return false;
  }

  const extensions = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json"
  };

  res.writeHead(200, { "Content-Type": extensions[path.extname(safePath)] || "text/plain" });
  res.end(fs.readFileSync(safePath));
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url.startsWith("/api")) {
      if (serveStaticFile(req, res)) {
        return;
      }
      throw new HttpError(404, "Page not found");
    }

    req.query = parseQuery(req.url);
    req.body = ["POST", "PUT", "PATCH"].includes(req.method) ? await parseBody(req) : {};
    const result = await router.handle(req);

    if (req.method === "DELETE") {
      noContent(res);
      return;
    }

    const statusCode = req.method === "POST" ? 201 : 200;
    json(res, statusCode, { success: true, data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    json(res, statusCode, {
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

server.listen(config.port, config.host, () => {
  console.log(`Smart Project Management System running on http://${config.host}:${config.port}`);
});
