import type { BofData } from "@/lib/load-bof-data";
import { getSafetyScorecardRows } from "@/lib/safety-scorecard";
import type { ActionableIssue } from "@/lib/actionability/types";

export function getSafetyActionabilityIssues(data: BofData): ActionableIssue[] {
  return getSafetyScorecardRows()
    .filter((r) => r.performanceTier === "At Risk")
    .map((r) => {
      const driver = data.drivers.find((d) => d.id === r.driverId);
      return {
        id: `safety-${r.driverId}`,
        label: driver?.name ?? r.driverId,
        entityType: "safety",
        entityId: r.driverId,
        entityName: driver?.name ?? r.driverId,
        headline: `${driver?.name ?? r.driverId} safety review required`,
        severity: "high",
        whyItMatters: "An unresolved safety item can impact dispatch eligibility and claims exposure.",
        recommendedFix: "Open safety record, document outcome, and clear or escalate the flag.",
        owner: "Safety",
        primaryAction: {
          label: "Open safety review",
          href: `/safety?driver=${r.driverId}`,
        },
        secondaryActions: [{ label: "Open driver file", href: `/drivers/${r.driverId}` }],
      };
    });
}

