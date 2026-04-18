const HttpError = require("../../core/http-error");

class UserValidator {
  validateProfileUpdate(payload) {
    if (payload.name && String(payload.name).trim().length < 2) {
      throw new HttpError(400, "Name must be at least 2 characters long");
    }

    if (payload.email && !String(payload.email).includes("@")) {
      throw new HttpError(400, "Email must be valid");
    }
  }
}

module.exports = new UserValidator();
