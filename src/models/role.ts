class Role {
  id;
  name;

  constructor({ id, name }) {
    this.id = id;
    this.name = name;
  }

  getRoleName() {
    return this.name;
  }
}

module.exports = Role;
