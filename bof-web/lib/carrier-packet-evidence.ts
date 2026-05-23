export type CarrierPacketEvidenceVisibility = "customer_visible" | "internal_only" | "sensitive_masked";
export type CarrierPacketEvidenceStatus =
  | "Current"
  | "Verified"
  | "Active"
  | "Ready"
  | "Renewal Watch"
  | "Review Required"
  | "Blocked"
  | "Pending";

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

const evidenceByCarrier: Record<string, CarrierPacketEvidence[]> = {
  "CAR-001": [
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
    customerSafeSummary: "Auto liability and cargo coverage are current, certificate is on file, and coverage limits meet the BOF packet standard.",
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
          "Reload qualification is tracked as a readiness signal for future assignment planning.",
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
  ],
  "CAR-002": [
    {
      carrierId: "CAR-002",
      id: "certificate-of-insurance",
      title: "Certificate of Insurance Renewal Review",
      packetRole: "Tracks current coverage while flagging the cargo renewal window before high-value freight assignment.",
      status: "Renewal Watch",
      visibility: "customer_visible",
      reviewDate: "May 20, 2026",
      expirationOrReview: "Cargo policy expires Jun 9, 2026",
      dispatchRelevance: "Dispatch may use Blue Ridge on standard dry-van reloads, but high-value and refrigerated freight require manager review.",
      financeRelevance: "Settlement can proceed, but customer release should show renewal timing until the updated certificate is received.",
      consequenceIfMissing: "High-value freight remains under review and customer packet release carries a renewal warning.",
      customerSafeSummary: "Auto liability is current and cargo coverage is on file, but cargo renewal is inside the action window.",
      fields: [
        { label: "Insured carrier", value: "Blue Ridge Dedicated Logistics LLC" },
        { label: "Auto liability", value: "$1,000,000 - Piedmont Mutual" },
        { label: "Cargo coverage", value: "$100,000 - Piedmont Mutual" },
        { label: "Cargo expiration", value: "June 9, 2026" },
        { label: "Packet status", value: "Renewal watch" },
      ],
      sections: [
        {
          title: "Renewal controls",
          items: [
            "Current certificate remains usable for standard freight.",
            "Cargo renewal is due inside the manager review window.",
            "High-value and refrigerated assignments require compliance confirmation.",
            "Packet owner must obtain the renewal certificate before the due date.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-002",
      id: "w9-masked",
      title: "W-9 Preview - Masked",
      packetRole: "Confirms tax profile is verified while keeping sensitive identifiers internal.",
      status: "Verified",
      visibility: "sensitive_masked",
      reviewDate: "May 16, 2026",
      expirationOrReview: "Annual finance review due Oct 15, 2026",
      dispatchRelevance: "Tax readiness does not block dispatch and keeps settlement setup clear.",
      financeRelevance: "Finance can release settlement after proof is complete because tax documentation is verified.",
      consequenceIfMissing: "BOF would flag settlement release risk and require finance owner follow-up.",
      customerSafeSummary: "Tax form is verified; sensitive identifiers are masked outside finance controls.",
      fields: [
        { label: "Entity", value: "Blue Ridge Dedicated Logistics LLC" },
        { label: "Tax classification", value: "Limited liability company" },
        { label: "EIN", value: "**-***1187", masked: true },
        { label: "Finance status", value: "Verified" },
        { label: "Customer-safe exposure", value: "Masked identifiers only" },
      ],
      sections: [
        {
          title: "Finance controls",
          items: [
            "W-9 was reviewed before the current packet cycle.",
            "ACH details remain outside the customer-safe packet.",
            "No tax-document hold applies to current dry-van work.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-002",
      id: "operating-authority",
      title: "Operating Authority Snapshot",
      packetRole: "Shows active operating authority and the current BOF compliance check.",
      status: "Active",
      visibility: "customer_visible",
      reviewDate: "May 20, 2026",
      expirationOrReview: "Authority check refreshed May 20, 2026",
      dispatchRelevance: "Authority supports standard dry-van assignments while the cargo renewal watch remains separate.",
      financeRelevance: "Customer release can confirm the carrier was authorized to operate on approved lanes.",
      consequenceIfMissing: "BOF would require compliance review before dispatching or publishing the packet.",
      customerSafeSummary: "Authority active, safety rating satisfactory, DOT and MC match the registry.",
      fields: [
        { label: "DOT", value: "DOT-3184720" },
        { label: "MC", value: "MC-1129084" },
        { label: "Authority type", value: "Motor carrier property authority" },
        { label: "Safety rating", value: "Satisfactory" },
        { label: "Last BOF check", value: "May 20, 2026" },
      ],
      sections: [
        {
          title: "Authority controls",
          items: [
            "Authority is active for approved interstate lanes.",
            "Operating profile supports standard dry-van reload work.",
            "No authority block is present.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-002",
      id: "broker-carrier-agreement",
      title: "Broker-Carrier Agreement Preview",
      packetRole: "Confirms active commercial terms before dispatch assignment.",
      status: "Active",
      visibility: "internal_only",
      reviewDate: "May 16, 2026",
      expirationOrReview: "Agreement review due Oct 15, 2026",
      dispatchRelevance: "Dispatch can assign approved freight under active terms.",
      financeRelevance: "Settlement can rely on active commercial terms after proof is complete.",
      consequenceIfMissing: "BOF would require legal owner review before new tenders are released.",
      customerSafeSummary: "Agreement presence is confirmed; commercial terms remain internal.",
      fields: [
        { label: "Agreement party", value: "Blue Ridge Dedicated Logistics LLC" },
        { label: "Agreement status", value: "Active" },
        { label: "Review owner", value: "Legal / carrier relations" },
        { label: "Commercial terms", value: "Internal only", masked: true },
        { label: "Packet role", value: "Dispatch authorization" },
      ],
      sections: [
        {
          title: "Agreement controls",
          items: [
            "Signed agreement is on file.",
            "Terms support standard freight assignment.",
            "Customer packet shows agreement status without exposing confidential terms.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-002",
      id: "safety-compliance-profile",
      title: "Safety / Compliance Profile",
      packetRole: "Summarizes safety posture and why the carrier remains eligible with review.",
      status: "Verified",
      visibility: "customer_visible",
      reviewDate: "May 20, 2026",
      expirationOrReview: "Next profile review due Jun 20, 2026",
      dispatchRelevance: "Safety profile is clean; dispatch review is driven by insurance renewal timing.",
      financeRelevance: "Clean compliance posture reduces claim and customer release friction.",
      consequenceIfMissing: "Manager review would be required before using the carrier on customer-sensitive freight.",
      customerSafeSummary: "Safety rating satisfactory with no active safety hold.",
      fields: [
        { label: "Safety rating", value: "Satisfactory" },
        { label: "Open carrier flags", value: "Cargo renewal watch" },
        { label: "Compliance owner", value: "Sophia Howard" },
        { label: "Last review", value: "May 20, 2026" },
        { label: "Dispatch gate", value: "Eligible with review" },
      ],
      sections: [
        {
          title: "Compliance signals",
          items: [
            "No safety hold blocks standard dry-van freight.",
            "Cargo renewal remains the active packet watch item.",
            "Manager review required for high-value or refrigerated assignments.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-002",
      id: "equipment-lane-qualification",
      title: "Equipment and Lane Qualification Sheet",
      packetRole: "Connects carrier capability to standard reload planning.",
      status: "Ready",
      visibility: "customer_visible",
      reviewDate: "May 20, 2026",
      expirationOrReview: "Lane review due Jun 30, 2026",
      dispatchRelevance: "Eligible for standard dry-van reloads across approved lanes.",
      financeRelevance: "Customer release can show equipment and lane fit for non-high-value freight.",
      consequenceIfMissing: "Dispatcher would need manager review before assigning lane-specific freight.",
      customerSafeSummary: "Dry-van lane fit is current; high-value freight remains tied to COI renewal review.",
      fields: [
        { label: "Equipment", value: "Dry van, team driver" },
        { label: "Approved lanes", value: "VA to IL, OH to TN, KY to GA" },
        { label: "Reload regions", value: "Appalachia, Ohio Valley, Mid-South" },
        { label: "Backhaul status", value: "Ready for standard dry-van reloads" },
        { label: "Customer release", value: "Qualified with renewal note" },
      ],
      sections: [
        {
          title: "Reload bridge",
          items: [
            "Roanoke to Chicago reload-qualified.",
            "Cincinnati to Nashville reload-qualified.",
            "Louisville to Atlanta reload-qualified.",
            "High-value cargo requires COI renewal confirmation before release.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-002",
      id: "customer-safe-packet-summary",
      title: "Customer-Safe Packet Summary",
      packetRole: "Combines current authority, insurance, and lane controls into one review packet.",
      status: "Review Required",
      visibility: "customer_visible",
      reviewDate: "May 20, 2026",
      expirationOrReview: "Refresh after cargo renewal certificate arrives",
      dispatchRelevance: "Dispatcher can share the packet with a renewal-watch note for standard freight.",
      financeRelevance: "Settlement remains clear, but customer-facing packet should disclose the renewal timing.",
      consequenceIfMissing: "Customer release would lack the reason Blue Ridge is allowed with review instead of fully ready.",
      customerSafeSummary: "Packet is mostly complete, with cargo insurance renewal review as the visible watch item.",
      fields: [
        { label: "Packet status", value: "Review" },
        { label: "Customer-visible docs", value: "COI, authority, safety profile, equipment/lane qualification" },
        { label: "Masked docs", value: "W-9 verified with EIN hidden" },
        { label: "Internal-only docs", value: "Broker-carrier agreement terms, ACH/payment details" },
        { label: "Dispatch note", value: "Eligible with review" },
      ],
      sections: [
        {
          title: "Release summary",
          items: [
            "Authority and tax profile are verified.",
            "Agreement is active.",
            "Cargo policy is current but near renewal.",
            "High-value or refrigerated work needs manager signoff until renewal is complete.",
          ],
        },
      ],
    },
  ],
  "CAR-003": [
    {
      carrierId: "CAR-003",
      id: "certificate-of-insurance",
      title: "Certificate of Insurance Block",
      packetRole: "Shows the expired auto liability certificate that blocks dispatch.",
      status: "Blocked",
      visibility: "customer_visible",
      reviewDate: "May 22, 2026",
      expirationOrReview: "Auto liability expired May 10, 2026",
      dispatchRelevance: "Dispatch is blocked from all assignments until updated liability coverage is verified.",
      financeRelevance: "Finance cannot support customer release because insurance exposure is unresolved.",
      consequenceIfMissing: "BOF keeps the carrier blocked and prevents customer packet publication.",
      customerSafeSummary: "Auto liability coverage is expired; customer release is blocked until a current COI is on file.",
      fields: [
        { label: "Insured carrier", value: "Iron Mile Transport Group LLC" },
        { label: "Auto liability", value: "$1,000,000 - Midwest Risk Partners" },
        { label: "Auto expiration", value: "May 10, 2026" },
        { label: "Cargo coverage", value: "$100,000 - current through Sep 30, 2026" },
        { label: "Packet status", value: "Blocked" },
      ],
      sections: [
        {
          title: "Insurance block",
          items: [
            "Auto liability certificate is expired.",
            "Cargo coverage is current but cannot override the auto liability block.",
            "Dispatch remains blocked until updated COI is verified.",
            "Customer packet cannot be released in blocked state.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-003",
      id: "w9-masked",
      title: "W-9 Preview - Masked",
      packetRole: "Confirms finance setup is not the current carrier block.",
      status: "Verified",
      visibility: "sensitive_masked",
      reviewDate: "May 13, 2026",
      expirationOrReview: "Annual finance review due Sep 30, 2026",
      dispatchRelevance: "W-9 is clean, but insurance and agreement controls still block dispatch.",
      financeRelevance: "Finance setup can resume after operational blocks clear.",
      consequenceIfMissing: "Finance would add a second settlement hold on top of the dispatch block.",
      customerSafeSummary: "Tax form is verified; sensitive identifiers remain masked.",
      fields: [
        { label: "Entity", value: "Iron Mile Transport Group LLC" },
        { label: "Tax classification", value: "Limited liability company" },
        { label: "EIN", value: "**-***4418", masked: true },
        { label: "Finance status", value: "Verified" },
        { label: "Current blocker", value: "Insurance and agreement, not tax" },
      ],
      sections: [
        {
          title: "Finance controls",
          items: [
            "W-9 is verified.",
            "ACH profile is verified.",
            "Finance controls do not release the carrier until insurance and agreement gates clear.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-003",
      id: "operating-authority",
      title: "Operating Authority Snapshot",
      packetRole: "Shows active authority while separating it from the insurance block.",
      status: "Active",
      visibility: "customer_visible",
      reviewDate: "May 22, 2026",
      expirationOrReview: "Authority check refreshed May 22, 2026",
      dispatchRelevance: "Authority is active, but BOF still blocks dispatch because insurance and agreement controls fail.",
      financeRelevance: "Authority helps explain that the block is not a DOT/MC identity problem.",
      consequenceIfMissing: "Compliance would add an authority hold and prevent any carrier packet release.",
      customerSafeSummary: "Authority active, but current packet remains blocked by insurance and agreement failures.",
      fields: [
        { label: "DOT", value: "DOT-4059182" },
        { label: "MC", value: "MC-1502241" },
        { label: "Authority type", value: "Motor carrier property authority" },
        { label: "Safety rating", value: "Review" },
        { label: "Last BOF check", value: "May 22, 2026" },
      ],
      sections: [
        {
          title: "Authority controls",
          items: [
            "Authority is active.",
            "Safety profile requires review due to the blocked packet state.",
            "Dispatch still blocked until insurance and agreement gates clear.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-003",
      id: "broker-carrier-agreement",
      title: "Unsigned Broker-Carrier Agreement",
      packetRole: "Shows the missing signed terms that block freight assignment.",
      status: "Blocked",
      visibility: "internal_only",
      reviewDate: "May 22, 2026",
      expirationOrReview: "Signed agreement past due May 15, 2026",
      dispatchRelevance: "Dispatch cannot tender freight without signed carrier terms.",
      financeRelevance: "Settlement cannot rely on unsigned commercial terms for new work.",
      consequenceIfMissing: "BOF blocks new tenders and keeps the customer packet unpublished.",
      customerSafeSummary: "Agreement is not signed; commercial terms remain unresolved.",
      fields: [
        { label: "Agreement party", value: "Iron Mile Transport Group LLC" },
        { label: "Agreement status", value: "Unsigned" },
        { label: "Review owner", value: "Legal / carrier relations" },
        { label: "Commercial terms", value: "Internal only", masked: true },
        { label: "Packet role", value: "Dispatch block" },
      ],
      sections: [
        {
          title: "Agreement block",
          items: [
            "Updated agreement has not been signed.",
            "New tenders remain blocked.",
            "Legal owner must close the agreement gate before dispatch can resume.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-003",
      id: "safety-compliance-profile",
      title: "Safety / Compliance Review Profile",
      packetRole: "Summarizes review posture while the carrier is blocked.",
      status: "Review Required",
      visibility: "customer_visible",
      reviewDate: "May 22, 2026",
      expirationOrReview: "Recheck after COI and agreement updates",
      dispatchRelevance: "Compliance review must confirm the carrier before any future load assignment.",
      financeRelevance: "Clean finance setup is not enough to overcome current packet blocks.",
      consequenceIfMissing: "Manager would not have a clear reason why the carrier remains blocked.",
      customerSafeSummary: "Authority is active, but packet remains blocked until insurance and agreement failures clear.",
      fields: [
        { label: "Safety rating", value: "Review" },
        { label: "Open carrier flags", value: "Expired auto liability; unsigned agreement" },
        { label: "Compliance owner", value: "Luis Alvarez" },
        { label: "Last review", value: "May 22, 2026" },
        { label: "Dispatch gate", value: "Dispatch blocked" },
      ],
      sections: [
        {
          title: "Compliance signals",
          items: [
            "Carrier should not be assigned new freight.",
            "Insurance and legal owners both have blocking items.",
            "Customer-safe release is blocked until both gates close.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-003",
      id: "equipment-lane-qualification",
      title: "Equipment and Lane Qualification Sheet",
      packetRole: "Preserves lane capability while showing why capability does not equal eligibility.",
      status: "Blocked",
      visibility: "customer_visible",
      reviewDate: "May 22, 2026",
      expirationOrReview: "Reopen after packet block clears",
      dispatchRelevance: "Flatbed and Conestoga capability cannot be used while insurance and agreement are blocked.",
      financeRelevance: "Lane fit is irrelevant until packet controls allow new work.",
      consequenceIfMissing: "Dispatcher could confuse equipment fit with dispatch eligibility.",
      customerSafeSummary: "Equipment is documented, but the carrier is not eligible for release.",
      fields: [
        { label: "Equipment", value: "Flatbed, Conestoga" },
        { label: "Approved lanes", value: "OH to PA, IN to MO, KY to NC" },
        { label: "Reload regions", value: "Great Lakes, Midwest industrial corridor" },
        { label: "Backhaul status", value: "Not backhaul-ready" },
        { label: "Customer release", value: "Blocked" },
      ],
      sections: [
        {
          title: "Readiness distinction",
          items: [
            "Carrier has usable equipment capability.",
            "Dispatch remains blocked by insurance and legal controls.",
            "No backhaul planning should proceed until packet gates clear.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-003",
      id: "customer-safe-packet-summary",
      title: "Customer-Safe Packet Summary",
      packetRole: "Explains why the carrier cannot be released to a customer-facing packet.",
      status: "Blocked",
      visibility: "customer_visible",
      reviewDate: "May 22, 2026",
      expirationOrReview: "Refresh after COI and agreement are corrected",
      dispatchRelevance: "Dispatcher sees a hard stop before freight assignment.",
      financeRelevance: "Finance cannot support customer release or factoring readiness for new work.",
      consequenceIfMissing: "The block would look arbitrary instead of tied to specific packet controls.",
      customerSafeSummary: "Customer release is blocked by expired auto liability and unsigned agreement.",
      fields: [
        { label: "Packet status", value: "Blocked" },
        { label: "Customer-visible docs", value: "COI and authority show why release is blocked" },
        { label: "Masked docs", value: "W-9 verified with EIN hidden" },
        { label: "Internal-only docs", value: "Unsigned agreement and commercial terms" },
        { label: "Dispatch note", value: "Do not assign" },
      ],
      sections: [
        {
          title: "Release summary",
          items: [
            "Auto liability is expired.",
            "Broker-carrier agreement is unsigned.",
            "Authority is active but cannot override blocking controls.",
            "Dispatch and customer release remain blocked.",
          ],
        },
      ],
    },
  ],
  "CAR-004": [
    {
      carrierId: "CAR-004",
      id: "certificate-of-insurance",
      title: "Certificate of Insurance Preview",
      packetRole: "Confirms current reefer carrier coverage while the proof-timing watch remains active.",
      status: "Current",
      visibility: "customer_visible",
      reviewDate: "May 19, 2026",
      expirationOrReview: "Auto and cargo expire Jan 31, 2027",
      dispatchRelevance: "Insurance is current; reefer release still requires manager review because of POD delay pattern.",
      financeRelevance: "Clean insurance supports settlement after proof is complete, but does not clear proof-timing risk.",
      consequenceIfMissing: "BOF would block reefer assignment and customer packet publication.",
      customerSafeSummary: "Insurance is current; watch status is driven by proof timing and safety review, not coverage.",
      fields: [
        { label: "Insured carrier", value: "Southern Cross Refrigerated Inc." },
        { label: "Auto liability", value: "$1,000,000 - Atlantic Specialty" },
        { label: "Cargo coverage", value: "$250,000 - Atlantic Specialty" },
        { label: "Expiration", value: "January 31, 2027" },
        { label: "Packet status", value: "Current insurance / watch review" },
      ],
      sections: [
        {
          title: "Insurance controls",
          items: [
            "Coverage is current.",
            "Certificate supports reefer freight from an insurance standpoint.",
            "Proof timing and safety review still require manager approval.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-004",
      id: "w9-masked",
      title: "W-9 Preview - Masked",
      packetRole: "Confirms tax profile is ready while watch status remains operational.",
      status: "Verified",
      visibility: "sensitive_masked",
      reviewDate: "May 12, 2026",
      expirationOrReview: "Annual finance review due Jan 31, 2027",
      dispatchRelevance: "W-9 does not block dispatch; reefer assignments need manager proof review.",
      financeRelevance: "No tax-document hold applies if POD proof arrives on time.",
      consequenceIfMissing: "Finance would add settlement timing risk on top of the POD delay pattern.",
      customerSafeSummary: "Tax form is verified and masked outside finance controls.",
      fields: [
        { label: "Entity", value: "Southern Cross Refrigerated Inc." },
        { label: "Tax classification", value: "Corporation" },
        { label: "EIN", value: "**-***6720", masked: true },
        { label: "Finance status", value: "Verified" },
        { label: "Current watch item", value: "POD timeliness / safety review" },
      ],
      sections: [
        {
          title: "Finance controls",
          items: [
            "W-9 and payment setup are clean.",
            "Settlement timing depends on prompt POD and temperature proof.",
            "Tax identifiers remain masked in customer-safe views.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-004",
      id: "operating-authority",
      title: "Operating Authority Review Snapshot",
      packetRole: "Shows active authority with conditional safety review.",
      status: "Review Required",
      visibility: "customer_visible",
      reviewDate: "May 19, 2026",
      expirationOrReview: "Manager review open May 19, 2026",
      dispatchRelevance: "Authority is active, but reefer assignment requires manager signoff.",
      financeRelevance: "Customer release can show authority while explaining watch status.",
      consequenceIfMissing: "BOF would block customer-sensitive reefer work until compliance review is complete.",
      customerSafeSummary: "Authority active with conditional safety review tied to proof timing.",
      fields: [
        { label: "DOT", value: "DOT-2870144" },
        { label: "MC", value: "MC-934720" },
        { label: "Authority type", value: "Motor carrier property authority" },
        { label: "Safety rating", value: "Conditional" },
        { label: "Last BOF check", value: "May 19, 2026" },
      ],
      sections: [
        {
          title: "Authority controls",
          items: [
            "Authority is active.",
            "Safety review is conditional and manager-owned.",
            "Reefer loads require proof timing review before release.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-004",
      id: "broker-carrier-agreement",
      title: "Broker-Carrier Agreement Preview",
      packetRole: "Confirms active terms for refrigerated assignments.",
      status: "Active",
      visibility: "internal_only",
      reviewDate: "May 12, 2026",
      expirationOrReview: "Agreement review due Jan 31, 2027",
      dispatchRelevance: "Commercial terms support refrigerated assignments after manager review.",
      financeRelevance: "Agreement supports settlement when proof is timely and complete.",
      consequenceIfMissing: "BOF would block new tenders until signed terms are restored.",
      customerSafeSummary: "Agreement is active; commercial terms remain internal.",
      fields: [
        { label: "Agreement party", value: "Southern Cross Refrigerated Inc." },
        { label: "Agreement status", value: "Active" },
        { label: "Review owner", value: "Legal / carrier relations" },
        { label: "Commercial terms", value: "Internal only", masked: true },
        { label: "Packet role", value: "Reefer assignment authorization" },
      ],
      sections: [
        {
          title: "Agreement controls",
          items: [
            "Agreement is signed.",
            "Terms support refrigerated assignments.",
            "Watch status remains tied to POD timeliness, not legal terms.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-004",
      id: "safety-compliance-profile",
      title: "Reefer Proof and Safety Watch Profile",
      packetRole: "Documents the POD delay pattern and manager review requirement.",
      status: "Review Required",
      visibility: "customer_visible",
      reviewDate: "May 19, 2026",
      expirationOrReview: "Follow-up review due May 27, 2026",
      dispatchRelevance: "Manager must confirm proof timing plan before another refrigerated customer load is released.",
      financeRelevance: "Late PODs can delay settlement and weaken customer release confidence.",
      consequenceIfMissing: "Dispatch could assign another reefer load without seeing the proof-timing pattern.",
      customerSafeSummary: "Carrier remains usable with manager review; POD timing and safety plan are under watch.",
      fields: [
        { label: "Safety rating", value: "Conditional" },
        { label: "Open carrier flags", value: "Late POD pattern; proof timing review" },
        { label: "Compliance owner", value: "Kara Morales" },
        { label: "Last review", value: "May 19, 2026" },
        { label: "Dispatch gate", value: "Manager review required" },
      ],
      sections: [
        {
          title: "Watch controls",
          items: [
            "Repeated POD delays are visible before dispatch release.",
            "Manager review must confirm temperature and delivery proof plan.",
            "Insurance and tax controls are clean, but proof execution is under watch.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-004",
      id: "equipment-lane-qualification",
      title: "Equipment and Lane Qualification Sheet",
      packetRole: "Connects reefer capability to the proof timing review.",
      status: "Review Required",
      visibility: "customer_visible",
      reviewDate: "May 19, 2026",
      expirationOrReview: "Reefer lane review due May 27, 2026",
      dispatchRelevance: "Reefer capability is valid but requires proof-timing plan approval.",
      financeRelevance: "Temperature and POD proof must be timely for clean settlement.",
      consequenceIfMissing: "Dispatcher could miss reefer-specific proof obligations before assignment.",
      customerSafeSummary: "Reefer lanes are qualified with manager review for proof timing.",
      fields: [
        { label: "Equipment", value: "Reefer, temperature monitored" },
        { label: "Approved lanes", value: "GA to FL, TN to TX, NC to LA" },
        { label: "Reload regions", value: "Southeast refrigerated, Gulf corridor" },
        { label: "Backhaul status", value: "Manager review before release" },
        { label: "Customer release", value: "Watch" },
      ],
      sections: [
        {
          title: "Reefer controls",
          items: [
            "Atlanta to Orlando reload-qualified after review.",
            "Nashville to Dallas reload-qualified after proof plan approval.",
            "Charlotte to New Orleans reload-qualified with manager signoff.",
            "Proof timing is the active gate.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-004",
      id: "customer-safe-packet-summary",
      title: "Customer-Safe Packet Summary",
      packetRole: "Shows how a watch carrier can still be explained without hiding the risk.",
      status: "Review Required",
      visibility: "customer_visible",
      reviewDate: "May 19, 2026",
      expirationOrReview: "Refresh after proof timing review",
      dispatchRelevance: "Dispatcher can see why manager review is required before release.",
      financeRelevance: "Finance can anticipate POD timing risk before settlement handoff.",
      consequenceIfMissing: "The watch state would look vague instead of tied to reefer POD execution.",
      customerSafeSummary: "Packet is usable with a proof-timeliness watch and manager review requirement.",
      fields: [
        { label: "Packet status", value: "Watch" },
        { label: "Customer-visible docs", value: "COI, authority, safety profile, equipment/lane qualification" },
        { label: "Masked docs", value: "W-9 verified with EIN hidden" },
        { label: "Internal-only docs", value: "Agreement terms and payment details" },
        { label: "Dispatch note", value: "Manager review before reefer release" },
      ],
      sections: [
        {
          title: "Release summary",
          items: [
            "Insurance, W-9, and agreement are ready.",
            "Authority is active with conditional safety review.",
            "Repeated POD delays require manager proof-timing approval.",
            "Customer release can be prepared only with watch status disclosed.",
          ],
        },
      ],
    },
  ],
  "CAR-005": [
    {
      carrierId: "CAR-005",
      id: "certificate-of-insurance",
      title: "Certificate of Insurance Preview",
      packetRole: "Confirms insurance is current while finance controls remain under review.",
      status: "Current",
      visibility: "customer_visible",
      reviewDate: "May 21, 2026",
      expirationOrReview: "Auto and cargo expire Aug 31, 2026",
      dispatchRelevance: "Insurance does not block low-risk dry-van dispatch.",
      financeRelevance: "Finance hold risk is driven by W-9 and ACH verification, not insurance.",
      consequenceIfMissing: "BOF would add an insurance hold and prevent dispatch release.",
      customerSafeSummary: "Auto liability and cargo coverage are current; payment controls remain internal review items.",
      fields: [
        { label: "Insured carrier", value: "Prairie Line Hauling LLC" },
        { label: "Auto liability", value: "$1,000,000 - Hoosier Commercial Risk" },
        { label: "Cargo coverage", value: "$100,000 - Hoosier Commercial Risk" },
        { label: "Expiration", value: "August 31, 2026" },
        { label: "Packet status", value: "Current insurance / finance review" },
      ],
      sections: [
        {
          title: "Insurance controls",
          items: [
            "Auto and cargo policies are current.",
            "Insurance does not block dispatch.",
            "Payment controls still create finance and settlement risk.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-005",
      id: "w9-masked",
      title: "W-9 Missing Control Record",
      packetRole: "Shows the tax-document gap that creates settlement and factoring hold risk.",
      status: "Blocked",
      visibility: "sensitive_masked",
      reviewDate: "May 21, 2026",
      expirationOrReview: "Required before settlement release",
      dispatchRelevance: "Dispatch may consider low-risk freight with manager approval, but finance hold is visible before assignment.",
      financeRelevance: "Settlement and factoring handoff cannot close until W-9 is collected and verified.",
      consequenceIfMissing: "BOF keeps finance/factoring release under hold and flags payment-control risk.",
      customerSafeSummary: "Tax documentation is missing; sensitive fields are not exposed because the form is not verified.",
      fields: [
        { label: "Entity", value: "Prairie Line Hauling LLC" },
        { label: "Tax classification", value: "Pending" },
        { label: "EIN", value: "Not verified", masked: true },
        { label: "Finance status", value: "Blocked" },
        { label: "Current blocker", value: "W-9 missing" },
      ],
      sections: [
        {
          title: "Finance controls",
          items: [
            "W-9 has not been verified.",
            "ACH review is also pending.",
            "Carrier can only be considered with manager approval and finance hold visibility.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-005",
      id: "operating-authority",
      title: "Operating Authority Snapshot",
      packetRole: "Shows active authority for a newer carrier profile.",
      status: "Active",
      visibility: "customer_visible",
      reviewDate: "May 21, 2026",
      expirationOrReview: "Authority check refreshed May 21, 2026",
      dispatchRelevance: "Authority supports approved dry-van and power-only lanes with manager review.",
      financeRelevance: "Authority is clean, but finance controls still prevent clean settlement release.",
      consequenceIfMissing: "BOF would block dispatch and customer release until compliance verifies authority.",
      customerSafeSummary: "Authority active; payment and tax controls remain under review.",
      fields: [
        { label: "DOT", value: "DOT-3650091" },
        { label: "MC", value: "MC-1287719" },
        { label: "Authority type", value: "Motor carrier property authority" },
        { label: "Safety rating", value: "Unrated" },
        { label: "Last BOF check", value: "May 21, 2026" },
      ],
      sections: [
        {
          title: "Authority controls",
          items: [
            "Authority is active.",
            "Carrier is newer and remains under manager review.",
            "Finance controls, not authority, are the active readiness gap.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-005",
      id: "broker-carrier-agreement",
      title: "Broker-Carrier Agreement Preview",
      packetRole: "Confirms active terms while finance controls remain unresolved.",
      status: "Active",
      visibility: "internal_only",
      reviewDate: "May 21, 2026",
      expirationOrReview: "Agreement review due Aug 31, 2026",
      dispatchRelevance: "Terms support approved dry-van work with manager approval.",
      financeRelevance: "Agreement is clean, but W-9 and ACH must clear before settlement release.",
      consequenceIfMissing: "BOF would add legal review to the finance-control hold.",
      customerSafeSummary: "Agreement is active; commercial terms remain internal.",
      fields: [
        { label: "Agreement party", value: "Prairie Line Hauling LLC" },
        { label: "Agreement status", value: "Active" },
        { label: "Review owner", value: "Legal / carrier relations" },
        { label: "Commercial terms", value: "Internal only", masked: true },
        { label: "Packet role", value: "Conditional dispatch authorization" },
      ],
      sections: [
        {
          title: "Agreement controls",
          items: [
            "Signed agreement is on file.",
            "Legal terms do not block dispatch.",
            "Finance controls still require W-9 and ACH completion.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-005",
      id: "safety-compliance-profile",
      title: "Safety / Compliance Profile",
      packetRole: "Summarizes why the carrier is conditionally usable but not finance-clean.",
      status: "Review Required",
      visibility: "customer_visible",
      reviewDate: "May 21, 2026",
      expirationOrReview: "Follow-up review due May 24, 2026",
      dispatchRelevance: "Manager review required before assignment because finance controls are incomplete.",
      financeRelevance: "Finance/factoring hold risk remains active until W-9 and ACH clear.",
      consequenceIfMissing: "Dispatch could miss that payment readiness, not authority or insurance, is the active concern.",
      customerSafeSummary: "Authority and insurance are current; finance controls remain under review.",
      fields: [
        { label: "Safety rating", value: "Unrated" },
        { label: "Open carrier flags", value: "W-9 missing; ACH review pending" },
        { label: "Compliance owner", value: "Jalen Turner" },
        { label: "Last review", value: "May 21, 2026" },
        { label: "Dispatch gate", value: "Manager review required" },
      ],
      sections: [
        {
          title: "Review controls",
          items: [
            "No insurance or authority block is active.",
            "Carrier is newer and remains under manager review.",
            "Finance controls must clear before clean settlement release.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-005",
      id: "equipment-lane-qualification",
      title: "Equipment and Lane Qualification Sheet",
      packetRole: "Connects dry-van and power-only capability to conditional dispatch use.",
      status: "Review Required",
      visibility: "customer_visible",
      reviewDate: "May 21, 2026",
      expirationOrReview: "Review after W-9 and ACH controls clear",
      dispatchRelevance: "Dry-van and power-only lanes are usable only with manager approval while finance controls remain open.",
      financeRelevance: "Payment-sensitive freight should wait until tax and ACH verification are complete.",
      consequenceIfMissing: "Dispatcher could assign payment-sensitive freight without seeing the finance hold risk.",
      customerSafeSummary: "Lane capability is documented, but finance readiness is conditional.",
      fields: [
        { label: "Equipment", value: "Dry van, power only" },
        { label: "Approved lanes", value: "IN to OH, IL to MI, KY to WI" },
        { label: "Reload regions", value: "Indiana hub, Great Lakes, Upper Midwest" },
        { label: "Backhaul status", value: "Candidate after W-9 and ACH controls clear" },
        { label: "Customer release", value: "Conditional" },
      ],
      sections: [
        {
          title: "Reload bridge",
          items: [
            "Indianapolis to Columbus reload candidate.",
            "Chicago to Detroit reload candidate.",
            "Louisville to Milwaukee reload candidate.",
            "Payment-control issues must be visible before assignment.",
          ],
        },
      ],
    },
    {
      carrierId: "CAR-005",
      id: "customer-safe-packet-summary",
      title: "Customer-Safe Packet Summary",
      packetRole: "Explains a conditionally usable carrier with finance-control risk.",
      status: "Review Required",
      visibility: "customer_visible",
      reviewDate: "May 21, 2026",
      expirationOrReview: "Refresh after W-9 and ACH verification",
      dispatchRelevance: "Dispatcher can see why manager approval is required before release.",
      financeRelevance: "Finance can see exactly why settlement and factoring release are at risk.",
      consequenceIfMissing: "The review state would look vague instead of tied to W-9 and ACH controls.",
      customerSafeSummary: "Authority and insurance are current; W-9 and payment verification remain internal blockers.",
      fields: [
        { label: "Packet status", value: "Review" },
        { label: "Customer-visible docs", value: "COI, authority, safety profile, equipment/lane qualification" },
        { label: "Masked docs", value: "W-9 not verified" },
        { label: "Internal-only docs", value: "Agreement terms and ACH verification" },
        { label: "Dispatch note", value: "Manager approval with finance hold visibility" },
      ],
      sections: [
        {
          title: "Release summary",
          items: [
            "Insurance and authority are current.",
            "Broker-carrier agreement is active.",
            "W-9 is missing and ACH verification is pending.",
            "Dispatch is conditional and finance/factoring release remains at risk.",
          ],
        },
      ],
    },
  ],
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
