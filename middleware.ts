import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { isPublicRoute, signInRedirectPath } from "@/lib/security/route-access";

/**
 * Central session gate for private operating routes (policy: lib/security/route-access.ts).
 * Verifies the Auth.js session JWT only; role and tenant authorization stay in pages, route
 * handlers and services. Runs on the edge, so it must not import `@/auth` (Prisma, bcrypt).
 */
function authSecret() {
  const raw = process.env.AUTH_SECRET ?? process.env.AUTH_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed || null;
}

async function hasSession(request: NextRequest, secret: string) {
  // Auth.js names the cookie "__Secure-authjs.session-token" on HTTPS and "authjs.session-token" otherwise.
  const httpsFirst = request.nextUrl.protocol === "https:";
  for (const secureCookie of [httpsFirst, !httpsFirst]) {
    const token = await getToken({ req: request, secret, secureCookie });
    if (token?.sub) return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicRoute(pathname, request.method)) return NextResponse.next();

  const isApi = pathname.startsWith("/api/");
  const secret = authSecret();
  if (!secret) {
    // Fail closed: without a secret no session can be verified.
    return isApi
      ? NextResponse.json({ error: "AUTH_SECRET is not configured", code: "AUTH_SECRET_REQUIRED" }, { status: 503 })
      : new NextResponse("Sign-in is not configured for this deployment.", { status: 503 });
  }

  if (await hasSession(request, secret)) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  }
  return NextResponse.redirect(new URL(signInRedirectPath(pathname, search), request.url));
}

export const config = {
  // Everything except Next.js build assets. Files under public/ are allowed by the policy itself
  // (PUBLIC_STATIC_ROOTS), so a file extension on a private route cannot bypass the gate.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
