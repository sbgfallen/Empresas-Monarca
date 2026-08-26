const jwt = require("jsonwebtoken");

const TOKEN_COOKIE = "monarca_admin_token";
const SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 8);

function getJwtSecret() {
  const secret =
    process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "monarca-dev-admin-secret-change-me";

  if (
    process.env.NODE_ENV === "production" &&
    !process.env.ADMIN_JWT_SECRET &&
    !process.env.JWT_SECRET
  ) {
    throw new Error("ADMIN_JWT_SECRET is required in production.");
  }

  return secret;
}

function signAdminToken(admin) {
  return jwt.sign(
    {
      sub: String(admin.id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
    getJwtSecret(),
    {
      audience: "monarca-admin",
      expiresIn: `${SESSION_HOURS}h`,
      issuer: "monarca-api",
    }
  );
}

function verifyAdminToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    audience: "monarca-admin",
    issuer: "monarca-api",
  });
}

function getTokenCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

function getClearCookieOptions() {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

module.exports = {
  TOKEN_COOKIE,
  getClearCookieOptions,
  getTokenCookieOptions,
  signAdminToken,
  verifyAdminToken,
};
