export type CarrierReadinessStatus = "Ready" | "Review" | "Watch" | "Blocked";
export type CarrierPacketItemStatus = "ready" | "review" | "blocked" | "expiring";
export type CarrierAuthorityStatus = "active" | "review" | "blocked";
export type CarrierInsuranceStatus = "current" | "renewal_watch" | "expired" | "missing";

export type CarrierPacketItem = {
  id: string;
  label: string;
  status: CarrierPacketItemStatus;
  owner: string;
  detail: string;
  dueDate?: string;
};

export type CarrierInsurancePolicy = {
  type: "Auto Liability" | "Cargo" | "General Liability" | "Workers Comp";
  status: CarrierInsuranceStatus;
  limit: string;
  insurer: string;
  expirationDate: string;
  certificateOnFile: boolean;
};

export type CarrierRecord = {
  id: string;
  legalName: string;
  dba: string;
  dotNumber: string;
  mcNumber: string;
  homeTerminal: string;
  primaryContact: {
    name: string;
    role: string;
    phone: string;
    email: string;
  };
  readinessStatus: CarrierReadinessStatus;
  readinessScore: number;
  dispatchEligibility: "Eligible" | "Eligible with review" | "Manager review required" | "Dispatch blocked";
  nextAction: string;
  authority: {
    status: CarrierAuthorityStatus;
    authorityType: string;
    lastChecked: string;
    safetyRating: "Satisfactory" | "Conditional" | "Unrated" | "Review";
    notes: string;
  };
  insurance: CarrierInsurancePolicy[];
  packetItems: CarrierPacketItem[];
  equipmentTypes: string[];
  lanes: string[];
  recentLoads: string[];
  riskFlags: string[];
  managerOwner: string;
};

export type CarrierRegistryStats = {
  total: number;
  ready: number;
  review: number;
  watch: number;
  blocked: number;
  expiringInsurance: number;
  dispatchEligible: number;
};

export const carrierRegistry: CarrierRecord[] = [
  {
    id: "CAR-001",
    legalName: "Delta Advanced Trucking, Inc.",
    dba: "Delta Advanced Trucking",
    dotNumber: "DOT-2481936",
    mcNumber: "MC-874201",
    homeTerminal: "Richmond, VA",
    primaryContact: {
      name: "Renee Collins",
      role: "Fleet Operations Manager",
      phone: "(804) 555-0148",
      email: "rcollins@deltaadvancedtransport.com",
    },
    readinessStatus: "Ready",
    readinessScore: 96,
    dispatchEligibility: "Eligible",
    nextAction: "Keep renewal monitor active for cargo policy review.",
    authority: {
      status: "active",
      authorityType: "Motor carrier property authority",
      lastChecked: "2026-05-21",
      safetyRating: "Satisfactory",
      notes: "Authority active and operating profile matches assigned lanes.",
    },
    insurance: [
      {
        type: "Auto Liability",
        status: "current",
        limit: "$1,000,000",
        insurer: "NorthStar Commercial Insurance",
        expirationDate: "2026-12-31",
        certificateOnFile: true,
      },
      {
        type: "Cargo",
        status: "current",
        limit: "$250,000",
        insurer: "NorthStar Commercial Insurance",
        expirationDate: "2026-11-30",
        certificateOnFile: true,
      },
    ],
    packetItems: [
      { id: "w9", label: "W-9", status: "ready", owner: "Finance", detail: "Tax profile verified." },
      { id: "agreement", label: "Broker-carrier agreement", status: "ready", owner: "Legal", detail: "Signed master services agreement on file." },
      { id: "coi", label: "Certificate of insurance", status: "ready", owner: "Compliance", detail: "Auto and cargo certificates current." },
      { id: "authority", label: "Operating authority", status: "ready", owner: "Compliance", detail: "Authority active." },
      { id: "payment", label: "Payment instructions", status: "ready", owner: "Finance", detail: "ACH profile verified." },
    ],
    equipmentTypes: ["Dry van", "Reefer", "53 ft trailer"],
    lanes: ["VA to OH", "NC to PA", "TN to IL"],
    recentLoads: ["L004", "L009", "L011"],
    riskFlags: [],
    managerOwner: "Renee Collins",
  },
  {
    id: "CAR-002",
    legalName: "Blue Ridge Dedicated Logistics LLC",
    dba: "Blue Ridge Dedicated",
    dotNumber: "DOT-3184720",
    mcNumber: "MC-1129084",
    homeTerminal: "Roanoke, VA",
    primaryContact: {
      name: "Caleb Morris",
      role: "Carrier Relations",
      phone: "(540) 555-0182",
      email: "cmorris@brdedicated.com",
    },
    readinessStatus: "Review",
    readinessScore: 82,
    dispatchEligibility: "Eligible with review",
    nextAction: "Confirm updated cargo certificate before high-value freight.",
    authority: {
      status: "active",
      authorityType: "Motor carrier property authority",
      lastChecked: "2026-05-20",
      safetyRating: "Satisfactory",
      notes: "Authority active. Cargo certificate is inside 30-day renewal window.",
    },
    insurance: [
      {
        type: "Auto Liability",
        status: "current",
        limit: "$1,000,000",
        insurer: "Piedmont Mutual",
        expirationDate: "2026-10-15",
        certificateOnFile: true,
      },
      {
        type: "Cargo",
        status: "renewal_watch",
        limit: "$100,000",
        insurer: "Piedmont Mutual",
        expirationDate: "2026-06-09",
        certificateOnFile: true,
      },
    ],
    packetItems: [
      { id: "w9", label: "W-9", status: "ready", owner: "Finance", detail: "Tax profile verified." },
      { id: "agreement", label: "Broker-carrier agreement", status: "ready", owner: "Legal", detail: "Agreement signed." },
      { id: "coi", label: "Certificate of insurance", status: "expiring", owner: "Compliance", detail: "Cargo renewal due soon.", dueDate: "2026-06-09" },
      { id: "authority", label: "Operating authority", status: "ready", owner: "Compliance", detail: "Authority active." },
      { id: "payment", label: "Payment instructions", status: "ready", owner: "Finance", detail: "ACH profile verified." },
    ],
    equipmentTypes: ["Dry van", "Team driver"],
    lanes: ["VA to IL", "OH to TN", "KY to GA"],
    recentLoads: ["L002", "L006"],
    riskFlags: ["Cargo policy renewal due"],
    managerOwner: "Sophia Howard",
  },
  {
    id: "CAR-003",
    legalName: "Iron Mile Transport Group LLC",
    dba: "Iron Mile",
    dotNumber: "DOT-4059182",
    mcNumber: "MC-1502241",
    homeTerminal: "Columbus, OH",
    primaryContact: {
      name: "Nadia Perez",
      role: "Compliance Lead",
      phone: "(614) 555-0190",
      email: "nperez@ironmiletransport.com",
    },
    readinessStatus: "Blocked",
    readinessScore: 54,
    dispatchEligibility: "Dispatch blocked",
    nextAction: "Upload current auto liability COI and signed agreement before dispatch.",
    authority: {
      status: "active",
      authorityType: "Motor carrier property authority",
      lastChecked: "2026-05-22",
      safetyRating: "Review",
      notes: "Authority active, but insurance certificate has expired.",
    },
    insurance: [
      {
        type: "Auto Liability",
        status: "expired",
        limit: "$1,000,000",
        insurer: "Midwest Risk Partners",
        expirationDate: "2026-05-10",
        certificateOnFile: true,
      },
      {
        type: "Cargo",
        status: "current",
        limit: "$100,000",
        insurer: "Midwest Risk Partners",
        expirationDate: "2026-09-30",
        certificateOnFile: true,
      },
    ],
    packetItems: [
      { id: "w9", label: "W-9", status: "ready", owner: "Finance", detail: "Tax profile verified." },
      { id: "agreement", label: "Broker-carrier agreement", status: "blocked", owner: "Legal", detail: "Updated agreement not signed." },
      { id: "coi", label: "Certificate of insurance", status: "blocked", owner: "Compliance", detail: "Auto liability expired.", dueDate: "2026-05-10" },
      { id: "authority", label: "Operating authority", status: "ready", owner: "Compliance", detail: "Authority active." },
      { id: "payment", label: "Payment instructions", status: "ready", owner: "Finance", detail: "ACH profile verified." },
    ],
    equipmentTypes: ["Flatbed", "Conestoga"],
    lanes: ["OH to PA", "IN to MO", "KY to NC"],
    recentLoads: [],
    riskFlags: ["Expired auto liability", "Unsigned agreement"],
    managerOwner: "Luis Alvarez",
  },
  {
    id: "CAR-004",
    legalName: "Southern Cross Refrigerated Inc.",
    dba: "Southern Cross Reefer",
    dotNumber: "DOT-2870144",
    mcNumber: "MC-934720",
    homeTerminal: "Atlanta, GA",
    primaryContact: {
      name: "Tanya Brooks",
      role: "Dispatch Manager",
      phone: "(404) 555-0137",
      email: "tbrooks@southerncrossreefer.com",
    },
    readinessStatus: "Watch",
    readinessScore: 74,
    dispatchEligibility: "Manager review required",
    nextAction: "Manager approval required after recent late POD pattern.",
    authority: {
      status: "review",
      authorityType: "Motor carrier property authority",
      lastChecked: "2026-05-19",
      safetyRating: "Conditional",
      notes: "Authority active. Safety and proof timeliness require manager review.",
    },
    insurance: [
      {
        type: "Auto Liability",
        status: "current",
        limit: "$1,000,000",
        insurer: "Atlantic Specialty",
        expirationDate: "2027-01-31",
        certificateOnFile: true,
      },
      {
        type: "Cargo",
        status: "current",
        limit: "$250,000",
        insurer: "Atlantic Specialty",
        expirationDate: "2027-01-31",
        certificateOnFile: true,
      },
    ],
    packetItems: [
      { id: "w9", label: "W-9", status: "ready", owner: "Finance", detail: "Tax profile verified." },
      { id: "agreement", label: "Broker-carrier agreement", status: "ready", owner: "Legal", detail: "Agreement signed." },
      { id: "coi", label: "Certificate of insurance", status: "ready", owner: "Compliance", detail: "Insurance current." },
      { id: "authority", label: "Operating authority", status: "review", owner: "Compliance", detail: "Conditional safety review active." },
      { id: "payment", label: "Payment instructions", status: "ready", owner: "Finance", detail: "ACH profile verified." },
    ],
    equipmentTypes: ["Reefer", "Temperature monitored"],
    lanes: ["GA to FL", "TN to TX", "NC to LA"],
    recentLoads: ["L008"],
    riskFlags: ["Late POD pattern", "Conditional safety review"],
    managerOwner: "Kara Morales",
  },
  {
    id: "CAR-005",
    legalName: "Prairie Line Hauling LLC",
    dba: "Prairie Line",
    dotNumber: "DOT-3650091",
    mcNumber: "MC-1287719",
    homeTerminal: "Indianapolis, IN",
    primaryContact: {
      name: "Owen Tate",
      role: "Owner",
      phone: "(317) 555-0164",
      email: "otate@prairielinehauling.com",
    },
    readinessStatus: "Review",
    readinessScore: 68,
    dispatchEligibility: "Manager review required",
    nextAction: "Collect W-9 and verify ACH before payment release.",
    authority: {
      status: "active",
      authorityType: "Motor carrier property authority",
      lastChecked: "2026-05-21",
      safetyRating: "Unrated",
      notes: "Newer carrier profile. Authority active; payment packet incomplete.",
    },
    insurance: [
      {
        type: "Auto Liability",
        status: "current",
        limit: "$1,000,000",
        insurer: "Hoosier Commercial Risk",
        expirationDate: "2026-08-31",
        certificateOnFile: true,
      },
      {
        type: "Cargo",
        status: "current",
        limit: "$100,000",
        insurer: "Hoosier Commercial Risk",
        expirationDate: "2026-08-31",
        certificateOnFile: true,
      },
    ],
    packetItems: [
      { id: "w9", label: "W-9", status: "blocked", owner: "Finance", detail: "W-9 missing." },
      { id: "agreement", label: "Broker-carrier agreement", status: "ready", owner: "Legal", detail: "Agreement signed." },
      { id: "coi", label: "Certificate of insurance", status: "ready", owner: "Compliance", detail: "Insurance current." },
      { id: "authority", label: "Operating authority", status: "ready", owner: "Compliance", detail: "Authority active." },
      { id: "payment", label: "Payment instructions", status: "review", owner: "Finance", detail: "ACH verification pending." },
    ],
    equipmentTypes: ["Dry van", "Power only"],
    lanes: ["IN to OH", "IL to MI", "KY to WI"],
    recentLoads: ["L010", "L012"],
    riskFlags: ["W-9 missing", "ACH review pending"],
    managerOwner: "Jalen Turner",
  },
];

export function getCarrierRegistry(): CarrierRecord[] {
  return carrierRegistry;
}

export function getCarrierById(carrierId: string): CarrierRecord | undefined {
  return carrierRegistry.find((carrier) => carrier.id.toLowerCase() === carrierId.toLowerCase());
}

export function getCarrierPacketSummary(carrier: CarrierRecord) {
  const total = carrier.packetItems.length;
  const ready = carrier.packetItems.filter((item) => item.status === "ready").length;
  const blocked = carrier.packetItems.filter((item) => item.status === "blocked").length;
  const review = carrier.packetItems.filter((item) => item.status === "review").length;
  const expiring = carrier.packetItems.filter((item) => item.status === "expiring").length;
  const percent = total === 0 ? 0 : Math.round((ready / total) * 100);

  return { total, ready, blocked, review, expiring, percent };
}

export function getCarrierRegistryStats(carriers: CarrierRecord[] = carrierRegistry): CarrierRegistryStats {
  return {
    total: carriers.length,
    ready: carriers.filter((carrier) => carrier.readinessStatus === "Ready").length,
    review: carriers.filter((carrier) => carrier.readinessStatus === "Review").length,
    watch: carriers.filter((carrier) => carrier.readinessStatus === "Watch").length,
    blocked: carriers.filter((carrier) => carrier.readinessStatus === "Blocked").length,
    expiringInsurance: carriers.filter((carrier) =>
      carrier.insurance.some((policy) => policy.status === "renewal_watch" || policy.status === "expired" || policy.status === "missing")
    ).length,
    dispatchEligible: carriers.filter((carrier) => carrier.dispatchEligibility === "Eligible").length,
  };
}

export function getCarrierStatusTone(status: CarrierReadinessStatus): "ready" | "review" | "watch" | "blocked" {
  if (status === "Ready") return "ready";
  if (status === "Blocked") return "blocked";
  if (status === "Watch") return "watch";
  return "review";
}

export function getCarrierDispatchExplanation(carrier: CarrierRecord): string {
  if (carrier.dispatchEligibility === "Eligible") {
    return "BOF can release this carrier for eligible loads because authority, insurance, tax, payment, and agreement controls are satisfied.";
  }

  if (carrier.dispatchEligibility === "Dispatch blocked") {
    return "BOF blocks dispatch until the packet owner closes every blocking carrier control. This prevents expired insurance, unsigned agreements, or payment gaps from entering live operations.";
  }

  return "BOF keeps this carrier visible for planning, but requires manager review before dispatch because at least one packet, authority, insurance, or payment control needs attention.";
}
