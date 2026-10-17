import type {
  Invoice,
  Load,
  LoadProofOfDelivery,
  OperatingException,
  Settlement,
} from "@prisma/client";

type LoadFinanceSource = Pick<Load, "id" | "status" | "referenceNumber"> & {
  proofsOfDelivery: Array<Pick<LoadProofOfDelivery, "id" | "status" | "verifiedAt" | "lifecycleClass">>;
  invoices: Array<Pick<Invoice, "id" | "status">>;
  settlements: Array<Pick<Settlement, "id" | "status" | "holdReason" | "netAmount" | "lifecycleClass">>;
  operatingExceptions: Array<Pick<OperatingException, "id" | "exceptionType" | "status" | "deviation">>;
};

export type LoadFinanceHandoff = {
  dataAuthority: "LIVE";
  loadId: string;
  referenceNumber: string | null;
  loadStatus: string;
  deliveryEvidence: {
    podCount: number;
    verifiedPods: number;
    summary: string;
  };
  invoicing: {
    invoiceCount: number;
    openInvoices: number;
    summary: string;
  };
  settlement: {
    settlementCount: number;
    heldCount: number;
    holdReasons: string[];
    summary: string;
  };
  exceptions: {
    openCount: number;
    summary: string;
  };
  nextRequiredAction: string;
  brokenHandoffs: string[];
  settlementEligibility: {
    state: "SETTLEMENT_READY" | "BLOCKED" | "NOT_APPLICABLE" | "INSUFFICIENT_EVIDENCE";
    reasons: string[];
    summary: string;
  };
};

export function buildLoadFinanceHandoff(load: LoadFinanceSource): LoadFinanceHandoff {
  const livePods = load.proofsOfDelivery.filter((row) => row.lifecycleClass === "LIVE");
  const verifiedPods = livePods.filter((row) => row.status === "VERIFIED" || Boolean(row.verifiedAt));
  const liveSettlements = load.settlements.filter((row) => row.lifecycleClass === "LIVE");
  const held = liveSettlements.filter((row) => row.status === "HELD");
  const openExceptions = load.operatingExceptions.filter((row) => row.status === "OPEN" || row.status === "IN_PROGRESS");
  const openInvoices = load.invoices.filter((row) => row.status !== "PAID" && row.status !== "CLOSED");

  const brokenHandoffs: string[] = [];
  if (load.status === "DELIVERED" && livePods.length === 0) {
    brokenHandoffs.push("Load is DELIVERED but no LIVE proof-of-delivery row exists.");
  }
  if (verifiedPods.length > 0 && load.invoices.length === 0) {
    brokenHandoffs.push("Verified POD exists but no invoice row is linked to this load.");
  }
  if (load.invoices.some((row) => row.status === "SUBMITTED") && liveSettlements.length === 0) {
    brokenHandoffs.push("Submitted invoice exists without a linked LIVE settlement row.");
  }
  if (held.length > 0 && !held.some((row) => row.holdReason?.trim())) {
    brokenHandoffs.push("Settlement hold recorded without holdReason text.");
  }

  let nextRequiredAction = "No finance handoff blockers detected from Prisma load, proof, invoice, and settlement rows.";
  if (brokenHandoffs.length > 0) {
    nextRequiredAction = brokenHandoffs[0];
  } else if (held.length > 0) {
    nextRequiredAction = `Review settlement hold on load ${load.referenceNumber ?? load.id}: ${held[0].holdReason?.trim() || "reason not recorded"}.`;
  } else if (openExceptions.length > 0) {
    nextRequiredAction = `Resolve operating exception ${openExceptions[0].exceptionType} before finance closeout.`;
  } else if (livePods.length === 0 && ["IN_TRANSIT", "DELIVERED", "EXCEPTION"].includes(load.status)) {
    nextRequiredAction = "Capture and verify delivery proof to unlock invoice and settlement workflows.";
  }

  const settlementBlockers: string[] = [...brokenHandoffs];
  if (openExceptions.length > 0) {
    settlementBlockers.push(`${openExceptions.length} open operating exception(s) must be resolved before settlement.`);
  }
  if (held.length > 0) {
    settlementBlockers.push("One or more LIVE settlements are on HOLD.");
  }
  if (verifiedPods.length === 0 && ["DELIVERED", "EXCEPTION", "IN_TRANSIT"].includes(load.status)) {
    settlementBlockers.push("No verified LIVE proof-of-delivery for this load.");
  }

  let settlementState: LoadFinanceHandoff["settlementEligibility"]["state"] = "NOT_APPLICABLE";
  if (load.status === "PLANNED") {
    settlementState = "NOT_APPLICABLE";
  } else if (settlementBlockers.length > 0) {
    settlementState = verifiedPods.length === 0 ? "INSUFFICIENT_EVIDENCE" : "BLOCKED";
  } else if (
    liveSettlements.some((row) =>
      ["REVIEWED", "APPROVED", "PAID", "CLOSED"].includes(row.status),
    )
  ) {
    settlementState = "SETTLEMENT_READY";
  } else if (liveSettlements.length === 0 && verifiedPods.length > 0 && openExceptions.length === 0) {
    settlementState = "INSUFFICIENT_EVIDENCE";
    settlementBlockers.push("Delivery evidence exists but no LIVE settlement row is ready for processing.");
  }

  const settlementSummary =
    settlementState === "SETTLEMENT_READY"
      ? "Prisma rows indicate settlement may proceed (no open blockers detected in this projection)."
      : settlementState === "NOT_APPLICABLE"
        ? "Settlement eligibility not evaluated for this load status."
        : settlementBlockers[0] ?? "Settlement blocked pending operational evidence.";

  return {
    dataAuthority: "LIVE",
    loadId: load.id,
    referenceNumber: load.referenceNumber,
    loadStatus: load.status,
    deliveryEvidence: {
      podCount: livePods.length,
      verifiedPods: verifiedPods.length,
      summary:
        livePods.length === 0
          ? "No LIVE POD rows on this load."
          : `${verifiedPods.length} of ${livePods.length} LIVE POD row(s) verified.`,
    },
    invoicing: {
      invoiceCount: load.invoices.length,
      openInvoices: openInvoices.length,
      summary:
        load.invoices.length === 0
          ? "No invoice rows linked."
          : `${openInvoices.length} open invoice(s); ${load.invoices.length} total.`,
    },
    settlement: {
      settlementCount: liveSettlements.length,
      heldCount: held.length,
      holdReasons: held.map((row) => row.holdReason?.trim() || "Hold reason not recorded").slice(0, 5),
      summary:
        liveSettlements.length === 0
          ? "No LIVE settlement rows."
          : held.length > 0
            ? `${held.length} settlement hold(s) on this load.`
            : `${liveSettlements.length} LIVE settlement row(s); none on hold.`,
    },
    exceptions: {
      openCount: openExceptions.length,
      summary:
        openExceptions.length === 0
          ? "No open operating exceptions on this load."
          : `${openExceptions.length} open operating exception(s) may block finance closeout.`,
    },
    nextRequiredAction,
    brokenHandoffs,
    settlementEligibility: {
      state: settlementState,
      reasons: settlementBlockers.slice(0, 8),
      summary: settlementSummary,
    },
  };
}
