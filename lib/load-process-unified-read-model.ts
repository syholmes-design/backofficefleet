import type { SessionUserLike } from "@/lib/authorization";
import { buildLoadFinanceHandoff } from "@/lib/load-finance-handoff";
import { getLoadProcessIntelligence } from "@/lib/load-process-intelligence";
import { getTenantLoadProcess } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import { ProcessIntelligenceError } from "@/lib/process-intelligence/types";
import { prisma } from "@/lib/prisma";

export type UnifiedLoadProcessView = {
  loadId: string;
  fleetId: string;
  referenceNumber: string | null;
  loadStatus: string;
  spine: {
    referenceActivities: string[];
    persistedEventTypes: string[];
    missingStages: string[];
    reconstructable: boolean;
  };
  financeHandoff: ReturnType<typeof buildLoadFinanceHandoff>;
  eventTraceSummary: {
    orderedEventCount: number;
    conformanceStatus: string | null;
    dataAuthority: string;
  };
  operatingProcess: {
    eventCount: number;
    exceptionCount: number;
    dataAuthority: string | null;
  } | null;
  nextUnifiedAction: string;
};

export async function getUnifiedLoadProcessView(
  user: SessionUserLike,
  fleetId: string,
  loadId: string,
): Promise<UnifiedLoadProcessView | null> {
  const load = await prisma.load.findFirst({
    where: { fleetId, OR: [{ id: loadId }, { referenceNumber: loadId }] },
    include: {
      proofsOfDelivery: true,
      invoices: true,
      settlements: true,
      operatingExceptions: true,
    },
  });
  if (!load) return null;

  const processIntelligence = await getLoadProcessIntelligence(load.id, { fleetId, liveOnly: true });
  if (!processIntelligence) return null;

  let operatingProcess: UnifiedLoadProcessView["operatingProcess"] = null;
  try {
    const reconstruction = await getTenantLoadProcess(getOperatingProcessStore(), user, fleetId, load.id);
    operatingProcess = {
      eventCount: reconstruction.events?.length ?? 0,
      exceptionCount: reconstruction.exceptions?.length ?? 0,
      dataAuthority: reconstruction.dataAuthority ?? null,
    };
  } catch (error) {
    if (!(error instanceof ProcessIntelligenceError && error.statusCode === 404)) {
      throw error;
    }
  }

  const financeHandoff = buildLoadFinanceHandoff(load);
  const persistedEventTypes =
    processIntelligence.orderedEvents?.map((event) => event.activity) ?? [];
  const missingStages = operatingProcess
    ? []
    : processIntelligence.eventLogSufficiency?.sufficientForSingleTrace
      ? []
      : ["OPERATING_PROCESS_RECONSTRUCTION_UNAVAILABLE"];

  const broken = financeHandoff.brokenHandoffs;
  const nextUnifiedAction =
    broken.length > 0
      ? broken[0]
      : financeHandoff.nextRequiredAction !==
          "No finance handoff blockers detected from Prisma load, proof, invoice, and settlement rows."
        ? financeHandoff.nextRequiredAction
        : processIntelligence.conformance?.nextRequiredAction ?? "Continue operating process event emission.";

  return {
    loadId: load.id,
    fleetId: load.fleetId,
    referenceNumber: load.referenceNumber,
    loadStatus: load.status,
    spine: {
      referenceActivities: processIntelligence.referenceProcess?.activities ?? [],
      persistedEventTypes,
      missingStages,
      reconstructable: Boolean(operatingProcess && operatingProcess.eventCount > 0),
    },
    financeHandoff,
    eventTraceSummary: {
      orderedEventCount: processIntelligence.orderedEvents?.length ?? 0,
      conformanceStatus: processIntelligence.conformance?.conformanceStatus ?? null,
      dataAuthority: processIntelligence.dataAuthority,
    },
    operatingProcess,
    nextUnifiedAction,
  };
}
