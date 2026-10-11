import { auth } from "@/auth";
import { assertEpodEnabled } from "@/lib/services/epod/deliveryLifecycle";
import { saveAcknowledgment } from "@/lib/services/epod/epodPersistence";
import { proofRouteStatus } from "@/lib/services/proofSettlementHoldService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ loadId: string }> }) {
  try {
    assertEpodEnabled();
  } catch (error) {
    const status = proofRouteStatus(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Electronic POD is disabled." }, { status });
  }
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 });
  const { loadId } = await context.params;
  try {
    const body = (await request.json()) as {
      name?: string;
      title?: string;
      facility?: string;
      disposition?: string;
      exceptions?: string;
      refusalReason?: string;
      statementAccepted?: boolean;
      channel?: string;
      signaturePng?: string;
      evidenceId?: string;
    };
    const result = await saveAcknowledgment(session.user, loadId, {
      name: body.name ?? "",
      title: body.title ?? "",
      facility: body.facility ?? "",
      disposition: body.disposition ?? "",
      exceptions: body.exceptions ?? "",
      refusalReason: body.refusalReason ?? "",
      statementAccepted: body.statementAccepted === true,
      channel: body.channel ?? "",
      signaturePng: body.signaturePng ?? "",
      evidenceId: body.evidenceId ?? null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = proofRouteStatus(error);
    return NextResponse.json({ error: status >= 500 ? "Internal server error" : error instanceof Error ? error.message : "Request failed" }, { status });
  }
}
