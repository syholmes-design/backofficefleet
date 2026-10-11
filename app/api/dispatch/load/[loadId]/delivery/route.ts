import { auth } from "@/auth";
import { assertEpodEnabled } from "@/lib/services/epod/deliveryLifecycle";
import { advanceDelivery, getEpod } from "@/lib/services/epod/epodPersistence";
import { proofRouteStatus } from "@/lib/services/proofSettlementHoldService";
import { NextRequest, NextResponse } from "next/server";

function fail(error: unknown) {
  const status = proofRouteStatus(error);
  const message = status >= 500 && status !== 503 ? "Internal server error" : error instanceof Error ? error.message : "Request failed";
  return NextResponse.json({ error: message }, { status });
}

function disabledEpodResponse() {
  try {
    assertEpodEnabled();
    return null;
  } catch (error) {
    return fail(error);
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  const disabled = disabledEpodResponse();
  if (disabled) return disabled;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  const { loadId } = await context.params;
  try {
    return NextResponse.json(await getEpod(session.user, loadId));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  const disabled = disabledEpodResponse();
  if (disabled) return disabled;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  const { loadId } = await context.params;
  try {
    const body = (await request.json()) as { action?: string; place?: string };
    if (body.action !== "ARRIVE" && body.action !== "START_UNLOADING" && body.action !== "READY_FOR_ACKNOWLEDGMENT") {
      return NextResponse.json({ error: "Delivery action is not supported." }, { status: 422 });
    }
    return NextResponse.json(await advanceDelivery(session.user, loadId, body.action, body.place ?? ""));
  } catch (error) {
    return fail(error);
  }
}
