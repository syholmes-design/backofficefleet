import type { BofRegulatoryFeedItem } from "@/lib/regulatory-feed-demo";

const CATEGORY_KEYWORDS: Array<{
  category: BofRegulatoryFeedItem["category"];
  patterns: string[];
}> = [
  {
    category: "Driver Files",
    patterns: ["cdl", "medical", "driver", "qualification", "license"],
  },
  {
    category: "Safety",
    patterns: ["out-of-service", "enforcement", "violation", "inspection", "crash", "safety", "csa", "dataqs"],
  },
  {
    category: "Dispatch",
    patterns: ["hours of service", "hos", "dispatch", "operations", "route"],
  },
  {
    category: "Maintenance",
    patterns: ["recall", "vehicle", "equipment", "maintenance", "repair", "defect"],
  },
  {
    category: "Claims",
    patterns: ["claim", "insurance", "crash", "liability", "accident"],
  },
  {
    category: "Compliance",
    patterns: ["rule", "notice", "regulation", "compliance", "fmcsa", "federal register"],
  },
  {
    category: "Market",
    patterns: ["freight", "market", "infrastructure", "transportation"],
  },
];

const IMPACT_BY_CATEGORY: Record<BofRegulatoryFeedItem["category"], string> = {
  Claims: "Potential claims impact: review evidence capture, incident documentation, and insurance follow-up.",
  Compliance: "Potential compliance impact: review carrier policies, driver documentation, or operating procedures.",
  Dispatch: "Potential dispatch impact: review assignment rules, route readiness, or operating restrictions.",
  "Driver Files": "Potential driver-file impact: review qualification records, expirations, and dispatch eligibility gates.",
  Maintenance: "Potential maintenance impact: review asset readiness, recall visibility, and maintenance documentation.",
  Market: "Potential operating impact: review freight, transportation, or infrastructure developments that may affect planning.",
  Safety: "Potential safety impact: review inspection, corrective-action, or CSA monitoring workflows.",
};

export function classifyRegulatoryCategory(text: string): BofRegulatoryFeedItem["category"] {
  const normalized = text.toLowerCase();
  const match = CATEGORY_KEYWORDS.find(({ patterns }) => patterns.some((pattern) => normalized.includes(pattern)));

  return match?.category ?? "Compliance";
}

export function classifyRegulatoryUrgency(text: string): BofRegulatoryFeedItem["urgency"] {
  const normalized = text.toLowerCase();

  if (
    ["final rule", "effective date", "out-of-service", "emergency", "recall"].some((pattern) =>
      normalized.includes(pattern),
    )
  ) {
    return "High";
  }

  if (["proposed rule", "enforcement", "safety advisory", "notice"].some((pattern) => normalized.includes(pattern))) {
    return "Medium";
  }

  return "Low";
}

export function getBofImpactForCategory(category: BofRegulatoryFeedItem["category"]) {
  return IMPACT_BY_CATEGORY[category];
}
