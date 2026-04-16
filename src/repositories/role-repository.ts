const BaseRepository = require("./base-repository");
const Role = require("../models/role");

class RoleRepository extends BaseRepository {
  constructor() {
    super("roles", Role);
  }

  findByName(name) {
    const item = this.all().find((role) => role.name === name);
    return item ? new Role(item) : null;
  }
}

module.exports = new RoleRepository();
