import { auth } from "@/auth";
import { isBofStaff } from "@/lib/contact/bofStaffAccess";
import type { SessionUserLike } from "@/lib/authorization";
import { NextResponse } from "next/server";

export async function requireInquiryStaff(): Promise<
  { user: SessionUserLike & { id: string }; error?: never } | { user?: never; error: NextResponse }
> {
  const session = await auth();
  const user = session?.user as SessionUserLike | undefined;
  if (!user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!isBofStaff(user)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user: { ...user, id: user.id } };
}
