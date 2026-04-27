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
const initialEvents: SafetyEvent[] = [
  {
    event_id: "EVT-001",
    driver_id: "DRV-001",
    driver_name: "John Carter",
    event_type: "Accident",
    severity: "High",
    event_date: "2026-04-15",
    status: "Open",
    notes: "Minor collision during backing maneuver",
    internal_notes: "Driver needs refresher training on backing procedures",
    linked_load_id: "L001",
    evidence_image_url: "/assets/images/safety_event_evidence_1.png",
    insurance_claim_needed: true,
    estimated_claim_exposure: 2500,
  },
  {
    event_id: "EVT-002",
    driver_id: "DRV-002",
    driver_name: "Maria Lopez",
    event_type: "Traffic Violation",
    severity: "Medium",
    event_date: "2026-04-18",
    status: "Open",
    notes: "Speeding ticket in construction zone",
    internal_notes: "Review with driver, consider defensive driving course",
    linked_load_id: "L002",
    evidence_image_url: "/assets/images/safety_event_evidence_2.png",
    insurance_claim_needed: false,
    estimated_claim_exposure: 0,
  },
  {
    event_id: "EVT-003",
    driver_id: "DRV-003",
    driver_name: "Alex Kim",
    event_type: "Equipment Damage",
    severity: "Medium",
    event_date: "2026-04-20",
    status: "In Review",
    notes: "Minor damage to trailer during loading",
    internal_notes: "Dock facility issue, not driver fault",
    linked_load_id: "L003",
    evidence_image_url: "/assets/images/safety_event_evidence_3.png",
    insurance_claim_needed: false,
    estimated_claim_exposure: 800,
  },
  {
    event_id: "EVT-004",
    driver_id: "DRV-004",
    driver_name: "Priya Patel",
    event_type: "Near Miss",
    severity: "Low",
    event_date: "2026-04-22",
    status: "Reviewed",
    notes: "Near miss with pedestrian at crosswalk",
    internal_notes: "Driver took appropriate action, document for training",
    linked_load_id: null,
    evidence_image_url: "/assets/images/safety_event_evidence_4.png",
    insurance_claim_needed: false,
    estimated_claim_exposure: 0,
  },
  {
    event_id: "EVT-005",
    driver_id: "DRV-005",
    driver_name: "James Wilson",
    event_type: "DOT Inspection Failure",
    severity: "High",
    event_date: "2026-04-24",
    status: "Open",
    notes: "Failed Level 1 inspection - brake adjustment issue",
    internal_notes: "Vehicle needs immediate maintenance before return to service",
    linked_load_id: "L004",
    evidence_image_url: "/assets/images/safety_event_evidence_5.png",
    insurance_claim_needed: false,
    estimated_claim_exposure: 0,
  },
];

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
