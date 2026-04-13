/**
 * Adapter: legacy entry shape + cross-links, backed by document-engine.
 */
import type { BofData } from "./load-bof-data";
import {
  engineDocumentToLegacyEntry,
  generateExceptionDocument,
  generateSettlementDocument,
  listEngineDocumentsForDriver,
  listEngineDocumentsForLoad,
  listEngineDocumentsForIncident,
  listEngineDocumentsForAllLoads,
  listEngineDocumentsForSpotlightLoads,
  GENERATED_PUBLIC_PREFIX,
} from "./document-engine";

export type GeneratedDocIds = {
  driverId?: string;
  loadId?: string;
  assetId?: string;
  incidentId?: string;
  settlementId?: string;
  moneyAtRiskId?: string;
  rfEventId?: string;
  financialImpactUsd?: number;
};

export type GeneratedDocumentEntry = {
  category: string;
  fileName: string;
  fileUrl: string;
  previewUrl: string;
  related: GeneratedDocIds;
  statusLabel: string;
  blocksPayment: boolean;
  notes?: string;
};

export {
  GENERATED_PUBLIC_PREFIX,
  listEngineDocumentsForAllLoads,
  listEngineDocumentsForSpotlightLoads,
};

export function getGeneratedDocumentsForLoad(
  data: BofData,
  loadId: string
): GeneratedDocumentEntry[] {
  return listEngineDocumentsForLoad(data, loadId).map((d) => {
    const e = engineDocumentToLegacyEntry(d);
    return {
      ...e,
      related: {
        driverId: d.driverId,
        loadId: d.loadId,
        assetId: d.assetId,
        incidentId: d.incidentId,
        settlementId: d.settlementId,
        moneyAtRiskId: d.moneyAtRiskId,
        rfEventId: d.rfEventId,
        financialImpactUsd: d.financialImpactUsd,
      },
    };
  });
}

export function getGeneratedDocumentsForDriver(
  data: BofData,
  driverId: string
): GeneratedDocumentEntry[] {
  return listEngineDocumentsForDriver(data, driverId).map((d) => {
    const e = engineDocumentToLegacyEntry(d);
    return {
      ...e,
      related: { driverId: d.driverId },
    };
  });
}

export function getGeneratedDocumentsForIncident(
  data: BofData,
  incidentId: string
): GeneratedDocumentEntry[] {
  return listEngineDocumentsForIncident(data, incidentId).map((d) => {
    const e = engineDocumentToLegacyEntry(d);
    return {
      ...e,
      related: { driverId: d.driverId, incidentId: d.incidentId },
    };
  });
}

export function getGeneratedDocumentsForMoneyAtRisk(
  data: BofData,
  marId: string
): GeneratedDocumentEntry[] {
  const kinds = [
    "Settlement Hold Explanation",
    "Dispute Letter",
    "Evidence Summary",
  ] as const;
  const out: GeneratedDocumentEntry[] = [];
  for (const k of kinds) {
    const d = generateExceptionDocument(data, marId, k);
    if (!d) continue;
    const e = engineDocumentToLegacyEntry(d);
    out.push({
      ...e,
      related: {
        driverId: d.driverId,
        loadId: d.loadId,
        moneyAtRiskId: d.moneyAtRiskId,
      },
    });
  }
  return out;
}

export function getGeneratedDocumentsForSettlement(
  data: BofData,
  settlementId: string
): GeneratedDocumentEntry[] {
  const kinds = [
    "Settlement Summary",
    "Settlement Hold Explanation",
    "Insurance Notice",
  ] as const;
  const out: GeneratedDocumentEntry[] = [];
  for (const k of kinds) {
    const d = generateSettlementDocument(data, settlementId, k);
    if (!d) continue;
    const e = engineDocumentToLegacyEntry(d);
    out.push({
      ...e,
      related: { driverId: d.driverId, settlementId: d.settlementId },
    });
  }
  return out;
}

/** Cross-links for a load: related settlements, MAR rows, compliance. */
export function getGeneratedCrossLinksForLoad(data: BofData, loadId: string) {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load)
    return {
      settlements: [] as string[],
      mar: [] as string[],
      incidents: [] as string[],
    };

  const settlements =
    data.settlements
      ?.filter((s) => s.driverId === load.driverId)
      .map((s) => s.settlementId) ?? [];

  const mar =
    data.moneyAtRisk?.filter((m) => m.loadId === loadId).map((m) => m.id) ??
    [];

  const incidents = data.complianceIncidents
    .filter((c) => c.driverId === load.driverId && c.status === "OPEN")
    .map((c) => c.incidentId);

  return { settlements, mar, incidents };
}

export const UNAVAILABLE_IN_SOURCE = [
  "Live GPS breadcrumb trail",
  "Historical weather observations for lane",
  "Real-time traffic telemetry",
  "Per-load tire PSI inspection readings",
  "Dash camera online/offline telemetry",
  "maintenanceAssets[] (not present in current BOF JSON)",
] as const;
