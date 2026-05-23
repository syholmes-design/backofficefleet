export type CarrierPacketEvidenceVisibility = "customer_visible" | "internal_only" | "sensitive_masked";
export type CarrierPacketEvidenceStatus = "Current" | "Verified" | "Active" | "Ready";

export type CarrierPacketEvidenceField = {
  label: string;
  value: string;
  masked?: boolean;
};

export type CarrierPacketEvidenceSection = {
  title: string;
  items: string[];
};

export type CarrierPacketEvidence = {
  carrierId: string;
  id: string;
  title: string;
  packetRole: string;
  status: CarrierPacketEvidenceStatus;
  visibility: CarrierPacketEvidenceVisibility;
  reviewDate: string;
  expirationOrReview: string;
  dispatchRelevance: string;
  financeRelevance: string;
  consequenceIfMissing: string;
  customerSafeSummary: string;
  fields: CarrierPacketEvidenceField[];
  sections: CarrierPacketEvidenceSection[];
};

const car001Evidence: CarrierPacketEvidence[] = [
  {
    carrierId: "CAR-001",
    id: "certificate-of-insurance",
    title: "Certificate of Insurance Preview",
    packetRole: "Verifies liability and cargo coverage before carrier release.",
    status: "Current",
    visibility: "customer_visible",
    reviewDate: "May 21, 2026",
    expirationOrReview: "Auto liability expires Dec 31, 2026; cargo expires Nov 30, 2026",
    dispatchRelevance: "Dispatch may assign Delta Advanced Trucking to dry-van, reefer, and L011 finance-support moves.",
    financeRelevance: "Factoring and customer release can show active insurance without exposing internal payment records.",
    consequenceIfMissing: "BOF would hold dispatch release and block customer packet publication until a current COI is uploaded.",
    customerSafeSummary: "Auto liability and cargo coverage are current, certificate is on file, and coverage limits meet the demo packet standard.",
    fields: [
      { label: "Insured carrier", value: "Delta Advanced Trucking, Inc." },
      { label: "Auto liability", value: "$1,000,000 - NorthStar Commercial Insurance" },
      { label: "Cargo coverage", value: "$250,000 - NorthStar Commercial Insurance" },
      { label: "Certificate holder", value: "BackOfficeFleet managed operations file" },
      { label: "Certificate status", value: "Current / on file" },
    ],
    sections: [
      {
        title: "BOF control checks",
        items: [
          "Carrier name matches registry legal entity.",
          "Coverage limits satisfy customer-safe packet requirements.",
          "Expiration monitor is active for cargo renewal.",
          "No insurance hold applies to L011 packet release.",
        ],
      },
    ],
  },
  {
    carrierId: "CAR-001",
    id: "w9-masked",
    title: "W-9 Preview - Masked",
    packetRole: "Confirms tax profile is verified while keeping sensitive identifiers internal.",
    status: "Verified",
    visibility: "sensitive_masked",
    reviewDate: "May 18, 2026",
    expirationOrReview: "Annual finance review due Dec 31, 2026",
    dispatchRelevance: "W-9 readiness does not affect load movement, but it prevents downstream settlement friction.",
    financeRelevance: "Supports L011 factoring readiness because tax documentation is verified before payment release.",
    consequenceIfMissing: "BOF would allow operations to see the carrier but would flag settlement and factoring release risk.",
    customerSafeSummary: "Tax form is verified; EIN and signature details remain masked outside finance controls.",
    fields: [
      { label: "Entity", value: "Delta Advanced Trucking, Inc." },
      { label: "Tax classification", value: "Corporation" },
      { label: "EIN", value: "**-***9214", masked: true },
      { label: "Finance status", value: "Verified" },
      { label: "Customer-safe exposure", value: "Masked tax identifiers only" },
    ],
    sections: [
      {
        title: "Finance controls",
        items: [
          "Finance verified tax profile before L011 settlement handoff.",
          "Masked W-9 can be referenced in packet readiness without exposing tax ID.",
          "ACH details remain outside the customer-safe packet.",
        ],
      },
    ],
  },
  {
    carrierId: "CAR-001",
    id: "operating-authority",
    title: "Operating Authority Snapshot",
    packetRole: "Shows operating authority, DOT/MC identity, and safety rating used by dispatch.",
    status: "Active",
    visibility: "customer_visible",
    reviewDate: "May 21, 2026",
    expirationOrReview: "Authority check refreshed May 21, 2026",
    dispatchRelevance: "Authority is active and matches the carrier profile used for interstate dispatch.",
    financeRelevance: "Supports customer release and factoring packet credibility by confirming the carrier was eligible to move freight.",
    consequenceIfMissing: "BOF would require compliance review before assigning freight or publishing a customer packet.",
    customerSafeSummary: "Authority active, safety rating satisfactory, DOT and MC match the carrier registry.",
    fields: [
      { label: "DOT", value: "DOT-2481936" },
      { label: "MC", value: "MC-874201" },
      { label: "Authority type", value: "Motor carrier property authority" },
      { label: "Safety rating", value: "Satisfactory" },
      { label: "Last BOF check", value: "May 21, 2026" },
    ],
    sections: [
      {
        title: "Dispatch checks",
        items: [
          "Authority status is active.",
          "Operating profile matches approved lanes.",
          "No authority hold blocks L011 finance packet release.",
        ],
      },
    ],
  },
  {
    carrierId: "CAR-001",
    id: "broker-carrier-agreement",
    title: "Broker-Carrier Agreement Preview",
    packetRole: "Confirms active contractual terms before freight assignment and payment release.",
    status: "Active",
    visibility: "internal_only",
    reviewDate: "May 18, 2026",
    expirationOrReview: "Annual review due Dec 31, 2026",
    dispatchRelevance: "Dispatch can assign loads because active carrier terms are on file.",
    financeRelevance: "Factoring and settlement teams can reference active terms without exposing commercial details to customers.",
    consequenceIfMissing: "BOF would block dispatch release or require legal override before assigning new freight.",
    customerSafeSummary: "Agreement is active; commercial terms remain internal.",
    fields: [
      { label: "Agreement party", value: "Delta Advanced Trucking, Inc." },
      { label: "Agreement status", value: "Active" },
      { label: "Review owner", value: "Legal / carrier relations" },
      { label: "Commercial terms", value: "Internal only", masked: true },
      { label: "Packet role", value: "Dispatch and settlement authorization" },
    ],
    sections: [
      {
        title: "Agreement controls",
        items: [
          "Signed agreement is on file.",
          "Terms support L011 finance handoff.",
          "Customer-safe packet shows agreement presence, not confidential terms.",
        ],
      },
    ],
  },
  {
    carrierId: "CAR-001",
    id: "safety-compliance-profile",
    title: "Safety / Compliance Profile",
    packetRole: "Summarizes compliance posture for dispatch and customer-safe release.",
    status: "Verified",
    visibility: "customer_visible",
    reviewDate: "May 21, 2026",
    expirationOrReview: "Next profile review due Jun 21, 2026",
    dispatchRelevance: "No active safety hold prevents assignment to the L011 finance-ready load story.",
    financeRelevance: "Clean compliance posture reduces claim or customer release friction after delivery.",
    consequenceIfMissing: "BOF would require manager review before using the carrier on customer-sensitive freight.",
    customerSafeSummary: "Safety rating satisfactory, no active carrier packet flags, compliance profile reviewed.",
    fields: [
      { label: "Safety rating", value: "Satisfactory" },
      { label: "Open carrier flags", value: "None" },
      { label: "Compliance owner", value: "Renee Collins" },
      { label: "Last review", value: "May 21, 2026" },
      { label: "Dispatch gate", value: "Eligible" },
    ],
    sections: [
      {
        title: "Compliance signals",
        items: [
          "No active authority, safety, or insurance blocks.",
          "Carrier remains eligible for approved lanes and equipment types.",
          "Profile supports customer-safe packet release.",
        ],
      },
    ],
  },
  {
    carrierId: "CAR-001",
    id: "equipment-lane-qualification",
    title: "Equipment and Lane Qualification Sheet",
    packetRole: "Connects carrier capability to dispatch assignment and reload planning.",
    status: "Ready",
    visibility: "customer_visible",
    reviewDate: "May 21, 2026",
    expirationOrReview: "Lane review due Jun 30, 2026",
    dispatchRelevance: "Eligible for dry van, reefer, and 53 ft trailer assignments across approved lanes.",
    financeRelevance: "Supports customer release by showing the carrier was qualified for the equipment and lane used.",
    consequenceIfMissing: "BOF would require dispatcher review before assigning equipment-specific or customer-sensitive freight.",
    customerSafeSummary: "Equipment, lane, and reload readiness align with CAR-001 and L011 packet requirements.",
    fields: [
      { label: "Equipment", value: "Dry van, reefer, 53 ft trailer" },
      { label: "Approved lanes", value: "VA to OH, NC to PA, TN to IL" },
      { label: "Reload regions", value: "Mid-Atlantic, Ohio Valley, Tennessee corridor" },
      { label: "Backhaul status", value: "Backhaul-ready after L011 packet release" },
      { label: "Customer release", value: "Qualified" },
    ],
    sections: [
      {
        title: "Reload bridge",
        items: [
          "Richmond to Columbus reload-qualified.",
          "Raleigh to Pittsburgh reload-qualified.",
          "Nashville to Chicago reload-qualified.",
          "No live reload marketplace integration is attached to this packet.",
        ],
      },
    ],
  },
  {
    carrierId: "CAR-001",
    id: "customer-safe-packet-summary",
    title: "Customer-Safe Packet Summary",
    packetRole: "Combines public-facing readiness controls into one release view.",
    status: "Ready",
    visibility: "customer_visible",
    reviewDate: "May 21, 2026",
    expirationOrReview: "Refresh on next packet change or monthly compliance review",
    dispatchRelevance: "Dispatcher can share the packet summary when the customer asks why this carrier is eligible.",
    financeRelevance: "L011 factoring handoff can reference a complete packet without exposing tax or payment details.",
    consequenceIfMissing: "Customer release would rely on scattered documents instead of one controlled packet narrative.",
    customerSafeSummary: "CAR-001 is complete enough for customer release, finance review, and L011 factoring support.",
    fields: [
      { label: "Packet status", value: "Ready" },
      { label: "Customer-visible docs", value: "COI, authority, safety profile, equipment/lane qualification" },
      { label: "Masked docs", value: "W-9 verified with EIN hidden" },
      { label: "Internal-only docs", value: "Broker-carrier agreement terms, ACH/payment details" },
      { label: "L011 finance tie-in", value: "Factoring packet supported" },
    ],
    sections: [
      {
        title: "Release summary",
        items: [
          "Insurance and authority are current.",
          "W-9 is verified but masked for customer-safe review.",
          "Agreement is active and commercial terms remain internal.",
          "Equipment and lane qualifications support the assigned work.",
          "Packet is ready to support L011 finance/factoring review.",
        ],
      },
    ],
  },
];

const evidenceByCarrier: Record<string, CarrierPacketEvidence[]> = {
  "CAR-001": car001Evidence,
};

export function getCarrierPacketEvidence(carrierId: string): CarrierPacketEvidence[] {
  return evidenceByCarrier[carrierId.toUpperCase()] ?? [];
}

export function getCarrierPacketEvidenceById(carrierId: string, evidenceId: string): CarrierPacketEvidence | undefined {
  return getCarrierPacketEvidence(carrierId).find((evidence) => evidence.id === evidenceId);
}

export function getAllCarrierPacketEvidenceParams() {
  return Object.entries(evidenceByCarrier).flatMap(([carrierId, records]) =>
    records.map((evidence) => ({ carrierId, evidenceId: evidence.id }))
  );
}

export function formatEvidenceVisibility(visibility: CarrierPacketEvidenceVisibility): string {
  if (visibility === "customer_visible") return "Customer-visible";
  if (visibility === "sensitive_masked") return "Sensitive / masked";
  return "BOF internal only";
}
