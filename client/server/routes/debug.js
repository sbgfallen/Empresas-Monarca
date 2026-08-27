const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

// Temporary endpoint - REMOVE after debugging
router.get("/admin-check", async (req, res) => {
  try {
    // Check if table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_users'
      ) as exists
    `);
    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      return res.json({ error: "admin_users table does not exist" });
    }

    // List all admins (without password_hash)
    const admins = await db.query(
      "SELECT id, name, email, role, active FROM admin_users"
    );

    // Try to verify the default password
    const defaultPassword = process.env.ADMIN_PASSWORD || "MonarcaAdmin2026!";
    const defaultEmail = (process.env.ADMIN_EMAIL || "admin@empresasmonarca.com").trim().toLowerCase();

    let passwordMatch = false;
    for (const admin of admins.rows) {
      const result = await db.query(
        "SELECT password_hash FROM admin_users WHERE id = $1",
        [admin.id]
      );
      const hash = result.rows[0]?.password_hash;
      if (hash) {
        const match = await bcrypt.compare(defaultPassword, hash);
        if (match && admin.email === defaultEmail) {
          passwordMatch = true;
        }
      }
    }

    return res.json({
      tableExists,
      adminCount: admins.rows.length,
      admins: admins.rows,
      defaultEmail,
      defaultPasswordWorks: passwordMatch,
      envAdminEmail: process.env.ADMIN_EMAIL || "(not set)",
      envAdminPassword: process.env.ADMIN_PASSWORD ? "(set)" : "(not set)",
    });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

// Reset admin password endpoint
router.post("/reset-admin", async (req, res) => {
  try {
    const email = (req.body.email || "admin@empresasmonarca.com").trim().toLowerCase();
    const password = req.body.password || "MonarcaAdmin2026!";

    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_users'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.query(
      `INSERT INTO admin_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = $3, active = true, updated_at = NOW()`,
      ["Administrador Monarca", email, passwordHash, "owner"]
    );

    return res.json({
      success: true,
      message: `Admin ${email} created/reset successfully`,
      email,
      password,
    });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

module.exports = router;
