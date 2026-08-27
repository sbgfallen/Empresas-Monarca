const { validateSessionToken, SESSION_COOKIE } = require("../services/sessions");

const ADMIN_ROLES = new Set(["admin", "super_admin", "owner"]);

function getRequestToken(req) {
  const cookieToken = req.cookies?.[SESSION_COOKIE];
  if (cookieToken) return cookieToken;
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith("Bearer ")) return bearer.slice("Bearer ".length);
  return null;
}

async function requireSession(req, res, next) {
  try {
    const token = getRequestToken(req);
    if (!token) return res.status(401).json({ error: "Sesión requerida" });
    const user = await validateSessionToken(token);
    if (!user) return res.status(401).json({ error: "Sesión inválida o expirada" });
    if (!ADMIN_ROLES.has(user.role)) return res.status(403).json({ error: "Permisos administrativos requeridos" });
    req.user = user;
    next();
  } catch (error) {
    console.error("[SessionAuth] Error:", error.message);
    return res.status(500).json({ error: "Error validating session" });
  }
}

function requireRoles(roles) {
  const allowedRoles = new Set(roles);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Sesión requerida" });
    if (!allowedRoles.has(req.user.role)) return res.status(403).json({ error: "Permisos insuficientes" });
    next();
  };
}

module.exports = { requireSession, requireRoles, getRequestToken };
