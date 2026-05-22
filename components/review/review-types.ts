export type ReviewDrawerIssueSeverity = "critical" | "high" | "warning" | "info";

export type ReviewDrawerIssue = {
  id: string;
  severity: ReviewDrawerIssueSeverity;
  category: string;
  title: string;
  detail: string;
  whyItMatters: string;
  recommendedFix: string;
  actionHref?: string;
  actionLabel?: string;
  canResolveInDemo: boolean;
  resolved?: boolean;
  /** Driver dispatch hard gate id — cleared via demo dispatch blocker path */
  dispatchBlockerId?: string;
};
