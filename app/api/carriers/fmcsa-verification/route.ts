import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { getLatestFmcsaVerification, verifyCarrierWithFmcsa } from "@/lib/services/fmcsa/fmcsaVerificationService";

type RouteSessionUser = {
  id?: string;
  email?: string | null;
  memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
};

function pickupLikeError(error: unknown) {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode) || 500
      : 500;
  const message =
    statusCode === 401 || statusCode === 403 || statusCode === 404 || statusCode === 422
      ? error instanceof Error
        ? error.message
        : "Request failed"
      : "Internal server error";
  const payload =
    error && typeof error === "object" && "payload" in error
      ? (error as { payload?: Record<string, unknown> }).payload
      : undefined;
  return NextResponse.json(payload ? { error: message, ...payload } : { error: message }, { status: statusCode });
}

function sessionUser(session: { user?: RouteSessionUser | null } | null) {
  if (!session?.user?.id) return null;
  return session.user;
}

function defaultFleetId(user: RouteSessionUser) {
  return user.memberships?.find((membership) => membership.status !== "INACTIVE")?.fleetId ?? null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = sessionUser(session);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const fleetId = request.nextUrl.searchParams.get("fleetId") || defaultFleetId(user);
    const carrierId = request.nextUrl.searchParams.get("carrierId");
    if (!fleetId || !carrierId) {
      throw Object.assign(new Error("fleetId and carrierId are required"), { statusCode: 422 });
    }
    const result = await getLatestFmcsaVerification(user, fleetId, carrierId);
    return NextResponse.json(result);
  } catch (error) {
    return pickupLikeError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const user = sessionUser(session);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fleetId = (typeof body.fleetId === "string" && body.fleetId) || defaultFleetId(user);
    if (!fleetId) throw Object.assign(new Error("fleetId is required"), { statusCode: 422 });
    const carrierRegistryId = typeof body.carrierId === "string" ? body.carrierId : null;
    const result = await verifyCarrierWithFmcsa(user, {
      fleetId,
      carrierRegistryId,
      kind: typeof body.kind === "string" ? body.kind : null,
      value: typeof body.value === "string" ? body.value : null,
      useCache: body.refresh === true ? false : true,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return pickupLikeError(error);
  }
}
