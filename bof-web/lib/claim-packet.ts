import type { BofData } from "./load-bof-data";
import { reconcileCredentialIncident } from "./compliance/credential-incident-reconciliation";
import { formatUsd } from "./format-money";
import {
  getLoadProofItems,
  type LoadProofItem,
} from "./load-proof";

function loadRecord(data: BofData, loadId: string) {
  return data.loads.find((l) => l.id === loadId) ?? null;
}

function bundleClaimApplicable(data: BofData, loadId: string): boolean | null {
  if (!("loadProofBundles" in data) || !data.loadProofBundles) return null;
  const bundles = data.loadProofBundles as Record<
    string,
    { claimApplicable?: boolean }
  >;
  const b = bundles[loadId];
  if (!b || b.claimApplicable == null) return null;
  return b.claimApplicable;
}

/** Claim workspace when disputes, seal/cargo issues, exceptions, MAR claims, or lumper/POD contention apply. */
export function isClaimPacketEligible(data: BofData, loadId: string): boolean {
  const load = loadRecord(data, loadId);
  if (!load) return false;

  const bundleFlag = bundleClaimApplicable(data, loadId);
  if (bundleFlag === false) return false;
  if (bundleFlag === true) return true;

  if (load.sealStatus === "Mismatch") return true;
  if (load.dispatchExceptionFlag) return true;

  if ("moneyAtRisk" in data && Array.isArray(data.moneyAtRisk)) {
    const marHit = data.moneyAtRisk.some(
      (m) =>
        m.loadId === loadId &&
        /claim|damage|dispute|freight claim/i.test(
          `${m.category} ${m.rootCause}`
        )
    );
    if (marHit) return true;
  }

  const proofs = getLoadProofItems(data, loadId);
  if (proofs.some((p) => p.type === "POD" && p.status === "Disputed"))
    return true;
  if (
    proofs.some(
      (p) =>
        p.type === "Lumper Receipt" &&
        (p.blocksPayment || p.disputeExposure) &&
        p.status !== "Not required"
    )
  )
    return true;

  return false;
}

export type ClaimPacketContext = {
  loadId: string;
  loadNumber: string;
  driverId: string;
  driverName: string;
  assetId: string;
  origin: string;
  destination: string;
  issueTypes: string[];
  incidentIds: string[];
  podStatus: string;
  sealStatus: string;
  lumperProofLine: string;
  rfidDockLine: string;
  amountAtRiskUsd: number;
  recoverableEstimateUsd: number;
  evidenceList: string[];
  settlementHoldNote: string;
  dispatchNotes?: string;
};

function proofEvidenceLines(items: LoadProofItem[]): string[] {
  const lines: string[] = [];
  for (const p of items) {
    if (p.status === "Not required") continue;
    const asset = p.fileUrl || p.previewUrl ? ` (file on record)` : ` (no asset yet)`;
    lines.push(`${p.type}: ${proofLineStatus(p)}${asset}`);
  }
  return lines;
}

function proofLineStatus(p: LoadProofItem): string {
  return `${p.status}${p.blocksPayment ? " · blocks pay" : ""}${p.disputeExposure ? " · risk" : ""}`;
}

export function buildClaimPacketContext(
  data: BofData,
  loadId: string
): ClaimPacketContext | null {
  if (!isClaimPacketEligible(data, loadId)) return null;
  const load = loadRecord(data, loadId)!;
  const driver = data.drivers.find((d) => d.id === load.driverId);
  const proofs = getLoadProofItems(data, loadId);
  const incidents = data.complianceIncidents.filter((c) => {
    if (c.driverId !== load.driverId) return false;
    const st = String(c.status ?? "").toUpperCase();
    if (st === "CLOSED" || st === "RESOLVED") return false;
    return reconcileCredentialIncident(data, c).display;
  });

  const issueTypes: string[] = [];
  if (load.sealStatus === "Mismatch") issueTypes.push("Seal mismatch");
  if (load.dispatchExceptionFlag) issueTypes.push("Dispatch exception");
  if (load.status === "Delivered" && load.podStatus !== "verified")
    issueTypes.push("POD not verified");
  const lump = proofs.find((p) => p.type === "Lumper Receipt");
  if (lump && lump.status !== "Not required" && lump.status !== "Complete")
    issueTypes.push("Lumper / unload documentation");
  if (
    "moneyAtRisk" in data &&
    data.moneyAtRisk.some(
      (m) =>
        m.loadId === loadId &&
        /claim|damage/i.test(`${m.category} ${m.rootCause}`)
    )
  )
    issueTypes.push("Customer / carrier claim exposure");

  let marAmount = 0;
  if ("moneyAtRisk" in data && Array.isArray(data.moneyAtRisk)) {
    for (const m of data.moneyAtRisk) {
      if (m.loadId === loadId) marAmount += m.amount;
    }
  }

  const settlement =
    "settlements" in data && Array.isArray(data.settlements)
      ? data.settlements.find((s) => s.driverId === load.driverId)
      : undefined;
  const settlementHoldNote =
    settlement && /hold|claim|lumper/i.test(settlement.pendingReason ?? "")
      ? `Settlement: ${settlement.status} — ${settlement.pendingReason}`
      : settlement
        ? `Settlement status: ${settlement.status}`
        : "No settlement row";

  const rfid = proofs.find((p) => p.type === "RFID / Dock Validation Record");

  return {
    loadId: load.id,
    loadNumber: load.number,
    driverId: load.driverId,
    driverName: driver?.name ?? load.driverId,
    assetId: load.assetId,
    origin: load.origin,
    destination: load.destination,
    issueTypes: [...new Set(issueTypes)],
    incidentIds: incidents.map((i) => i.incidentId),
    podStatus: load.podStatus,
    sealStatus: load.sealStatus,
    lumperProofLine: lump
      ? `${lump.status} · blocks payment: ${lump.blocksPayment ? "yes" : "no"}`
      : "—",
    rfidDockLine: rfid
      ? `${rfid.status} — ${rfid.riskNote ?? ""}`
      : "—",
    amountAtRiskUsd: Math.max(load.revenue, marAmount),
    recoverableEstimateUsd: Math.round(
      load.revenue * 0.55 + (marAmount > 0 ? marAmount * 0.2 : 0)
    ),
    evidenceList: proofEvidenceLines(proofs),
    settlementHoldNote,
    dispatchNotes: load.dispatchOpsNotes,
  };
}

export type ClaimDraftKind =
  | "packet"
  | "insurance"
  | "dispute_letter"
  | "evidence";

export function buildClaimDraft(
  kind: ClaimDraftKind,
  ctx: ClaimPacketContext
): string {
  const header = `[BOF CLAIM WORKSPACE — ${kind.toUpperCase()} — DEMO DRAFT ONLY]`;
  const incidents =
    ctx.incidentIds.length > 0
      ? ctx.incidentIds.join(", ")
      : "None linked in compliance queue";

  const baseFacts = [
    `Load: ${ctx.loadNumber} (${ctx.loadId})`,
    `Driver: ${ctx.driverName} (${ctx.driverId})`,
    `Asset: ${ctx.assetId}`,
    `Lane: ${ctx.origin} → ${ctx.destination}`,
    `Issue types: ${ctx.issueTypes.join("; ") || "General claim prep"}`,
    `Compliance incident IDs (if any): ${incidents}`,
    `POD status: ${ctx.podStatus} · Seal status: ${ctx.sealStatus}`,
    `Lumper proof: ${ctx.lumperProofLine}`,
    `RFID / dock validation: ${ctx.rfidDockLine}`,
    `${ctx.settlementHoldNote}`,
    `Linehaul revenue (reference): ${formatUsd(ctx.amountAtRiskUsd)}`,
    `Recoverable estimate (derived demo): ${formatUsd(ctx.recoverableEstimateUsd)}`,
  ];

  if (ctx.dispatchNotes) baseFacts.push(`Dispatch notes: ${ctx.dispatchNotes}`);

  const evidenceBlock = [
    "Supporting evidence index:",
    ...ctx.evidenceList.map((l) => `• ${l}`),
  ];

  switch (kind) {
    case "packet":
      return [
        header,
        "",
        "INTERNAL CLAIM PACKET (assemble attachments from proof stack)",
        "",
        ...baseFacts,
        "",
        ...evidenceBlock,
        "",
        "Next step requested: Assign claims owner, confirm counterparty, and file within carrier policy window.",
      ].join("\n");

    case "insurance":
      return [
        header,
        "",
        "NOTICE TO INSURANCE / CARGO COVERAGE (draft — not sent)",
        "",
        ...baseFacts,
        "",
        ...evidenceBlock,
        "",
        "Narrative: We are documenting a freight movement with conflicting seal and/or POD evidence. BOF is assembling proof-of-custody, dock validation (RFID where available), and lumper documentation.",
        "",
        "Next step: Transmit via secure carrier portal when counsel approves.",
      ].join("\n");

    case "dispute_letter":
      return [
        header,
        "",
        "DISPUTE / CHARGEBACK RESPONSE LETTER (draft)",
        "",
        ...baseFacts,
        "",
        ...evidenceBlock,
        "",
        "Position: BOF contests liability pending full proof review. RFID checkpoints support attribution but do not replace executed BOL/POD where contract requires them.",
        "",
        "Next step: Send certified + email per contract notice clause.",
      ].join("\n");

    case "evidence":
      return [
        header,
        "",
        "EVIDENCE SUMMARY FOR LEGAL / FINANCE",
        "",
        ...baseFacts,
        "",
        ...evidenceBlock,
        "",
        "Chain of custody summary: Driver/asset matched on load record; seal and POD states as above; RFID dock record supports checkpoint timing where lane is equipped.",
        "",
        "Next step: Archive PDFs from load proof + attach MAR register excerpts.",
      ].join("\n");
  }
}

export type ClaimQueueRow = {
  loadId: string;
  loadNumber: string;
  driverName: string;
  driverId: string;
  issues: string;
  amountAtRiskUsd: number;
  nextStep: string;
};

export function buildClaimQueueRows(data: BofData, limit = 12): ClaimQueueRow[] {
  const rows: ClaimQueueRow[] = [];
  for (const load of data.loads) {
    if (!isClaimPacketEligible(data, load.id)) continue;
    const ctx = buildClaimPacketContext(data, load.id);
    if (!ctx) continue;
    const driver = data.drivers.find((d) => d.id === load.driverId);
    rows.push({
      loadId: load.id,
      loadNumber: load.number,
      driverName: driver?.name ?? load.driverId,
      driverId: load.driverId,
      issues: ctx.issueTypes.slice(0, 3).join(" · ") || "Claim prep",
      amountAtRiskUsd: ctx.amountAtRiskUsd,
      nextStep: "Claim packet · load workspace",
    });
  }
  return rows.slice(0, limit);
}
