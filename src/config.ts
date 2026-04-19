const path = require("path");

const ROOT_DIR = __dirname;

module.exports = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "127.0.0.1",
  databaseUrl: process.env.DATABASE_URL || "",
  dataFile: process.env.DATA_FILE || path.join(ROOT_DIR, "..", "..", "data", "database.sqlite"),
  tokenSecret: process.env.TOKEN_SECRET || "sesd-smart-project-secret",
  tokenExpiryHours: 12
};
