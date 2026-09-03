import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { SessionUserLike } from "@/lib/authorization";
import { getTenantLoadProcess } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import { ProcessIntelligenceError } from "@/lib/process-intelligence/types";

export async function GET(request: Request, context: { params: Promise<{ loadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { loadId } = await context.params;
  const fleetId = new URL(request.url).searchParams.get("fleetId") ?? "";
  if (!fleetId) return NextResponse.json({ error: "fleetId is required" }, { status: 422 });

  try {
    const reconstruction = await getTenantLoadProcess(
      getOperatingProcessStore(),
      session.user as SessionUserLike,
      fleetId,
      loadId,
    );
    return NextResponse.json({
      dataAuthority: reconstruction.dataAuthority,
      loadId: reconstruction.loadId,
      fleetId: reconstruction.fleetId,
      lineage: reconstruction.lineage,
      reconstructable: reconstruction.reconstructable,
      missingStages: reconstruction.missingStages,
      stageSummaries: reconstruction.stageSummaries,
      events: reconstruction.events.map((event) => ({
        recordClass: "AUTHORITATIVE_PERSISTED_EVENT" as const,
        ...event,
      })),
      supportingRecords: reconstruction.supportingRecords,
      exceptions: reconstruction.exceptions.map((item) => ({
        recordClass: "EXCEPTION" as const,
        ...item,
      })),
      actions: reconstruction.actions.map((item) => ({
        recordClass: "CORRECTIVE_ACTION" as const,
        ...item,
      })),
      evidence: reconstruction.supportingRecords.proofs
        .filter((proof) => proof.evidenceId)
        .map((proof) => ({
          recordClass: "EVIDENCE" as const,
          loadId: proof.loadId,
          evidenceId: proof.evidenceId,
          proofId: proof.id,
        })),
    });
  } catch (error) {
    if (error instanceof ProcessIntelligenceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
