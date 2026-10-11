import { auth } from "@/auth";
import { isDatabaseUrlNotConfiguredError, prismaUnavailablePayload } from "@/lib/prisma";
import { listAccessibleLiveSettlements } from "@/lib/services/settlementReadService";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  try {
    const settlements = await listAccessibleLiveSettlements(session.user);
    return NextResponse.json({ authority: "LIVE", settlements });
  } catch (error) {
    if (isDatabaseUrlNotConfiguredError(error)) {
      return NextResponse.json(prismaUnavailablePayload(), { status: 503 });
    }
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;
    return NextResponse.json(
      { error: statusCode === 401 || statusCode === 403 ? (error as Error).message : "Internal server error" },
      { status: statusCode },
    );
  }
}
