import type { BofData } from "@/lib/load-bof-data";
import {
  hasIndependentInvestigation,
  reconcileCredentialIncident,
} from "@/lib/compliance/credential-incident-reconciliation";
import {
  credentialDisplayText,
  getDriverCredentialStatus,
  type CredentialRecord,
} from "@/lib/driver-credential-status";
import {
  DISPATCH_BLOCKER_REASON_IDS,
  getDriverDispatchEligibility,
  type DriverDispatchEligibility,
} from "@/lib/driver-dispatch-eligibility";
import { complianceNotesForDriver } from "@/lib/driver-queries";
import { buildDriverDocumentPacket } from "@/lib/driver-document-packet";
import { getSafetyScorecardRows } from "@/lib/safety-scorecard";

export type DriverReviewIssueSeverity = "critical" | "high" | "warning" | "info";

export type DriverReviewIssueCategory =
  | "credentials"
  | "documents"
  | "safety"
  | "settlement"
  | "compliance"
  | "dispatch";

export type DriverReviewIssue = {
  id: string;
  severity: DriverReviewIssueSeverity;
  category: DriverReviewIssueCategory;
  title: string;
  detail: string;
  whyItMatters: string;
  recommendedFix: string;
  actionHref?: string;
  actionLabel?: string;
  /** When set, demo resolve clears dispatch hard gate via existing override path */
  dispatchBlockerId?: string;
  canResolveInDemo: boolean;
  resolved?: boolean;
  plainEnglishReason?: string;
  operationalImpact?: string;
  proposedSolution?: string;
  severityLabel?: "blocked" | "needs_review" | "watch";
};

export type DriverReviewGuidance = {
  headline: string;
  plainEnglishReason: string;
  operationalImpact: string;
  proposedSolution: string;
  severity: "blocked" | "needs_review" | "watch";
  primaryActionLabel: string;
  primaryActionHref?: string;
};

export type DriverReviewExplanation = {
  driverId: string;
  driverName: string;
  entityType: "driver";
  entityId: string;
  entityLabel: string;
  /** Dispatch posture — mirrors reviewStatus */
  status: "ready" | "needs_review" | "blocked";
  reviewStatus: "ready" | "needs_review" | "blocked";
  summary: string;
  issues: DriverReviewIssue[];
  documentsColumnLabel: string;
  complianceColumnLabel: string;
  primaryAction?: { label: string; href: string };
  /** Narrative primary remediation — first open issue fix, else eligibility CTA label */
  recommendedNextStepText: string;
  primaryGuidance: DriverReviewGuidance;
};

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return (h >>> 0).toString(16);
}

function resolvedReviewIds(data: BofData, driverId: string): Set<string> {
  return new Set(data.driverReviewOverrides?.[driverId]?.resolvedIssueIds ?? []);
}

function pushUnique(list: DriverReviewIssue[], issue: DriverReviewIssue, resolved: Set<string>) {
  if (list.some((x) => x.id === issue.id)) return;
  list.push({ ...issue, resolved: resolved.has(issue.id) });
}

function issueTextOverlap(a: string, b: string): boolean {
  const ta = a.toLowerCase();
  const tb = b.toLowerCase();
  if (ta.includes(tb) || tb.includes(ta)) return true;
  const wa = new Set(ta.split(/\W+/).filter((w) => w.length > 3));
  for (const w of tb.split(/\W+/)) {
    if (w.length > 3 && wa.has(w)) return true;
  }
  return false;
}

function coveredByExisting(issues: DriverReviewIssue[], title: string, detail: string): boolean {
  const blob = `${title} ${detail}`;
  return issues.some((i) => issueTextOverlap(`${i.title} ${i.detail}`, blob));
}

function credentialHref(driverId: string, kind: "vault" | "hr" | "safety" | "settlements"): string {
  const base = `/drivers/${driverId}`;
  if (kind === "vault") return `${base}/vault`;
  if (kind === "hr") return `${base}/hr`;
  if (kind === "safety") return `${base}/safety`;
  return `${base}/settlements`;
}

function complianceSeverityToIssueSev(sev: string): DriverReviewIssueSeverity {
  const u = sev.toUpperCase();
  if (u === "CRITICAL") return "critical";
  if (u === "HIGH") return "high";
  if (u === "DUE_SOON" || u === "MEDIUM") return "warning";
  return "warning";
}

function resolveComplianceColumnLabelFromCanonical(
  eligibility: DriverDispatchEligibility,
  activeIssues: DriverReviewIssue[],
  medicalSlice: CredentialRecord,
): string {
  const open = activeIssues.filter((i) => !i.resolved);

  const criticalNonMedicalCompliance = open.filter(
    (i) => i.category === "compliance" && i.severity === "critical" && !/medical/i.test(i.title),
  );
  if (criticalNonMedicalCompliance.length > 0) return "Critical compliance";

  const otherCredProblems = open.filter(
    (i) =>
      i.category === "credentials" &&
      !/medical card/i.test(i.title) &&
      /expired|missing|review/i.test(i.title),
  );

  if (medicalSlice.status === "expired" && medicalSlice.expirationDate) {
    return otherCredProblems.length
      ? `Medical Card expired on ${medicalSlice.expirationDate} · other credential gap`
      : `Medical Card expired on ${medicalSlice.expirationDate}`;
  }
  if (medicalSlice.status === "missing") {
    return otherCredProblems.length ? "Medical Card missing · other credential gap" : "Medical Card missing";
  }
  if (medicalSlice.status === "pending_review") {
    return "Medical card date needs review";
  }

  if (otherCredProblems.length > 0) {
    const label = otherCredProblems[0].title.split(":")[0]?.trim() ?? "Credential";
    return `${label} — needs attention`;
  }

  const complianceIssues = open.filter(
    (i) => i.category === "compliance" || (i.category === "credentials" && /expired|missing/i.test(i.title)),
  );
  if (complianceIssues.some((i) => i.severity === "critical")) return "Critical compliance";
  if (complianceIssues.some((i) => /expired/i.test(i.title))) {
    const types = complianceIssues
      .filter((i) => i.category === "credentials" && /expired/i.test(i.title))
      .map((i) => i.title.split(":")[0]?.trim() ?? "")
      .filter(Boolean);
    return types.length ? `${types.slice(0, 2).join(" + ")} expired` : "Expired";
  }
  if (open.length > 0 && eligibility.status !== "ready") {
    const sorted = [...open].sort((a, b) => {
      const rank = (s: DriverReviewIssue["severity"]) =>
        s === "critical" ? 0 : s === "high" ? 1 : s === "warning" ? 2 : 3;
      return rank(a.severity) - rank(b.severity);
    });
    const head = sorted[0];
    return head ? head.title : "Needs review";
  }
  return "Valid";
}

function filterIssuesAgainstCanonicalCredentials(
  data: BofData,
  driverId: string,
  issues: DriverReviewIssue[],
): DriverReviewIssue[] {
  const cred = getDriverCredentialStatus(data, driverId);
  return issues.filter((issue) => {
    if (issue.id === "credential:medicalCard" && cred.medicalCard.status === "valid") return false;
    if (issue.id === "credential:mvr" && cred.mvr.status === "valid") return false;
    if (issue.id === "credential:cdl" && cred.cdl.status === "valid") return false;
    if (issue.category !== "compliance" || !issue.id.startsWith("compliance:")) return true;
    const incidentId = issue.id.slice("compliance:".length);
    const inc = data.complianceIncidents?.find((c) => c.incidentId === incidentId);
    if (!inc) return true;
    const type = String(inc.type ?? "");
    if (/medical/i.test(type) && cred.medicalCard.status === "valid") return false;
    if (/\bmvr\b|motor\s*vehicle/i.test(type) && cred.mvr.status === "valid" && !hasIndependentInvestigation(inc)) {
      return false;
    }
    if (/\bcdl\b/i.test(type) && cred.cdl.status === "valid" && !hasIndependentInvestigation(inc)) return false;
    return true;
  });
}

function buildDocumentsColumnLabel(cred: ReturnType<typeof getDriverCredentialStatus>, credDocIssues: DriverReviewIssue[]) {
  if (credDocIssues.length > 0) {
    if (credDocIssues.length === 1) {
      const t = credDocIssues[0].title.split(":")[0]?.trim() ?? credDocIssues[0].title;
      return `${t} — review`;
    }
    const short = credDocIssues
      .slice(0, 2)
      .map((i) => i.title.split(":")[0]?.trim() ?? i.title)
      .join(" + ");
    return credDocIssues.length > 2 ? `${credDocIssues.length} items need review` : `${short} — review`;
  }
  const parts: string[] = [];
  if (cred.w9.status !== "valid") parts.push(`W-9: ${credentialDisplayText(cred.w9)}`);
  if (cred.bankInformation.status !== "valid")
    parts.push(`Bank: ${credentialDisplayText(cred.bankInformation)}`);
  if (parts.length > 0) return parts.slice(0, 2).join(" · ");
  return "OK";
}

function titleCaseDocument(doc: string): string {
  if (/^\s*w-?9\s*$/i.test(doc)) return "W-9";
  if (/^\s*i-?9\s*$/i.test(doc)) return "I-9";
  if (/^\s*cdl\s*$/i.test(doc)) return "CDL";
  if (/medical\s*card/i.test(doc)) return "Medical card";
  if (/fmcsa/i.test(doc)) return "FMCSA document";
  if (/mvr/i.test(doc)) return "MVR";
  return doc.trim() || "document";
}

function extractKnownDocumentName(raw: string): string | null {
  const candidates = ["CDL", "Medical Card", "FMCSA", "MVR", "W-9", "I-9", "Bank Information"];
  const lower = raw.toLowerCase();
  for (const c of candidates) {
    if (lower.includes(c.toLowerCase())) return c;
  }
  return null;
}

function toSeverityLabel(s: DriverReviewIssueSeverity): "blocked" | "needs_review" | "watch" {
  if (s === "critical" || s === "high") return "blocked";
  if (s === "warning") return "needs_review";
  return "watch";
}

function normalizeIssueForDispatchers(
  issue: DriverReviewIssue,
  reviewStatus: DriverReviewExplanation["reviewStatus"],
  cred: ReturnType<typeof getDriverCredentialStatus>
): DriverReviewIssue {
  const baseHref = issue.actionHref ?? "";
  const baseLabel = issue.actionLabel?.trim() || "Review driver file";
  const text = `${issue.id} ${issue.title} ${issue.detail}`.toLowerCase();

  const set = (
    headline: string,
    reason: string,
    impact: string,
    solution: string,
    actionLabel: string,
    actionHref?: string
  ): DriverReviewIssue => ({
    ...issue,
    title: headline,
    detail: reason,
    whyItMatters: impact,
    recommendedFix: solution,
    actionLabel,
    actionHref: actionHref ?? issue.actionHref,
    plainEnglishReason: reason,
    operationalImpact: impact,
    proposedSolution: solution,
    severityLabel: toSeverityLabel(issue.severity),
  });

  if (/cdl/.test(text) && /expired/.test(text)) {
    return set(
      "CDL expired",
      "This driver cannot be cleared for dispatch because the CDL is expired.",
      "Dispatch should not assign this driver until the renewed CDL is uploaded and verified.",
      "Upload the renewed CDL, confirm the expiration date, then mark it ready for review.",
      "Open CDL document",
      baseHref
    );
  }

  if (/medical/.test(text) && /expired/.test(text) && cred.medicalCard.status === "expired") {
    const suffix = cred.medicalCard.expirationDate ? ` (expired ${cred.medicalCard.expirationDate})` : "";
    return set(
      "Medical card expired",
      `This driver cannot be cleared for dispatch because the medical card is expired${suffix}.`,
      "Dispatch should not assign this driver until the updated medical card is uploaded and verified.",
      "Request the renewed medical card, upload it to the driver vault, and verify the new expiration date.",
      "Open medical card",
      baseHref
    );
  }

  if (/medical/.test(text) && (/expiring/.test(text) || /due soon/.test(text))) {
    const exp = cred.medicalCard.expirationDate ? ` on ${cred.medicalCard.expirationDate}` : "";
    return set(
      "Medical card expires soon",
      `This driver is currently usable, but the medical card is approaching expiration${exp}.`,
      "If not renewed in time, this driver can become dispatch blocked.",
      "Request the updated medical card now and upload it to the driver vault before expiration.",
      "Open medical card",
      baseHref
    );
  }

  if ((/fmcsa/.test(text) || /mvr/.test(text)) && /expired/.test(text)) {
    const doc = /fmcsa/.test(text) ? "FMCSA document" : "MVR";
    return set(
      `${doc} expired`,
      `This driver has an expired ${doc} requirement on file.`,
      "Dispatch and compliance review should treat this as not dispatch-ready until corrected.",
      `Upload the updated ${doc}, verify the date, and clear the review item.`,
      `Open ${doc}`,
      baseHref
    );
  }

  if (/missing/.test(text)) {
    const doc = titleCaseDocument(extractKnownDocumentName(issue.title) ?? "required document");
    return set(
      "Required document missing",
      `The driver file is missing ${doc}.`,
      "BOF cannot fully clear this driver until the missing document is provided.",
      `Upload ${doc} to the driver vault and submit it for review.`,
      "Open driver vault",
      baseHref || undefined
    );
  }

  if (/safety/.test(text) || issue.category === "safety") {
    return set(
      "Safety review needed",
      "This driver has a safety item that should be reviewed before assignment.",
      "Dispatch should confirm eligibility before assigning the next load.",
      "Open the safety record, resolve flagged items, and document the review outcome.",
      "Open safety record",
      baseHref || undefined
    );
  }

  if (/expiring/.test(text)) {
    const doc = titleCaseDocument(extractKnownDocumentName(issue.title) ?? "credential");
    return set(
      `${doc} expires soon`,
      `This driver is currently usable, but ${doc.toLowerCase()} is approaching expiration.`,
      "Renewal should be completed now to avoid a dispatch block.",
      `Request the updated ${doc.toLowerCase()} and upload it to the driver vault.`,
      "Open driver vault",
      baseHref || undefined
    );
  }

  if (reviewStatus === "blocked" && (issue.category === "dispatch" || issue.severity === "critical")) {
    return set(
      "Driver blocked",
      "This driver has unresolved items that currently prevent dispatch.",
      "Do not assign this driver until the blocking items are cleared.",
      "Start with expired or missing compliance documents, then rerun the readiness check.",
      "Open driver vault",
      baseHref || undefined
    );
  }

  return set(
    "Review needed",
    "This driver has a readiness issue that needs manual review.",
    "Dispatch should confirm eligibility before assignment.",
    "Open the driver vault and review required documents, safety status, and dispatch eligibility.",
    baseLabel || "Review driver file",
    baseHref || undefined
  );
}

function guidancePriorityRank(i: DriverReviewIssue): number {
  const txt = `${i.title} ${i.detail}`.toLowerCase();
  if (/cdl/.test(txt) && /expired/.test(txt)) return 1;
  if (/medical/.test(txt) && /expired/.test(txt)) return 2;
  if (/fmcsa|mvr|compliance/.test(txt) && /expired/.test(txt)) return 3;
  if (/missing/.test(txt)) return 4;
  if (/driver blocked|dispatch blocked|safety review needed/.test(txt)) return 5;
  if (/expir/.test(txt)) return 6;
  return 7;
}

/**
 * Canonical driver review narrative for roster / drawer — keyed by driverId only.
 */
export function getDriverReviewExplanation(data: BofData, driverId: string): DriverReviewExplanation {
  const driver = data.drivers.find((d) => d.id === driverId);
  const driverName = driver?.name ?? driverId;
  const resolved = resolvedReviewIds(data, driverId);
  const issues: DriverReviewIssue[] = [];

  const eligibility = getDriverDispatchEligibility(data, driverId);
  const cred = getDriverCredentialStatus(data, driverId);
  const scoreRow = getSafetyScorecardRows().find((r) => r.driverId === driverId);
  const settlement = data.settlements.find((s) => s.driverId === driverId);
  const compliance = complianceNotesForDriver(data, driverId).filter((c) => {
    const st = String(c.status ?? "").toUpperCase();
    return st !== "CLOSED" && st !== "RESOLVED";
  });

  for (const hb of eligibility.hardBlockerDetails) {
    if (
      hb.id === DISPATCH_BLOCKER_REASON_IDS.medical_card_expired &&
      cred.medicalCard.status !== "expired"
    ) {
      continue;
    }
    if (
      hb.id === DISPATCH_BLOCKER_REASON_IDS.medical_card_missing &&
      cred.medicalCard.status !== "missing"
    ) {
      continue;
    }

    const isCred =
      hb.message.includes("CDL") ||
      hb.message.includes("Medical Card") ||
      hb.message.includes("MVR") ||
      hb.message.includes("FMCSA");
    pushUnique(
      issues,
      {
        id: `dispatch_hard:${hb.id}`,
        severity: "critical",
        category: isCred ? "credentials" : "dispatch",
        title: hb.message,
        detail: `Dispatch hard gate: ${hb.message}`,
        whyItMatters:
          "Hard gates block assignment and revenue movement until cleared or acknowledged in demo.",
        recommendedFix: isCred
          ? "Open the driver vault and verify or renew the credential, or use a demo override to rehearse downstream flows."
          : "Open the linked workspace (safety, settlements, or compliance) and clear the underlying condition.",
        actionHref: isCred ? credentialHref(driverId, "vault") : eligibility.recommendedAction?.href,
        actionLabel: isCred ? "Open documents" : eligibility.recommendedAction?.label ?? "Open workspace",
        dispatchBlockerId: hb.id,
        canResolveInDemo: true,
      },
      resolved
    );
  }

  for (const sw of eligibility.softWarnings) {
    if (sw.startsWith("Demo override active")) {
      pushUnique(
        issues,
        {
          id: "dispatch_info:demo_override",
          severity: "info",
          category: "dispatch",
          title: "Demo override active",
          detail: sw,
          whyItMatters: "Shows that one or more hard gates were acknowledged for this demo session only.",
          recommendedFix: "Reset demo overrides on the driver hub if you need the baseline gates back.",
          actionHref: `/drivers/${driverId}`,
          actionLabel: "Open driver hub",
          canResolveInDemo: false,
        },
        resolved
      );
      continue;
    }

    const idBase = `dispatch_soft:${hashString(sw)}`;
    let category: DriverReviewIssueCategory = "dispatch";
    let href = credentialHref(driverId, "vault");
    let label = "Open documents";
    if (/I-9|W-9|Bank/i.test(sw)) {
      category = "credentials";
      href = /Bank/i.test(sw) ? credentialHref(driverId, "hr") : credentialHref(driverId, "hr");
      label = /Bank/i.test(sw) ? "Open HR / bank" : "Open HR documents";
    } else if (/Settlement|pay hold/i.test(sw)) {
      category = "settlement";
      href = credentialHref(driverId, "settlements");
      label = "Open settlement";
    } else if (/Safety tier At Risk/i.test(sw)) {
      category = "safety";
      href = credentialHref(driverId, "safety");
      label = "Open safety";
    } else if (/Open compliance:/i.test(sw)) {
      category = "compliance";
      href = `/drivers/${driverId}/profile`;
      label = "Open profile";
    }

    pushUnique(
      issues,
      {
        id: idBase,
        severity: /critical|block/i.test(sw) ? "high" : "warning",
        category,
        title: sw,
        detail: `Dispatch readiness warning: ${sw}`,
        whyItMatters:
          "Soft warnings do not always hard-block dispatch but increase operational and audit risk until reviewed.",
        recommendedFix: "Review the underlying record and update documents, HR, safety, or finance as indicated.",
        actionHref: href,
        actionLabel: label,
        canResolveInDemo: true,
      },
      resolved
    );
  }

  if (scoreRow?.performanceTier === "At Risk") {
    const tire = scoreRow.tireAssetInspection === "Fail";
    const cargo = scoreRow.cargoDamageUsd > 0;
    const hos = scoreRow.hosCompliancePct < 92;
    const detail = [tire ? "Tire/asset inspection failed" : null, cargo ? `Cargo exposure ${scoreRow.cargoDamageUsd}` : null, hos ? `HOS ${scoreRow.hosCompliancePct}%` : null]
      .filter(Boolean)
      .join(" · ");
    pushUnique(
      issues,
      {
        id: "safety:at_risk_tier",
        severity: tire || cargo ? "high" : "warning",
        category: "safety",
        title: "Safety tier: At Risk",
        detail: detail || "Scorecard tier is At Risk based on recent safety signals.",
        whyItMatters: "At-risk drivers may be gated from premium dispatch lanes until coaching and findings close.",
        recommendedFix: "Run the safety workflow, attach evidence, and clear or document each open item.",
        actionHref: credentialHref(driverId, "safety"),
        actionLabel: "Open safety",
        canResolveInDemo: false,
      },
      resolved
    );
  }

  const settlementHold =
    String(settlement?.status ?? "").toLowerCase().includes("hold") ||
    String(settlement?.status ?? "").toLowerCase().includes("review");
  const hasHold =
    data.moneyAtRisk.some(
      (m) => m.driverId === driverId && String(m.status ?? "").toUpperCase() === "BLOCKED"
    ) || settlementHold;

  if (hasHold && !issues.some((i) => /Settlement|pay hold/i.test(i.title))) {
    pushUnique(
      issues,
      {
        id: "settlement:hold_or_blocked",
        severity: "high",
        category: "settlement",
        title: "Settlement or pay hold active",
        detail: "Finance has a hold, a blocked money-at-risk row, or settlement is on hold or in review for this driver.",
        whyItMatters: "Pay release and some dispatch lanes may stall until proof and finance review complete.",
        recommendedFix: "Open settlements, verify proof packets, and clear holds with finance.",
        actionHref: credentialHref(driverId, "settlements"),
        actionLabel: "Open settlement",
        canResolveInDemo: false,
      },
      resolved
    );
  }

  for (const inc of compliance) {
    const rec = reconcileCredentialIncident(data, inc);
    if (!rec.display) continue;
    const sevRaw = String(inc.severity ?? "");
    const id = `compliance:${inc.incidentId}`;
    const issueSev = complianceSeverityToIssueSev(sevRaw);
    pushUnique(
      issues,
      {
        id,
        severity: issueSev,
        category: "compliance",
        title: `${rec.presentationTitle ?? inc.type} (${inc.status})`,
        detail: `Open compliance incident ${inc.incidentId}`,
        whyItMatters:
          issueSev === "critical"
            ? "Critical incidents can hard-block dispatch until dispositioned."
            : "Open compliance work keeps DQF defensible and reduces litigation exposure.",
        recommendedFix: "Resolve or document the incident in the driver profile and compliance workspace.",
        actionHref: `/drivers/${driverId}/profile`,
        actionLabel: "Open profile",
        canResolveInDemo: issueSev !== "critical",
      },
      resolved
    );
  }

  const credSlots: Array<{
    key: "cdl" | "medicalCard" | "mvr" | "fmcsa";
    label: string;
  }> = [
    { key: "cdl", label: "CDL" },
    { key: "medicalCard", label: "Medical Card" },
    { key: "mvr", label: "MVR" },
    { key: "fmcsa", label: "FMCSA" },
  ];

  for (const { key, label } of credSlots) {
    const rec = cred[key];
    if (
      key === "medicalCard" &&
      cred.medicalCard.status === "valid" &&
      rec.source === "runtime_override"
    ) {
      pushUnique(
        issues,
        {
          id: "credential:medical_demo_override",
          severity: "info",
          category: "credentials",
          title: "Demo override active — medical card",
          detail:
            "A runtime medical-card date override is present for this driver. Canonical structured data shows the card as valid; verify the override matches your rehearsal scenario.",
          whyItMatters: "Overrides persist in local demo storage and can diverge from seed documents until reset.",
          recommendedFix: "Open Safety → Credential expirations or reset credential overrides for this driver.",
          actionHref: `/drivers/${driverId}/safety`,
          actionLabel: "Open safety expirations",
          canResolveInDemo: false,
        },
        resolved
      );
      continue;
    }
    if (rec.status === "valid") continue;
    const dup = issues.some(
      (i) =>
        i.dispatchBlockerId &&
        ((label === "Medical Card" && i.title.includes("Medical Card")) ||
          (label === "CDL" && i.title.includes("CDL")) ||
          (label === "MVR" && i.title.includes("MVR")) ||
          (label === "FMCSA" && i.title.includes("FMCSA")))
    );
    if (dup) continue;

    const sev: DriverReviewIssueSeverity =
      rec.status === "expired" || rec.status === "missing" ? "high" : "warning";
    pushUnique(
      issues,
      {
        id: `credential:${key}`,
        severity: sev,
        category: "credentials",
        title: `${label}: ${rec.status.replace(/_/g, " ")}`,
        detail: credentialDisplayText(rec),
        whyItMatters:
          rec.status === "missing" || rec.status === "expired"
            ? "Missing or expired credentials break dispatch continuity and audit readiness."
            : "Pending or soon-to-expire credentials need owner verification before they become hard gates.",
        recommendedFix: `Open documents and update ${label} in the vault or HR stack.`,
        actionHref: credentialHref(driverId, "vault"),
        actionLabel: "Open documents",
        canResolveInDemo: rec.status === "pending_review" || rec.status === "expiring_soon",
      },
      resolved
    );
  }

  const packet = buildDriverDocumentPacket(data, driverId);
  const packetBad = (status: string) => {
    const u = status.toUpperCase();
    return u === "MISSING" || u === "EXPIRED" || u.includes("PENDING") || u.includes("AT RISK");
  };

  const packetSkipCanonical = new Set(["cdl", "medical_card", "mvr", "fmcsa_compliance"]);

  for (const doc of packet.documents) {
    if (packetSkipCanonical.has(doc.canonicalType)) continue;
    if (doc.group !== "core_dqf" && doc.group !== "hr_workflow") continue;
    if (!packetBad(doc.status)) continue;
    const title = `${doc.label}: ${doc.status}`;
    if (coveredByExisting(issues, title, doc.label)) continue;
    const isHr = /I-9|W-9|Bank|HR/i.test(doc.label) || doc.group === "hr_workflow";
    pushUnique(
      issues,
      {
        id: `packet:${doc.canonicalType}`,
        severity: doc.status.toUpperCase() === "EXPIRED" ? "high" : "warning",
        category: isHr ? "credentials" : "documents",
        title,
        detail: doc.notes ?? `Packet status ${doc.status} (${doc.sourceLabel})`,
        whyItMatters: "Incomplete DQF / HR items surface in readiness checks and can become dispatch gates.",
        recommendedFix: "Upload or refresh the document in the vault or HR workflow, then re-run readiness.",
        actionHref: isHr ? credentialHref(driverId, "hr") : credentialHref(driverId, "vault"),
        actionLabel: isHr ? "Open HR" : "Open documents",
        canResolveInDemo: true,
      },
      resolved
    );
  }

  const issuesForPresentation = filterIssuesAgainstCanonicalCredentials(data, driverId, issues);
  const normalizedIssues = issuesForPresentation.map((i) =>
    normalizeIssueForDispatchers(i, eligibility.status, cred)
  );
  const activeIssues = normalizedIssues.filter((i) => !i.resolved);
  const summary =
    activeIssues.length === 0
      ? "No open review items for this driver."
      : `${activeIssues.length} open item(s) — ${activeIssues.filter((i) => i.severity === "critical").length} critical, ${activeIssues.filter((i) => i.severity === "high").length} high.`;

  const credDocIssues = activeIssues.filter((i) => i.category === "credentials" || i.category === "documents");
  const documentsColumnLabel = buildDocumentsColumnLabel(cred, credDocIssues);

  const complianceColumnLabel = resolveComplianceColumnLabelFromCanonical(
    eligibility,
    activeIssues,
    cred.medicalCard
  );

  let primaryAction: DriverReviewExplanation["primaryAction"];
  const first = [...activeIssues].sort((a, b) => guidancePriorityRank(a) - guidancePriorityRank(b))[0];
  if (first?.actionHref && first.actionLabel) {
    primaryAction = { label: first.actionLabel, href: first.actionHref };
  }

  const recommendedNextStepText =
    first?.recommendedFix ??
    eligibility.recommendedAction?.label ??
    (activeIssues.length === 0 ? "" : summary);

  let reviewStatus: DriverReviewExplanation["reviewStatus"] = eligibility.status;
  if (reviewStatus === "needs_review" && activeIssues.length === 0) {
    reviewStatus = "ready";
  }

  const fallbackGuidance: DriverReviewGuidance = {
    headline: "Review needed",
    plainEnglishReason: "This driver has a readiness issue that needs manual review.",
    operationalImpact: "Dispatch should confirm eligibility before assignment.",
    proposedSolution:
      "Open the driver vault and review required documents, safety status, and dispatch eligibility.",
    severity: reviewStatus === "blocked" ? "blocked" : reviewStatus === "needs_review" ? "needs_review" : "watch",
    primaryActionLabel: "Open driver vault",
    primaryActionHref: `/drivers/${driverId}/vault`,
  };

  let primaryGuidance: DriverReviewGuidance = first
    ? {
        headline: first.title,
        plainEnglishReason: first.detail,
        operationalImpact: first.whyItMatters,
        proposedSolution: first.recommendedFix,
        severity:
          reviewStatus === "blocked" ? "blocked" : reviewStatus === "needs_review" ? "needs_review" : "watch",
        primaryActionLabel: first.actionLabel?.trim() || fallbackGuidance.primaryActionLabel,
        primaryActionHref: first.actionHref ?? fallbackGuidance.primaryActionHref,
      }
    : fallbackGuidance;

  if (reviewStatus === "blocked" && activeIssues.length > 1) {
    primaryGuidance = {
      ...primaryGuidance,
      headline: "Driver blocked",
      plainEnglishReason: "This driver has multiple unresolved items that prevent dispatch.",
      operationalImpact: "Do not assign this driver until the blocking items are cleared.",
      proposedSolution:
        "Start with expired or missing compliance documents, then rerun the readiness check.",
      primaryActionLabel: "Open driver vault",
      primaryActionHref: `/drivers/${driverId}/vault`,
      severity: "blocked",
    };
  }

  return {
    driverId,
    driverName,
    entityType: "driver",
    entityId: driverId,
    entityLabel: driverId,
    status: reviewStatus,
    reviewStatus,
    summary,
    issues: normalizedIssues,
    documentsColumnLabel,
    complianceColumnLabel,
    primaryAction,
    recommendedNextStepText,
    primaryGuidance,
  };
}
