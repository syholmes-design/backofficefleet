/**
 * BOF Document Automation Engine — central generator for UI + URLs.
 * All field values come from BofData (drivers, loads, documents, incidents, settlements, MAR, proof layer).
 * Served bytes are SVG via /api/bof-generated; public URLs use /generated/... (see next.config rewrites).
 */
import type { BofData } from "./load-bof-data";
import { GENERATED_PUBLIC_PREFIX } from "./generated-public-prefix";
import {
  DRIVER_GENERATED_FILES,
  LOAD_GENERATED_FILES,
  CLAIM_GENERATED_FILES,
  SETTLEMENT_GENERATED_FILES,
} from "./bof-generated-svgs";
import { getOrderedDocumentsForDriver } from "./driver-queries";
import {
  getDriverDocumentByType,
  resolveDriverBankInformationUrl,
} from "./driver-doc-registry";
import { getLoadProofItems, LOAD_PROOF_TYPES } from "./load-proof";
import { mergeRfidIntoLoadScopedDocument } from "./rf-document-influence";
import {
  buildRfidDockRowForLoad,
  buildRfidFuelRowForLoad,
  buildRfidMaintenanceRows,
} from "./rfid-intelligence";

export { GENERATED_PUBLIC_PREFIX };

export type EngineDocumentLinks = {
  driverProfile?: string;
  loadDetail?: string;
  pretrip?: string;
  documentVault?: string;
  settlements?: string;
  moneyAtRisk?: string;
  rfActions?: string;
  commandCenter?: string;
};

export type EngineDocument = {
  id: string;
  type: string;
  title: string;
  driverId?: string;
  loadId?: string;
  incidentId?: string;
  settlementId?: string;
  moneyAtRiskId?: string;
  assetId?: string;
  /** RFID intelligence / RF action queue event id (e.g. RFID-DOCK-L001). */
  rfEventId?: string;
  /** Demo exposure / opportunity from RFID fuel, dock, or maintenance lane. */
  financialImpactUsd?: number;
  status: string;
  fileUrl: string;
  previewUrl: string;
  blocksPayment: boolean;
  generatedAt: string;
  sourceDataSummary: string;
  notes?: string;
  links: EngineDocumentLinks;
};

function publicUrl(relativePath: string): string {
  const p = relativePath.replace(/^\/+/, "");
  return `${GENERATED_PUBLIC_PREFIX}/${p}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadRecord(data: BofData, loadId: string) {
  return data.loads.find((l) => l.id === loadId) ?? null;
}

/** Per-load proof bundle URLs from demo JSON (takes precedence over generated SVG paths). */
function bundleProofUrls(
  data: BofData,
  loadId: string,
  proofType: string
): { fileUrl: string; previewUrl: string } | null {
  if (!("loadProofBundles" in data) || !data.loadProofBundles) return null;
  const bundles = data.loadProofBundles as Record<
    string,
    { items?: Record<string, { fileUrl?: string; previewUrl?: string }> }
  >;
  const row = bundles[loadId]?.items?.[proofType];
  const f = row?.fileUrl?.trim();
  const p = row?.previewUrl?.trim();
  if (!f && !p) return null;
  return { fileUrl: f || p!, previewUrl: p || f! };
}

function driverRecord(data: BofData, driverId: string) {
  return data.drivers.find((d) => d.id === driverId) ?? null;
}

function linksForLoad(data: BofData, loadId: string): EngineDocumentLinks {
  const load = loadRecord(data, loadId);
  if (!load) return {};
  return {
    driverProfile: `/drivers/${load.driverId}`,
    loadDetail: `/loads/${loadId}`,
    pretrip: `/pretrip/${loadId}`,
    documentVault: "/documents",
    settlements: "/settlements",
    moneyAtRisk: "/money-at-risk",
    rfActions: "/rf-actions",
    commandCenter: "/command-center",
  };
}

function linksForDriver(driverId: string): EngineDocumentLinks {
  return {
    driverProfile: `/drivers/${driverId}`,
    documentVault: "/documents",
    settlements: "/settlements",
    moneyAtRisk: "/money-at-risk",
    rfActions: "/rf-actions",
    commandCenter: "/command-center",
  };
}

/** Proof type → generated load/*.svg filename (same as bof-generated-svgs). */
const PROOF_TYPE_TO_FILE: Partial<Record<string, string>> = {
  "Rate Confirmation": "rate-confirmation.svg",
  BOL: "bol.svg",
  "Signed BOL": "bol-signed.svg",
  POD: "pod.svg",
  "Pickup Seal Photo": "pickup-seal-verification.svg",
  "Delivery Seal Photo": "delivery-seal-verification.svg",
  "Pre-Trip Cargo Photo": "cargo-photo-record.svg",
  "Delivery / Empty-Trailer Photo": "empty-trailer-confirmation.svg",
  "Lumper Receipt": "lumper-receipt.svg",
  "Fuel Receipt": "fuel-receipt.svg",
  "RFID / Dock Validation Record": "gps-geolocation-summary.svg",
  "Cargo Damage Photos": "cargo-damage-photos.svg",
  "Claim Support Docs": "hos-status-summary.svg",
};

const LOAD_DOC_TYPE_TO_FILE: Record<string, string> = {
  "Rate Confirmation": "rate-confirmation.svg",
  BOL: "bol.svg",
  Invoice: "invoice.svg",
  "Dispatch Instructions": "dispatch-instructions.svg",
  "Pre-Trip Checklist": "pretrip-checklist.svg",
  "Cargo Photo Record": "cargo-photo-record.svg",
  "Pickup Seal Verification": "pickup-seal-verification.svg",
  "Delivery Seal Verification": "delivery-seal-verification.svg",
  POD: "pod.svg",
  "Empty Trailer Confirmation": "empty-trailer-confirmation.svg",
  "GPS Route Summary": "gps-geolocation-summary.svg",
  "Weather / Traffic Report": "weather-traffic-summary.svg",
  "HOS Status Report": "hos-status-summary.svg",
  "Camera Status Report": "camera-status-summary.svg",
  "Lumper Receipt": "lumper-receipt.svg",
  "Fuel Receipt": "fuel-receipt.svg",
  "Maintenance Report": "maintenance-readiness-report.svg",
  "Tire Inspection Report": "tire-check-report.svg",
  "RF POD Verification Report": "rf-pod-verification-report.svg",
  "RF Seal Exception Report": "rf-seal-exception-report.svg",
  "RF Fuel Efficiency Report": "rf-fuel-efficiency-report.svg",
  "RF Maintenance Alert Report": "rf-maintenance-alert-report.svg",
};

const DRIVER_TYPE_TO_FILE: Record<string, string> = {
  CDL: "cdl.svg",
  "Medical Card": "medical-card.svg",
  MVR: "mvr.svg",
  "I-9": "i9.svg",
  "FMCSA Compliance": "fmcsa-compliance-record.svg",
  FMCSA: "fmcsa-compliance-record.svg",
  "W-9": "w9.svg",
  "Bank Info": "bank-direct-deposit.svg",
  "Emergency Contact Sheet": "emergency-contact-sheet.svg",
  "Credential Register": "credential-register.svg",
};

/** One entry per generated file (avoid duplicate FMCSA / Compliance rows). */
const DRIVER_ENGINE_TYPES = [
  "Emergency Contact Sheet",
  "Credential Register",
  "CDL",
  "Medical Card",
  "MVR",
  "I-9",
  "FMCSA Compliance",
  "W-9",
  "Bank Info",
  "FMCSA DQF Compliance Summary",
] as const;

function proofItemForType(data: BofData, loadId: string, proofLabel: string) {
  return getLoadProofItems(data, loadId).find((p) => p.type === proofLabel);
}

function buildSourceSummaryLoad(data: BofData, loadId: string): string {
  const load = loadRecord(data, loadId);
  if (!load) return "load: not found";
  const d = driverRecord(data, load.driverId);
  return [
    `loads[].id=${load.id} number=${load.number}`,
    `driverId=${load.driverId} name=${d?.name ?? "—"}`,
    `origin=${load.origin} destination=${load.destination}`,
    `revenue=${load.revenue} backhaulPay=${load.backhaulPay}`,
    `status=${load.status} podStatus=${load.podStatus}`,
    `seals pickup=${load.pickupSeal || "—"} delivery=${load.deliverySeal || "—"} sealStatus=${load.sealStatus}`,
    `assetId=${load.assetId}`,
    `maintenanceAssets[]: not present in BOF JSON (maintenance context from moneyAtRisk + proof only)`,
  ].join("\n");
}

/** Compact RFID intelligence snapshot for document source blocks (rfid-intelligence.ts). */
function buildRfSnapshotAppendix(data: BofData, loadId: string): string {
  const dock = buildRfidDockRowForLoad(data, loadId);
  const fuel = buildRfidFuelRowForLoad(data, loadId);
  const maint = buildRfidMaintenanceRows(data).find((r) =>
    r.relatedLoadIds.includes(loadId)
  );
  const lines: string[] = [];
  if (dock) {
    lines.push(
      `rfDock id=${dock.id} trailerConfirmedAtDock=${dock.trailerConfirmedAtDock} lumperWorkflow=${dock.lumperWorkflowStatus} receiptStillRequired=${dock.receiptStillRequired}`
    );
  }
  if (fuel) {
    lines.push(
      `rfFuel id=${fuel.id} routeCheckpointMatch=${fuel.routeCheckpointMatch} unauthorizedFueling=${fuel.unauthorizedFuelingFlag} fuelAnomalyOpportunityUsd=${fuel.fuelAnomalyOpportunityUsd}`
    );
  }
  if (maint) {
    lines.push(
      `rfMaint id=${maint.id} assetId=${maint.assetId} exposureUsd=${maint.overdueExposureUsd} serviceZoneVerified=${maint.serviceZoneVerified}`
    );
  }
  return lines.length ? lines.join("\n") : "RF snapshots: (no dock/fuel/maint row for load)";
}

function buildSourceSummaryDriver(data: BofData, driverId: string): string {
  const d = driverRecord(data, driverId);
  if (!d) return "driver: not found";
  return [
    `drivers[].id=${driverId} name=${d.name}`,
    `address=${d.address}`,
    `documents[] rows for driver merged in credential forms`,
  ].join("\n");
}

/**
 * Generate one driver credential / form document (SVG).
 */
export function generateDriverDocument(
  data: BofData,
  driverId: string,
  type: string
): EngineDocument | null {
  const driver = driverRecord(data, driverId);
  if (!driver) return null;
  if (type === "Bank Info") {
    const bankHtml = resolveDriverBankInformationUrl(driverId);
    if (bankHtml) {
      const rows = getOrderedDocumentsForDriver(data, driverId);
      const row = rows.find((r) => r.type === "Bank Info");
      const blocks = row?.blocksPayment === true;
      return {
        id: `ENG-DRIVER-${driverId}-bankcardhtml`,
        type,
        title: `Bank Info · ${driver.name}`,
        driverId,
        status: row?.status ?? "VALID",
        fileUrl: bankHtml,
        previewUrl: bankHtml,
        blocksPayment: blocks,
        generatedAt: nowIso(),
        sourceDataSummary: buildSourceSummaryDriver(data, driverId),
        notes: "Canonical bank card HTML under /documents/drivers/{driverId}/.",
        links: linksForDriver(driverId),
      };
    }
  }
  if (type === "I-9") {
    const i9Url = getDriverDocumentByType(driverId, "I-9");
    const rows = getOrderedDocumentsForDriver(data, driverId);
    const row = rows.find((r) => r.type === "I-9");
    const blocks = row?.blocksPayment === true;
    if (i9Url) {
      return {
        id: `ENG-DRIVER-${driverId}-i9canonical`,
        type,
        title: `I-9 · ${driver.name}`,
        driverId,
        status: row?.status ?? "VALID",
        fileUrl: i9Url,
        previewUrl: i9Url,
        blocksPayment: blocks,
        generatedAt: nowIso(),
        sourceDataSummary: buildSourceSummaryDriver(data, driverId),
        notes: "Canonical Form I-9 PDF under /documents/drivers/{driverId}/ (driverId-keyed).",
        links: linksForDriver(driverId),
      };
    }
    return {
      id: `ENG-DRIVER-${driverId}-i9missing`,
      type,
      title: `I-9 · ${driver.name}`,
      driverId,
      status: row?.status ?? "MISSING",
      fileUrl: "",
      previewUrl: "",
      blocksPayment: blocks,
      generatedAt: nowIso(),
      sourceDataSummary: buildSourceSummaryDriver(data, driverId),
      notes:
        "Expected canonical PDF at /documents/drivers/{driverId}/i9-{driverIdLower}.pdf — copy I9-{driverId}_*.pdf from Downloads and run npm run sync:driver-hr-docs.",
      links: linksForDriver(driverId),
    };
  }
  if (type === "W-9") {
    const w9Url = getDriverDocumentByType(driverId, "W-9");
    if (w9Url) {
      const rows = getOrderedDocumentsForDriver(data, driverId);
      const row = rows.find((r) => r.type === "W-9");
      const blocks = row?.blocksPayment === true;
      return {
        id: `ENG-DRIVER-${driverId}-w9canonical`,
        type,
        title: `W-9 · ${driver.name}`,
        driverId,
        status: row?.status ?? "VALID",
        fileUrl: w9Url,
        previewUrl: w9Url,
        blocksPayment: blocks,
        generatedAt: nowIso(),
        sourceDataSummary: buildSourceSummaryDriver(data, driverId),
        notes: "Canonical W-9 PDF under /documents/drivers/{driverId}/ (driverId-keyed).",
        links: linksForDriver(driverId),
      };
    }
    return null;
  }
  if (type === "FMCSA DQF Compliance Summary") {
    const dqfUrl = getDriverDocumentByType(driverId, "FMCSA DQF Compliance Summary");
    if (dqfUrl) {
      return {
        id: `ENG-DRIVER-${driverId}-dqfcompliancesummary`,
        type,
        title: `FMCSA DQF Compliance Summary · ${driver.name}`,
        driverId,
        status: "Summary",
        fileUrl: dqfUrl,
        previewUrl: dqfUrl,
        blocksPayment: false,
        generatedAt: nowIso(),
        sourceDataSummary: buildSourceSummaryDriver(data, driverId),
        notes:
          "Administrative compliance summary PDF on file — not the FMCSA source compliance document and not used as the source of credential expiration dates.",
        links: linksForDriver(driverId),
      };
    }
    return {
      id: `ENG-DRIVER-${driverId}-dqfcompliancesummary-missing`,
      type,
      title: `FMCSA DQF Compliance Summary · ${driver.name}`,
      driverId,
      status: "MISSING",
      fileUrl: "",
      previewUrl: "",
      blocksPayment: false,
      generatedAt: nowIso(),
      sourceDataSummary: buildSourceSummaryDriver(data, driverId),
      notes:
        "Expected canonical PDF at /documents/drivers/{driverId}/dqf-compliance-summary-{driverIdLower}.pdf — copy DQF_{driverId}_*.pdf from Downloads and run npm run sync:driver-hr-docs.",
      links: linksForDriver(driverId),
    };
  }
  const file = DRIVER_TYPE_TO_FILE[type];
  if (!file || !(DRIVER_GENERATED_FILES as readonly string[]).includes(file)) {
    return null;
  }
  const rel = `drivers/${driverId}/${file}`;
  const url = publicUrl(rel);
  const rows = getOrderedDocumentsForDriver(data, driverId);
  const row =
    type === "Emergency Contact Sheet" || type === "Credential Register"
      ? null
      : rows.find((r) => r.type === type || (type === "FMCSA Compliance" && r.type === "FMCSA"));
  const status =
    row?.status ??
    (type === "Emergency Contact Sheet"
      ? "Complete"
      : type === "Credential Register"
        ? "Summary"
        : "Pending");
  const blocks = row?.blocksPayment === true;

  return {
    id: `ENG-DRIVER-${driverId}-${file.replace(/\W/g, "")}`,
    type,
    title: `${type} · ${driver.name}`,
    driverId,
    status,
    fileUrl: url,
    previewUrl: url,
    blocksPayment: blocks,
    generatedAt: nowIso(),
    sourceDataSummary: buildSourceSummaryDriver(data, driverId),
    notes:
      type === "Emergency Contact Sheet"
        ? "From drivers[] contact fields only."
        : `documents[] status for ${type}.`,
    links: linksForDriver(driverId),
  };
}

/**
 * Generate one load / dispatch document (SVG).
 * POD, seals, lumper, fuel, and maintenance docs are merged with RFID intelligence when available.
 */
export function generateLoadDocument(
  data: BofData,
  loadId: string,
  type: string
): EngineDocument | null {
  const load = loadRecord(data, loadId);
  if (!load) return null;
  const file = LOAD_DOC_TYPE_TO_FILE[type];
  if (
    !file ||
    !(LOAD_GENERATED_FILES as readonly string[]).includes(file)
  ) {
    return null;
  }
  const rel = `loads/${loadId}/${file}`;
  const url = publicUrl(rel);

  // --- RF-specific aggregate reports (rfid-intelligence.ts + load proof; own SVGs) ---
  if (type === "RF POD Verification Report") {
    const podP = proofItemForType(data, loadId, "POD");
    const m = mergeRfidIntoLoadScopedDocument(data, loadId, "POD", podP, {
      status: podP?.status ?? "Pending",
      blocksPayment: podP?.blocksPayment ?? false,
      notes: podP?.notes,
    });
    const dock = buildRfidDockRowForLoad(data, loadId);
    return {
      id: `ENG-RF-POD-${loadId}`,
      type,
      title: `${type} · Load ${load.number}`,
      driverId: load.driverId,
      loadId,
      assetId: load.assetId,
      rfEventId: m.rfEventId ?? dock?.id,
      financialImpactUsd:
        m.status.includes("Verified") ? undefined : Math.round(load.revenue * 0.04),
      status: m.status,
      fileUrl: url,
      previewUrl: url,
      blocksPayment: m.blocksPayment,
      generatedAt: nowIso(),
      sourceDataSummary: [
        buildSourceSummaryLoad(data, loadId),
        buildRfSnapshotAppendix(data, loadId),
        "buildRfActions / RF queue: load-proof.ts (proof gaps → RF-* ids)",
      ].join("\n"),
      notes: dock?.nextAction,
      links: linksForLoad(data, loadId),
    };
  }

  if (type === "RF Seal Exception Report") {
    const dock = buildRfidDockRowForLoad(data, loadId);
    const isExc = load.sealStatus === "Mismatch";
    return {
      id: `ENG-RF-SEAL-${loadId}`,
      type,
      title: `${type} · Load ${load.number}`,
      driverId: load.driverId,
      loadId,
      assetId: load.assetId,
      rfEventId: dock?.id ?? `RFID-DOCK-${loadId}`,
      financialImpactUsd: isExc ? Math.round(load.revenue * 0.025) : undefined,
      status: isExc
        ? "Open — seal mismatch (RF dock proxy)"
        : "Clear — no seal mismatch in loads[].sealStatus",
      fileUrl: url,
      previewUrl: url,
      blocksPayment: isExc,
      generatedAt: nowIso(),
      sourceDataSummary: [
        buildSourceSummaryLoad(data, loadId),
        buildRfSnapshotAppendix(data, loadId),
      ].join("\n"),
      notes: dock?.unloadCheckpointNarrative,
      links: linksForLoad(data, loadId),
    };
  }

  if (type === "RF Fuel Efficiency Report") {
    const fuel = buildRfidFuelRowForLoad(data, loadId);
    if (!fuel) return null;
    return {
      id: `ENG-RF-FUEL-${loadId}`,
      type,
      title: `${type} · Load ${load.number}`,
      driverId: load.driverId,
      loadId,
      assetId: load.assetId,
      rfEventId: fuel.id,
      financialImpactUsd: fuel.fuelAnomalyOpportunityUsd,
      status: fuel.unauthorizedFuelingFlag
        ? "Alert — unverified fueling pattern (RF lane)"
        : fuel.routeCheckpointMatch
          ? "Nominal — RFID fuel checkpoint aligned"
          : "Review — route checkpoint mismatch",
      fileUrl: url,
      previewUrl: url,
      blocksPayment: fuel.unauthorizedFuelingFlag,
      generatedAt: nowIso(),
      sourceDataSummary: [
        buildSourceSummaryLoad(data, loadId),
        `rfFuel id=${fuel.id} narrative=${fuel.verifiedFuelingNarrative}`,
        `nextAction=${fuel.nextAction}`,
      ].join("\n"),
      notes: fuel.nextAction,
      links: linksForLoad(data, loadId),
    };
  }

  if (type === "RF Maintenance Alert Report") {
    const maint = buildRfidMaintenanceRows(data).find((r) =>
      r.relatedLoadIds.includes(loadId)
    );
    if (!maint) {
      return {
        id: `ENG-RF-MAINT-${loadId}`,
        type,
        title: `${type} · Load ${load.number}`,
        driverId: load.driverId,
        loadId,
        assetId: load.assetId,
        status: "Fallback — no RFID maintenance row for this asset (load-based only)",
        fileUrl: url,
        previewUrl: url,
        blocksPayment: false,
        generatedAt: nowIso(),
        sourceDataSummary: buildSourceSummaryLoad(data, loadId),
        notes: "See Maintenance Report + moneyAtRisk for asset.",
        links: linksForLoad(data, loadId),
      };
    }
    const alert =
      !maint.serviceZoneVerified || !maint.componentEventLogged || !maint.inspectionCheckpointVerified;
    return {
      id: `ENG-RF-MAINT-${loadId}`,
      type,
      title: `${type} · Load ${load.number}`,
      driverId: load.driverId,
      loadId,
      assetId: load.assetId,
      rfEventId: maint.id,
      financialImpactUsd: maint.overdueExposureUsd,
      status: alert
        ? "Alert — RFID maintenance verification gap"
        : "Nominal — RFID maintenance checkpoints satisfied",
      fileUrl: url,
      previewUrl: url,
      blocksPayment: alert && maint.overdueExposureUsd > 600,
      generatedAt: nowIso(),
      sourceDataSummary: [
        buildSourceSummaryLoad(data, loadId),
        `rfMaint id=${maint.id} readinessImpact=${maint.readinessImpact}`,
        `nextAction=${maint.nextAction}`,
      ].join("\n"),
      notes: maint.nextAction,
      links: linksForLoad(data, loadId),
    };
  }

  const proof = proofItemForType(data, loadId, type);
  let status = proof?.status ?? "Generated";
  if (!proof) {
    if (type === "Dispatch Instructions") {
      status = load.dispatchOpsNotes?.trim()
        ? "Instructions on file"
        : load.status === "Pending"
          ? "Pending"
          : "Review";
    } else if (
      type === "Weather / Traffic Report" ||
      type === "Camera Status Report" ||
      type === "Tire Inspection Report"
    ) {
      status = "Pending — detail not in source";
    } else if (type === "Maintenance Report") {
      status = "See MAR / asset rows";
    }
  }
  let blocks = proof?.blocksPayment ?? false;
  let notes = proof?.notes ?? proof?.riskNote;

  const merged = mergeRfidIntoLoadScopedDocument(data, loadId, type, proof, {
    status: typeof status === "string" ? status : String(status),
    blocksPayment: blocks,
    notes,
  });
  status = merged.status;
  blocks = merged.blocksPayment;
  notes = merged.notes;
  const rfEventId = merged.rfEventId;
  const financialImpactUsd = merged.financialImpactUsd;

  const appendRfAppendix =
    Boolean(rfEventId) ||
    type === "POD" ||
    type.includes("Seal") ||
    type === "Lumper Receipt" ||
    type === "Fuel Receipt" ||
    type === "Maintenance Report";
  const sourceDataSummary = [
    buildSourceSummaryLoad(data, loadId),
    appendRfAppendix ? buildRfSnapshotAppendix(data, loadId) : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id: `ENG-LOAD-${loadId}-${file.replace(/\W/g, "")}`,
    type,
    title: `${type} · Load ${load.number}`,
    driverId: load.driverId,
    loadId,
    assetId: load.assetId,
    rfEventId,
    financialImpactUsd,
    status: typeof status === "string" ? status : String(status),
    fileUrl: url,
    previewUrl: url,
    blocksPayment: blocks,
    generatedAt: nowIso(),
    sourceDataSummary,
    notes,
    links: linksForLoad(data, loadId),
  };
}

/**
 * Generate proof-layer-aligned document (same backing file as load dispatch when types align).
 */
export function generateProofDocument(
  data: BofData,
  loadId: string,
  type: string
): EngineDocument | null {
  const file = PROOF_TYPE_TO_FILE[type];
  if (!file) {
    return generateLoadDocument(data, loadId, type);
  }
  const load = loadRecord(data, loadId);
  if (!load) return null;
  const rel = `loads/${loadId}/${file}`;
  const url = publicUrl(rel);
  const proof = proofItemForType(data, loadId, type);
  if (!proof) return null;

  const merged = mergeRfidIntoLoadScopedDocument(data, loadId, type, proof, {
    status: proof.status,
    blocksPayment: proof.blocksPayment,
    notes: proof.notes ?? proof.riskNote,
  });
  const proofRfAppendix =
    Boolean(merged.rfEventId) ||
    type === "POD" ||
    type.includes("Seal") ||
    type === "Lumper Receipt" ||
    type === "Fuel Receipt";

  return {
    id: `ENG-PROOF-${loadId}-${file.replace(/\W/g, "")}`,
    type,
    title: `${type} · Load ${load.number}`,
    driverId: load.driverId,
    loadId,
    assetId: load.assetId,
    rfEventId: merged.rfEventId,
    financialImpactUsd: merged.financialImpactUsd,
    status: merged.status,
    fileUrl: url,
    previewUrl: url,
    blocksPayment: merged.blocksPayment,
    generatedAt: nowIso(),
    sourceDataSummary: [
      buildSourceSummaryLoad(data, loadId),
      proofRfAppendix ? buildRfSnapshotAppendix(data, loadId) : "",
    ]
      .filter(Boolean)
      .join("\n"),
    notes: merged.notes,
    links: linksForLoad(data, loadId),
  };
}

/**
 * Primary automated claim/compliance packet cover for an incident.
 */
export function generateClaimDocument(
  data: BofData,
  incidentId: string
): EngineDocument | null {
  const inc = data.complianceIncidents.find((c) => c.incidentId === incidentId);
  if (!inc) return null;
  const file = "claim-packet-cover.svg";
  const rel = `claims/${incidentId}/${file}`;
  const url = publicUrl(rel);
  const driver = driverRecord(data, inc.driverId);

  return {
    id: `ENG-CLAIM-${incidentId}`,
    type: "Claim Packet",
    title: `Claim packet · ${incidentId}`,
    driverId: inc.driverId,
    incidentId,
    status: inc.status,
    fileUrl: url,
    previewUrl: url,
    blocksPayment: inc.severity === "CRITICAL",
    generatedAt: nowIso(),
    sourceDataSummary: [
      `complianceIncidents incidentId=${inc.incidentId}`,
      `type=${inc.type} severity=${inc.severity} status=${inc.status}`,
      `driverId=${inc.driverId} name=${driver?.name ?? "—"}`,
    ].join("\n"),
    notes: inc.type,
    links: {
      ...linksForDriver(inc.driverId),
      loadDetail: undefined,
    },
  };
}

export type SettlementDocKind =
  | "Settlement Summary"
  | "Settlement Hold Explanation"
  | "Insurance Notice";

const SETTLEMENT_KIND_TO_FILE: Record<SettlementDocKind, string> = {
  "Settlement Summary": "settlement-summary.svg",
  "Settlement Hold Explanation": "settlement-hold-explanation.svg",
  "Insurance Notice": "insurance-notice.svg",
};

/**
 * Generate one settlement-related document.
 */
export function generateSettlementDocument(
  data: BofData,
  settlementId: string,
  kind: SettlementDocKind = "Settlement Summary"
): EngineDocument | null {
  const st = data.settlements?.find((s) => s.settlementId === settlementId);
  if (!st) return null;
  const file = SETTLEMENT_KIND_TO_FILE[kind];
  if (!file || !(SETTLEMENT_GENERATED_FILES as readonly string[]).includes(file)) {
    return null;
  }
  const rel = `settlements/${settlementId}/${file}`;
  const url = publicUrl(rel);
  const driver = driverRecord(data, st.driverId);
  const pend = (st.pendingReason ?? "").trim();

  return {
    id: `ENG-STL-${settlementId}-${file}`,
    type: kind,
    title: `${kind} · ${settlementId}`,
    driverId: st.driverId,
    settlementId,
    status: st.status,
    fileUrl: url,
    previewUrl: url,
    blocksPayment:
      Boolean(pend) &&
      /hold|block|pending|awaiting/i.test(`${st.status} ${pend}`),
    generatedAt: nowIso(),
    sourceDataSummary: [
      `settlements settlementId=${settlementId}`,
      `driverId=${st.driverId} name=${driver?.name ?? "—"}`,
      `grossPay=${st.grossPay} netPay=${st.netPay} deductions=${st.deductions}`,
      pend ? `pendingReason=${pend}` : "pendingReason=(empty)",
    ].join("\n"),
    notes: pend || undefined,
    links: {
      ...linksForDriver(st.driverId),
      settlements: "/settlements",
    },
  };
}

/** MAR / financial exception row (moneyAtRisk[]). */
export function generateExceptionDocument(
  data: BofData,
  marId: string,
  kind: "Settlement Hold Explanation" | "Dispute Letter" | "Evidence Summary" = "Settlement Hold Explanation"
): EngineDocument | null {
  const mar = data.moneyAtRisk?.find((m) => m.id === marId);
  if (!mar) return null;
  const file =
    kind === "Settlement Hold Explanation"
      ? "settlement-hold-explanation.svg"
      : kind === "Dispute Letter"
        ? "dispute-letter.svg"
        : "evidence-summary.svg";
  const rel = `exceptions/${marId}/${file}`;
  const url = publicUrl(rel);

  return {
    id: `ENG-MAR-${marId}-${file}`,
    type: kind,
    title: `${kind} · ${marId}`,
    driverId: mar.driverId,
    loadId: mar.loadId ?? undefined,
    moneyAtRiskId: mar.id,
    assetId: mar.assetId ?? undefined,
    status: mar.status,
    fileUrl: url,
    previewUrl: url,
    blocksPayment: /blocked/i.test(mar.status),
    generatedAt: nowIso(),
    sourceDataSummary: [
      `moneyAtRisk id=${mar.id}`,
      `category=${mar.category} amount=${mar.amount}`,
      `driverId=${mar.driverId} loadId=${mar.loadId ?? "—"} assetId=${mar.assetId ?? "—"}`,
      `rootCause=${mar.rootCause}`,
    ].join("\n"),
    notes: mar.nextBestAction,
    links: {
      driverProfile: `/drivers/${mar.driverId}`,
      loadDetail: mar.loadId ? `/loads/${mar.loadId}` : undefined,
      moneyAtRisk: "/money-at-risk",
      settlements: "/settlements",
      rfActions: "/rf-actions",
      commandCenter: "/command-center",
      pretrip: mar.loadId ? `/pretrip/${mar.loadId}` : undefined,
      documentVault: "/documents",
    },
  };
}

/** All load-scoped engine docs (dispatch + operational). */
export function listEngineDocumentsForLoad(data: BofData, loadId: string): EngineDocument[] {
  const keys = Object.keys(LOAD_DOC_TYPE_TO_FILE);
  const out: EngineDocument[] = [];
  for (const k of keys) {
    const doc = generateLoadDocument(data, loadId, k);
    if (doc) out.push(doc);
  }
  return out;
}

/** All driver-scoped engine docs. */
export function listEngineDocumentsForDriver(data: BofData, driverId: string): EngineDocument[] {
  const out: EngineDocument[] = [];
  for (const t of DRIVER_ENGINE_TYPES) {
    const doc = generateDriverDocument(data, driverId, t);
    if (doc) out.push(doc);
  }
  return out;
}

/** All compliance claim artifacts for one incident. */
export function listEngineDocumentsForIncident(
  data: BofData,
  incidentId: string
): EngineDocument[] {
  const inc = data.complianceIncidents.find((c) => c.incidentId === incidentId);
  if (!inc) return [];
  const driver = driverRecord(data, inc.driverId);
  const baseLinks = { ...linksForDriver(inc.driverId) };
  return CLAIM_GENERATED_FILES.map((file) => {
    const rel = `claims/${incidentId}/${file}`;
    const url = publicUrl(rel);
    const label = file.replace(/-/g, " ").replace(".svg", "");
    return {
      id: `ENG-CLAIM-${incidentId}-${file}`,
      type: label,
      title: `${label} · ${incidentId}`,
      driverId: inc.driverId,
      incidentId,
      status: inc.status,
      fileUrl: url,
      previewUrl: url,
      blocksPayment: inc.severity === "CRITICAL" && /evidence|claim|dispute/i.test(file),
      generatedAt: nowIso(),
      sourceDataSummary: [
        `complianceIncidents incidentId=${incidentId}`,
        `driverName=${driver?.name ?? inc.driverId}`,
      ].join("\n"),
      notes: inc.type,
      links: baseLinks,
    } satisfies EngineDocument;
  });
}

/** Every load in `data.loads` — dispatch + proof-linked generated docs. */
export function listEngineDocumentsForAllLoads(data: BofData): EngineDocument[] {
  const out: EngineDocument[] = [];
  for (const load of data.loads) {
    out.push(...listEngineDocumentsForLoad(data, load.id));
  }
  return out;
}

/** @deprecated Use `listEngineDocumentsForAllLoads` (same behavior). */
export function listEngineDocumentsForSpotlightLoads(
  data: BofData
): EngineDocument[] {
  return listEngineDocumentsForAllLoads(data);
}

/** Links from proof type → generated doc for LoadProofPanel. */
export function listAutomationProofLinksForLoad(
  data: BofData,
  loadId: string
): { proofType: string; label: string; fileUrl: string; previewUrl: string }[] {
  const load = loadRecord(data, loadId);
  if (!load) return [];
  const out: { proofType: string; label: string; fileUrl: string; previewUrl: string }[] = [];
  for (const pt of LOAD_PROOF_TYPES) {
    const fromBundle = bundleProofUrls(data, loadId, pt);
    if (fromBundle) {
      out.push({
        proofType: pt,
        label: `Auto: ${pt}`,
        fileUrl: fromBundle.fileUrl,
        previewUrl: fromBundle.previewUrl,
      });
      continue;
    }
    const doc = generateProofDocument(data, loadId, pt);
    if (doc) {
      out.push({
        proofType: pt,
        label: `Auto: ${pt}`,
        fileUrl: doc.fileUrl,
        previewUrl: doc.previewUrl,
      });
    }
  }
  return out;
}

/** Re-export for legacy `generated-documents` adapter. */
export function engineDocumentToLegacyEntry(doc: EngineDocument): {
  category: string;
  fileName: string;
  fileUrl: string;
  previewUrl: string;
  related: {
    driverId?: string;
    loadId?: string;
    assetId?: string;
    incidentId?: string;
    settlementId?: string;
    moneyAtRiskId?: string;
    rfEventId?: string;
    financialImpactUsd?: number;
  };
  statusLabel: string;
  blocksPayment: boolean;
  notes?: string;
} {
  const parts = doc.fileUrl.split("/").filter(Boolean);
  const fileName = parts[parts.length - 1] ?? "document.svg";
  return {
    category: doc.type,
    fileName,
    fileUrl: doc.fileUrl,
    previewUrl: doc.previewUrl,
    related: {
      driverId: doc.driverId,
      loadId: doc.loadId,
      assetId: doc.assetId,
      incidentId: doc.incidentId,
      settlementId: doc.settlementId,
      moneyAtRiskId: doc.moneyAtRiskId,
      rfEventId: doc.rfEventId,
      financialImpactUsd: doc.financialImpactUsd,
    },
    statusLabel: doc.status,
    blocksPayment: doc.blocksPayment,
    notes: doc.notes,
  };
}
