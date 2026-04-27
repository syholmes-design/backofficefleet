"use client";

import { create } from "zustand";
import type { BofData } from "@/lib/load-bof-data";
import { getBofData } from "@/lib/load-bof-data";
import type { Driver, EventStatus, SafetyEvent, SafetyNavId, ComplianceStatus } from "@/types/safety";
import { buildExpirationRowsFromBofDocuments } from "@/lib/safety-rules";

// Original buildExpirationRows function for compatibility
export function buildExpirationRows(drivers: Driver[]) {
  return drivers.map(driver => ({
    driver_id: driver.driver_id,
    driver_name: driver.name,
    home_terminal: driver.home_terminal,
    document_type: "Medical Card",
    expiration_date: null,
    status: "VALID" as "VALID" | "Expired"
  }));
}
import {
  canTransitionEventStatus,
  isDispatchBlocked,
  isHighSeverityOpen,
} from "@/lib/safety-rules";

type SafetyState = {
  drivers: Driver[];
  events: SafetyEvent[];
  nav: SafetyNavId;
  selectedDriverId: string;
  eventDrawerEventId: string | null;

  setNav: (id: SafetyNavId) => void;
  setSelectedDriverId: (id: string) => void;
  openEventDrawer: (event_id: string) => void;
  closeEventDrawer: () => void;

  setEventStatus: (event_id: string, status: EventStatus) => boolean;
  setEventInternalNotes: (event_id: string, internal_notes: string) => void;
  setEventClaimNeeded: (event_id: string, needed: boolean) => void;
  hydrateFromBofData: (data: BofData) => void;
};

const initialData = getBofData();
const initialDrivers = initialData.drivers.map((d) => ({
  driver_id: d.id,
  name: d.name,
  status: "Active" as const,
  home_terminal: d.address ? `${d.address.split(",")[1]?.trim()}, ${d.address.split(",")[2]?.split(" ")[0]}` : "Cleveland, OH",
  compliance_status: "VALID" as ComplianceStatus,
  cdl_expiration_date: null,
  med_card_expiration_date: null,
  mvr_expiration_date: null,
  qual_file_status: "Complete" as const,
  safety_ack_status: "Signed" as const,
}));
const initialEvents: SafetyEvent[] = [];

export const useSafetyStore = create<SafetyState>((set, get) => ({
  drivers: initialDrivers,
  events: initialEvents,
  nav: "dashboard",
  selectedDriverId: initialDrivers[0]?.driver_id ?? "",
  eventDrawerEventId: null,

  setNav: (id) => set({ nav: id }),

  setSelectedDriverId: (id) => set({ selectedDriverId: id }),

  openEventDrawer: (event_id) => set({ eventDrawerEventId: event_id }),

  closeEventDrawer: () => set({ eventDrawerEventId: null }),

  setEventStatus: (event_id, status) => {
    const { events } = get();
    const ev = events.find((e) => e.event_id === event_id);
    if (!ev) return false;
    if (!canTransitionEventStatus(ev.status, status)) return false;
    set({
      events: events.map((e) =>
        e.event_id === event_id ? { ...e, status } : e
      ),
    });
    return true;
  },

  setEventInternalNotes: (event_id, internal_notes) =>
    set((s) => ({
      events: s.events.map((e) =>
        e.event_id === event_id ? { ...e, internal_notes } : e
      ),
    })),

  setEventClaimNeeded: (event_id, needed) =>
    set((s) => ({
      events: s.events.map((e) =>
        e.event_id === event_id
          ? {
              ...e,
              insurance_claim_needed: needed,
              estimated_claim_exposure: needed
                ? e.estimated_claim_exposure || 25000
                : 0,
            }
          : e
      ),
    })),

  hydrateFromBofData: (data) =>
    set((s) => {
      const nextDrivers = data.drivers.map((d) => ({
        driver_id: d.id,
        name: d.name,
        status: "Active" as const,
        home_terminal: d.address ? `${d.address.split(",")[1]?.trim()}, ${d.address.split(",")[2]?.split(" ")[0]}` : "Cleveland, OH",
        compliance_status: "VALID" as ComplianceStatus,
        cdl_expiration_date: null,
        med_card_expiration_date: null,
        mvr_expiration_date: null,
        qual_file_status: "Complete" as const,
        safety_ack_status: "Signed" as const,
      }));
      const nameByDriverId = new Map(nextDrivers.map((d) => [d.driver_id, d.name]));
      const validDriverIds = new Set(nextDrivers.map((d) => d.driver_id));
      const hasOnlyCanonicalEventDrivers =
        s.events.length > 0 &&
        s.events.every((e) => validDriverIds.has(e.driver_id));

      const nextEvents = hasOnlyCanonicalEventDrivers
        ? s.events.map((e) => ({
            ...e,
            driver_name: nameByDriverId.get(e.driver_id) ?? e.driver_name,
          }))
        : [];

      const selectedDriverId = validDriverIds.has(s.selectedDriverId)
        ? s.selectedDriverId
        : nextDrivers[0]?.driver_id ?? "";

      return {
        drivers: nextDrivers,
        events: nextEvents,
        selectedDriverId,
      };
    }),
}));

export function countOpenEvents(events: SafetyEvent[]): number {
  return events.filter((e) => e.status === "Open").length;
}

export function countHighSeverityOpen(events: SafetyEvent[]): number {
  return events.filter(isHighSeverityOpen).length;
}

export function countDriversDocRisk(drivers: Driver[]): number {
  return drivers.filter(
    (d) => d.compliance_status === "EXPIRING_SOON" || d.compliance_status === "EXPIRED"
  ).length;
}

export function countBlockedDrivers(
  drivers: Driver[],
  events: SafetyEvent[]
): number {
  return drivers.filter((d) => isDispatchBlocked(d, events)).length;
}

export function sumOpenClaimExposure(events: SafetyEvent[]): number {
  return events
    .filter(
      (e) =>
        e.insurance_claim_needed &&
        e.status !== "Closed" &&
        e.estimated_claim_exposure > 0
    )
    .reduce((a, e) => a + e.estimated_claim_exposure, 0);
}
