import type { SafetyEvent } from "@/lib/v3-operational-types";

export type SafetyEventEvidence = {
  url: string;
  label: string;
  note: string;
};

const SAFETY_EVENT_EVIDENCE: Record<string, SafetyEventEvidence> = {
  "EVT-001": {
    url: "/evidence/safety/evt-001-hos-eld.png",
    label: "ELD HOS excerpt",
    note: "Drive-clock evidence for the 11-hour limit violation.",
  },
  "EVT-002": {
    url: "/evidence/safety/evt-002-harsh-braking-dashcam.png",
    label: "Dashcam braking still",
    note: "Telematics still for the hard-braking event.",
  },
  "EVT-003": {
    url: "/evidence/safety/evt-003-speeding-telematics.png",
    label: "Speed event snapshot",
    note: "GPS speed evidence for the 78 MPH alert.",
  },
  "EVT-004": {
    url: "/evidence/safety/evt-004-geofence-yard-exit.png",
    label: "Yard geofence snapshot",
    note: "Yard geofence boundary evidence.",
  },
  "EVT-005": {
    url: "/evidence/safety/evt-005-break-hos-violation.png",
    label: "HOS break audit",
    note: "Break-window evidence for the HOS violation.",
  },
  "EVT-006": {
    url: "/evidence/safety/evt-006-maintenance-photo-missing.png",
    label: "Inspection upload audit",
    note: "Missing tire and asset inspection photo evidence.",
  },
  "EVT-007": {
    url: "/evidence/safety/evt-007-following-distance.png",
    label: "Following-distance still",
    note: "ADAS following-distance evidence.",
  },
  "EVT-008": {
    url: "/evidence/safety/evt-008-lane-departure.png",
    label: "Lane departure still",
    note: "Dashcam/ADAS lane-departure evidence.",
  },
  "EVT-009": {
    url: "/evidence/safety/evt-009-tire-inspection-failure.png",
    label: "Pre-trip tire photo",
    note: "Tread and sidewall evidence for the dispatch hold.",
  },
  "EVT-010": {
    url: "/evidence/safety/evt-010-fatigue-alert.png",
    label: "Fatigue alert still",
    note: "Dashcam fatigue evidence from the overnight segment.",
  },
  "EVT-011": {
    url: "/evidence/safety/evt-011-backing-dock-contact.png",
    label: "Dock camera still",
    note: "Low-speed backing contact evidence.",
  },
  "EVT-012": {
    url: "/evidence/safety/evt-012-speeding-threshold.png",
    label: "Speed threshold snapshot",
    note: "Telematics evidence for the speed threshold event.",
  },
};

export function getSafetyEventEvidence(event: Pick<SafetyEvent, "eventId" | "eventPhotoUrl">): SafetyEventEvidence | null {
  return SAFETY_EVENT_EVIDENCE[event.eventId] ?? null;
}

export function getSafetyEventEvidenceUrl(event: Pick<SafetyEvent, "eventId" | "eventPhotoUrl">): string | null {
  return getSafetyEventEvidence(event)?.url ?? null;
}
