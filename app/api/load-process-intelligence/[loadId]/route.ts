import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getLoadProcessIntelligence } from "@/lib/load-process-intelligence";
import { getUnifiedLoadProcessView } from "@/lib/load-process-unified-read-model";
import { isDatabaseUrlNotConfiguredError, prisma, prismaUnavailablePayload } from "@/lib/prisma";
import { operatorUnauthorizedResponse } from "@/lib/require-operator-session";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";
import { isDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

export async function GET(_request: Request, context: { params: Promise<{ loadId: string }> }) {
  const unauthorized = await operatorUnauthorizedResponse();
  if (unauthorized) return unauthorized;
  const session = await auth();
  const { loadId } = await context.params;
  const key = decodeURIComponent(loadId).trim();
  if (!key || isDemoOperationalKey(key)) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }
  try {
    const matches = await prisma.load.findMany({
      where: { OR: [{ id: key }, { referenceNumber: key }, { sourceRecordId: key }] },
      select: { id: true, fleetId: true },
      take: 20,
    });
    const actor = session?.user as SessionUserLike | undefined;
    let allowed: { id: string; fleetId: string } | null = null;
    for (const row of matches) {
      const access = await authorizedFleetAccess(actor, row.fleetId);
      if (access.allowed) {
        allowed = row;
        break;
      }
    }
    if (!allowed) return NextResponse.json({ error: "Load not found" }, { status: 404 });
    const processIntelligence = await getLoadProcessIntelligence(allowed.id, {
      fleetId: allowed.fleetId,
      liveOnly: true,
    });
    if (!processIntelligence) return NextResponse.json({ error: "Load not found" }, { status: 404 });
    const unifiedProcess = await getUnifiedLoadProcessView(actor!, allowed.fleetId, allowed.id);
    return NextResponse.json({ ...processIntelligence, unifiedProcess });
  } catch (error) {
    if (isDatabaseUrlNotConfiguredError(error)) {
      return NextResponse.json(prismaUnavailablePayload(), { status: 503 });
    }
    const message = error instanceof Error ? error.message : "";
    if (/SASL|password authentication|ECONNREFUSED|Can't reach database|PrismaClient/i.test(message)) {
      return NextResponse.json(
        { error: "Process intelligence store is unavailable", code: "PRISMA_UNAVAILABLE" },
        { status: 503 },
      );
    }
    throw error;
  }
}