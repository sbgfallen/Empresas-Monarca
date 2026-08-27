/**
 * GET /api/auth/me — Verify session and return admin info.
 */
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require("node:crypto");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require("../../../../server/config/db");

const SESSION_COOKIE = "monarca_session";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const result = await db.query(
      `SELECT s.user_id, u.name, u.email, u.role, u.active, s.expires_at
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = $1`,
      [hashToken(token)]
    );

    const session = result.rows[0];
    if (!session) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      await db.query("DELETE FROM admin_sessions WHERE token_hash = $1", [hashToken(token)]);
      return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
    }

    if (!session.active) {
      return NextResponse.json({ error: "Cuenta desactivada" }, { status: 403 });
    }

    return NextResponse.json({
      admin: { id: session.user_id, name: session.name, email: session.email, role: session.role },
    });
  } catch (error: any) {
    console.error("[Auth] /me error:", error.message);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
