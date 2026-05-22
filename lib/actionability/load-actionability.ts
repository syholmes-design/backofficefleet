import type { BofData } from "@/lib/load-bof-data";
import { getLoadProofItems } from "@/lib/load-proof";
import type { ActionableIssue } from "@/lib/actionability/types";

export function getLoadActionabilityIssues(data: BofData): ActionableIssue[] {
  const out: ActionableIssue[] = [];
  for (const load of data.loads) {
    const proofItems = getLoadProofItems(data, load.id);
    const blockers = proofItems.filter((p) => p.blocksPayment);
    if (blockers.length === 0 && !load.dispatchExceptionFlag) continue;
    const blocker = blockers[0];
    out.push({
      id: `load-${load.id}`,
      label: load.number ?? load.id,
      entityType: blocker ? "proof" : "dispatch",
      entityId: load.id,
      entityName: load.number ?? load.id,
      headline: blocker
        ? `${load.id} missing ${blocker.type}`
        : `${load.id} has a dispatch exception`,
      severity: blocker ? "critical" : "high",
      whyItMatters: blocker
        ? "Payment or claim workflow cannot complete until required proof is attached."
        : "Dispatch continuity is at risk until the load exception is cleared.",
      recommendedFix: blocker
        ? `Attach ${blocker.type} and verify proof packet completion.`
        : "Open load detail and resolve the dispatch exception.",
      owner: "Dispatch",
      primaryAction: {
        label: `Open ${load.id} proof issue`,
        href: `/loads/${load.id}#load-review`,
      },
      secondaryActions: [{ label: `Open ${load.id}`, href: `/loads/${load.id}` }],
    });
  }
  return out;
}

