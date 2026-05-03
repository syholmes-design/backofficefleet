import type { BofData } from "@/lib/load-bof-data";
import {
  getDriverCredentialStatus,
  type CredentialRecord,
} from "@/lib/driver-credential-status";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import type { Driver, EventStatus, SafetyEvent, SafetySeverity } from "@/types/safety";

const MS_DAY = 86400000;

export function parseIsoDate(s: string | null | undefined): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isMvrExpired(driver: Driver, today = new Date()): boolean {
  const d = parseIsoDate(driver.mvr_expiration_date ?? undefined);
  if (!d) return false;
  return d.getTime() < today.setHours(0, 0, 0, 0);
}

/** CDL/Med expiry drives EXPIRED compliance in seed; MVR alone is warning-only for dispatch. */
export function hasOpenCriticalEvent(
  driverId: string,
  events: SafetyEvent[]
): boolean {
  return events.some(
    (e) =>
      e.driver_id === driverId &&
      e.status === "Open" &&
      e.severity === "Critical"
  );
}

export function isDispatchBlocked(
  driver: Driver,
  events: SafetyEvent[]
): boolean {
  if (driver.status === "Inactive") return true;
  if (driver.compliance_status === "EXPIRED") return true;
  if (hasOpenCriticalEvent(driver.driver_id, events)) return true;
  return false;
}

export function isHighSeverityOpen(ev: SafetyEvent): boolean {
  return (
    ev.status === "Open" &&
    (ev.severity === "High" || ev.severity === "Critical")
  );
}

export function nextEventStatuses(current: EventStatus): EventStatus[] {
  switch (current) {
    case "Open":
      return ["In Review"];
    case "In Review":
      return ["Reviewed"];
    case "Reviewed":
      return ["Closed"];
    case "Closed":
      return [];
    default:
      return [];
  }
}

export function canTransitionEventStatus(
  from: EventStatus,
  to: EventStatus
): boolean {
  return nextEventStatuses(from).includes(to);
}

export function severityChipClass(sev: SafetySeverity): string {
  switch (sev) {
    case "Critical":
      return "border border-red-700/60 bg-red-950/60 text-red-100";
    case "High":
      return "border border-orange-700/55 bg-orange-950/50 text-orange-100";
    case "Medium":
      return "border border-amber-600/50 bg-amber-950/45 text-amber-100";
    case "Low":
    default:
      return "border border-slate-600 bg-slate-800/80 text-slate-200";
  }
}

export function eventStatusChipClass(st: EventStatus): string {
  switch (st) {
    case "Open":
      return "border border-rose-700/50 bg-rose-950/45 text-rose-100";
    case "In Review":
      return "border border-amber-600/50 bg-amber-950/45 text-amber-100";
    case "Reviewed":
      return "border border-teal-700/50 bg-teal-950/45 text-teal-100";
    case "Closed":
    default:
      return "border border-slate-600 bg-slate-800/80 text-slate-300";
  }
}

export function complianceChipClass(c: Driver["compliance_status"]): string {
  switch (c) {
    case "EXPIRED":
      return "border border-red-700/60 bg-red-950/55 text-red-100";
    case "EXPIRING_SOON":
      return "border border-amber-600/50 bg-amber-950/45 text-amber-100";
    case "VALID":
    default:
      return "border border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
  }
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  const d = parseIsoDate(dateStr ?? undefined);
  if (!d) return null;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return Math.round((x.getTime() - t.getTime()) / MS_DAY);
}

export type ExpirationRowSignal = "blocking_action" | "review_warning" | "needs_review";

export type ExpirationRow = {
  driver_id: string;
  driver_name: string;
  home_terminal: string;
  document_type: "CDL" | "Med Card" | "MVR";
  /** ISO date when known; empty when expiration is unknown / needs review */
  expiration_date: string;
  status: "Expired" | "Expiring soon" | "Needs review";
  signal: ExpirationRowSignal;
};

const SOON = 60;

function homeTerminalFromSeedAddress(address?: string): string {
  if (!address?.trim()) return "Cleveland, OH";
  const parts = address.split(",");
  const mid = parts[1]?.trim();
  const region = parts[2]?.trim().split(/\s+/)?.[0];
  if (mid && region) return `${mid}, ${region}`;
  return "Cleveland, OH";
}

function credentialSliceToExpirationRow(
  document_type: ExpirationRow["document_type"],
  rec: CredentialRecord
): Omit<ExpirationRow, "driver_id" | "driver_name" | "home_terminal"> | null {
  const exp = rec.expirationDate?.trim() ?? "";
  const days = exp ? daysUntil(exp) : null;

  if (rec.status === "valid") {
    if (!exp || days === null) return null;
    if (days < 0) {
      return {
        document_type,
        expiration_date: exp,
        status: "Expired",
        signal: document_type === "MVR" ? "review_warning" : "blocking_action",
      };
    }
    if (days <= SOON) {
      return {
        document_type,
        expiration_date: exp,
        status: "Expiring soon",
        signal: "review_warning",
      };
    }
    return null;
  }

  if (rec.status === "expiring_soon") {
    return {
      document_type,
      expiration_date: exp || "",
      status: "Expiring soon",
      signal: "review_warning",
    };
  }

  if (rec.status === "expired") {
    return {
      document_type,
      expiration_date: exp || "",
      status: "Expired",
      signal: document_type === "MVR" ? "review_warning" : "blocking_action",
    };
  }

  if (rec.status === "missing") {
    return {
      document_type,
      expiration_date: "",
      status: "Needs review",
      signal: document_type === "MVR" ? "needs_review" : "blocking_action",
    };
  }

  if (rec.status === "pending_review") {
    return {
      document_type,
      expiration_date: exp,
      status: "Needs review",
      signal: document_type === "MVR" ? "needs_review" : "needs_review",
    };
  }

  return null;
}

/** Credential expirations for Safety UI — one canonical resolver (`getDriverCredentialStatus`), keyed by driverId. */
export function buildExpirationRows(data: BofData): ExpirationRow[] {
  const rows: ExpirationRow[] = [];
  for (const d of data.drivers) {
    const cred = getDriverCredentialStatus(data, d.id);
    const home_terminal = homeTerminalFromSeedAddress(d.address);
    const parts: [ExpirationRow["document_type"], CredentialRecord][] = [
      ["CDL", cred.cdl],
      ["Med Card", cred.medicalCard],
      ["MVR", cred.mvr],
    ];
    for (const [document_type, rec] of parts) {
      const slice = credentialSliceToExpirationRow(document_type, rec);
      if (!slice) continue;
      rows.push({
        driver_id: d.id,
        driver_name: d.name,
        home_terminal,
        ...slice,
      });
    }
  }
  return rows.sort((a, b) => {
    const ae = a.expiration_date || "9999-12-31";
    const be = b.expiration_date || "9999-12-31";
    return ae.localeCompare(be);
  });
}

export function expirationSignalLabel(signal: ExpirationRowSignal): string {
  switch (signal) {
    case "blocking_action":
      return "Blocking action";
    case "review_warning":
      return "Review / warning";
    case "needs_review":
    default:
      return "Needs review";
  }
}

export function dispatchEligibilityLabel(
  data: BofData,
  driverId: string,
  driverShell: Pick<Driver, "status">,
  events: SafetyEvent[]
): string {
  if (driverShell.status === "Inactive") return "Blocked";
  if (hasOpenCriticalEvent(driverId, events)) return "Blocked";
  const el = getDriverDispatchEligibility(data, driverId);
  if (el.status === "blocked") return "Blocked";
  if (el.status === "needs_review") return "Needs Review";
  return "Eligible";
}
