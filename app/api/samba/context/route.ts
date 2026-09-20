import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import { getSambaOperationalContext } from "@/lib/services/samba/sambaIntelligenceService";
import { evaluateSambaIntelligence } from "@/lib/services/samba/sambaIntelligenceService";

type RouteUser = {
  id?: string;
  email?: string | null;
  memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
};

function errorResponse(error: unknown) {
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
  return NextResponse.json({ error: message }, { status: statusCode });
}

function userFrom(session: { user?: RouteUser | null } | null) {
  return session?.user?.id ? session.user : null;
}

function fleetIdFrom(user: RouteUser, request: NextRequest, bodyFleet?: unknown) {
  if (typeof bodyFleet === "string" && bodyFleet) return bodyFleet;
  const query = request.nextUrl.searchParams.get("fleetId");
  if (query) return query;
  return user.memberships?.find((membership) => membership.status !== "INACTIVE")?.fleetId ?? null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = userFrom(session);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const fleetId = fleetIdFrom(user, request);
    if (!fleetId) throw Object.assign(new Error("fleetId is required"), { statusCode: 422 });
    return NextResponse.json(
      await getSambaOperationalContext(user, fleetId, {
        loadId: request.nextUrl.searchParams.get("loadId"),
        authorizationId: request.nextUrl.searchParams.get("authorizationId"),
        driverId: request.nextUrl.searchParams.get("driverId"),
        equipmentId: request.nextUrl.searchParams.get("equipmentId"),
        carrierRegistryId: request.nextUrl.searchParams.get("carrierRegistryId"),
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const user = userFrom(session);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const fleetId = fleetIdFrom(user, request, body.fleetId);
    if (!fleetId) throw Object.assign(new Error("fleetId is required"), { statusCode: 422 });
    const evaluated = await evaluateSambaIntelligence(user, fleetId);
    const context = await getSambaOperationalContext(user, fleetId, {
      loadId: typeof body.loadId === "string" ? body.loadId : request.nextUrl.searchParams.get("loadId"),
      authorizationId: typeof body.authorizationId === "string" ? body.authorizationId : null,
      driverId: typeof body.driverId === "string" ? body.driverId : null,
      equipmentId: typeof body.equipmentId === "string" ? body.equipmentId : null,
      carrierRegistryId: typeof body.carrierRegistryId === "string" ? body.carrierRegistryId : null,
    });
    return NextResponse.json({
      ...context,
      createdIds: evaluated.createdIds,
      findings: evaluated.findings,
      mutatedOperationalRecords: false,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
