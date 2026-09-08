import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** Existing NextAuth session gate. Not a new permission model or authorization platform. */
export async function operatorUnauthorizedResponse() {
  const session = await auth();
  if (session?.user?.id) return null;
  return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
}
