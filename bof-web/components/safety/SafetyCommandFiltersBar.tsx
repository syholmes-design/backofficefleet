"use client";

import type {
  SafetyCommandDriverFilter,
  SafetyCommandEventTypeFilter,
  SafetyCommandSeverityFilter,
  SafetyCommandStatusFilter,
} from "@/lib/safety-command-feed";

type Props = {
  driverIds: string[];
  eventType: SafetyCommandEventTypeFilter;
  driverId: SafetyCommandDriverFilter;
  severity: SafetyCommandSeverityFilter;
  status: SafetyCommandStatusFilter;
  onEventType: (v: SafetyCommandEventTypeFilter) => void;
  onDriverId: (v: SafetyCommandDriverFilter) => void;
  onSeverity: (v: SafetyCommandSeverityFilter) => void;
  onStatus: (v: SafetyCommandStatusFilter) => void;
};

const selectCls =
  "rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] font-medium text-slate-100 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600";

export function SafetyCommandFiltersBar({
  driverIds,
  eventType,
  driverId,
  severity,
  status,
  onEventType,
  onDriverId,
  onSeverity,
  onStatus,
}: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
      <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Event type
        <select className={selectCls} value={eventType} onChange={(e) => onEventType(e.target.value as SafetyCommandEventTypeFilter)}>
          <option value="all">All</option>
          <option value="hos_violation">HOS violation</option>
          <option value="oos_violation">OOS violation</option>
          <option value="pretrip_missed">Pre-trip missed</option>
          <option value="pod_certification_issue">POD certification issue</option>
          <option value="seal_cargo_protocol">Seal / cargo protocol</option>
          <option value="speeding_harsh_braking">Speeding / harsh braking</option>
          <option value="accident_claim">Accident / claim</option>
          <option value="coaching_required">Coaching required</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Driver
        <select className={selectCls} value={driverId} onChange={(e) => onDriverId(e.target.value as SafetyCommandDriverFilter)}>
          <option value="all">All drivers</option>
          {driverIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Severity
        <select className={selectCls} value={severity} onChange={(e) => onSeverity(e.target.value as SafetyCommandSeverityFilter)}>
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="review">Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Status
        <select className={selectCls} value={status} onChange={(e) => onStatus(e.target.value as SafetyCommandStatusFilter)}>
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="pending_review">Pending review</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
    </div>
  );
}
