const path = require("path");

const ROOT_DIR = __dirname;

module.exports = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "127.0.0.1",
  dataFile: process.env.DATA_FILE || path.join(ROOT_DIR, "..", "..", "data", "database.json"),
  tokenSecret: process.env.TOKEN_SECRET || "sesd-smart-project-secret",
  tokenExpiryHours: 12
};
