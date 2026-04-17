const HttpError = require("../core/http-error");
const roleRepository = require("../repositories/role-repository");
const userRepository = require("../repositories/user-repository");
const { hashPassword, verifyPassword } = require("../utils/password");
const { generateToken } = require("../utils/token");
const activityLogService = require("./activity-log-service");

class AuthService {
  ensureDefaultRoles() {
    ["ADMIN", "MANAGER", "MEMBER"].forEach((name) => {
      if (!roleRepository.findByName(name)) {
        roleRepository.create({ name });
      }
    });
  }

  register({ name, email, password, roleName = "MEMBER" }) {
    this.ensureDefaultRoles();
    if (userRepository.findByEmail(email)) {
      throw new HttpError(409, "Email is already registered");
    }

    const role = roleRepository.findByName(roleName);
    if (!role) {
      throw new HttpError(400, "Invalid role selected");
    }

    const user = userRepository.create({
      name,
      email,
      password: hashPassword(password),
      roleId: role.id
    });

    activityLogService.logAction(`Registered user ${user.email}`, user.id);
    return this.buildAuthResponse(user);
  }

  login({ email, password }) {
    const user = userRepository.findByEmail(email);
    if (!user || user.isDeleted || !verifyPassword(password, user.password)) {
      throw new HttpError(401, "Invalid email or password");
    }

    activityLogService.logAction(`Logged in user ${user.email}`, user.id);
    return this.buildAuthResponse(user);
  }

  buildAuthResponse(user) {
    const role = roleRepository.findById(user.roleId);
    const token = generateToken({
      sub: user.id,
      role: role.name,
      email: user.email
    });

    return {
      token,
      user: this.toSafeUser(user, role)
    };
  }

  toSafeUser(user, role) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: role.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

module.exports = new AuthService();
