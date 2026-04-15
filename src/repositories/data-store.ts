const fs = require("fs");
const path = require("path");
const config = require("../config");

class DataStore {
  filePath;
  state;

  constructor() {
    this.filePath = config.dataFile;
    this.state = null;
  }

  initialize() {
    const dirPath = path.dirname(this.filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      const initialState = {
        roles: [],
        users: [],
        projects: [],
        projectMembers: [],
        sprints: [],
        tasks: [],
        comments: [],
        activityLogs: [],
        notifications: []
      };
      fs.writeFileSync(this.filePath, JSON.stringify(initialState, null, 2));
    }

    this.state = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
  }

  getState() {
    if (!this.state) {
      this.initialize();
    }
    return this.state;
  }

  saveState(state) {
    this.state = state;
    fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2));
  }
}

module.exports = new DataStore();
