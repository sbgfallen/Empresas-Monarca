const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");

const { SESSION_COOKIE } = require("../services/sessions");
const sessions = require("../services/sessions");
const { requireSession } = require("../middleware/sessionAuth");
const { audit } = require("../services/audit");
const { ensureAdminUsers } = require("../services/adminUsers");
const db = require("../config/db");

const router = express.Router();

const loginLimiter = rateLimit({
  legacyHeaders: false,
  limit: 15,
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    await ensureAdminUsers();

    const result = await sessions.login(req.body.email, req.body.password);

    if (!result) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    res.cookie(SESSION_COOKIE, result.session.token, result.session.cookieOptions);

    await audit(result.admin, "LOGIN", "AdminUser", result.admin.id, {
      email: result.admin.email,
    }, req.ip);

    return res.json({ admin: result.admin });
  } catch (error) {
    console.error("[Auth] Login error:", error.message);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

// GET /api/auth/me
router.get("/me", requireSession, (req, res) => {
  res.json({ admin: req.user });
});

// PATCH /api/auth/profile
router.patch("/profile", requireSession, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).json({ error: "Nombre y correo son requeridos" });
    }

    const updated = await db.query(
      `UPDATE admin_users SET name = $1, email = $2, updated_at = NOW()
       WHERE id = $3 RETURNING id, name, email, role, active`,
      [name, email, req.user.id]
    );

    const admin = updated.rows[0];
    await audit(req.user, "EDITAR", "AdminUser", req.user.id, { fields: ["name", "email"] }, req.ip);
    return res.json({ admin });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "El correo ya existe" });
    console.error("[Auth] Profile error:", error.message);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

// PATCH /api/auth/password
router.patch("/password", requireSession, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Mínimo 8 caracteres" });
    }

    const adminResult = await db.query("SELECT * FROM admin_users WHERE id = $1", [req.user.id]);
    const admin = adminResult.rows[0];

    const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isValid) return res.status(401).json({ error: "Contraseña actual incorrecta" });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.query("UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [passwordHash, req.user.id]);

    await audit(req.user, "EDITAR", "AdminUser", req.user.id, { action: "password_change" }, req.ip);
    return res.json({ success: true });
  } catch (error) {
    console.error("[Auth] Password error:", error.message);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) await sessions.destroySession(token);

  res.clearCookie(SESSION_COOKIE, {
    path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production",
  });

  res.json({ success: true });
});

module.exports = router;
