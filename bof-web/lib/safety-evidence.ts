export type SafetyEvidenceItem = {
  id: string;
  driverId: string;
  driverName: string;
  label: string;
  violationCode?: string;
  severity: "low" | "medium" | "high";
  type:
    | "tire_inspection"
    | "hos_violation"
    | "cargo_damage"
    | "brake_inspection"
    | "safety_equipment"
    | "logbook_review";
  url: string;
  note: string;
  date: string;
  location?: string;
  loadId?: string;
};

export const safetyEvidenceItems: readonly SafetyEvidenceItem[] = [
  {
    id: "EVID-DRV-004-B102-TIRE",
    driverId: "DRV-004",
    driverName: "Priya Patel",
    loadId: "L004",
    label: "B-102 Tires",
    violationCode: "B-102",
    severity: "medium",
    type: "tire_inspection",
    url: "/evidence/safety/b102-tires-irregular-wear.png",
    note: "Tire inspection failed — irregular wear detected.",
    date: "2026-04-02",
    location: "Atlanta, GA",
  },
  {
    id: "EVID-DRV-004-TREAD",
    driverId: "DRV-004",
    driverName: "Priya Patel",
    loadId: "L004",
    label: "Pre-Trip Tire Inspection",
    severity: "medium",
    type: "tire_inspection",
    url: "/evidence/safety/pre-trip-tire-tread-depth.png",
    note: "Tire tread depth below minimum requirement.",
    date: "2026-04-02",
    location: "Atlanta, GA",
  },
  {
    id: "EVID-DRV-004-CARGO",
    driverId: "DRV-004",
    driverName: "Priya Patel",
    loadId: "L004",
    label: "Cargo Damage",
    severity: "medium",
    type: "cargo_damage",
    url: "/evidence/safety/cargo-damage-punctured-box.png",
    note: "Box punctured and product damaged.",
    date: "2026-04-02",
    location: "Atlanta, GA",
  },
  {
    id: "EVID-DRV-004-EXTINGUISHER",
    driverId: "DRV-004",
    driverName: "Priya Patel",
    loadId: "L004",
    label: "Safety Equipment Inspection",
    severity: "medium",
    type: "safety_equipment",
    url: "/evidence/safety/safety-equipment-fire-extinguisher-tag.png",
    note: "Fire extinguisher inspection tag expired.",
    date: "2026-04-02",
    location: "Atlanta, GA",
  },
  {
    id: "EVID-DRV-008-L405-HOS",
    driverId: "DRV-008",
    driverName: "Liam Smith",
    loadId: "L008",
    label: "L-405 HOS",
    violationCode: "L-405",
    severity: "high",
    type: "hos_violation",
    url: "/evidence/safety/l_smith_l405_hos_violation_eld.svg",
    note: "Hours of Service violation — daily driving limit exceeded.",
    date: "2026-04-01",
    location: "Memphis, TN",
  },
  {
    id: "EVID-DRV-008-LOGBOOK",
    driverId: "DRV-008",
    driverName: "Liam Smith",
    loadId: "L008",
    label: "Logbook Review",
    severity: "high",
    type: "logbook_review",
    url: "/evidence/safety/l_smith_logbook_review_violation.svg",
    note: "Logbook review identified required reset / violation.",
    date: "2026-04-01",
    location: "Memphis, TN",
  },
  {
    id: "EVID-DRV-008-BRAKES",
    driverId: "DRV-008",
    driverName: "Liam Smith",
    loadId: "L008",
    label: "Trailer Brake Inspection",
    severity: "high",
    type: "brake_inspection",
    url: "/evidence/safety/l_smith_trailer_brake_inspection.svg",
    note: "Brake lining worn below minimum standard.",
    date: "2026-04-01",
    location: "Memphis, TN",
  },
  {
    id: "EVID-DRV-008-CARGO",
    driverId: "DRV-008",
    driverName: "Liam Smith",
    loadId: "L008",
    label: "Cargo Damage",
    severity: "high",
    type: "cargo_damage",
    url: "/evidence/safety/l_smith_cargo_damage_pallet_wrap.svg",
    note: "Significant cargo damage / damaged wrapped pallet.",
    date: "2026-04-01",
    location: "Memphis, TN",
  },
];

export function getSafetyEvidenceByDriverId(driverId: string) {
  return safetyEvidenceItems.filter((item) => item.driverId === driverId);
}

export function getSafetyEvidenceCountByDriverId(driverId: string) {
  return getSafetyEvidenceByDriverId(driverId).length;
}

export function getSafetyEvidenceByLoadId(loadId: string) {
  return safetyEvidenceItems.filter((item) => item.loadId === loadId);
}
