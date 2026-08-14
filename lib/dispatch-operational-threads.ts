import { getCarrierById } from "@/lib/carrier-registry";
import { getReloadOpportunities, type ReloadRecommendationStatus } from "@/lib/carrier-reload-intelligence";

export type DispatchThreadType =
  | "load_thread"
  | "carrier_readiness_thread"
  | "reload_coordination_thread"
  | "proof_escalation_thread"
  | "finance_release_thread";

export type DispatchThreadTone = "ready" | "review" | "blocked" | "info";

export type DispatchOperationalMessage = {
  id: string;
  at: string;
  owner: string;
  message: string;
  consequence: string;
};

export type DispatchOperationalThread = {
  id: string;
  type: DispatchThreadType;
  title: string;
  tone: DispatchThreadTone;
  loadId?: string;
  carrierId?: string;
  reloadId?: string;
  status: string;
  nextOwner: string;
  dispatchConsequence: string;
  financeConsequence: string;
  customerConsequence: string;
  primaryAction: {
    label: string;
    href: string;
  };
  simulatedActions: string[];
  messages: DispatchOperationalMessage[];
};

export type CommandCenterOperationalActivity = {
  id: string;
  title: string;
  tone: DispatchThreadTone;
  owner: string;
  summary: string;
  consequence: string;
  href: string;
};

const reloadById = new Map(getReloadOpportunities().map((reload) => [reload.id, reload]));

function carrierName(carrierId: string) {
  return getCarrierById(carrierId)?.dba ?? carrierId;
}

function reloadStatusLabel(status: ReloadRecommendationStatus) {
  if (status === "recommended") return "Reload candidate cleared";
  if (status === "allowed_with_warning") return "Reload allowed with warning";
  if (status === "operations_review_required") return "Operations review required";
  return "Reload assignment blocked";
}

export function getDispatchOperationalThreads(): DispatchOperationalThread[] {
  const l011Reload = reloadById.get("RLD-011-FIN");
  const l004Reefer = reloadById.get("RLD-004-REEFER");
  const l003Blocked = reloadById.get("RLD-003-BLOCK");
  const l005Finance = reloadById.get("RLD-005-FIN");

  return [
    {
      id: "thread-l004-proof-release",
      type: "proof_escalation_thread",
      title: "L004 proof packet and release coordination",
      tone: "info",
      loadId: "L004",
      carrierId: "CAR-001",
      status: "Proof packet ready for dispatch release",
      nextOwner: "Dispatch lead",
      dispatchConsequence: "Dispatch can release the load after confirming the proof packet, seal photo, and driver pre-trip checklist are attached.",
      financeConsequence: "Settlement stays clean because rate confirmation, BOL, POD path, and proof controls are visible before departure.",
      customerConsequence: "Customer-facing packet can show readiness and proof expectations without exposing internal finance controls.",
      primaryAction: { label: "Review proof packet", href: "/loads/L004" },
      simulatedActions: ["Request packet update", "Release for dispatch", "Send customer proof link"],
      messages: [
        {
          id: "msg-l004-1",
          at: "09:05",
          owner: "Dispatch",
          message: "L004 release packet is ready for dispatcher signoff: rate confirmation, BOL path, seal proof, and pre-trip checklist are visible.",
          consequence: "Dispatcher can release the load without creating a manual proof chase.",
        },
        {
          id: "msg-l004-2",
          at: "09:08",
          owner: "Customer ops",
          message: "Customer proof view is ready for L004 after dispatch confirms pickup seal and cargo-photo expectations.",
          consequence: "Customer-facing status stays audit-ready before the load moves.",
        },
      ],
    },
    {
      id: "thread-l011-finance-release",
      type: "finance_release_thread",
      title: "L011 finance release and customer packet",
      tone: "ready",
      loadId: "L011",
      carrierId: "CAR-001",
      reloadId: "RLD-011-FIN",
      status: "Finance release cleared",
      nextOwner: "Dispatch lead",
      dispatchConsequence: l011Reload?.dispatchConsequence ?? "Dispatch can assign the reload after confirming pickup timing.",
      financeConsequence: l011Reload?.financeConsequence ?? "Factoring support stays clean because carrier and proof controls are aligned.",
      customerConsequence: l011Reload?.customerConsequence ?? "Customer packet can be released with sensitive details masked.",
      primaryAction: { label: "Prepare customer release", href: "/carriers/CAR-001/packet" },
      simulatedActions: ["Release for dispatch", "Prepare customer release", "Attach L011 proof packet"],
      messages: [
        {
          id: "msg-l011-1",
          at: "09:12",
          owner: "Finance",
          message: "Finance cleared same-day factoring release for L011 after invoice, POD, W-9, and carrier agreement checks matched.",
          consequence: "Settlement can proceed without a finance hold.",
        },
        {
          id: "msg-l011-2",
          at: "09:18",
          owner: "Dispatch",
          message: `${carrierName("CAR-001")} is the preferred reload carrier for ${l011Reload?.id ?? "RLD-011-FIN"} after Chicago delivery.`,
          consequence: "Deadhead exposure drops before the next Ohio Valley pickup.",
        },
      ],
    },
    {
      id: "thread-car003-blocked-reload",
      type: "carrier_readiness_thread",
      title: "CAR-003 reload assignment blocked",
      tone: "blocked",
      loadId: "L009",
      carrierId: "CAR-003",
      reloadId: "RLD-003-BLOCK",
      status: reloadStatusLabel(l003Blocked?.recommendationStatus ?? "blocked"),
      nextOwner: "Carrier compliance",
      dispatchConsequence: l003Blocked?.dispatchConsequence ?? "BOF excludes this carrier from the reload board until packet controls clear.",
      financeConsequence: l003Blocked?.financeConsequence ?? "No new settlement workflow should open while the carrier packet is blocked.",
      customerConsequence: l003Blocked?.customerConsequence ?? "Customer-safe packet cannot be released with expired insurance.",
      primaryAction: { label: "Resolve insurance hold", href: "/carriers/CAR-003/packet/certificate-of-insurance" },
      simulatedActions: ["Request packet update", "Hold for compliance", "Escalate to operations"],
      messages: [
        {
          id: "msg-car003-1",
          at: "09:24",
          owner: "Carrier compliance",
          message: `${carrierName("CAR-003")} remains blocked from reload assignment because liability coverage is expired and the broker-carrier agreement is unsigned.`,
          consequence: "Dispatch cannot assign this carrier to L009 or the flatbed reload.",
        },
      ],
    },
    {
      id: "thread-car004-reefer-review",
      type: "reload_coordination_thread",
      title: "Reefer reload operations review",
      tone: "review",
      loadId: "L008",
      carrierId: "CAR-004",
      reloadId: "RLD-004-REEFER",
      status: reloadStatusLabel(l004Reefer?.recommendationStatus ?? "operations_review_required"),
      nextOwner: "Operations manager",
      dispatchConsequence: l004Reefer?.dispatchConsequence ?? "Dispatch should hold assignment until operations signs off.",
      financeConsequence: l004Reefer?.financeConsequence ?? "Late POD behavior can delay settlement and factoring readiness.",
      customerConsequence: l004Reefer?.customerConsequence ?? "Customer release should include a proof-timeliness plan.",
      primaryAction: { label: "Escalate to operations", href: "/carriers/CAR-004" },
      simulatedActions: ["Escalate to operations", "Request POD timing plan", "Hold reefer release"],
      messages: [
        {
          id: "msg-car004-1",
          at: "09:31",
          owner: "Dispatch",
          message: `Reload candidate ${l004Reefer?.id ?? "RLD-004-REEFER"} identified after Atlanta delivery, but reefer POD timing must be confirmed before release.`,
          consequence: "Operations review protects customer release and settlement timing.",
        },
      ],
    },
    {
      id: "thread-l008-proof-escalation",
      type: "proof_escalation_thread",
      title: "L008 proof and claim evidence coordination",
      tone: "review",
      loadId: "L008",
      carrierId: "CAR-004",
      status: "Claim evidence partial",
      nextOwner: "Claims / safety",
      dispatchConsequence: "Dispatch should not promise a reefer reload until POD and claim proof timing are documented.",
      financeConsequence: "Claim review can delay release if damage evidence, POD, and safety notes are not aligned.",
      customerConsequence: "Customer release needs a clean proof narrative before invoice readiness is presented.",
      primaryAction: { label: "Open safety claim", href: "/safety" },
      simulatedActions: ["Request proof update", "Hold for finance review", "Escalate claim evidence"],
      messages: [
        {
          id: "msg-l008-1",
          at: "09:36",
          owner: "Safety",
          message: "POD and damage evidence are partial on L008; HOS coaching and driver statement remain tied to the claim review.",
          consequence: "Customer and finance release stay under review until evidence is complete.",
        },
      ],
    },
    {
      id: "thread-car005-payment-warning",
      type: "finance_release_thread",
      title: "CAR-005 finance warning on power-only reload",
      tone: "review",
      loadId: "L010",
      carrierId: "CAR-005",
      reloadId: "RLD-005-FIN",
      status: reloadStatusLabel(l005Finance?.recommendationStatus ?? "allowed_with_warning"),
      nextOwner: "Finance",
      dispatchConsequence: l005Finance?.dispatchConsequence ?? "Dispatch may plan the reload with finance hold visibility.",
      financeConsequence: l005Finance?.financeConsequence ?? "Settlement release remains at risk until W-9 and payment instructions are verified.",
      customerConsequence: l005Finance?.customerConsequence ?? "Payment controls remain internal while customer packet stays limited.",
      primaryAction: { label: "Hold for finance review", href: "/carriers/CAR-005/packet/w9-masked" },
      simulatedActions: ["Hold for finance review", "Request W-9 update", "Release after finance signoff"],
      messages: [
        {
          id: "msg-car005-1",
          at: "09:42",
          owner: "Finance",
          message: `${carrierName("CAR-005")} can be planned for a low-risk power-only reload, but W-9 and ACH verification remain open.`,
          consequence: "Dispatch sees the reload path while finance keeps settlement release controlled.",
        },
      ],
    },
  ];
}

export function getOperationalThreadsForLoad(loadId: string): DispatchOperationalThread[] {
  const threads = getDispatchOperationalThreads().filter((thread) => thread.loadId === loadId);
  if (threads.length > 0) return threads;
  return getDispatchOperationalThreads().slice(0, 3);
}

export function getCommandCenterOperationalActivity(): CommandCenterOperationalActivity[] {
  return getDispatchOperationalThreads().map((thread) => ({
    id: `activity-${thread.id}`,
    title: thread.title,
    tone: thread.tone,
    owner: thread.nextOwner,
    summary: thread.messages[0]?.message ?? thread.status,
    consequence: thread.dispatchConsequence,
    href: thread.primaryAction.href,
  }));
}
