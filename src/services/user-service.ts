const BaseService = require("../core/base-service");
const roleRepository = require("../repositories/role-repository");
const userRepository = require("../repositories/user-repository");
const activityLogService = require("./activity-log-service");
const notificationService = require("./notification-service");
const userValidator = require("./validators/user-validator");

class UserService extends BaseService {
  async listUsers() {
    const users = await userRepository.findAll();
    return Promise.all(users.filter((user) => !user.isDeleted).map((user) => this.enrichUser(user)));
  }

  async getUserById(id) {
    const user = await this.ensureActiveUser(id);
    return this.enrichUser(user);
  }

  async updateProfile(id, payload, actor) {
    const existing = await this.ensureActiveUser(id);

    this.ensureAuthorized(actor.id === existing.id || ["ADMIN"].includes(actor.role), "You are not allowed to update this user");
    userValidator.validateProfileUpdate(payload);

    this.ensure(
      !payload.email ||
        !(await userRepository.findAll()).some((user) => user.email.toLowerCase() === payload.email.toLowerCase() && Number(user.id) !== Number(id)),
      409,
      "Email is already in use by another user"
    );

    const updatedUser = await userRepository.update(id, (user) => {
      user.updateProfile(payload.name || user.name, payload.email || user.email);
      return user;
    });

    await activityLogService.logAction(`Updated profile for ${updatedUser.email}`, actor.id);
    return this.enrichUser(updatedUser);
  }

  async assignRole(id, roleName, actor) {
    this.ensureAuthorized(actor.role === "ADMIN", "Only admin can assign roles");

    const role = await roleRepository.findByName(roleName);
    const user = await userRepository.findById(id);
    this.ensure(role && user, 404, "User or role not found");

    const updatedUser = await userRepository.update(id, (entry) => {
      entry.roleId = role.id;
      entry.updatedAt = new Date().toISOString();
      return entry;
    });

    await activityLogService.logAction(`Assigned role ${roleName} to ${updatedUser.email}`, actor.id);
    await notificationService.sendNotification("IN_APP", `Your role was updated to ${roleName}`, updatedUser.id);
    return this.enrichUser(updatedUser);
  }

  async softDelete(id, actor) {
    this.ensureAuthorized(actor.role === "ADMIN", "Only admin can delete users");

    const user = this.ensureFound(await userRepository.findById(id), "User not found");

    this.ensure(Number(actor.id) !== Number(id), 400, "Admin cannot deactivate their own account");

    const role = await roleRepository.findById(user.roleId);
    if (role?.name === "ADMIN") {
      const entries = await userRepository.findAll();
      const enriched = await Promise.all(
        entries.filter((entry) => !entry.isDeleted).map(async (entry) => ({
          entry,
          role: await roleRepository.findById(entry.roleId)
        }))
      );
      const activeAdminCount = enriched.filter(({ role }) => role?.name === "ADMIN").length;

      this.ensure(activeAdminCount > 1, 400, "At least one active admin must remain in the system");
    }

    const deleted = await userRepository.update(id, (entry) => {
      entry.isDeleted = true;
      entry.updatedAt = new Date().toISOString();
      return entry;
    });
    await activityLogService.logAction(`Soft deleted user ${deleted.email}`, actor.id);
    return this.enrichUser(deleted);
  }

  async enrichUser(user) {
    const role = await roleRepository.findById(user.roleId);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: role ? role.name : "UNKNOWN",
      isDeleted: user.isDeleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async ensureActiveUser(id) {
    const user = await userRepository.findById(id);
    this.ensure(user && !user.isDeleted, 404, "User not found");
    return user;
  }
}

module.exports = new UserService();
