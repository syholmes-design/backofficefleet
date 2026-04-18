"use client";

import { create } from "zustand";
import type { Driver, EventStatus, SafetyEvent, SafetyNavId } from "@/types/safety";
import { createSafetySeedDrivers, createSafetySeedEvents } from "@/lib/safety-seed";
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
};

export const useSafetyStore = create<SafetyState>((set, get) => ({
  drivers: createSafetySeedDrivers(),
  events: createSafetySeedEvents(),
  nav: "dashboard",
  selectedDriverId: createSafetySeedDrivers()[0]?.driver_id ?? "",
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
