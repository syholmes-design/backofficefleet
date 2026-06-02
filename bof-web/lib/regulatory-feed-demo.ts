export type BofRegulatoryFeedItem = {
  id: string;
  title: string;
  source: "FMCSA" | "DOT" | "Federal Register" | "NHTSA" | "CSA";
  sourceUrl: string;
  publishedAt: string;
  category:
    | "Compliance"
    | "Safety"
    | "Driver Files"
    | "Dispatch"
    | "Maintenance"
    | "Claims"
    | "Market";
  urgency: "Low" | "Medium" | "High";
  bofImpact: string;
  summary: string;
};

export const bofRegulatoryFeedDemoItems: BofRegulatoryFeedItem[] = [
  {
    id: "fmcsa-newsroom-updates",
    title: "FMCSA Newsroom Updates",
    source: "FMCSA",
    sourceUrl: "https://www.fmcsa.dot.gov/newsroom/rss",
    publishedAt: "2026-06-02",
    category: "Compliance",
    urgency: "Medium",
    bofImpact: "Watch for enforcement, safety, and driver qualification updates that may affect carrier workflows.",
    summary:
      "BOF surfaces public FMCSA updates and maps them to compliance, dispatch, and document-readiness workflows.",
  },
  {
    id: "federal-register-rulemaking-notices",
    title: "Federal Register Rulemaking Notices",
    source: "Federal Register",
    sourceUrl: "https://www.fmcsa.dot.gov/regulations/federal-register-documents",
    publishedAt: "2026-06-02",
    category: "Compliance",
    urgency: "High",
    bofImpact:
      "Proposed and final rules may require updates to policies, acknowledgments, driver files, or operating procedures.",
    summary:
      "BOF helps carriers track when public rulemaking activity may require back-office review.",
  },
  {
    id: "dot-transportation-updates",
    title: "DOT Transportation Updates",
    source: "DOT",
    sourceUrl: "https://www.transportation.gov/rss",
    publishedAt: "2026-06-02",
    category: "Market",
    urgency: "Low",
    bofImpact:
      "Broader transportation announcements can affect safety priorities, infrastructure planning, and operating expectations.",
    summary:
      "BOF keeps carrier leadership aware of transportation-sector updates from official public sources.",
  },
  {
    id: "nhtsa-recall-and-safety-alerts",
    title: "NHTSA Recall and Safety Alerts",
    source: "NHTSA",
    sourceUrl: "https://www.nhtsa.gov/recalls",
    publishedAt: "2026-06-02",
    category: "Maintenance",
    urgency: "High",
    bofImpact:
      "Vehicle and equipment recalls may affect asset readiness, maintenance review, and safety documentation.",
    summary:
      "BOF connects vehicle safety awareness to maintenance and operational readiness workflows.",
  },
  {
    id: "csa-safety-measurement-updates",
    title: "CSA Safety Measurement Updates",
    source: "CSA",
    sourceUrl: "https://csa.fmcsa.dot.gov/Home/Subscribe",
    publishedAt: "2026-06-02",
    category: "Safety",
    urgency: "Medium",
    bofImpact:
      "Safety measurement, inspection, and DataQs updates can affect carrier risk monitoring and corrective action.",
    summary:
      "BOF ties public safety updates to the carrier's internal safety and compliance controls.",
  },
];

export function getBofRegulatoryFeedDemoItems() {
  return bofRegulatoryFeedDemoItems;
}
