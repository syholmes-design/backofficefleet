import type { BofData } from "@/lib/load-bof-data";
import type { Driver, SafetyEvent } from "@/types/safety";
import { getDriverMedicalCardStatus } from "@/lib/driver-doc-registry";

type SafetyDriverOverride = Partial<
  Pick<
    Driver,
    | "status"
    | "home_terminal"
    | "compliance_status"
    | "cdl_expiration_date"
    | "med_card_expiration_date"
    | "mvr_expiration_date"
    | "qual_file_status"
    | "safety_ack_status"
  >
>;

const SAFETY_DRIVER_OVERRIDES_BY_INDEX: SafetyDriverOverride[] = [
  {
    compliance_status: "VALID",
    cdl_expiration_date: "2028-04-12",
    med_card_expiration_date: "2027-11-01",
    mvr_expiration_date: "2026-12-15",
    qual_file_status: "Complete",
    safety_ack_status: "Signed",
  },
  {
    compliance_status: "EXPIRED",
    cdl_expiration_date: "2024-02-01",
    med_card_expiration_date: "2027-06-10",
    mvr_expiration_date: "2026-09-30",
    qual_file_status: "Complete",
    safety_ack_status: "Signed",
  },
  {
    compliance_status: "EXPIRING_SOON",
    cdl_expiration_date: "2027-03-20",
    med_card_expiration_date: "2026-05-10",
    mvr_expiration_date: "2027-01-22",
    qual_file_status: "Incomplete",
    safety_ack_status: "Pending",
  },
  {
    compliance_status: "VALID",
    cdl_expiration_date: "2027-09-01",
    med_card_expiration_date: "2027-08-15",
    mvr_expiration_date: "2024-11-30",
    qual_file_status: "Complete",
    safety_ack_status: "Signed",
  },
  {
    status: "Inactive",
    compliance_status: "VALID",
    cdl_expiration_date: "2028-01-10",
    med_card_expiration_date: "2027-04-20",
    mvr_expiration_date: "2026-11-05",
    qual_file_status: "Incomplete",
    safety_ack_status: "Pending",
  },
];

function docStatusToCompliance(raw: string | undefined): Driver["compliance_status"] {
  const s = String(raw || "").toUpperCase();
  if (s.includes("EXPIRED")) return "EXPIRED";
  if (s.includes("EXPIRING")) return "EXPIRING_SOON";
  return "VALID";
}

function inferHomeTerminal(address: string | undefined): string {
  const parts = String(address || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 3) return `${parts[1]}, ${parts[2].split(" ")[0]}`;
  return "Cleveland, OH";
}

function docFor(
  data: BofData,
  driverId: string,
  type: string
): (typeof data.documents)[number] | undefined {
  return data.documents.find((d) => d.driverId === driverId && d.type === type);
}

/** Safety drivers mapped to canonical BOF driver IDs/names. */
export function createSafetySeedDrivers(data: BofData): Driver[] {
  return data.drivers.map((base, idx) => {
    const override = SAFETY_DRIVER_OVERRIDES_BY_INDEX[idx] ?? {};
    const cdlDoc = docFor(data, base.id, "CDL");
    const medDoc = docFor(data, base.id, "Medical Card");
    const medCanon = getDriverMedicalCardStatus(data, base.id);
    const mvrDoc = docFor(data, base.id, "MVR");
    const qualDoc = docFor(data, base.id, "Qualification File");
    const ackDoc = docFor(data, base.id, "Safety Acknowledgment");

    const docCompliance = [cdlDoc?.status, medCanon.rowStatus].some((s) =>
      String(s || "").toUpperCase().includes("EXPIRED")
    )
      ? "EXPIRED"
      : [cdlDoc?.status, medCanon.rowStatus].some((s) =>
            String(s || "").toUpperCase().includes("EXPIRING")
          )
        ? "EXPIRING_SOON"
        : "VALID";

    return {
      driver_id: base.id,
      name: base.name,
      status: override.status ?? "Active",
      home_terminal: override.home_terminal ?? inferHomeTerminal(base.address),
      compliance_status: override.compliance_status ?? docCompliance,
      cdl_expiration_date: override.cdl_expiration_date ?? cdlDoc?.expirationDate ?? null,
      med_card_expiration_date:
        override.med_card_expiration_date ?? medCanon.expirationDate ?? medDoc?.expirationDate ?? null,
      mvr_expiration_date: override.mvr_expiration_date ?? mvrDoc?.expirationDate ?? null,
      qual_file_status:
        override.qual_file_status ??
        (docStatusToCompliance(qualDoc?.status) === "VALID" ? "Complete" : "Incomplete"),
      safety_ack_status:
        override.safety_ack_status ??
        (docStatusToCompliance(ackDoc?.status) === "VALID" ? "Signed" : "Pending"),
    };
  });
}

type EventTemplate = Omit<SafetyEvent, "driver_id" | "driver_name"> & {
  driverSlot: number;
};

const SAFETY_EVENT_TEMPLATES: EventTemplate[] = [
  {
    event_id: "EVT-S01",
    driverSlot: 0,
    event_type: "Hard braking — customer complaint",
    severity: "High",
    event_date: "2026-04-12T14:30:00",
    status: "Open",
    notes: "Broker flagged harsh event near receiver; video requested.",
    linked_load_id: "L002",
    evidence_image_url: "/mocks/hardbreaking.PNG",
    insurance_claim_needed: false,
    estimated_claim_exposure: 0,
  },
  {
    event_id: "EVT-S02",
    driverSlot: 1,
    event_type: "Dock strike — trailer damage",
    severity: "Critical",
    event_date: "2026-04-10T09:15:00",
    status: "Open",
    notes: "Seal intact; receiver claims impact during blind-side back.",
    linked_load_id: "L001",
    evidence_image_url: "/mocks/trailerdamage.PNG",
    insurance_claim_needed: true,
    estimated_claim_exposure: 42500,
  },
  {
    event_id: "EVT-S03",
    driverSlot: 2,
    event_type: "HOS soft violation — unassigned driving",
    severity: "Medium",
    event_date: "2026-04-08T22:00:00",
    status: "In Review",
    notes: "ELD gap 47 minutes; driver statement pending.",
    linked_load_id: "L005",
    evidence_image_url: "/mocks/hosviolation.PNG",
    insurance_claim_needed: false,
    estimated_claim_exposure: 0,
  },
  {
    event_id: "EVT-S04",
    driverSlot: 3,
    event_type: "Yard speed — geofence alert",
    severity: "Low",
    event_date: "2026-03-28T16:45:00",
    status: "Reviewed",
    notes: "Verified yard limit; coaching logged.",
    internal_notes: "Safety reviewed 4/1 — no further action.",
    linked_load_id: undefined,
    evidence_image_url: "/mocks/yardspeed.PNG",
    insurance_claim_needed: false,
    estimated_claim_exposure: 0,
  },
  {
    event_id: "EVT-S05",
    driverSlot: 0,
    event_type: "Pre-trip photo incomplete",
    severity: "Low",
    event_date: "2026-03-15T07:00:00",
    status: "Closed",
    notes: "Driver re-submitted; closed by terminal manager.",
    linked_load_id: "L003",
    evidence_image_url: "/mocks/pretripphoto.PNG",
    insurance_claim_needed: false,
    estimated_claim_exposure: 0,
  },
];

/** Safety events attached to canonical BOF drivers via driver_id. */
export function createSafetySeedEvents(drivers: Driver[]): SafetyEvent[] {
  if (drivers.length === 0) return [];
  return SAFETY_EVENT_TEMPLATES.map(({ driverSlot, ...event }) => {
    const d = drivers[Math.min(driverSlot, drivers.length - 1)];
    return {
      ...event,
      driver_id: d.driver_id,
      driver_name: d.name,
    };
  });
}
