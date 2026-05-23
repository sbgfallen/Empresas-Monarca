const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../config/db");
const { requireAdmin, requireRoles } = require("../middleware/auth");
const { ensureAdminUsers } = require("../services/adminUsers");

const router = express.Router();
const MANAGER_ROLES = ["owner", "super_admin"];
const VALID_ROLES = new Set(["admin", "super_admin", "owner"]);

router.use(requireAdmin, requireRoles(MANAGER_ROLES));

function cleanEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function cleanRole(role) {
  const normalized = String(role || "admin").trim();

  return VALID_ROLES.has(normalized) ? normalized : "admin";
}

async function countActiveManagers() {
  const result = await db.query(
    `
    SELECT COUNT(*)::int AS total
    FROM admin_users
    WHERE role IN ('owner', 'super_admin') AND active = TRUE
    `
  );

  return result.rows[0].total;
}

async function wouldRemoveLastManager(id, nextRole, nextActive) {
  const current = await db.query(
    `
    SELECT role, active
    FROM admin_users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  const admin = current.rows[0];

  if (
    !admin ||
    !["owner", "super_admin"].includes(admin.role) ||
    !admin.active
  ) {
    return false;
  }

  const remainsManager = MANAGER_ROLES.includes(nextRole) && nextActive;

  if (remainsManager) {
    return false;
  }

  return (await countActiveManagers()) <= 1;
}

router.get("/", async (req, res) => {
  try {
    await ensureAdminUsers();

    const result = await db.query(
      `
      SELECT id, name, email, role, active, created_at, updated_at
      FROM admin_users
      ORDER BY id ASC
      `
    );

    res.json({
      admins: result.rows,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Admin users list error",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");
    const role = cleanRole(req.body.role);

    // Only owner can create owner accounts
    if (role === "owner" && req.admin.role !== "owner") {
      return res.status(403).json({
        error: "Only the owner can create owner accounts",
      });
    }

    if (!name || !email || password.length < 8) {
      return res.status(400).json({
        error: "Name, email and an 8 character password are required",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await db.query(
      `
      INSERT INTO admin_users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, active, created_at, updated_at
      `,
      [name, email, passwordHash, role]
    );

    res.status(201).json({
      admin: created.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    console.log(error);

    res.status(500).json({
      error: "Admin user create error",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const email = cleanEmail(req.body.email);
    const role = cleanRole(req.body.role);
    const active = Boolean(req.body.active);

    // Only owner can assign owner role
    if (role === "owner" && req.admin.role !== "owner") {
      return res.status(403).json({
        error: "Only the owner can assign the owner role",
      });
    }

    // If the current user is being updated to owner, only owner can do that
    const currentUser = await db.query(
      "SELECT role FROM admin_users WHERE id = $1 LIMIT 1",
      [id]
    );

    if (
      currentUser.rows[0]?.role === "owner" &&
      req.admin.role !== "owner"
    ) {
      return res.status(403).json({
        error: "Only the owner can modify another owner",
      });
    }

    if (!name || !email || !id) {
      return res.status(400).json({
        error: "Name and email are required",
      });
    }

    if (Number(req.admin.id) === id && !active) {
      return res.status(400).json({
        error: "You cannot deactivate your own user",
      });
    }

    if (await wouldRemoveLastManager(id, role, active)) {
      return res.status(400).json({
        error: "At least one active owner or super_admin is required",
      });
    }

    const updated = await db.query(
      `
      UPDATE admin_users
      SET name = $1,
          email = $2,
          role = $3,
          active = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, email, role, active, created_at, updated_at
      `,
      [name, email, role, active, id]
    );

    if (!updated.rows[0]) {
      return res.status(404).json({
        error: "Admin user not found",
      });
    }

    res.json({
      admin: updated.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    console.log(error);

    res.status(500).json({
      error: "Admin user update error",
    });
  }
});

router.patch("/:id/password", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const password = String(req.body.password || "");

    if (!id || password.length < 8) {
      return res.status(400).json({
        error: "An 8 character password is required",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await db.query(
      `
      UPDATE admin_users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
      `,
      [passwordHash, id]
    );

    if (!updated.rows[0]) {
      return res.status(404).json({
        error: "Admin user not found",
      });
    }

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Admin password update error",
    });
  }
});

module.exports = router;
