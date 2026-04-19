const crypto = require("crypto");

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  const [salt, existingHash] = storedValue.split(":");
  const computedHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(existingHash, "hex"), Buffer.from(computedHash, "hex"));
}

module.exports = {
  hashPassword,
  verifyPassword
};
