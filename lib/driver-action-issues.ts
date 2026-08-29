import type { BofData } from "@/lib/load-bof-data";
import { getDriverReviewExplanation, type DriverReviewRequirement } from "@/lib/driver-review-explanation";

export type DriverActionIssue = {
  driverId: string;
  area: "Documents" | "Settlement" | "Compliance" | "Safety" | "Dispatch";
  severity: "info" | "warning" | "blocker";
  title: string;
  description: string;
  whyItMatters: string;
  primaryActionLabel: string;
  primaryActionHref: string;
};

/**
 * Returns actionable driver issues from canonical data sources.
 * This function consolidates issues from documents, settlements, compliance, safety, and dispatch
 * to provide a unified view of what needs attention for each driver.
 */
export function getDriverActionIssues(
  driverId: string,
  data: BofData,
  requirements: DriverReviewRequirement[] = [],
): DriverActionIssue[] {
  const issues: DriverActionIssue[] = [];
  
  // Get canonical driver review explanation
  const review = getDriverReviewExplanation(data, driverId, requirements);
  const openIssues = review.issues.filter(issue => !issue.resolved);
  
  // Convert canonical issues to DriverActionIssue format
  for (const issue of openIssues) {
    // Map category to area
    let area: DriverActionIssue["area"];
    switch (issue.category) {
      case "documents":
        area = "Documents";
        break;
      case "settlement":
        area = "Settlement";
        break;
      case "compliance":
        area = "Compliance";
        break;
      case "safety":
        area = "Safety";
        break;
      case "dispatch":
        area = "Dispatch";
        break;
      default:
        area = "Documents"; // fallback
    }
    
    // Map severity
    let severity: DriverActionIssue["severity"];
    switch (issue.severity) {
      case "critical":
        severity = "blocker";
        break;
      case "high":
        severity = "blocker";
        break;
      case "warning":
        severity = "warning";
        break;
      case "info":
        severity = "info";
        break;
      default:
        severity = "warning"; // fallback
    }
    
    // Special handling for settlement holds
    if (issue.category === "settlement" && /hold|review/i.test(issue.title)) {
      issues.push({
        driverId,
        area: "Settlement",
        severity: "warning",
        title: "Settlement hold needs review",
        description: "A settlement item is pending review for this driver.",
        whyItMatters: "Dispatch and payroll should confirm this hold is expected before next assignment.",
        primaryActionLabel: "Open settlement hold",
        primaryActionHref: issue.actionHref || `/drivers/${driverId}/settlements`,
      });
    } else {
      // Standard issue mapping
      issues.push({
        driverId,
        area,
        severity,
        title: issue.title,
        description: issue.detail || issue.title,
        whyItMatters: issue.whyItMatters || "May affect dispatch eligibility and compliance.",
        primaryActionLabel: issue.actionLabel || "Open workspace",
        primaryActionHref: issue.actionHref || `/drivers/${driverId}`,
      });
    }
  }
  
  return issues;
}

/**
 * Gets the primary (most severe) driver action issue
 */
export function getPrimaryDriverActionIssue(driverId: string, data: BofData): DriverActionIssue | null {
  const issues = getDriverActionIssues(driverId, data);
  if (issues.length === 0) return null;
  
  // Sort by severity: blocker > warning > info
  const severityOrder = { blocker: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  return issues[0];
}

/**
 * Determines if a driver has any action issues
 */
export function driverHasActionIssues(driverId: string, data: BofData): boolean {
  return getDriverActionIssues(driverId, data).length > 0;
}

/**
 * Gets the count of drivers with action issues
 */
export function getDriversWithActionIssuesCount(data: BofData): number {
  return data.drivers.filter(driver => driverHasActionIssues(driver.id, data)).length;
}
