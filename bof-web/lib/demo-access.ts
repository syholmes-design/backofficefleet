export type DemoAccessTierId = "public" | "self_guided" | "guided_demo" | "trusted_access" | "internal";

export type DemoPersonaId =
  | "fleet_owner"
  | "dispatcher"
  | "carrier_operations"
  | "safety_compliance"
  | "investor";

export type DemoAccessTier = {
  id: DemoAccessTierId;
  label: string;
  summary: string;
  boundary: string;
};

export type DemoPersona = {
  id: DemoPersonaId;
  label: string;
  routeLabel: string;
  summary: string;
  primaryRoute: string;
  secondaryRoute: string;
  focusAreas: string[];
  guidedPrompt: string;
};

export type DemoWalkthroughStep = {
  id: string;
  title: string;
  route: string;
  owner: string;
  outcome: string;
  proofPoint: string;
};

export type DemoAccessSurface = {
  route: string;
  label: string;
  recommendedTier: DemoAccessTierId;
  framing: string;
};

export const demoAccessTiers: DemoAccessTier[] = [
  {
    id: "public",
    label: "Public preview",
    summary: "Marketing, positioning, and a guided entry into the BOF operating model.",
    boundary: "Best for first-time visitors who need the story before the full workflow.",
  },
  {
    id: "self_guided",
    label: "Self-guided demo",
    summary: "Open exploration of dashboard, dispatch, carrier readiness, documents, safety, and settlements.",
    boundary: "Best for fleet owners who want to inspect the system without a walkthrough.",
  },
  {
    id: "guided_demo",
    label: "Guided demo",
    summary: "A controlled route through the flagship operating stories and escalation logic.",
    boundary: "Best for buyers evaluating how BOF enforces workflow consequences.",
  },
  {
    id: "trusted_access",
    label: "Trusted access",
    summary: "Deeper operating views for implementation partners and serious founding fleet review.",
    boundary: "Best for workflow owners reviewing packet, finance, and compliance details.",
  },
  {
    id: "internal",
    label: "Internal",
    summary: "Setup, workspace, and source-of-truth surfaces that should be explained in context.",
    boundary: "Best kept out of unguided buyer demos until the owner frames the purpose.",
  },
];

export const demoPersonas: DemoPersona[] = [
  {
    id: "fleet_owner",
    label: "Fleet Owner Demo",
    routeLabel: "Experience BOF Operations",
    summary: "See the command center, money at risk, carrier readiness, and executive operating picture.",
    primaryRoute: "/command-center",
    secondaryRoute: "/settlements",
    focusAreas: ["Command Center", "Settlements", "Carrier Registry", "Money at Risk"],
    guidedPrompt: "Start with triage, then follow the finance and carrier readiness consequences.",
  },
  {
    id: "dispatcher",
    label: "Dispatcher Demo",
    routeLabel: "Enter Dispatch Workflow",
    summary: "Work through dispatch gates, proof obligations, reload fit, and operational thread decisions.",
    primaryRoute: "/dispatch",
    secondaryRoute: "/loads",
    focusAreas: ["Dispatch Gates", "Reload Intelligence", "Load Proof", "Operational Threads"],
    guidedPrompt: "Use the dispatch board to see what can move, what is blocked, and who owns the next action.",
  },
  {
    id: "carrier_operations",
    label: "Carrier Operations Demo",
    routeLabel: "Explore Carrier Readiness",
    summary: "Inspect packet completeness, insurance, authority, dispatch gates, and reload eligibility.",
    primaryRoute: "/carriers",
    secondaryRoute: "/carriers/CAR-001/packet",
    focusAreas: ["Carrier Registry", "Packet Evidence", "Dispatch Eligibility", "Customer Release"],
    guidedPrompt: "Compare ready, review, watch, blocked, and payment-control carriers before assignment.",
  },
  {
    id: "safety_compliance",
    label: "Safety and Compliance Demo",
    routeLabel: "Review Safety Escalations",
    summary: "Follow driver readiness, safety events, document status, and proof-chain consequences.",
    primaryRoute: "/safety",
    secondaryRoute: "/drivers",
    focusAreas: ["Safety Events", "Driver Vault", "Compliance Queue", "Proof Packets"],
    guidedPrompt: "Use L008 and L009 to show how BOF separates claim escalation from pre-trip readiness failure.",
  },
  {
    id: "investor",
    label: "Investor Overview",
    routeLabel: "View Operating System Story",
    summary: "Frame BOF as an enforcement-driven operating system with carrier, dispatch, proof, and finance depth.",
    primaryRoute: "/dashboard",
    secondaryRoute: "/founding-fleet",
    focusAreas: ["Product Depth", "Founding Fleet Strategy", "Reload Intelligence", "Operational Moat"],
    guidedPrompt: "Start broad, then use command center and carrier gates to prove workflow depth.",
  },
];

export const demoWalkthroughSteps: DemoWalkthroughStep[] = [
  {
    id: "triage",
    title: "Command center triage",
    route: "/command-center",
    owner: "Fleet owner / operations lead",
    outcome: "Prioritize drivers, carriers, reloads, proof gaps, claims, and money at risk.",
    proofPoint: "BOF turns scattered issues into owned escalation cards.",
  },
  {
    id: "dispatch",
    title: "Dispatch lifecycle",
    route: "/dispatch",
    owner: "Dispatcher",
    outcome: "Assign only when driver, carrier, proof, and reload consequences agree.",
    proofPoint: "Dispatch gates explain allowed, warning, review, and blocked states.",
  },
  {
    id: "carrier-readiness",
    title: "Carrier readiness",
    route: "/carriers",
    owner: "Carrier operations",
    outcome: "Verify authority, insurance, W-9, agreement, lane fit, and packet readiness.",
    proofPoint: "Carrier status changes dispatch eligibility and customer release confidence.",
  },
  {
    id: "packet-verification",
    title: "Packet verification",
    route: "/carriers/CAR-001/packet",
    owner: "Carrier packet owner",
    outcome: "Separate customer-safe packet evidence from internal-only compliance records.",
    proofPoint: "CAR-001 supports the L011 finance and factoring readiness story.",
  },
  {
    id: "finance-release",
    title: "Finance and factoring readiness",
    route: "/settlements",
    owner: "Finance / settlements",
    outcome: "Confirm invoice, proof packet, carrier packet, and release status before cash moves.",
    proofPoint: "Settlement readiness ties proof, factoring, and customer release together.",
  },
  {
    id: "safety-proof",
    title: "Safety and proof escalation",
    route: "/safety",
    owner: "Safety / compliance",
    outcome: "Separate active claim evidence from tire, asset, and pre-trip readiness issues.",
    proofPoint: "L008 is a claim escalation; L009 is a dispatch readiness block.",
  },
];

export const demoAccessSurfaces: DemoAccessSurface[] = [
  {
    route: "/documents/template-packs",
    label: "Template pack workspace",
    recommendedTier: "trusted_access",
    framing: "Show only when explaining document generation workflow ownership.",
  },
  {
    route: "/documents/template-packs/artifact",
    label: "Template artifact workspace",
    recommendedTier: "internal",
    framing: "Keep behind guided context because this is a workspace surface, not a buyer entry point.",
  },
  {
    route: "/source-of-truth",
    label: "Source-of-truth diagnostics",
    recommendedTier: "internal",
    framing: "Use only when explaining the static/generated demo architecture.",
  },
  {
    route: "/dispatch/intake",
    label: "Dispatch intake workspace",
    recommendedTier: "guided_demo",
    framing: "Use after the main dispatch board so the intake workflow has operational context.",
  },
  {
    route: "/load-request",
    label: "Legacy load request",
    recommendedTier: "guided_demo",
    framing: "Avoid as a primary path; use only to explain legacy intake continuity.",
  },
];

export function getDemoAccessTiers() {
  return demoAccessTiers;
}

export function getDemoPersonas() {
  return demoPersonas;
}

export function getDemoPersona(personaId: DemoPersonaId) {
  return demoPersonas.find((persona) => persona.id === personaId);
}

export function getDemoWalkthroughSteps() {
  return demoWalkthroughSteps;
}

export function getDemoAccessSurfaces() {
  return demoAccessSurfaces;
}
