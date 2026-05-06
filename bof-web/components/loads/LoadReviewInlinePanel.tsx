"use client";

import type { BofData } from "@/lib/load-bof-data";
import { getLoadRiskExplanation } from "@/lib/load-risk-explanation";
import { getCanonicalLoadEvidenceForLoad } from "@/lib/canonical-load-evidence";
import { buildTripDocumentPacket } from "@/lib/load-trip-packet";

type LoadReviewInlinePanelProps = {
  loadId: string;
  loadNumber: string;
  riskExplanation: ReturnType<typeof getLoadRiskExplanation>;
  data: BofData;
};


function getSeverityLabel(severity: string): string {
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  if (severity === "warning") return "Medium";
  return "Watch";
}

function getLifecycleStageFromLoad(data: BofData, loadId: string): string {
  const load = data.loads.find(l => l.id === loadId);
  if (!load) return "Unknown";
  
  if (load.dispatchExceptionFlag) return "Exception Review";
  if (load.status === "Pending") return "Pre-trip / Dispatch Release";
  if (load.status === "En Route") return "In Route";
  if (load.status === "Delivered") {
    if (load.podStatus === "verified") return "Settlement / Billing";
    return "Delivery / POD";
  }
  return "Dispatch review";
}

function getAvailableDocuments(data: BofData, loadId: string): string[] {
  const evidence = getCanonicalLoadEvidenceForLoad(data, loadId);
  const trip = buildTripDocumentPacket(data, loadId);
  
  if (!trip) return [];
  
  const available: string[] = [];
  
  // Check for key documents using correct BofLoadEvidenceType values
  if (evidence.some(e => e.evidenceType === "rate_confirmation")) {
    available.push("Rate confirmation");
  }
  if (evidence.some(e => e.evidenceType === "bol")) {
    available.push("BOL");
  }
  if (evidence.some(e => e.evidenceType === "pod")) {
    available.push("POD");
  }
  
  return available;
}

function getMissingRequiredProof(data: BofData, loadId: string): string[] {
  const load = data.loads.find(l => l.id === loadId);
  if (!load) return [];
  
  const missing: string[] = [];
  
  if (load.podStatus !== "verified") {
    missing.push("POD pending");
  }
  if (load.sealStatus === "Mismatch") {
    missing.push("Seal review required");
  }
  if (load.dispatchExceptionFlag) {
    missing.push("Exception review required");
  }
  
  return missing;
}

export function LoadReviewInlinePanel({
  loadId,
  loadNumber,
  riskExplanation,
  data,
}: LoadReviewInlinePanelProps) {
  const stage = getLifecycleStageFromLoad(data, loadId);
  const severityLabel = getSeverityLabel(riskExplanation.riskStatus);
  const availableDocuments = getAvailableDocuments(data, loadId);
  const missingRequiredProof = getMissingRequiredProof(data, loadId);

  return (
    <div className="bof-load-review-inline-panel">
      <div className="bof-load-review-inline-header">
        <h4 className="bof-load-review-inline-load-id">
          Load {loadId} / {loadNumber}
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
          <h5 className="bof-load-review-inline-headline">Lifecycle stage</h5>
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

        <div className="bof-load-review-inline-documents">
          <h5 className="bof-load-review-inline-headline">Available documents</h5>
          <div className="bof-load-review-inline-text">
            {availableDocuments.length > 0 ? (
              availableDocuments.map((doc, index) => (
                <div key={index} className="bof-load-review-inline-doc-item">
                  {doc}
                </div>
              ))
            ) : (
              <a href={`/loads/${loadId}`} className="bof-load-review-inline-btn bof-load-review-inline-btn--primary">
                Open trip packet to review available documents
              </a>
            )}
          </div>
        </div>

        <div className="bof-load-review-inline-missing">
          <h5 className="bof-load-review-inline-headline">Missing required proof</h5>
          <div className="bof-load-review-inline-text">
            {missingRequiredProof.length > 0 ? (
              missingRequiredProof.map((proof, index) => (
                <div key={index} className="bof-load-review-inline-missing-item">
                  {proof}
                </div>
              ))
            ) : (
              <div>No required proof issue identified from current load status</div>
            )}
          </div>
        </div>

        <div className="bof-load-review-inline-actions">
          <h5 className="bof-load-review-inline-headline">Actions</h5>
          <div className="bof-load-review-inline-buttons">
            {missingRequiredProof.includes("POD pending") && (
              <a
                href={`/loads/${loadId}`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Open POD
              </a>
            )}
            
            {missingRequiredProof.includes("Seal review required") && (
              <a
                href={`/loads/${loadId}`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Review delivery proof
              </a>
            )}
            
            {missingRequiredProof.includes("Exception review required") && (
              <a
                href={`/loads/${loadId}`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Review assignment blocker
              </a>
            )}
            
            {riskExplanation.reasons?.[0]?.category === "driver" && (
              <a
                href={`/dispatch`}
                className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
              >
                Review assignment blocker
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
            
            <a
              href={`/loads/${loadId}`}
              className="bof-load-review-inline-btn bof-load-review-inline-btn--primary"
            >
              Open trip packet
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
