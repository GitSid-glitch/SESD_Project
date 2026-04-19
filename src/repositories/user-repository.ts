const BaseRepository = require("./base-repository");
const User = require("../models/user");

class UserRepository extends BaseRepository {
  constructor() {
    super("users", User);
  }

  async findByEmail(email) {
    const item = (await this.all()).find((user) => user.email.toLowerCase() === email.toLowerCase());
    return item ? new User(item) : null;
  }
}

module.exports = new UserRepository();
