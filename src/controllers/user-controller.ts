const userService = require("../services/user-service");

class UserController {
  list(req) {
    return userService.listUsers(req.user);
  }

  getMe(req) {
    return userService.getUserById(req.user.id);
  }

  updateMe(req) {
    return userService.updateProfile(req.user.id, req.body, req.user);
  }

  assignRole(req) {
    return userService.assignRole(req.params.id, req.body.roleName, req.user);
  }

  deactivate(req) {
    return userService.softDelete(req.params.id, req.user);
  }
}

module.exports = new UserController();
