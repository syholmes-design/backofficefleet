import { NextResponse } from "next/server";

import { auth } from "@/auth";
import type { SessionUserLike } from "@/lib/authorization";

/** Session user for recruiting API routes, or a 401 response. */
export async function recruitingSessionUser(): Promise<{ user: SessionUserLike; response?: undefined } | { user?: undefined; response: NextResponse }> {
  const session = await auth();
  const user = session?.user as SessionUserLike | undefined;
  if (!user?.id) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user };
}

export function recruitingErrorResponse(error: unknown) {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;
  if (statusCode >= 500) throw error;
  return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: statusCode });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
