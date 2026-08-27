const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

// GET /api/debug/admin-check — Diagnóstico completo de la BD
router.get("/admin-check", async (req, res) => {
  try {
    // 1. Check DB connection
    const dbTest = await db.query("SELECT NOW() as now");
    const serverTime = dbTest.rows[0].now;

    // 2. Check admin_users table
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'admin_users'
      ) as exists
    `);
    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      return res.json({
        status: "TABLE_MISSING",
        serverTime,
        message: "Tabla admin_users no existe. Llama POST /api/debug/reset-admin para crearla.",
      });
    }

    // 3. List all admins
    const admins = await db.query("SELECT id, name, email, role, active FROM admin_users");

    // 4. Test default password
    const testEmail = (process.env.ADMIN_EMAIL || "admin@empresasmonarca.com").trim().toLowerCase();
    const testPassword = process.env.ADMIN_PASSWORD || "MonarcaAdmin2026!";

    let passwordTest = null;
    for (const admin of admins.rows) {
      if (admin.email === testEmail) {
        const result = await db.query("SELECT password_hash FROM admin_users WHERE id = $1", [admin.id]);
        const hash = result.rows[0]?.password_hash;
        if (hash) {
          passwordTest = await bcrypt.compare(testPassword, hash);
        }
        break;
      }
    }

    // 5. Check admin_sessions table
    const sessionsCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'admin_sessions'
      ) as exists
    `);

    return res.json({
      status: "OK",
      serverTime,
      tableExists: true,
      sessionsTableExists: sessionsCheck.rows[0].exists,
      adminCount: admins.rows.length,
      admins: admins.rows,
      testEmail,
      passwordWorks: passwordTest,
      hint: passwordTest === false
        ? "La contraseña NO coincide. Llama POST /api/debug/reset-admin para resetear."
        : passwordTest === true
        ? "Las credenciales son correctas. El problema podría estar en CORS o cookies."
        : "No se encontró admin con ese email.",
    });
  } catch (error) {
    return res.json({ status: "ERROR", error: error.message, stack: error.stack });
  }
});

// POST /api/debug/reset-admin — Crear o resetear admin por defecto
router.post("/reset-admin", async (req, res) => {
  try {
    const email = (req.body.email || "admin@empresasmonarca.com").trim().toLowerCase();
    const password = req.body.password || "MonarcaAdmin2026!";

    // Create table if not exists
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

    const passwordHash = await bcrypt.hash(password, 12);

    await db.query(
      `INSERT INTO admin_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = $3, active = true, updated_at = NOW()`,
      ["Administrador Monarca", email, passwordHash, "owner"]
    );

    // Verify it works
    const verify = await db.query("SELECT password_hash FROM admin_users WHERE email = $1", [email]);
    const hash = verify.rows[0]?.password_hash;
    const verified = hash ? await bcrypt.compare(password, hash) : false;

    return res.json({
      success: true,
      verified,
      message: `Admin ${email} creado/resetead${verified ? "o ✓" : "o (verificación falló)"}`,
      email,
      password,
    });
  } catch (error) {
    return res.json({ status: "ERROR", error: error.message });
  }
});

// POST /api/debug/test-login — Probar login directamente
router.post("/test-login", async (req, res) => {
  try {
    const email = (req.body.email || "admin@empresasmonarca.com").trim().toLowerCase();
    const password = req.body.password || "MonarcaAdmin2026!";

    // Step 1: Check table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'admin_users'
      ) as exists
    `);
    if (!tableCheck.rows[0].exists) {
      return res.json({ step: "table_check", error: "Tabla admin_users no existe" });
    }

    // Step 2: Find admin
    const adminResult = await db.query(
      "SELECT id, name, email, password_hash, role, active FROM admin_users WHERE email = $1",
      [email]
    );
    if (adminResult.rows.length === 0) {
      return res.json({ step: "find_admin", error: `No se encontró admin con email: ${email}` });
    }

    const admin = adminResult.rows[0];

    // Step 3: Check active
    if (!admin.active) {
      return res.json({ step: "active_check", error: "El admin está desactivado" });
    }

    // Step 4: Check password
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) {
      return res.json({
        step: "password_check",
        error: "Contraseña incorrecta",
        adminId: admin.id,
        adminEmail: admin.email,
      });
    }

    // Step 5: Create session
    const sessions = require("../services/sessions");
    const session = await sessions.createSession(admin.id);

    return res.json({
      success: true,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      sessionCreated: true,
      token: session.token,
      cookieName: sessions.SESSION_COOKIE,
      message: "Login exitoso. El token debería estar en la cookie.",
    });
  } catch (error) {
    return res.json({ status: "ERROR", error: error.message, stack: error.stack });
  }
});

module.exports = router;
