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
  timing: string;
  consequence: string;
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
  statusReason: string;
  dispatchImpact: string;
  packetConsequence: string;
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
  reloadQualifiedRegions: string[];
  preferredReloadLanes: string[];
  backhaulReadyStatus: string;
  financeTieIn?: string;
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
    statusReason: "Ready: all dispatch, insurance, tax, authority, agreement, and settlement controls are verified.",
    dispatchImpact: "Eligible for dry-van, reefer, and L011 finance-support assignments without manager override.",
    packetConsequence: "Customer packet can be released with authority, COI, agreement, W-9 control, equipment fit, and lane qualification visible.",
    nextAction: "Prepare customer release packet for L011 factoring review and keep cargo renewal monitor active.",
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
      { id: "w9", label: "W-9", status: "ready", owner: "Finance", detail: "Tax profile verified.", timing: "Reviewed May 18, 2026", consequence: "Settlement and factoring setup can proceed without tax-document hold." },
      { id: "agreement", label: "Broker-carrier agreement", status: "ready", owner: "Legal", detail: "Signed master services agreement on file.", timing: "Annual review due Dec 31, 2026", consequence: "Carrier may be assigned freight under approved commercial terms." },
      { id: "coi", label: "Certificate of insurance", status: "ready", owner: "Compliance", detail: "Auto and cargo certificates current.", timing: "Cargo expires Nov 30, 2026", consequence: "Customer-safe packet may show active liability and cargo coverage." },
      { id: "authority", label: "Operating authority", status: "ready", owner: "Compliance", detail: "Authority active.", timing: "Checked May 21, 2026", consequence: "Dispatch can release carrier on approved interstate lanes." },
      { id: "payment", label: "Payment instructions", status: "ready", owner: "Finance", detail: "ACH profile verified.", timing: "Reviewed May 18, 2026", consequence: "Post-trip settlement can move to finance review when load proof is complete." },
    ],
    equipmentTypes: ["Dry van", "Reefer", "53 ft trailer"],
    lanes: ["VA to OH", "NC to PA", "TN to IL"],
    reloadQualifiedRegions: ["Mid-Atlantic", "Ohio Valley", "Tennessee corridor"],
    preferredReloadLanes: ["Richmond to Columbus", "Raleigh to Pittsburgh", "Nashville to Chicago"],
    backhaulReadyStatus: "Backhaul-ready for Midwest dry-van and reefer reloads after L011 packet release.",
    financeTieIn: "L011 is the clean finance story: the carrier packet supports invoice, BOL, POD, proof packet, W-9, agreement, and factoring readiness.",
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
    statusReason: "Review: cargo insurance renewal is due in 17 days and high-value freight needs compliance confirmation.",
    dispatchImpact: "Eligible for standard dry-van reloads; high-value or refrigerated freight requires manager review before release.",
    packetConsequence: "Customer packet can be previewed, but the COI card carries a renewal-watch note until the updated certificate arrives.",
    nextAction: "Confirm updated cargo certificate before high-value or refrigerated assignment.",
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
      { id: "w9", label: "W-9", status: "ready", owner: "Finance", detail: "Tax profile verified.", timing: "Reviewed May 16, 2026", consequence: "Settlement file can release once load proof is complete." },
      { id: "agreement", label: "Broker-carrier agreement", status: "ready", owner: "Legal", detail: "Agreement signed.", timing: "Review due Oct 15, 2026", consequence: "Dispatch may assign approved freight under active terms." },
      { id: "coi", label: "Certificate of insurance", status: "expiring", owner: "Compliance", detail: "Cargo renewal due soon.", timing: "Expires Jun 9, 2026", consequence: "High-value freight stays under manager review until the renewal certificate is uploaded.", dueDate: "2026-06-09" },
      { id: "authority", label: "Operating authority", status: "ready", owner: "Compliance", detail: "Authority active.", timing: "Checked May 20, 2026", consequence: "Carrier remains available for approved lanes." },
      { id: "payment", label: "Payment instructions", status: "ready", owner: "Finance", detail: "ACH profile verified.", timing: "Reviewed May 16, 2026", consequence: "No payment setup hold once proof is complete." },
    ],
    equipmentTypes: ["Dry van", "Team driver"],
    lanes: ["VA to IL", "OH to TN", "KY to GA"],
    reloadQualifiedRegions: ["Appalachia", "Ohio Valley", "Mid-South"],
    preferredReloadLanes: ["Roanoke to Chicago", "Cincinnati to Nashville", "Louisville to Atlanta"],
    backhaulReadyStatus: "Backhaul-ready for standard dry-van reloads; manager review before high-value cargo.",
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
    statusReason: "Blocked: auto liability certificate expired 13 days ago and the updated broker-carrier agreement is unsigned.",
    dispatchImpact: "Carrier is blocked from all dispatch assignments until insurance and agreement controls clear.",
    packetConsequence: "Customer packet cannot be released because the COI and agreement cards would show blocking failures.",
    nextAction: "Resolve insurance hold and obtain signed agreement before dispatch.",
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
      { id: "w9", label: "W-9", status: "ready", owner: "Finance", detail: "Tax profile verified.", timing: "Reviewed May 13, 2026", consequence: "Finance setup is not the blocker." },
      { id: "agreement", label: "Broker-carrier agreement", status: "blocked", owner: "Legal", detail: "Updated agreement not signed.", timing: "Past due May 15, 2026", consequence: "Carrier cannot receive new tenders until signed terms are on file." },
      { id: "coi", label: "Certificate of insurance", status: "blocked", owner: "Compliance", detail: "Auto liability expired.", timing: "Expired May 10, 2026", consequence: "BOF blocks all dispatch release to prevent uncovered operating exposure.", dueDate: "2026-05-10" },
      { id: "authority", label: "Operating authority", status: "ready", owner: "Compliance", detail: "Authority active.", timing: "Checked May 22, 2026", consequence: "Authority is clean, but insurance and agreement gates still block dispatch." },
      { id: "payment", label: "Payment instructions", status: "ready", owner: "Finance", detail: "ACH profile verified.", timing: "Reviewed May 13, 2026", consequence: "Payment setup can resume after the dispatch block clears." },
    ],
    equipmentTypes: ["Flatbed", "Conestoga"],
    lanes: ["OH to PA", "IN to MO", "KY to NC"],
    reloadQualifiedRegions: ["Great Lakes", "Midwest industrial corridor"],
    preferredReloadLanes: ["Columbus to Pittsburgh", "Indianapolis to St. Louis", "Louisville to Charlotte"],
    backhaulReadyStatus: "Not backhaul-ready until COI and agreement holds are cleared.",
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
    statusReason: "Watch: repeated POD delays on refrigerated loads and a conditional safety review require manager signoff.",
    dispatchImpact: "Reefer assignments remain possible only after manager review confirms proof timing and safety plan.",
    packetConsequence: "Customer packet may be shared with a proof-timeliness note; dispatch should not promise clean POD timing without review.",
    nextAction: "Review POD timeliness pattern before assigning another refrigerated customer load.",
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
      { id: "w9", label: "W-9", status: "ready", owner: "Finance", detail: "Tax profile verified.", timing: "Reviewed May 12, 2026", consequence: "No tax-document hold on settlement." },
      { id: "agreement", label: "Broker-carrier agreement", status: "ready", owner: "Legal", detail: "Agreement signed.", timing: "Review due Jan 31, 2027", consequence: "Commercial terms support refrigerated assignments." },
      { id: "coi", label: "Certificate of insurance", status: "ready", owner: "Compliance", detail: "Insurance current.", timing: "Expires Jan 31, 2027", consequence: "Insurance is not blocking, but safety review still controls dispatch release." },
      { id: "authority", label: "Operating authority", status: "review", owner: "Compliance", detail: "Conditional safety review active.", timing: "Manager review open May 19, 2026", consequence: "BOF requires manager signoff before another refrigerated load is released." },
      { id: "payment", label: "Payment instructions", status: "ready", owner: "Finance", detail: "ACH profile verified.", timing: "Reviewed May 12, 2026", consequence: "Payment setup is clean when proof arrives on time." },
    ],
    equipmentTypes: ["Reefer", "Temperature monitored"],
    lanes: ["GA to FL", "TN to TX", "NC to LA"],
    reloadQualifiedRegions: ["Southeast refrigerated", "Gulf corridor"],
    preferredReloadLanes: ["Atlanta to Orlando", "Nashville to Dallas", "Charlotte to New Orleans"],
    backhaulReadyStatus: "Backhaul-qualified only after manager confirms POD timing and safety review path.",
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
    statusReason: "Review: W-9 is missing and ACH verification is pending, creating a payment and settlement release hold.",
    dispatchImpact: "Carrier may be considered for low-risk dry-van reloads only with manager approval and finance hold visibility.",
    packetConsequence: "Customer packet can show authority and insurance, but finance controls remain internal review items until W-9 and ACH are complete.",
    nextAction: "Collect W-9 and verify ACH before assigning payment-sensitive freight.",
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
      { id: "w9", label: "W-9", status: "blocked", owner: "Finance", detail: "W-9 missing.", timing: "Required before settlement release", consequence: "Settlement and factoring handoff cannot close without tax documentation." },
      { id: "agreement", label: "Broker-carrier agreement", status: "ready", owner: "Legal", detail: "Agreement signed.", timing: "Review due Aug 31, 2026", consequence: "Terms are available, but finance controls still require review." },
      { id: "coi", label: "Certificate of insurance", status: "ready", owner: "Compliance", detail: "Insurance current.", timing: "Expires Aug 31, 2026", consequence: "Insurance does not block dispatch." },
      { id: "authority", label: "Operating authority", status: "ready", owner: "Compliance", detail: "Authority active.", timing: "Checked May 21, 2026", consequence: "Authority supports approved dry-van and power-only lanes." },
      { id: "payment", label: "Payment instructions", status: "review", owner: "Finance", detail: "ACH verification pending.", timing: "Review due May 24, 2026", consequence: "BOF flags settlement timing risk until payment controls clear." },
    ],
    equipmentTypes: ["Dry van", "Power only"],
    lanes: ["IN to OH", "IL to MI", "KY to WI"],
    reloadQualifiedRegions: ["Indiana hub", "Great Lakes", "Upper Midwest"],
    preferredReloadLanes: ["Indianapolis to Columbus", "Chicago to Detroit", "Louisville to Milwaukee"],
    backhaulReadyStatus: "Backhaul candidate for power-only moves after W-9 and ACH controls clear.",
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

export function getCarrierForLoad(loadId: string): CarrierRecord {
  return carrierRegistry.find((carrier) => carrier.recentLoads.includes(loadId)) ?? carrierRegistry[0]!;
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
    return `${carrier.dispatchImpact} BOF can release this carrier because authority, insurance, tax, payment, and agreement controls are satisfied.`;
  }

  if (carrier.dispatchEligibility === "Dispatch blocked") {
    return `${carrier.dispatchImpact} BOF blocks dispatch until the packet owner closes every blocking carrier control.`;
  }

  return `${carrier.dispatchImpact} BOF keeps this carrier visible for planning, but requires manager review before dispatch because at least one packet, authority, insurance, or payment control needs attention.`;
}
