"use client";

import type { BofData } from "@/lib/load-bof-data";
import { getLoadRiskExplanation } from "@/lib/load-risk-explanation";

type LoadReviewInlinePanelProps = {
  loadId: string;
  loadNumber: string;
  riskExplanation: ReturnType<typeof getLoadRiskExplanation>;
  data: BofData;
};

function getLoadIssueStage(risk: any): string {
  if (risk.category === "proof") return "POD / proof";
  if (risk.category === "documents") return "Documents";
  if (risk.category === "driver") return "Assignment";
  if (risk.category === "compliance") return "Compliance";
  if (risk.category === "settlement") return "Settlement";
  if (risk.category === "safety") return "Safety";
  if (risk.category === "route") return "Route";
  return "Unknown";
}

function getSeverityLabel(severity: string): string {
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  if (severity === "warning") return "Medium";
  return "Watch";
}

export function LoadReviewInlinePanel({
  loadId,
  loadNumber,
  riskExplanation,
  data,
}: LoadReviewInlinePanelProps) {
  const stage = getLoadIssueStage(riskExplanation);
  const severityLabel = getSeverityLabel(riskExplanation.riskStatus);

  return (
    <div className="bof-load-review-inline-panel">
      <div className="bof-load-review-inline-header">
        <h4 className="bof-load-review-inline-load-id">
          {loadId} · {loadNumber}
        </h4>
        <span className={`bof-load-review-inline-stage bof-load-review-inline-stage--${riskExplanation.riskStatus}`}>
          {stage}
        </span>
      </div>

      <div className="bof-load-review-inline-content">
        <div className="bof-load-review-inline-issue">
          <h5 className="bof-load-review-inline-headline">Issue</h5>
          <p className="bof-load-review-inline-text">{riskExplanation.primaryReasonLabel}</p>
        </div>

        <div className="bof-load-review-inline-status">
          <h5 className="bof-load-review-inline-headline">Stage</h5>
          <p className="bof-load-review-inline-text">{stage}</p>
        </div>

        <div className="bof-load-review-inline-severity">
          <h5 className="bof-load-review-inline-headline">Severity</h5>
          <p className="bof-load-review-inline-text">{severityLabel}</p>
        </div>

        <div className="bof-load-review-inline-impact">
          <h5 className="bof-load-review-inline-headline">Why it matters</h5>
          <p className="bof-load-review-inline-text">{riskExplanation.recommendedNextStep}</p>
        </div>

        <div className="bof-load-review-inline-fix">
          <h5 className="bof-load-review-inline-headline">Recommended fix</h5>
          <p className="bof-load-review-inline-text">{riskExplanation.recommendedNextStep}</p>
        </div>

        <div className="bof-load-review-inline-actions">
          <h5 className="bof-load-review-inline-headline">Actions</h5>
          <div className="bof-load-review-inline-buttons">
            {riskExplanation.reasons?.[0]?.category === "proof" && (
              <a
                href={`/loads/${loadId}`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Open {loadId} proof issue
              </a>
            )}
            
            {riskExplanation.reasons?.[0]?.category === "documents" && (
              <a
                href={`/loads/${loadId}`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Open {loadId} documents
              </a>
            )}
            
            {riskExplanation.reasons?.[0]?.category === "driver" && (
              <a
                href={`/dispatch`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Open {loadId} dispatch record
              </a>
            )}
            
            {riskExplanation.reasons?.[0]?.category === "compliance" && (
              <a
                href={`/dispatch`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Review assignment blocker
              </a>
            )}
            
            {riskExplanation.reasons?.[0]?.category === "settlement" && (
              <a
                href={`/settlements`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Open {loadId} settlement
              </a>
            )}
            
            {riskExplanation.reasons?.[0]?.category === "safety" && (
              <a
                href={`/safety`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Open {loadId} safety issue
              </a>
            )}
            
            {riskExplanation.reasons?.[0]?.category === "route" && (
              <a
                href={`/dispatch`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Open {loadId} route issue
              </a>
            )}
            
            <a
              href={`/loads/${loadId}`}
              className="bof-load-review-inline-btn"
            >
              Open load {loadId}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
