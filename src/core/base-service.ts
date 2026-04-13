const HttpError = require("./http-error");

class BaseService {
  ensure(condition, statusCode, message) {
    if (!condition) {
      throw new HttpError(statusCode, message);
    }
  }

  ensureFound(entity, message) {
    this.ensure(Boolean(entity), 404, message);
    return entity;
  }

  ensureAuthorized(condition, message = "You are not authorized to perform this action") {
    this.ensure(condition, 403, message);
  }
}

module.exports = BaseService;
