export type ActionableIssue = {
  id: string;
  label: string;
  entityType:
    | "driver"
    | "load"
    | "document"
    | "safety"
    | "settlement"
    | "proof"
    | "dispatch"
    | "revenue";
  entityId?: string;
  entityName?: string;
  headline: string;
  severity: "critical" | "high" | "medium" | "watch";
  whyItMatters: string;
  recommendedFix: string;
  owner?: string;
  exposureLabel?: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryActions?: Array<{
    label: string;
    href: string;
  }>;
};

