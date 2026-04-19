const crypto = require("crypto");
const config = require("../config");

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload) {
  return crypto.createHmac("sha256", config.tokenSecret).update(payload).digest("base64url");
}

function generateToken(data) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      ...data,
      exp: Date.now() + config.tokenExpiryHours * 60 * 60 * 1000
    })
  );
  const signature = sign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token) {
    return null;
  }

  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = sign(`${header}.${payload}`);
  if (signature !== expectedSignature) {
    return null;
  }

  const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (decodedPayload.exp < Date.now()) {
    return null;
  }

  return decodedPayload;
}

module.exports = {
  generateToken,
  verifyToken
};
