import { DATA_AUTHORITY } from "@/lib/process-intelligence/data-authority";
import { LOAD_PROCESS_SPINE, type LoadProcessReconstruction, type LoadProcessStage, type OperatingProcessEvent } from "@/lib/process-intelligence/types";
import type { OperatingProcessStore } from "@/lib/process-intelligence/store";

const STAGE_SUPPORT: Record<LoadProcessStage, (counts: {
  deliveries: number;
  proofs: number;
  settlements: number;
  invoices: number;
  payments: number;
}) => number> = {
  LOAD_INTAKE: () => 0,
  CANONICAL_LOAD: () => 0,
  DISPATCH: () => 0,
  DRIVER_EQUIPMENT: () => 0,
  DOCUMENTS: () => 0,
  PRE_TRIP_EVIDENCE: () => 0,
  READINESS: () => 0,
  RELEASE: () => 0,
  DELIVERY_PROOF: (counts) => counts.deliveries + counts.proofs,
  SETTLEMENT: (counts) => counts.settlements,
  INVOICE_CASH: (counts) => counts.invoices + counts.payments,
};

export async function reconstructLoadProcess(
  store: OperatingProcessStore,
  fleetId: string,
  loadId: string,
): Promise<LoadProcessReconstruction> {
  const load = await store.getLoad(fleetId, loadId);
  const events = await store.listEventsForLoad(fleetId, loadId);
  const exceptions = await store.listExceptionsForLoad(fleetId, loadId);
  const actions = await store.listActionsForLoad(fleetId, loadId);
  const deliveries = await store.listDeliveriesForLoad(fleetId, loadId);
  const proofs = await store.listProofsForLoad(fleetId, loadId);
  const settlements = await store.listSettlementsForLoad(fleetId, loadId);
  const invoices = await store.listInvoicesForLoad(fleetId, loadId);
  const payments = await store.listPaymentsForLoad(fleetId, loadId);
  const supportCounts = {
    deliveries: deliveries.length,
    proofs: proofs.length,
    settlements: settlements.length,
    invoices: invoices.length,
    payments: payments.length,
  };

  const stages = LOAD_PROCESS_SPINE.map((stage) => ({
    stage,
    events: events.filter((event) => event.processStage === stage),
  }));
  const stageSummaries = stages.map((stage) => {
    const supportingRecordCount = STAGE_SUPPORT[stage.stage](supportCounts);
    const present = stage.events.length > 0 || supportingRecordCount > 0;
    return {
      stage: stage.stage,
      status: present ? ("present" as const) : ("unavailable" as const),
      recordClass: stage.events.length
        ? ("AUTHORITATIVE_PERSISTED_EVENT" as const)
        : supportingRecordCount
          ? ("AUTHORITATIVE_SUPPORTING_RECORD" as const)
          : ("UNAVAILABLE" as const),
      eventTypes: stage.events.map((event) => event.eventType),
      supportingRecordCount,
    };
  });
  const missingStages = stageSummaries.filter((stage) => stage.status === "unavailable").map((stage) => stage.stage);
  const hasIdentity = Boolean(load);
  const hasOrderedHistory = events.length > 0 && events.every((event, index, list) => {
    if (index === 0) return true;
    return list[index - 1].eventTimestamp.getTime() <= event.eventTimestamp.getTime();
  });

  return {
    fleetId,
    loadId,
    lineage: load?.lineage ?? lineageFromEvents(events),
    dataAuthority: DATA_AUTHORITY.AUTHORITATIVE_PERSISTED_DATA,
    events,
    exceptions,
    actions,
    supportingRecords: { deliveries, proofs, settlements, invoices, payments },
    stages,
    stageSummaries,
    missingStages,
    reconstructable: hasIdentity && hasOrderedHistory,
  };
}

function lineageFromEvents(events: OperatingProcessEvent[]) {
  return events[0]?.lineage ?? null;
}
