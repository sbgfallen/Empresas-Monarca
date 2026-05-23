const { TOKEN_COOKIE, verifyAdminToken } = require("../config/auth");
const {
  findAdminById,
  toAdminDto,
} = require("../services/adminUsers");

const ADMIN_ROLES = new Set(["admin", "super_admin", "owner"]);

function getRequestToken(req) {
  const bearer = req.headers.authorization;

  if (bearer && bearer.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length);
  }

  return req.cookies?.[TOKEN_COOKIE];
}

async function requireAdmin(req, res, next) {
  try {
    const token = getRequestToken(req);

    if (!token) {
      return res.status(401).json({
        error: "Admin session required",
      });
    }

    const payload = verifyAdminToken(token);

    if (!ADMIN_ROLES.has(payload.role)) {
      return res.status(403).json({
        error: "Admin role required",
      });
    }

    const admin = await findAdminById(payload.sub);

    if (!admin || !admin.active || !ADMIN_ROLES.has(admin.role)) {
      return res.status(401).json({
        error: "Invalid admin session",
      });
    }

    req.admin = toAdminDto(admin);

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid admin session",
    });
  }
}

function requireRoles(roles) {
  const allowedRoles = new Set(roles);

  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        error: "Admin session required",
      });
    }

    if (!allowedRoles.has(req.admin.role)) {
      return res.status(403).json({
        error: "Insufficient admin role",
      });
    }

    next();
  };
}

module.exports = {
  requireAdmin,
  requireRoles,
};
