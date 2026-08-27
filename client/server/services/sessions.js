const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const SESSION_COOKIE = "monarca_session";
const SESSION_TTL_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 24 * 30);

let setupPromise;

async function ensureSessionsTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token_hash)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON admin_sessions(user_id)`);
    })();
  }
  return setupPromise;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  return crypto.randomBytes(24).toString("base64url");
}

async function validateSessionToken(rawToken) {
  if (!rawToken) return null;
  await ensureSessionsTable();
  const result = await db.query(
    `SELECT s.*, u.name, u.email, u.role, u.active
     FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = $1`,
    [hashToken(rawToken)]
  );
  const session = result.rows[0];
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await db.query("DELETE FROM admin_sessions WHERE id = $1", [session.id]).catch(() => {});
    return null;
  }
  if (!session.active) {
    await db.query("DELETE FROM admin_sessions WHERE id = $1", [session.id]).catch(() => {});
    return null;
  }
  return { id: session.user_id, name: session.name, email: session.email, role: session.role };
}

async function createSession(userId) {
  await ensureSessionsTable();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  await db.query(
    `INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt]
  );
  return {
    token,
    expiresAt,
    cookieOptions: {
      httpOnly: true, maxAge: SESSION_TTL_HOURS * 60 * 60 * 1000,
      path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production",
    },
  };
}

async function destroySession(rawToken) {
  if (!rawToken) return;
  await ensureSessionsTable();
  await db.query("DELETE FROM admin_sessions WHERE token_hash = $1", [hashToken(rawToken)]).catch(() => {});
}

async function login(email, password) {
  await ensureSessionsTable();
  const normalized = String(email || "").trim().toLowerCase();
  const result = await db.query(
    "SELECT * FROM admin_users WHERE email = $1 AND active = true", [normalized]
  );
  const admin = result.rows[0];
  if (!admin) return null;
  const isValid = await bcrypt.compare(String(password || ""), admin.password_hash);
  if (!isValid) return null;
  await db.query("DELETE FROM admin_sessions WHERE user_id = $1", [admin.id]);
  const session = await createSession(admin.id);
  return {
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    session,
  };
}

module.exports = { SESSION_COOKIE, hashToken, validateSessionToken, createSession, destroySession, login, ensureSessionsTable };
