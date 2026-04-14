class User {
  id;
  name;
  email;
  password;
  roleId;
  isDeleted;
  createdAt;
  updatedAt;

  constructor({
    id,
    name,
    email,
    password,
    roleId,
    isDeleted = false,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.roleId = roleId;
    this.isDeleted = isDeleted;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  updateProfile(name, email) {
    this.name = name;
    this.email = email;
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = User;
