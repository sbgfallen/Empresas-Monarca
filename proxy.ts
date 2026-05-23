import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "monarca_admin_token";
const LOGIN_PATH = "/admin-hidden-2026/login";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAdminSession = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);

  if (pathname === LOGIN_PATH || hasAdminSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin-hidden-2026/:path*"],
};
