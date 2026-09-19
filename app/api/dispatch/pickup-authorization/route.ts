import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  issuePickupAuthorization,
  listPickupAuthorizations,
  parseJsonBody,
  pickupErrorResponse,
  requireRouteUser,
  getRequiredString,
} from "./_shared";

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = requireRouteUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const loadId = request.nextUrl.searchParams.get("loadId");
    const rows = await listPickupAuthorizations(user, loadId);
    return NextResponse.json({ authorizations: rows });
  } catch (error) {
    return pickupErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const user = requireRouteUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseJsonBody(request);
    const issued = await issuePickupAuthorization(user, getRequiredString(body, "loadId"));
    return NextResponse.json(issued, { status: 201 });
  } catch (error) {
    return pickupErrorResponse(error);
  }
}
