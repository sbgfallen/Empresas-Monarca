const express = require("express");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");

const {
  TOKEN_COOKIE,
  getClearCookieOptions,
  getTokenCookieOptions,
  signAdminToken,
} = require("../config/auth");
const { requireAdmin } = require("../middleware/auth");
const {
  ensureAdminUsers,
  findAdminCredentialsById,
  findAdminByEmail,
  toAdminDto,
} = require("../services/adminUsers");
const db = require("../config/db");

const router = express.Router();

const loginLimiter = rateLimit({
  legacyHeaders: false,
  limit: 15,
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    await ensureAdminUsers();

    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const admin = await findAdminByEmail(email);
    const isValid =
      admin?.active &&
      (await bcrypt.compare(password, admin.password_hash));

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid admin credentials",
      });
    }

    const token = signAdminToken(admin);

    res.cookie(TOKEN_COOKIE, token, getTokenCookieOptions());

    return res.json({
      admin: toAdminDto(admin),
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Auth server error",
    });
  }
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({
    admin: req.admin,
  });
});

router.patch("/profile", requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).json({
        error: "Name and email are required",
      });
    }

    const updated = await db.query(
      `
      UPDATE admin_users
      SET name = $1, email = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, email, role, active
      `,
      [name, email, req.admin.id]
    );

    const admin = updated.rows[0];
    const token = signAdminToken(admin);

    res.cookie(TOKEN_COOKIE, token, getTokenCookieOptions());

    return res.json({
      admin: toAdminDto(admin),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    console.log(error);

    return res.status(500).json({
      error: "Profile update error",
    });
  }
});

router.patch("/password", requireAdmin, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must have at least 8 characters",
      });
    }

    const admin = await findAdminCredentialsById(req.admin.id);
    const isValid =
      admin?.active &&
      (await bcrypt.compare(currentPassword, admin.password_hash));

    if (!isValid) {
      return res.status(401).json({
        error: "Current password is invalid",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.query(
      `
      UPDATE admin_users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [passwordHash, req.admin.id]
    );

    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Password update error",
    });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(TOKEN_COOKIE, getClearCookieOptions());

  res.json({
    success: true,
  });
});

module.exports = router;
