import type { BofLoadEvidence } from "@/lib/canonical-load-evidence";
import { getGeneratedLoadDocUrl } from "@/lib/load-doc-manifest";
import type { LoadProofItem } from "@/lib/load-proof";

/** Same blocker row shape used by Load File operating display. Inlined so this existing settlement/proof helper can compile without the uncommitted Load File operating layer. */
export type LoadFileBlockerRow = {
  category: string;
  source: string;
  problem: string;
  whyItMatters: string;
  nextAction: string;
  href?: string;
};

export type ProofRequirementRow = {
  category: string;
  label: string;
  requirement: string;
  availability: string;
  verification: string;
  source: string;
};

export type ProofArtifactRow = {
  category: string;
  label: string;
  presentation: string;
  verification: string;
  href?: string;
  note?: string;
  capturedAt?: string;
  locationOrRef?: string;
  evidenceType?: string;
};

export type ProofVerificationRow = {
  label: string;
  status: string;
  verifiedBy: string;
  verifiedAt: string;
  notes: string;
};

export type MoneyLine = { label: string; value: string };

export type CashRecordRow = {
  label: string;
  status: string;
  detail: string;
  href?: string;
};

export const PROOF_CATEGORY_ORDER = [
  "Pickup / Cargo Condition",
  "Pickup Proof",
  "Seal Proof",
  "Delivery / Empty-Trailer Proof",
  "Delivery Proof",
  "BOL / POD",
  "Accessorial Proof",
  "Temperature Proof",
  "Claim / Condition Proof",
  "Other Proof",
] as const;

export function groupProofArtifacts(artifacts: ProofArtifactRow[]): Array<{ category: string; items: ProofArtifactRow[] }> {
  const buckets = new Map<string, ProofArtifactRow[]>();
  for (const row of artifacts) {
    const category = row.category || categorizeProofLabel(row.label);
    const list = buckets.get(category) ?? [];
    list.push(row);
    buckets.set(category, list);
  }
  const ordered: Array<{ category: string; items: ProofArtifactRow[] }> = PROOF_CATEGORY_ORDER.filter((category) =>
    buckets.has(category),
  ).map((category) => ({
    category,
    items: buckets.get(category) ?? [],
  }));
  const known = new Set<string>(PROOF_CATEGORY_ORDER);
  for (const [category, items] of buckets) {
    if (!known.has(category)) {
      ordered.push({ category, items });
    }
  }
  return ordered;
}

export function categorizeProofLabel(label: string): string {
  if (/empty.?trailer/i.test(label)) return "Delivery / Empty-Trailer Proof";
  if (/pickup/i.test(label)) return "Pickup Proof";
  if (/seal/i.test(label)) return "Seal Proof";
  if (/temp/i.test(label)) return "Temperature Proof";
  if (/lumper|accessorial|detention|fuel receipt/i.test(label)) return "Accessorial Proof";
  if (/bol|pod/i.test(label)) return "BOL / POD";
  if (/delivery|signature/i.test(label)) return "Delivery Proof";
  if (/photo/i.test(label)) return "Pickup Proof";
  if (/geo|rfid/i.test(label)) return "Delivery Proof";
  return "Other Proof";
}

export function categoryFromEvidenceType(evidenceType: string | undefined, title: string): string {
  switch (evidenceType) {
    case "seal_pickup_photo":
    case "seal_delivery_photo":
      return "Seal Proof";
    case "cargo_pickup_photo":
      return "Pickup / Cargo Condition";
    case "cargo_delivery_photo":
      return "Delivery / Empty-Trailer Proof";
    case "bol":
    case "pod":
      return "BOL / POD";
    case "lumper_receipt":
      return "Accessorial Proof";
    case "rfid_geo_proof":
      return "Delivery Proof";
    case "claim_photo":
      return "Claim / Condition Proof";
    default:
      return categorizeProofLabel(title);
  }
}

export function mapLoadProofItemStates(item: LoadProofItem, podStatus?: string): {
  requirement: string;
  availability: string;
  verification: string;
} {
  const podVerified = String(podStatus ?? "").toLowerCase() === "verified" && /pod/i.test(item.type);
  if (item.status === "Not required") {
    return { requirement: "NOT REQUIRED", availability: "NOT APPLICABLE", verification: "NOT APPLICABLE" };
  }
  const attached = item.status === "Complete" || Boolean(item.fileUrl || item.previewUrl);
  return {
    requirement: "REQUIRED",
    availability: attached ? "ATTACHED" : "NOT YET AVAILABLE",
    verification: podVerified ? "VERIFIED" : "VERIFICATION NOT REPORTED",
  };
}

export function proofRequirementsFromItems(items: LoadProofItem[], podStatus?: string): ProofRequirementRow[] {
  return items.map((item) => {
    const mapped = mapLoadProofItemStates(item, podStatus);
    return {
      category: categorizeProofLabel(item.type),
      label: item.type,
      requirement: mapped.requirement,
      availability: mapped.availability,
      verification: mapped.verification,
      source: "Load proof record",
    };
  });
}

export function proofArtifactsFromItems(items: LoadProofItem[]): ProofArtifactRow[] {
  return items
    .filter((item) => item.status !== "Not required")
    .map((item) => {
      const href = item.fileUrl || item.previewUrl;
      return {
        category: categorizeProofLabel(item.type),
        label: item.type,
        presentation: href ? "ACTUAL ARTIFACT" : "NOT RECEIVED",
        verification: "VERIFICATION NOT REPORTED",
        href,
        note: item.notes || item.riskNote,
      };
    });
}

export function proofArtifactsFromEvidence(assets: BofLoadEvidence[]): ProofArtifactRow[] {
  return assets.map((asset) => ({
    category: categoryFromEvidenceType(asset.evidenceType, asset.title),
    label: asset.title,
    presentation:
      asset.status === "available"
        ? "ACTUAL ARTIFACT"
        : asset.status === "placeholder"
          ? "PLACEHOLDER — NOT VERIFIED PROOF"
          : asset.status === "not_required"
            ? "NOT REQUIRED"
            : "NOT RECEIVED",
    verification: "VERIFICATION NOT REPORTED",
    href: asset.url,
    note: asset.reason,
    capturedAt: asset.createdAt,
    locationOrRef: asset.sealRef,
    evidenceType: asset.evidenceType,
  }));
}

export function prismaProofTypeLabel(proofType: string): string {
  if (proofType === "POD") return "Proof of Delivery";
  if (proofType === "BOL") return "Bill of Lading";
  if (proofType === "PHOTO") return "Photo";
  if (proofType === "GEOLOCATION") return "Geolocation";
  if (proofType === "SIGNATURE") return "Signature";
  return proofType || "OTHER";
}

export function mapPrismaProofStatus(status: string): {
  requirement: string;
  availability: string;
  verification: string;
  presentation: string;
} {
  if (status === "VERIFIED") {
    return { requirement: "REQUIRED", availability: "ATTACHED", verification: "VERIFIED", presentation: "ACTUAL ARTIFACT" };
  }
  if (status === "RECEIVED") {
    return { requirement: "REQUIRED", availability: "ATTACHED", verification: "NOT VERIFIED", presentation: "ATTACHED" };
  }
  if (status === "MISSING") {
    return { requirement: "REQUIRED", availability: "NOT YET AVAILABLE", verification: "NOT VERIFIED", presentation: "NOT RECEIVED" };
  }
  if (status === "REJECTED" || status === "EXCEPTION") {
    return { requirement: "REQUIRED", availability: status, verification: status, presentation: status };
  }
  return { requirement: "RECORDED", availability: status || "NOT YET AVAILABLE", verification: "VERIFICATION NOT REPORTED", presentation: status || "NOT RECEIVED" };
}

export const PRISMA_PROOF_TYPES = ["POD", "BOL", "PHOTO", "GEOLOCATION", "SIGNATURE", "OTHER"] as const;

export function proofRequirementsFromPrisma(proofs: Array<{ proofType?: string; status?: string }>): ProofRequirementRow[] {
  if (proofs.length === 0) {
    return PRISMA_PROOF_TYPES.map((proofType) => ({
      category: categorizeProofLabel(prismaProofTypeLabel(proofType)),
      label: prismaProofTypeLabel(proofType),
      requirement: "SUPPORTED TYPE",
      availability: "NOT YET AVAILABLE",
      verification: "NOT VERIFIED",
      source: "LoadProofOfDelivery",
    }));
  }
  return proofs.map((proof, index) => {
    const mapped = mapPrismaProofStatus(String(proof.status ?? ""));
    const label = prismaProofTypeLabel(String(proof.proofType ?? "OTHER"));
    return {
      category: categorizeProofLabel(label),
      label: `${label} (${index + 1})`,
      requirement: mapped.requirement,
      availability: mapped.availability,
      verification: mapped.verification,
      source: "LoadProofOfDelivery",
    };
  });
}

export function proofArtifactsFromPrisma(
  proofs: Array<{ id?: string; proofType?: string; status?: string; evidenceId?: string | null; documentId?: string | null }>,
): ProofArtifactRow[] {
  if (proofs.length === 0) return [];
  return proofs.map((proof, index) => {
    const mapped = mapPrismaProofStatus(String(proof.status ?? ""));
    const label = prismaProofTypeLabel(String(proof.proofType ?? "OTHER"));
    return {
      category: categorizeProofLabel(label),
      label: `${label} ${proof.id ?? index + 1}`,
      presentation: mapped.presentation,
      verification: mapped.verification,
      note: proof.evidenceId
        ? `Evidence id ${proof.evidenceId}`
        : proof.documentId
          ? `Linked document id ${proof.documentId}`
          : "No stored file URL is exposed on this proof record.",
    };
  });
}

export function proofVerificationsFromPrisma(
  proofs: Array<{
    proofType?: string;
    status?: string;
    verifiedBy?: string | null;
    verifiedAt?: string | Date | null;
    exceptionStatus?: string | null;
  }>,
): ProofVerificationRow[] {
  return proofs
    .filter((proof) => proof.verifiedBy || proof.verifiedAt || proof.status === "VERIFIED")
    .map((proof) => ({
      label: prismaProofTypeLabel(String(proof.proofType ?? "OTHER")),
      status: String(proof.status ?? "VERIFICATION NOT REPORTED"),
      verifiedBy: proof.verifiedBy?.trim() || "Not recorded",
      verifiedAt: proof.verifiedAt ? String(proof.verifiedAt) : "Not recorded",
      notes: proof.exceptionStatus?.trim() || "No verification notes stored.",
    }));
}

export function podVerificationFromLoad(podStatus?: string | null): ProofVerificationRow[] {
  if (String(podStatus ?? "").toLowerCase() !== "verified") return [];
  return [
    {
      label: "POD",
      status: "VERIFIED",
      verifiedBy: "Not recorded on this load row",
      verifiedAt: "Not recorded on this load row",
      notes: "Copied from the load podStatus field. No reviewer identity is stored on the demo load.",
    },
  ];
}

export function settlementCalcFromDemo(settlement: {
  grossPay?: number;
  baseEarnings?: number;
  backhaulPay?: number;
  safetyBonus?: number;
  reimbursement?: number;
  totalDeductions?: number;
  netPay?: number;
  status?: string;
  pendingReason?: string;
} | null): { status: string; note: string; lines: MoneyLine[] } {
  if (!settlement) {
    return {
      status: "NOT YET CALCULATED",
      note: "No settlement row is attached to this load. This page does not calculate pay.",
      lines: [],
    };
  }
  const lines: MoneyLine[] = [];
  if (settlement.baseEarnings != null) lines.push({ label: "Base pay", value: String(settlement.baseEarnings) });
  if (settlement.backhaulPay != null) lines.push({ label: "Backhaul", value: String(settlement.backhaulPay) });
  if (settlement.safetyBonus != null) lines.push({ label: "Bonus", value: String(settlement.safetyBonus) });
  if (settlement.reimbursement != null) lines.push({ label: "Reimbursements", value: String(settlement.reimbursement) });
  if (settlement.grossPay != null) lines.push({ label: "Gross", value: String(settlement.grossPay) });
  if (settlement.totalDeductions != null) lines.push({ label: "Deductions", value: String(settlement.totalDeductions) });
  if (settlement.netPay != null) lines.push({ label: "Net settlement", value: String(settlement.netPay) });
  return {
    status: String(settlement.status || "RECORDED"),
      note: settlement.pendingReason || "Copied from the existing driver-period payroll settlement row. This page does not recalculate. Load settlementHold is a separate load-level field.",
    lines,
  };
}

export function settlementCalcFromPrisma(rows: Array<{
  status?: string;
  payBasis?: string | null;
  grossAmount?: string | number;
  deductions?: string | number;
  reimbursements?: string | number;
  advances?: string | number;
  netAmount?: string | number;
  holdReason?: string | null;
  settlementDate?: string | Date;
}>): { status: string; note: string; lines: MoneyLine[] } {
  const row = rows[0];
  if (!row) {
    return {
      status: "NOT YET CALCULATED",
      note: "No Settlement record is stored for this load.",
      lines: [],
    };
  }
  return {
    status: String(row.status || "CREATED"),
    note: row.holdReason || `Settlement date ${row.settlementDate ?? "not recorded"}. Amounts are stored Settlement fields.`,
    lines: [
      { label: "Pay basis", value: row.payBasis?.trim() || "Not recorded" },
      { label: "Gross", value: String(row.grossAmount ?? "Not recorded") },
      { label: "Deductions", value: String(row.deductions ?? "0") },
      { label: "Reimbursements", value: String(row.reimbursements ?? "0") },
      { label: "Advances", value: String(row.advances ?? "0") },
      { label: "Net settlement", value: String(row.netAmount ?? "Not recorded") },
    ],
  };
}

export function settlementBlockersFromHold(args: {
  hold?: boolean;
  reason?: string | null;
  loadId: string;
  driverId?: string | null;
}): LoadFileBlockerRow[] {
  if (!args.hold) return [];
  return [
    {
      category: "Settlement",
      source: "Load settlementHold",
      problem: args.reason?.trim() || "Settlement hold is recorded.",
      whyItMatters: "Financial close waits on the recorded hold. This page does not release the hold.",
      nextAction: "Review settlement",
      href: existingSettlementWorkflowHref({ driverId: args.driverId, loadId: args.loadId }),
    },
  ];
}

export function settlementBlockersFromPrisma(rows: Array<{ status?: string; holdReason?: string | null }>, loadId: string): LoadFileBlockerRow[] {
  return rows
    .filter((row) => row.status === "HELD" || row.status === "EXCEPTION" || Boolean(row.holdReason))
    .map((row) => ({
      category: "Settlement",
      source: "Settlement",
      problem: row.holdReason?.trim() || `Settlement status ${row.status}`,
      whyItMatters: "The stored Settlement record is not clear for close.",
      nextAction: "Review settlement",
      href: existingSettlementWorkflowHref({ loadId }),
    }));
}

export function invoiceRowsFromGenerated(loadId: string): CashRecordRow[] {
  const href = getGeneratedLoadDocUrl(loadId, "invoice");
  if (!href) {
    return [{ label: "Customer invoice", status: "NO INVOICE RECORDED", detail: "No generated invoice artifact is filed for this load." }];
  }
  return [{ label: "Customer invoice", status: "FILED", detail: "Generated invoice artifact from the existing load document manifest.", href }];
}

export function invoiceRowsFromPrisma(rows: Array<{ id?: string; status?: string; amount?: string | number; terms?: string | null }>): CashRecordRow[] {
  if (rows.length === 0) {
    return [{ label: "Customer invoice", status: "NO INVOICE RECORDED", detail: "No Invoice record is stored for this load." }];
  }
  return rows.map((row) => ({
    label: `Invoice ${row.id ?? ""}`.trim(),
    status: String(row.status || "CREATED"),
    detail: `Amount ${row.amount ?? "not recorded"}${row.terms ? ` · ${row.terms}` : ""}`,
  }));
}

export function paymentRowsFromPrisma(rows: Array<{ id?: string; status?: string; amount?: string | number; paidAt?: string | Date }>): CashRecordRow[] {
  if (rows.length === 0) {
    return [{ label: "Invoice payment", status: "NO PAYMENT RECORDED", detail: "No InvoicePayment record is stored for this load." }];
  }
  return rows.map((row) => ({
    label: `Payment ${row.id ?? ""}`.trim(),
    status: String(row.status || "RECORDED"),
    detail: `Amount ${row.amount ?? "not recorded"} · paid ${row.paidAt ?? "timestamp not recorded"}`,
  }));
}

export function factoringRow(loadId: string, factoringActive?: boolean | null): CashRecordRow {
  const href = getGeneratedLoadDocUrl(loadId, "factoringNotification");
  if (href) {
    return {
      label: "Factoring notification",
      status: "FILED",
      detail: "Generated factoring notification from the existing load document manifest. Factoring is not settlement and is not payment.",
      href,
    };
  }
  if (factoringActive === true) {
    return {
      label: "Factoring",
      status: "ACTIVE ON CANONICAL STORY",
      detail: "Canonical load story records factoring as active. No factoring notification file is attached.",
    };
  }
  if (factoringActive === false) {
    return {
      label: "Factoring",
      status: "NOT RECORDED",
      detail: "Canonical load story does not mark factoring active, and no factoring notification is filed.",
    };
  }
  return {
    label: "Factoring",
    status: "NO FACTORING RECORDED",
    detail: "No factoring notification is filed for this load.",
  };
}

export function proofSpineLabel(args: { attachedCount: number; verifiedCount: number; pending: boolean }): string {
  if (args.verifiedCount > 0 && !args.pending) return "VERIFIED";
  if (args.attachedCount > 0) return "ATTACHED";
  return "PENDING";
}

export function settlementSpineLabel(args: { hold?: boolean; status?: string | null; hasRow?: boolean }): string {
  if (args.hold) return "BLOCKED";
  if (args.status === "HELD" || args.status === "EXCEPTION") return "BLOCKED";
  if (args.status === "PAID" || args.status === "CLOSED" || args.status === "APPROVED") return args.status;
  if (args.hasRow || args.status) return String(args.status || "PENDING");
  return "NOT EVALUATED";
}

/** Demo payroll rows use STL-*; Prisma Settlement.id is a cuid and is not a /settlements navigation key. */
export function isDemoPayrollSettlementId(value: string | null | undefined): boolean {
  return /^STL-/i.test(String(value ?? "").trim());
}

/**
 * Existing /settlements command center is driver-week payroll, not a load-id settlement page.
 * driverId is the real join from a demo load to that workflow. loadId is only for hold highlighting.
 */
export function existingSettlementWorkflowHref(args: {
  driverId?: string | null;
  loadId?: string | null;
  payrollSettlementId?: string | null;
}): string {
  const params = new URLSearchParams();
  const driverId = args.driverId?.trim();
  const loadId = args.loadId?.trim();
  const payrollId = args.payrollSettlementId?.trim();
  if (driverId) params.set("driverId", driverId);
  if (loadId) params.set("loadId", loadId);
  if (payrollId && isDemoPayrollSettlementId(payrollId)) params.set("settlementId", payrollId);
  const query = params.toString();
  return query ? `/settlements?${query}` : "/settlements";
}
