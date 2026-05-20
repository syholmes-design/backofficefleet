import type { SafetyEvent } from "@/lib/v3-operational-types";
import { getLoadEvidenceUrl } from "@/lib/load-documents";

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

function isClaimOrDamageEvent(event: Partial<Pick<SafetyEvent, "eventType" | "insuranceClaimNeeded" | "claimAmount">>) {
  return Boolean(event.insuranceClaimNeeded) ||
    Number(event.claimAmount ?? 0) > 0 ||
    /claim|damage|accident|dock|seal|cargo|collision|tire/i.test(String(event.eventType ?? ""));
}

type SafetyEvidenceEventInput =
  Pick<SafetyEvent, "eventId" | "eventPhotoUrl"> &
  Partial<Pick<SafetyEvent, "linkedLoadId" | "eventType" | "insuranceClaimNeeded" | "claimAmount">>;

export function getSafetyEventEvidence(event: SafetyEvidenceEventInput): SafetyEventEvidence | null {
  const loadId = /^L\d{3}$/.test(String(event.linkedLoadId ?? "")) ? event.linkedLoadId : "";
  if (loadId && isClaimOrDamageEvent(event)) {
    const claimUrl =
      getLoadEvidenceUrl(loadId, "cargoDamagePhoto") ??
      getLoadEvidenceUrl(loadId, "claimEvidence") ??
      getLoadEvidenceUrl(loadId, "damagePhoto") ??
      getLoadEvidenceUrl(loadId, "sealMismatchPhoto");
    if (claimUrl) {
      return {
        url: claimUrl,
        label: `${loadId} claim / damage photo`,
        note: "Load-linked claim evidence from the canonical proof folder.",
      };
    }
  }

  const registered = SAFETY_EVENT_EVIDENCE[event.eventId];
  if (registered) return registered;

  const eventPhotoUrl = String(event.eventPhotoUrl ?? "").trim();
  if (eventPhotoUrl) {
    return {
      url: eventPhotoUrl,
      label: "Safety event photo",
      note: "Photo evidence attached to the safety event record.",
    };
  }

  return null;
}

export function getSafetyEventEvidenceUrl(event: Pick<SafetyEvent, "eventId" | "eventPhotoUrl">): string | null {
  return getSafetyEventEvidence(event)?.url ?? null;
}
