import type { BofData } from "@/lib/load-bof-data";
import type { CanonicalCredentialStatus } from "@/lib/driver-credential-status";
import {
  getDriverCredentialStatus,
  type CredentialRecord,
} from "@/lib/driver-credential-status";

/** Minimal incident shape — demo JSON + optional investigation metadata */
export type ComplianceIncidentLike = {
  incidentId?: string;
  driverId?: string;
  type?: string;
  status?: string;
  severity?: string;
  loadId?: string;
  investigationOpen?: boolean;
  investigationNotes?: string;
  notes?: string;
  detail?: string;
};

export type CredentialSlot = "medicalCard" | "mvr" | "cdl" | "fmcsa";

/** Canonical credential slice attached when a credential-slot incident is reconciled */
export type CanonicalCredentialStatusSlice = {
  slot: CredentialSlot;
  status: CanonicalCredentialStatus;
  expirationDate?: string;
  reviewDate?: string;
};

export type CredentialIncidentReconciliationResult = {
  incident: ComplianceIncidentLike;
  display: boolean;
  reconciledStatus: "active" | "stale_suppressed" | "downgraded" | "resolved" | "active_verified";
  reason: string;
  canonicalCredentialSnapshot?: CanonicalCredentialStatusSlice;
  /** Same object as canonicalCredentialSnapshot — stable name for validators / contracts */
  canonicalCredentialStatus?: CanonicalCredentialStatusSlice;
  presentationTitle?: string;
  presentationSeverity?: "critical" | "high" | "medium";
};

export function credentialSlotFromIncidentType(type: string): CredentialSlot | null {
  const t = type.trim().toLowerCase();
  if (!t) return null;
  if (/\bmedical\b|\bmed\s*card\b|\bmcsa[- ]?5876\b/i.test(t)) return "medicalCard";
  if (/\bmvr\b|motor\s*vehicle\s*record/i.test(t)) return "mvr";
  if (/\bcdl\b|commercial\s*drivers?\s*license/i.test(t)) return "cdl";
  if (/fmcsa|clearinghouse/i.test(t)) return "fmcsa";
  return null;
}

function devStaleLog(result: CredentialIncidentReconciliationResult): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug(
      "[BOF] stale credential compliance incident suppressed",
      result.incident.incidentId ?? "(no id)",
      result.reason
    );
  }
}

/** Keeps a credential incident visible even when canonical credential looks healthy */
export function hasIndependentInvestigation(incident: ComplianceIncidentLike): boolean {
  if (incident.investigationOpen === true) return true;
  const blob = [incident.investigationNotes, incident.notes, incident.detail]
    .filter(Boolean)
    .join(" ");
  if (blob.trim().length < 12) return false;
  return /\b(investigation|formal\s+audit|dot\s+audit|complaint\s*(id|#)|crash\s+reconstruction|litigation)\b/i.test(
    blob
  );
}

function parseMedicalIntent(type: string): "expiring" | "expired" | "missing" | "generic" {
  const t = type.toLowerCase();
  if (/\bmissing\b|not\s+on\s+file/.test(t)) return "missing";
  if (/\bexpired\b/.test(t)) return "expired";
  if (/\bexpir|\bdue\s*soon\b|\bexpiring\b/.test(t)) return "expiring";
  return "generic";
}

function parseMvrIntent(type: string): "review" | "expired" | "missing" | "generic" {
  const t = type.toLowerCase();
  if (/\bmissing\b/.test(t)) return "missing";
  if (/\bexpired\b/.test(t)) return "expired";
  if (/\breview\s+required\b|\bqualification\b|\bstale\b|\bpending\b|\brequired\b/.test(t))
    return "review";
  return "generic";
}

function parseCdlIntent(type: string): "expiring" | "expired" | "missing" | "generic" {
  const t = type.toLowerCase();
  if (/\bmissing\b/.test(t)) return "missing";
  if (/\bexpired\b/.test(t)) return "expired";
  if (/\bexpir|\bdue\s*soon\b|\bexpiring\b/.test(t)) return "expiring";
  return "generic";
}

function parseFmcsaIntent(type: string): "review" | "expired" | "missing" | "generic" {
  const t = type.toLowerCase();
  if (/\bmissing\b/.test(t)) return "missing";
  if (/\bexpired\b|not\s+cleared/.test(t)) return "expired";
  if (/\breview\b|\bclearinghouse\b|\bflagged\b/.test(t)) return "review";
  return "generic";
}

function contradictsValidMedical(intent: ReturnType<typeof parseMedicalIntent>, status: CanonicalCredentialStatus): boolean {
  if (status !== "valid") return false;
  if (intent === "expiring") return true;
  if (intent === "expired" || intent === "missing") return true;
  return false;
}

function contradictsValidMvr(intent: ReturnType<typeof parseMvrIntent>, status: CanonicalCredentialStatus): boolean {
  if (status !== "valid") return false;
  return intent === "review" || intent === "expired" || intent === "missing";
}

function contradictsValidCdl(intent: ReturnType<typeof parseCdlIntent>, status: CanonicalCredentialStatus): boolean {
  if (status !== "valid") return false;
  return intent === "expiring" || intent === "expired" || intent === "missing";
}

function contradictsValidFmcsa(intent: ReturnType<typeof parseFmcsaIntent>, status: CanonicalCredentialStatus): boolean {
  if (status !== "valid") return false;
  return intent === "review" || intent === "expired" || intent === "missing";
}

function snapshot(slice: CredentialRecord, slot: CredentialSlot): CanonicalCredentialStatusSlice {
  return {
    slot,
    status: slice.status,
    expirationDate: slice.expirationDate,
    reviewDate: slice.reviewDate ?? slice.expirationDate,
  };
}

function canonSnapFields(snap: CanonicalCredentialStatusSlice) {
  return {
    canonicalCredentialSnapshot: snap,
    canonicalCredentialStatus: snap,
  };
}

function medicalPresentation(slice: CredentialRecord): { title: string; severity: "critical" | "high" | "medium" } {
  const date = slice.expirationDate?.trim();
  switch (slice.status) {
    case "expired":
      return {
        title: date ? `Medical Card expired on ${date}` : "Medical Card expired on recorded date",
        severity: "critical",
      };
    case "expiring_soon":
      return {
        title: date ? `Medical Card expiring soon on ${date}` : "Medical Card expiring soon",
        severity: "high",
      };
    case "missing":
      return { title: "Medical Card missing — upload current certificate", severity: "critical" };
    case "pending_review":
      return {
        title: date
          ? `Medical Card pending review — expiration ${date}`
          : "Medical Card on file — expiration needs review",
        severity: "high",
      };
    default:
      return { title: "Medical Card — review required", severity: "medium" };
  }
}

function mvrPresentation(slice: CredentialRecord): { title: string; severity: "critical" | "high" | "medium" } {
  const date = slice.expirationDate?.trim();
  switch (slice.status) {
    case "valid":
      return {
        title: date ? `MVR valid through ${date}` : "MVR valid — review date on file",
        severity: "medium",
      };
    case "expired":
      return {
        title: date ? `MVR expired on ${date} — renewal required` : "MVR expired — renewal required",
        severity: "critical",
      };
    case "expiring_soon":
      return {
        title: date ? `MVR expiring soon — valid through ${date}` : "MVR expiring soon — schedule review",
        severity: "high",
      };
    case "missing":
      return { title: "MVR missing — order current motor vehicle record", severity: "critical" };
    case "pending_review":
      return {
        title: date ? `MVR review required — review date ${date}` : "MVR review required — review date missing",
        severity: "high",
      };
    default:
      return { title: "MVR — qualification review", severity: "medium" };
  }
}

function cdlPresentation(slice: CredentialRecord): { title: string; severity: "critical" | "high" | "medium" } {
  const date = slice.expirationDate?.trim();
  switch (slice.status) {
    case "expired":
      return { title: date ? `CDL expired on ${date}` : "CDL expired — renewal required", severity: "critical" };
    case "expiring_soon":
      return {
        title: date ? `CDL expiring soon on ${date}` : "CDL expiring soon",
        severity: "high",
      };
    case "missing":
      return { title: "CDL missing — upload current license", severity: "critical" };
    case "pending_review":
      return {
        title: date ? `CDL pending review — expiration ${date}` : "CDL on file — expiration needs review",
        severity: "high",
      };
    default:
      return { title: "CDL — review required", severity: "medium" };
  }
}

function fmcsaPresentation(slice: CredentialRecord): { title: string; severity: "critical" | "high" | "medium" } {
  const date = (slice.reviewDate ?? slice.expirationDate)?.trim();
  switch (slice.status) {
    case "expired":
      return {
        title: date ? `FMCSA compliance expired or overdue (${date})` : "FMCSA compliance expired or overdue",
        severity: "critical",
      };
    case "expiring_soon":
      return {
        title: date ? `FMCSA review due soon (${date})` : "FMCSA review due soon",
        severity: "high",
      };
    case "missing":
      return { title: "FMCSA / Clearinghouse documentation missing", severity: "critical" };
    case "pending_review":
      return {
        title: date ? `FMCSA pending review — ${date}` : "FMCSA pending review — date needs confirmation",
        severity: "high",
      };
    default:
      return { title: "FMCSA compliance — review required", severity: "medium" };
  }
}

/**
 * Reconcile seed compliance incidents against `getDriverCredentialStatus` (driverId-keyed).
 * Stale credential copies must not override canonical medical/MVR/CDL/FMCSA posture in UI or dispatch gates.
 */
export function reconcileCredentialIncident(
  data: BofData,
  incident: ComplianceIncidentLike
): CredentialIncidentReconciliationResult {
  const st = String(incident.status ?? "").toUpperCase();
  if (st === "CLOSED" || st === "RESOLVED") {
    return {
      incident,
      display: true,
      reconciledStatus: "resolved",
      reason: "incident_closed_or_resolved_history",
    };
  }

  const slot = credentialSlotFromIncidentType(String(incident.type ?? ""));
  if (!slot) {
    return {
      incident,
      display: true,
      reconciledStatus: "active",
      reason: "non_credential_incident",
    };
  }

  const driverId = String(incident.driverId ?? "").trim();
  if (!driverId) {
    return {
      incident,
      display: true,
      reconciledStatus: "active",
      reason: "credential_incident_missing_driver_id",
    };
  }

  const cred = getDriverCredentialStatus(data, driverId);
  const slice = cred[slot];
  const snap = snapshot(slice, slot);

  if (slot === "mvr" && slice.status === "valid" && hasIndependentInvestigation(incident)) {
    return {
      incident,
      display: true,
      reconciledStatus: "active_verified",
      reason: "mvr_canonical_valid_independent_investigation_keeps_signal",
      ...canonSnapFields(snap),
      presentationTitle: String(incident.type ?? "MVR compliance review"),
      presentationSeverity: incident.severity === "CRITICAL" ? "critical" : "high",
    };
  }

  const typeStr = String(incident.type ?? "");

  if (slot === "medicalCard") {
    const intent = parseMedicalIntent(typeStr);
    if (slice.status === "valid" && intent === "generic") {
      const result: CredentialIncidentReconciliationResult = {
        incident,
        display: false,
        reconciledStatus: "stale_suppressed",
        reason: "medical_incident_generic_while_canonical_valid",
        ...canonSnapFields(snap),
      };
      devStaleLog(result);
      return result;
    }
    if (contradictsValidMedical(intent, slice.status)) {
      const result: CredentialIncidentReconciliationResult = {
        incident,
        display: false,
        reconciledStatus: "stale_suppressed",
        reason: "medical_incident_contradicts_canonical_valid",
        ...canonSnapFields(snap),
      };
      devStaleLog(result);
      return result;
    }
    const pres = medicalPresentation(slice);
    return {
      incident,
      display: true,
      reconciledStatus: "active_verified",
      reason: "medical_incident_canonical_backed",
      ...canonSnapFields(snap),
      presentationTitle: pres.title,
      presentationSeverity: pres.severity,
    };
  }

  if (slot === "mvr") {
    const intent = parseMvrIntent(typeStr);
    if (slice.status === "valid" && intent === "generic") {
      const result: CredentialIncidentReconciliationResult = {
        incident,
        display: false,
        reconciledStatus: "stale_suppressed",
        reason: "mvr_incident_generic_while_canonical_valid",
        ...canonSnapFields(snap),
      };
      devStaleLog(result);
      return result;
    }
    if (contradictsValidMvr(intent, slice.status) && !hasIndependentInvestigation(incident)) {
      const result: CredentialIncidentReconciliationResult = {
        incident,
        display: false,
        reconciledStatus: "stale_suppressed",
        reason: "mvr_incident_contradicts_canonical_valid",
        ...canonSnapFields(snap),
      };
      devStaleLog(result);
      return result;
    }
    const pres = mvrPresentation(slice);
    return {
      incident,
      display: true,
      reconciledStatus: "active_verified",
      reason: "mvr_incident_canonical_backed",
      ...canonSnapFields(snap),
      presentationTitle: pres.title,
      presentationSeverity: pres.severity,
    };
  }

  if (slot === "cdl") {
    const intent = parseCdlIntent(typeStr);
    if (slice.status === "valid" && intent === "generic") {
      const result: CredentialIncidentReconciliationResult = {
        incident,
        display: false,
        reconciledStatus: "stale_suppressed",
        reason: "cdl_incident_generic_while_canonical_valid",
        ...canonSnapFields(snap),
      };
      devStaleLog(result);
      return result;
    }
    if (contradictsValidCdl(intent, slice.status)) {
      const result: CredentialIncidentReconciliationResult = {
        incident,
        display: false,
        reconciledStatus: "stale_suppressed",
        reason: "cdl_incident_contradicts_canonical_valid",
        ...canonSnapFields(snap),
      };
      devStaleLog(result);
      return result;
    }
    const pres = cdlPresentation(slice);
    return {
      incident,
      display: true,
      reconciledStatus: "active_verified",
      reason: "cdl_incident_canonical_backed",
      ...canonSnapFields(snap),
      presentationTitle: pres.title,
      presentationSeverity: pres.severity,
    };
  }

  /* fmcsa */
  const fmIntent = parseFmcsaIntent(typeStr);
  if (slice.status === "valid" && fmIntent === "generic") {
    const result: CredentialIncidentReconciliationResult = {
      incident,
      display: false,
      reconciledStatus: "stale_suppressed",
      reason: "fmcsa_incident_generic_while_canonical_valid",
      ...canonSnapFields(snap),
    };
    devStaleLog(result);
    return result;
  }
  if (contradictsValidFmcsa(fmIntent, slice.status)) {
    const result: CredentialIncidentReconciliationResult = {
      incident,
      display: false,
      reconciledStatus: "stale_suppressed",
      reason: "fmcsa_incident_contradicts_canonical_valid",
      ...canonSnapFields(snap),
    };
    devStaleLog(result);
    return result;
  }
  const pres = fmcsaPresentation(slice);
  return {
    incident,
    display: true,
    reconciledStatus: "active_verified",
    reason: "fmcsa_incident_canonical_backed",
    ...canonSnapFields(snap),
    presentationTitle: pres.title,
    presentationSeverity: pres.severity,
  };
}

/** Open incidents that should surface after credential reconciliation */
export function complianceIncidentDisplayedAfterCredentialReconciliation(
  data: BofData,
  incident: ComplianceIncidentLike
): boolean {
  const st = String(incident.status ?? "").toUpperCase();
  if (st === "CLOSED" || st === "RESOLVED") return false;
  return reconcileCredentialIncident(data, incident).display;
}
