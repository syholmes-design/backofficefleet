import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** Existing NextAuth session gate for recruiting-v2 Prisma mutations. Not a new permission model. */
export async function recruitingV2UnauthorizedResponse() {
  const session = await auth();
  if (session?.user?.id) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
