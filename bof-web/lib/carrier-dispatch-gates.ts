import type { CarrierRecord } from "@/lib/carrier-registry";
import { getCarrierPacketSummary } from "@/lib/carrier-registry";

export type CarrierDispatchGateOutcome = "allowed" | "warning" | "operations_review" | "blocked";
export type CarrierDispatchGateTone = "ready" | "review" | "watch" | "blocked";

export type CarrierDispatchGate = {
  carrierId: string;
  outcome: CarrierDispatchGateOutcome;
  tone: CarrierDispatchGateTone;
  indicator: "Dispatch ready" | "Review warning" | "Operations review required" | "Dispatch blocked" | "Finance hold risk" | "Reefer compliance watch";
  assignmentSimulation:
    | "Carrier assignment cleared"
    | "Assignment allowed with warning"
    | "Assignment pending operations review"
    | "Assignment blocked";
  reason: string;
  operationalRisk: string;
  requiredNextAction: string;
  dispatchConsequence: string;
  customerConsequence: string;
  financeConsequence: string;
  packetPercent: number;
};

export type CarrierGateEscalation = {
  id: string;
  carrierId: string;
  title: string;
  carrierName: string;
  tone: CarrierDispatchGateTone;
  impact: string;
  nextAction: string;
  href: string;
};

export function getCarrierDispatchGate(carrier: CarrierRecord): CarrierDispatchGate {
  const packet = getCarrierPacketSummary(carrier);
  const base = {
    carrierId: carrier.id,
    reason: carrier.statusReason,
    requiredNextAction: carrier.nextAction,
    dispatchConsequence: carrier.dispatchImpact,
    packetPercent: packet.percent,
  };

  if (carrier.id === "CAR-001") {
    return {
      ...base,
      outcome: "allowed",
      tone: "ready",
      indicator: "Dispatch ready",
      assignmentSimulation: "Carrier assignment cleared",
      operationalRisk: "No active carrier gate. Authority, insurance, W-9, agreement, payment, equipment, and lane controls are verified.",
      customerConsequence: "Customer-safe packet can be released with authority, insurance, agreement, equipment fit, and lane qualification visible.",
      financeConsequence: "L011 factoring support is clean because W-9, agreement, invoice, proof, and settlement controls are aligned.",
    };
  }

  if (carrier.id === "CAR-002") {
    return {
      ...base,
      outcome: "warning",
      tone: "review",
      indicator: "Review warning",
      assignmentSimulation: "Assignment allowed with warning",
      operationalRisk: "Cargo insurance renewal is inside the active review window, so high-value and refrigerated assignments need compliance confirmation.",
      customerConsequence: "Customer packet may be shared with a renewal-watch note until the updated cargo certificate arrives.",
      financeConsequence: "Settlement can proceed after load proof, but finance should keep renewal visibility on any longer-running assignment.",
    };
  }

  if (carrier.id === "CAR-003") {
    return {
      ...base,
      outcome: "blocked",
      tone: "blocked",
      indicator: "Dispatch blocked",
      assignmentSimulation: "Assignment blocked",
      operationalRisk: "Expired auto liability and unsigned carrier terms create uncovered operating exposure.",
      customerConsequence: "Customer release is blocked because the packet would expose expired insurance and unsigned agreement controls.",
      financeConsequence: "New settlement or factoring support should not be opened until the insurance and agreement holds clear.",
    };
  }

  if (carrier.id === "CAR-004") {
    return {
      ...base,
      outcome: "operations_review",
      tone: "watch",
      indicator: "Reefer compliance watch",
      assignmentSimulation: "Assignment pending operations review",
      operationalRisk: "Repeated reefer POD delays and conditional safety review require manager signoff before another refrigerated load is released.",
      customerConsequence: "Customer packet can be reviewed, but dispatch should not promise clean proof timing without a POD recovery plan.",
      financeConsequence: "Late POD behavior can delay settlement release and factoring readiness on temperature-sensitive freight.",
    };
  }

  return {
    ...base,
    outcome: "warning",
    tone: "review",
    indicator: "Finance hold risk",
    assignmentSimulation: "Assignment allowed with warning",
    operationalRisk: "W-9 and ACH verification are incomplete, creating payment-control risk even though authority and insurance are current.",
    customerConsequence: "Customer packet can show authority and insurance, but internal finance controls should stay visible before release.",
    financeConsequence: "Settlement and factoring handoff remain at risk until W-9 and payment instructions are verified.",
  };
}

export function getCarrierGateStats(carriers: CarrierRecord[]) {
  const gates = carriers.map(getCarrierDispatchGate);
  return {
    allowed: gates.filter((gate) => gate.outcome === "allowed").length,
    warning: gates.filter((gate) => gate.outcome === "warning").length,
    operationsReview: gates.filter((gate) => gate.outcome === "operations_review").length,
    blocked: gates.filter((gate) => gate.outcome === "blocked").length,
  };
}

export function getCarrierGateEscalations(carriers: CarrierRecord[]): CarrierGateEscalation[] {
  const byId = new Map(carriers.map((carrier) => [carrier.id, carrier]));
  const escalationOrder = [
    {
      id: "blocked-carrier",
      carrierId: "CAR-003",
      title: "Blocked carrier",
      impact: "Expired auto liability and unsigned agreement prevent dispatch and customer packet release.",
    },
    {
      id: "insurance-renewal",
      carrierId: "CAR-002",
      title: "Insurance renewal warning",
      impact: "Cargo policy renewal is due soon; high-value or reefer freight requires compliance confirmation.",
    },
    {
      id: "reefer-watch",
      carrierId: "CAR-004",
      title: "Reefer compliance watch",
      impact: "POD delay pattern requires manager review before another refrigerated assignment.",
    },
    {
      id: "finance-hold",
      carrierId: "CAR-005",
      title: "Finance packet hold",
      impact: "Missing W-9 and ACH verification create settlement and factoring release risk.",
    },
    {
      id: "customer-release-hold",
      carrierId: "CAR-003",
      title: "Customer release hold",
      impact: "Customer-safe packet cannot be released while insurance and agreement controls are blocked.",
    },
  ];

  return escalationOrder.flatMap((item) => {
    const carrier = byId.get(item.carrierId);
    if (!carrier) return [];
    const gate = getCarrierDispatchGate(carrier);
    return [{
      id: item.id,
      carrierId: carrier.id,
      title: item.title,
      carrierName: carrier.dba,
      tone: gate.tone,
      impact: item.impact,
      nextAction: gate.requiredNextAction,
      href: `/carriers/${carrier.id}`,
    }];
  });
}
