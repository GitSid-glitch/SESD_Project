const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { Pool } = require("pg");
const config = require("../config");

class DataStore {
  filePath;
  sqliteDb;
  pgPool;
  provider;

  constructor() {
    this.filePath = config.dataFile;
    this.sqliteDb = null;
    this.pgPool = null;
    this.provider = config.databaseUrl ? "postgres" : "sqlite";
  }

  async initialize() {
    if (this.provider === "postgres") {
      await this.initializePostgres();
      return;
    }

    this.initializeSqlite();
  }

  async initializePostgres() {
    if (this.pgPool) {
      return;
    }

    this.pgPool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : false
    });

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

    for (const tableName of collections) {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          id SERIAL PRIMARY KEY,
          data JSONB NOT NULL
        )
      `);
    }
  }

  initializeSqlite() {
    if (this.sqliteDb) {
      return;
    }

    const dirPath = path.dirname(this.filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    this.sqliteDb = new DatabaseSync(this.filePath);
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
      this.sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data TEXT NOT NULL
        )
      `);
    });
  }

  async findAll(tableName) {
    await this.initialize();
    if (this.provider === "postgres") {
      const result = await this.pgPool.query(`SELECT id, data FROM "${tableName}" ORDER BY id ASC`);
      return result.rows.map((row) => ({ id: row.id, ...row.data }));
    }

    const statement = this.sqliteDb.prepare(`SELECT id, data FROM ${tableName} ORDER BY id ASC`);
    return statement.all().map((row) => ({ id: row.id, ...JSON.parse(row.data) }));
  }

  async findById(tableName, id) {
    await this.initialize();
    if (this.provider === "postgres") {
      const result = await this.pgPool.query(`SELECT id, data FROM "${tableName}" WHERE id = $1`, [Number(id)]);
      const row = result.rows[0];
      return row ? { id: row.id, ...row.data } : null;
    }

    const statement = this.sqliteDb.prepare(`SELECT id, data FROM ${tableName} WHERE id = ?`);
    const row = statement.get(Number(id));
    return row ? { id: row.id, ...JSON.parse(row.data) } : null;
  }

  async insert(tableName, data) {
    await this.initialize();
    const payload = { ...data };
    delete payload.id;

    if (this.provider === "postgres") {
      const result = await this.pgPool.query(`INSERT INTO "${tableName}" (data) VALUES ($1) RETURNING id, data`, [payload]);
      const row = result.rows[0];
      return { id: row.id, ...row.data };
    }

    const statement = this.sqliteDb.prepare(`INSERT INTO ${tableName} (data) VALUES (?)`);
    const result = statement.run(JSON.stringify(payload));
    return this.findById(tableName, result.lastInsertRowid);
  }

  async update(tableName, id, data) {
    await this.initialize();
    const payload = { ...data };
    delete payload.id;

    if (this.provider === "postgres") {
      const result = await this.pgPool.query(`UPDATE "${tableName}" SET data = $1 WHERE id = $2 RETURNING id, data`, [
        payload,
        Number(id)
      ]);
      const row = result.rows[0];
      return row ? { id: row.id, ...row.data } : null;
    }

    const statement = this.sqliteDb.prepare(`UPDATE ${tableName} SET data = ? WHERE id = ?`);
    statement.run(JSON.stringify(payload), Number(id));
    return this.findById(tableName, id);
  }

  async delete(tableName, id) {
    await this.initialize();
    if (this.provider === "postgres") {
      await this.pgPool.query(`DELETE FROM "${tableName}" WHERE id = $1`, [Number(id)]);
      return;
    }

    const statement = this.sqliteDb.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
    statement.run(Number(id));
  }
}

module.exports = new DataStore();
