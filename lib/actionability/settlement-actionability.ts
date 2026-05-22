import type { BofData } from "@/lib/load-bof-data";
import type { ActionableIssue } from "@/lib/actionability/types";
import { formatUsd } from "@/lib/format-money";

export function getSettlementActionabilityIssues(data: BofData): ActionableIssue[] {
  return data.settlements
    .filter((s) => /hold|pending|awaiting/i.test(String(s.status ?? "")))
    .map((s) => {
      const driver = data.drivers.find((d) => d.id === s.driverId);
      const loadId = (s as { loadId?: string }).loadId;
      return {
        id: `settlement-${s.settlementId}`,
        label: s.settlementId,
        entityType: "settlement",
        entityId: s.settlementId,
        entityName: driver?.name ?? s.driverId,
        headline: `${driver?.name ?? s.driverId} settlement hold`,
        severity: /hold/i.test(String(s.status ?? "")) ? "high" : "medium",
        whyItMatters: "Driver pay can be delayed until the settlement hold reason is resolved.",
        recommendedFix: "Review hold reason, verify linked load proof, then release settlement if clear.",
        owner: "Finance",
        exposureLabel: formatUsd(s.netPay),
        primaryAction: {
          label: "Open settlement hold",
          href: `/settlements?driver=${s.driverId}`,
        },
        secondaryActions: loadId ? [{ label: `Open ${loadId}`, href: `/loads/${loadId}` }] : [],
      };
    });
}

