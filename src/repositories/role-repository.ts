const BaseRepository = require("./base-repository");
const Role = require("../models/role");

class RoleRepository extends BaseRepository {
  constructor() {
    super("roles", Role);
  }

  async findByName(name) {
    const item = (await this.all()).find((role) => role.name === name);
    return item ? new Role(item) : null;
  }
}

module.exports = new RoleRepository();
