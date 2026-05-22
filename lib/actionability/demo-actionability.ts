import type { BofData } from "@/lib/load-bof-data";
import type { ActionableIssue } from "@/lib/actionability/types";
import { getDriverActionabilityIssues } from "@/lib/actionability/driver-actionability";
import { getLoadActionabilityIssues } from "@/lib/actionability/load-actionability";
import { getSettlementActionabilityIssues } from "@/lib/actionability/settlement-actionability";
import { getSafetyActionabilityIssues } from "@/lib/actionability/safety-actionability";
import { getDocumentActionabilityIssues } from "@/lib/actionability/document-actionability";

export function getDemoActionabilityIssues(data: BofData): ActionableIssue[] {
  return [
    ...getLoadActionabilityIssues(data),
    ...getDriverActionabilityIssues(data),
    ...getDocumentActionabilityIssues(data),
    ...getSettlementActionabilityIssues(data),
    ...getSafetyActionabilityIssues(data),
  ];
}

