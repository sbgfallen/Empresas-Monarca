/**
 * POST /api/auth/logout — Destroy session.
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

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      await db.query("DELETE FROM admin_sessions WHERE token_hash = $1", [hashToken(token)]);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error: any) {
    console.error("[Auth] Logout error:", error.message);
    return NextResponse.json({ success: true });
  }
}
