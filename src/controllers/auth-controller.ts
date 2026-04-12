const authService = require("../services/auth-service");

class AuthController {
  register(req) {
    return authService.register(req.body);
  }

  login(req) {
    return authService.login(req.body);
  }
}

module.exports = new AuthController();
