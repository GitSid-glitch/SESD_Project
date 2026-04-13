const HttpError = require("../core/http-error");
const roleRepository = require("../repositories/role-repository");
const userRepository = require("../repositories/user-repository");
const { verifyToken } = require("../utils/token");

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length);
}

function authenticate(req) {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload) {
    throw new HttpError(401, "Authentication required");
  }

  const user = userRepository.findById(payload.sub);
  if (!user || user.isDeleted) {
    throw new HttpError(401, "Authenticated user no longer exists");
  }

  const role = roleRepository.findById(user.roleId);
  req.user = {
    id: user.id,
    email: user.email,
    role: role.name
  };
}

module.exports = {
  authenticate
};
