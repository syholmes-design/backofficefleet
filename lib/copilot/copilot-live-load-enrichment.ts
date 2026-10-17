import type { CopilotAdvocateView, CopilotFact } from "@/lib/copilot/copilot-shared";

type LiveLoadProcessPayload = {
  loadIdentity?: { id: string; status: string; customerName?: string };
  financeHandoff?: {
    nextRequiredAction: string;
    brokenHandoffs: string[];
    settlement: { summary: string; heldCount: number };
    deliveryEvidence: { summary: string };
  } | null;
  unifiedProcess?: {
    nextUnifiedAction: string;
    loadStatus: string;
    financeHandoff: { settlement: { summary: string } };
  } | null;
};

export function enrichLoadCopilotWithLiveProcess(
  view: CopilotAdvocateView,
  live: LiveLoadProcessPayload | null | undefined,
): CopilotAdvocateView {
  if (!live?.loadIdentity) return view;

  const finance = (live.unifiedProcess?.financeHandoff ?? live.financeHandoff) as LiveLoadProcessPayload["financeHandoff"];
  const facts: CopilotFact[] = [...view.facts];
  const unsupported = view.unsupported.filter(
    (line) => !line.includes("Live Prisma load process") && !line.includes("Load process intelligence is not called"),
  );

  facts.unshift({
    id: `live-load-status-${live.loadIdentity.id}`,
    domain: "Load status (LIVE)",
    source: "load-process-intelligence",
    sourceClass: "AUTHORITATIVE",
    fact: `Load ${live.loadIdentity.id} is ${live.loadIdentity.status} in Prisma (${live.loadIdentity.customerName ?? "customer n/a"}).`,
    causeClass: "RECORDED_CAUSE",
    recordedCause: "Load.status on fleet-scoped Prisma row",
  });

  if (finance) {
    facts.unshift({
      id: `live-load-finance-${live.loadIdentity.id}`,
      domain: "Load-to-finance (LIVE)",
      source: "load-finance-handoff",
      sourceClass: "AUTHORITATIVE",
      fact: `${finance.deliveryEvidence?.summary ?? "POD n/a"} · ${finance.settlement?.summary ?? "Settlement n/a"}`,
      causeClass: "RECORDED_CAUSE",
      recordedCause: live.unifiedProcess?.nextUnifiedAction ?? finance.nextRequiredAction ?? "financeHandoff projection",
    });
    if (finance.brokenHandoffs?.length) {
      facts.unshift({
        id: `live-load-handoff-${live.loadIdentity.id}`,
        domain: "Load handoff integrity (LIVE)",
        source: "load-finance-handoff",
        sourceClass: "AUTHORITATIVE",
        fact: finance.brokenHandoffs[0],
        causeClass: "RECORDED_CAUSE",
        recordedCause: "Unified load-finance handoff rules",
      });
    }
  }

  return {
    ...view,
    facts,
    unsupported: [
      "Demo BofData load timelines remain for L00x keys; LIVE facts above come from authorized Prisma load-process-intelligence.",
      ...unsupported,
    ],
  };
}
