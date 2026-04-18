import type { Load } from "@/types/dispatch";

/** BOF-owned packet / line statuses for shipper & billing workflows. */
export type DocumentationLineStatus =
  | "Ready"
  | "Missing"
  | "Incomplete"
  | "Exception"
  | "Claim Required"
  | "Not applicable";

export type OverallPacketStatus =
  | "Ready"
  | "Missing"
  | "Incomplete"
  | "Exception"
  | "Claim Required";

export type ReadinessLineKey =
  | "rate_con"
  | "bol"
  | "pod"
  | "invoice"
  | "cargo_photo"
  | "seal_photo"
  | "lumper"
  | "exception_claim";

export interface DocumentationReadinessLine {
  key: ReadinessLineKey;
  label: string;
  status: DocumentationLineStatus;
  detail?: string;
}

export interface DocumentationReadinessReport {
  lines: DocumentationReadinessLine[];
  /** Human labels for required items still absent (excludes N/A lumper when not required). */
  missingRequired: string[];
  overall: OverallPacketStatus;
  overallDetail: string;
  /** Claim packet: attachments present enough to send internally (demo heuristic). */
  claimPacketReady: boolean;
  /** Recommend settlement hold when packet cannot support release (demo). */
  suggestedSettlementHold: boolean;
  suggestedSettlementHoldReason?: string;
}

function lineFromUrl(
  label: string,
  url: string | undefined
): DocumentationLineStatus {
  if (url && url.trim().length > 0) return "Ready";
  return "Missing";
}

function lumperLine(load: Load): DocumentationReadinessLine {
  const required = load.lumper_receipt_required === true;
  if (!required) {
    return {
      key: "lumper",
      label: "Lumper receipt",
      status: "Not applicable",
      detail: "Not required on this move",
    };
  }
  const ok = Boolean(load.lumper_photo_url?.trim());
  return {
    key: "lumper",
    label: "Lumper receipt",
    status: ok ? "Ready" : "Missing",
    detail: ok ? undefined : "Detention / lumper documentation required",
  };
}

function exceptionClaimLine(load: Load): DocumentationReadinessLine {
  if (load.insurance_claim_needed) {
    return {
      key: "exception_claim",
      label: "Exception / claim support",
      status: "Claim Required",
      detail: load.exception_flag
        ? "Carrier claim file — coordinate with customer and insurer"
        : "Claim review required",
    };
  }
  if (load.exception_flag) {
    return {
      key: "exception_claim",
      label: "Exception / claim support",
      status: "Exception",
      detail: load.exception_reason ?? "Operational exception on file",
    };
  }
  return {
    key: "exception_claim",
    label: "Exception / claim support",
    status: "Ready",
    detail: "No open exception or claim flag",
  };
}

function requiredMissingLabels(
  load: Load,
  lines: DocumentationReadinessLine[]
): string[] {
  const missing: string[] = [];
  const pushIf = (cond: boolean, label: string) => {
    if (cond) missing.push(label);
  };
  pushIf(!load.rate_con_url?.trim(), "Rate Confirmation");
  pushIf(!load.bol_url?.trim(), "BOL");
  pushIf(!load.pod_url?.trim(), "POD");
  pushIf(!load.invoice_url?.trim(), "Invoice");
  pushIf(!load.cargo_photo_url?.trim(), "Cargo photo");
  pushIf(!load.seal_photo_url?.trim(), "Seal photo");
  const lumper = lines.find((x) => x.key === "lumper");
  if (
    lumper?.status === "Missing" &&
    load.lumper_receipt_required === true
  ) {
    missing.push("Lumper receipt");
  }
  return missing;
}

function claimPacketReady(load: Load): boolean {
  if (!load.insurance_claim_needed && !load.exception_flag) return true;
  return Boolean(
    load.claim_form_url?.trim() &&
      load.damage_photo_url?.trim() &&
      load.supporting_attachment_url?.trim()
  );
}

/**
 * BOF documentation readiness for shipper packet, billing, and claim support.
 * URL presence on `Load` is the demo signal; production would merge TMS + doc vault state.
 */
export function computeDocumentationReadiness(
  load: Load
): DocumentationReadinessReport {
  const lines: DocumentationReadinessLine[] = [
    {
      key: "rate_con",
      label: "Rate Confirmation",
      status: lineFromUrl("Rate Confirmation", load.rate_con_url),
    },
    {
      key: "bol",
      label: "BOL",
      status: lineFromUrl("BOL", load.bol_url),
    },
    {
      key: "pod",
      label: "POD",
      status: lineFromUrl("POD", load.pod_url),
    },
    {
      key: "invoice",
      label: "Invoice",
      status: lineFromUrl("Invoice", load.invoice_url),
    },
    {
      key: "cargo_photo",
      label: "Cargo photo",
      status: lineFromUrl("Cargo photo", load.cargo_photo_url),
    },
    {
      key: "seal_photo",
      label: "Seal photo",
      status: lineFromUrl("Seal photo", load.seal_photo_url),
    },
    lumperLine(load),
    exceptionClaimLine(load),
  ];

  const missingRequired = requiredMissingLabels(load, lines);

  const coreIncomplete = missingRequired.length > 0;

  let overall: OverallPacketStatus;
  let overallDetail: string;

  if (load.insurance_claim_needed) {
    overall = "Claim Required";
    overallDetail = claimPacketReady(load)
      ? "Claim packet staged — submit to carrier / insurer per playbook"
      : "Claim packet incomplete — add carrier claim form, damage photos, and supporting BOL or correspondence";
  } else if (load.exception_flag) {
    overall = "Exception";
    overallDetail =
      load.exception_reason ??
      "Resolve exception before shipper packet is certified";
  } else if (coreIncomplete) {
    overall = missingRequired.length >= 3 ? "Missing" : "Incomplete";
    overallDetail = `Outstanding: ${missingRequired.join(", ")}`;
  } else {
    overall = "Ready";
    overallDetail = "Shipper packet meets minimum documentation for release";
  }

  const suggestedSettlementHold =
    coreIncomplete || overall === "Claim Required" || overall === "Exception";

  const suggestedSettlementHoldReason = suggestedSettlementHold
    ? load.settlement_hold_reason ??
      "Documentation packet does not meet settlement release criteria"
    : undefined;

  return {
    lines,
    missingRequired,
    overall,
    overallDetail,
    claimPacketReady: claimPacketReady(load),
    suggestedSettlementHold,
    suggestedSettlementHoldReason,
  };
}

export function overallPacketBadgeClass(status: OverallPacketStatus): string {
  switch (status) {
    case "Ready":
      return "border border-emerald-700/50 bg-emerald-950/45 text-emerald-100";
    case "Incomplete":
      return "border border-amber-600/50 bg-amber-950/40 text-amber-100";
    case "Missing":
      return "border border-red-800/50 bg-red-950/40 text-red-100";
    case "Exception":
      return "border border-orange-700/50 bg-orange-950/40 text-orange-100";
    case "Claim Required":
      return "border border-rose-800/50 bg-rose-950/40 text-rose-100";
  }
}

export function documentationLineBadgeClass(
  status: DocumentationLineStatus
): string {
  switch (status) {
    case "Ready":
      return "border border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
    case "Incomplete":
      return "border border-amber-600/50 bg-amber-950/40 text-amber-100";
    case "Missing":
      return "border border-red-800/50 bg-red-950/40 text-red-100";
    case "Exception":
      return "border border-orange-700/50 bg-orange-950/40 text-orange-100";
    case "Claim Required":
      return "border border-rose-800/50 bg-rose-950/40 text-rose-100";
    case "Not applicable":
      return "border border-slate-600 bg-slate-900/80 text-slate-400";
  }
}
