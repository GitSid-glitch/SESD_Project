const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const config = require("../config");

class DataStore {
  filePath;
  db;

  constructor() {
    this.filePath = config.dataFile;
    this.db = null;
  }

  initialize() {
    const dirPath = path.dirname(this.filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    this.db = new DatabaseSync(this.filePath);
    this.createSchema();
  }

  getDb() {
    if (!this.db) {
      this.initialize();
    }
    return this.db;
  }

  createSchema() {
    const db = this.getDb();
    const collections = [
      "roles",
      "users",
      "projects",
      "projectMembers",
      "sprints",
      "tasks",
      "comments",
      "activityLogs",
      "notifications"
    ];

    collections.forEach((tableName) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data TEXT NOT NULL
        )
      `);
    });
  }

  findAll(tableName) {
    const statement = this.getDb().prepare(`SELECT id, data FROM ${tableName} ORDER BY id ASC`);
    return statement.all().map((row) => ({ id: row.id, ...JSON.parse(row.data) }));
  }

  findById(tableName, id) {
    const statement = this.getDb().prepare(`SELECT id, data FROM ${tableName} WHERE id = ?`);
    const row = statement.get(Number(id));
    return row ? { id: row.id, ...JSON.parse(row.data) } : null;
  }

  insert(tableName, data) {
    const payload = { ...data };
    delete payload.id;
    const statement = this.getDb().prepare(`INSERT INTO ${tableName} (data) VALUES (?)`);
    const result = statement.run(JSON.stringify(payload));
    return this.findById(tableName, result.lastInsertRowid);
  }

  update(tableName, id, data) {
    const payload = { ...data };
    delete payload.id;
    const statement = this.getDb().prepare(`UPDATE ${tableName} SET data = ? WHERE id = ?`);
    statement.run(JSON.stringify(payload), Number(id));
    return this.findById(tableName, id);
  }

  delete(tableName, id) {
    const statement = this.getDb().prepare(`DELETE FROM ${tableName} WHERE id = ?`);
    statement.run(Number(id));
  }
}

module.exports = new DataStore();
