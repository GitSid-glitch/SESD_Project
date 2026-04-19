const HttpError = require("../core/http-error");
const roleRepository = require("../repositories/role-repository");
const userRepository = require("../repositories/user-repository");
const { hashPassword, verifyPassword } = require("../utils/password");
const { generateToken } = require("../utils/token");
const activityLogService = require("./activity-log-service");

class AuthService {
  ensureDefaultRoles() {
    return Promise.all(["ADMIN", "MANAGER", "MEMBER"].map(async (name) => {
      if (!(await roleRepository.findByName(name))) {
        await roleRepository.create({ name });
      }
    }));
  }

  async register({ name, email, password, roleName = "MEMBER" }) {
    await this.ensureDefaultRoles();
    if (await userRepository.findByEmail(email)) {
      throw new HttpError(409, "Email is already registered");
    }

    const role = await roleRepository.findByName(roleName);
    if (!role) {
      throw new HttpError(400, "Invalid role selected");
    }

    const user = await userRepository.create({
      name,
      email,
      password: hashPassword(password),
      roleId: role.id
    });

    await activityLogService.logAction(`Registered user ${user.email}`, user.id);
    return this.buildAuthResponse(user);
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.isDeleted || !verifyPassword(password, user.password)) {
      throw new HttpError(401, "Invalid email or password");
    }

    await activityLogService.logAction(`Logged in user ${user.email}`, user.id);
    return this.buildAuthResponse(user);
  }

  async buildAuthResponse(user) {
    const role = await roleRepository.findById(user.roleId);
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
