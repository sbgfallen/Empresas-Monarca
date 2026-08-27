/**
 * Next.js API route for /api/auth/login — direct implementation
 * Bypasses the Express bridge to ensure login works reliably.
 */
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require("../../../../server/config/db");

const SESSION_COOKIE = "monarca_session";
const SESSION_TTL_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 24 * 30);

let adminTableReady = false;

async function ensureAdmin() {
  if (adminTableReady) return;
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

  const email = (process.env.ADMIN_EMAIL || "admin@empresasmonarca.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "MonarcaAdmin2026!";
  const name = process.env.ADMIN_NAME || "Administrador Monarca";
  const role = process.env.ADMIN_ROLE || "owner";
  const hash = await bcrypt.hash(password, 12);

  await db.query(
    `INSERT INTO admin_users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = $3, role = $4, updated_at = NOW()`,
    [name, email, hash, role]
  );
  adminTableReady = true;
  console.log("[Auth] Default admin ensured:", email);
}

function hashToken(token: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("node:crypto");
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("node:crypto");
  return crypto.randomBytes(24).toString("base64url");
}

async function ensureSessionsTable() {
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
}

export async function POST(request: NextRequest) {
  try {
    await ensureAdmin();

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    // Find admin
    const result = await db.query(
      "SELECT id, name, email, password_hash, role, active FROM admin_users WHERE email = $1",
      [email]
    );
    const admin = result.rows[0];

    if (!admin || !admin.active) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Create session
    await ensureSessionsTable();
    await db.query("DELETE FROM admin_sessions WHERE user_id = $1", [admin.id]);
    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
    await db.query(
      "INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [admin.id, hashToken(token), expiresAt]
    );

    const response = NextResponse.json({
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      maxAge: SESSION_TTL_HOURS * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: any) {
    console.error("[Auth] Login error:", error.message);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
