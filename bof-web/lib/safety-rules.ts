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

export type ExpirationRow = {
  driver_id: string;
  driver_name: string;
  home_terminal: string;
  document_type: "CDL" | "Med Card" | "MVR";
  expiration_date: string;
  status: "Expired" | "Expiring soon" | "OK";
};

export function buildExpirationRows(drivers: Driver[]): ExpirationRow[] {
  const rows: ExpirationRow[] = [];
  const soon = 60;
  for (const d of drivers) {
    const pairs: [ExpirationRow["document_type"], string | null | undefined][] =
      [
        ["CDL", d.cdl_expiration_date],
        ["Med Card", d.med_card_expiration_date],
        ["MVR", d.mvr_expiration_date],
      ];
    for (const [docType, raw] of pairs) {
      if (!raw) continue;
      const days = daysUntil(raw);
      if (days === null) continue;
      let status: ExpirationRow["status"];
      if (days < 0) status = "Expired";
      else if (days <= soon) status = "Expiring soon";
      else status = "OK";
      if (status === "OK") continue;
      rows.push({
        driver_id: d.driver_id,
        driver_name: d.name,
        home_terminal: d.home_terminal,
        document_type: docType,
        expiration_date: raw,
        status,
      });
    }
  }
  return rows.sort((a, b) => a.expiration_date.localeCompare(b.expiration_date));
}

export function buildExpirationRowsFromBofDocuments(
  drivers: Driver[],
  bofDocuments: Array<{ driverId: string; type: string; cdlExpiration?: string; mvrExpiration?: string; status?: string }>
): ExpirationRow[] {
  const rows: ExpirationRow[] = [];
  const soon = 60;
  
  for (const d of drivers) {
    // Find documents for this driver from BOF source of truth
    const driverDocs = bofDocuments.filter(doc => doc.driverId === d.driver_id);
    
    const pairs: [ExpirationRow["document_type"], string | null | undefined][] =
      [
        ["CDL", driverDocs.find(doc => doc.type === "CDL")?.cdlExpiration],
        ["Med Card", driverDocs.find(doc => doc.type === "Med Card")?.cdlExpiration], // Using cdlExpiration field for Med Card
        ["MVR", driverDocs.find(doc => doc.type === "MVR")?.mvrExpiration],
      ];
    
    for (const [docType, raw] of pairs) {
      if (!raw) continue;
      const days = daysUntil(raw);
      if (days === null) continue;
      let status: ExpirationRow["status"];
      if (days < 0) status = "Expired";
      else if (days <= soon) status = "Expiring soon";
      else status = "OK";
      if (status === "OK") continue;
      rows.push({
        driver_id: d.driver_id,
        driver_name: d.name,
        home_terminal: d.home_terminal,
        document_type: docType,
        expiration_date: raw,
        status,
      });
    }
  }
  return rows.sort((a, b) => a.expiration_date.localeCompare(b.expiration_date));
}

export function dispatchEligibilityLabel(
  driver: Driver,
  events: SafetyEvent[]
): string {
  if (isDispatchBlocked(driver, events)) return "Blocked";
  if (isMvrExpired(driver)) return "Eligible — MVR review";
  return "Eligible";
}
