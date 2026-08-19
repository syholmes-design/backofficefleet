import { auth } from "@/auth";
import { getDriverClaimStatus } from "@/lib/services/driverClaimService";

import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getDriverClaimStatus({
    sessionUser: session.user,
  });

  return NextResponse.json(result);
}
