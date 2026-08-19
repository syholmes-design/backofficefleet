import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { logUnauthorizedAttempt, createDriverIntakeRecord, listDriverIntakesForUser } from "@/lib/services/intakeService";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      fleetId?: string;
      driverId?: string;
      intakeSource?: string;
      intakeChannel?: string;
    };

    if (!body.fleetId || !body.driverId) {
      return NextResponse.json({ error: "fleetId and driverId are required" }, { status: 422 });
    }

    const intake = await createDriverIntakeRecord({
      sessionUser: session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> },
      driverId: body.driverId,
      fleetId: body.fleetId,
      intakeSource: body.intakeSource,
      intakeChannel: body.intakeChannel,
    });

    return NextResponse.json(intake, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;

    if (statusCode === 401 || statusCode === 403) {
      await logUnauthorizedAttempt(session?.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, null, null, message);
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fleetId = searchParams.get("fleetId");
  const status = searchParams.get("status");
  const stage = searchParams.get("stage");
  const driverId = searchParams.get("driverId");

  if (!fleetId) {
    return NextResponse.json({ error: "fleetId is required" }, { status: 422 });
  }

  try {
    const records = await listDriverIntakesForUser(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> }, fleetId, {
      status,
      stage,
      driverId,
    });

    return NextResponse.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;

    if (statusCode === 403) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, fleetId, null, message);
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
