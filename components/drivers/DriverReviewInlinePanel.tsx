"use client";

import { useState } from "react";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";
import type { DriverReviewExplanation } from "@/lib/driver-review-explanation";

export function DriverReviewInlinePanel({
  explanation,
  driverId,
  driverName,
}: {
  explanation: DriverReviewExplanation;
  driverId: string;
  driverName: string;
}) {
  const [affirming, setAffirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const statusLabel = explanation.severity || "needs_review";
  const statusColor = 
    explanation.severity === "blocked" ? "bof-status-bof-status--blocked" :
    explanation.severity === "needs_review" ? "bof-status-bof-status--warning" :
    "bof-status-bof-status--info";

  return (
    <div className="bof-driver-review-inline-panel">
      <div className="bof-driver-review-inline-header">
        <DriverAvatar
          name={driverName}
          photoUrl={driverPhotoPath(driverId)}
          size={32}
        />
        <div className="bof-driver-review-inline-title">
          <h4 className="bof-driver-review-inline-driver-name">{driverName}</h4>
          <span className={`bof-status-chip ${statusColor}`}>
            {statusLabel === "blocked" ? "Blocked" :
             statusLabel === "needs_review" ? "Needs Review" :
             statusLabel === "watch" ? "Watch" : "Ready"}
          </span>
        </div>
      </div>

      <div className="bof-driver-review-inline-content">
        <div className="bof-driver-review-inline-issue">
          <h5 className="bof-driver-review-inline-headline">Issue</h5>
          <p className="bof-driver-review-inline-text">{explanation.headline}</p>
        </div>

        <div className="bof-driver-review-inline-status">
          <h5 className="bof-driver-review-inline-headline">Status</h5>
          <p className="bof-driver-review-inline-text">{statusLabel}</p>
        </div>

        <div className="bof-driver-review-inline-impact">
          <h5 className="bof-driver-review-inline-headline">Why it matters</h5>
          <p className="bof-driver-review-inline-text">{explanation.impact}</p>
        </div>

        <div className="bof-driver-review-inline-fix">
          <h5 className="bof-driver-review-inline-headline">Recommended fix</h5>
          <p className="bof-driver-review-inline-text">{explanation.recommendedFix}</p>
        </div>

        <div className="bof-driver-review-inline-actions">
          <h5 className="bof-driver-review-inline-headline">Actions</h5>
          <div className="bof-driver-review-inline-buttons">
            {explanation.issueType === "document" && explanation.documentType && (
              <a
                href={`/drivers/${driverId}/vault?doc=${explanation.documentType}`}
                className="bof-driver-review-inline-btn bof-driver-review-inline-btn--primary"
              >
                Open {explanation.entityLabel || explanation.documentType}
              </a>
            )}
            
            {explanation.issueType === "safety" && (
              <a
                href={`/safety?driver=${driverId}`}
                className="bof-driver-review-inline-btn bof-driver-review-inline-btn--primary"
              >
                Open safety record
              </a>
            )}
            
            {explanation.issueType === "settlement" && (
              <a
                href={`/settlements?driver=${driverId}`}
                className="bof-driver-review-inline-btn bof-driver-review-inline-btn--primary"
              >
                Open settlement hold
              </a>
            )}
            
            {explanation.issueType === "dispatch" && explanation.loadId && (
              <a
                href={`/loads/${explanation.loadId}`}
                className="bof-driver-review-inline-btn bof-driver-review-inline-btn--primary"
              >
                Open load {explanation.loadId}
              </a>
            )}
            
            <a
              href={`/drivers/${driverId}/vault`}
              className="bof-driver-review-inline-btn"
            >
              Open driver vault
            </a>
            {explanation.issues.some((issue) => issue.id === "credential:medical_renewal_action_required" && !issue.resolved) && (
              <button
                type="button"
                className="bof-driver-review-inline-btn bof-driver-review-inline-btn--primary"
                disabled={affirming}
                onClick={async () => {
                  setAffirming(true);
                  setMessage(null);
                  try {
                    const response = await fetch(`/api/drivers/${driverId}/medical-renewal/affirm`, { method: "POST" });
                    const body = await response.json() as { error?: string };
                    if (!response.ok) throw new Error(body.error ?? "Unable to affirm appointment");
                    setMessage("Appointment affirmed and recorded.");
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Unable to affirm appointment");
                  } finally {
                    setAffirming(false);
                  }
                }}
              >
                {affirming ? "Recording..." : "Affirm appointment"}
              </button>
            )}
            {message ? <span className="bof-driver-review-inline-text">{message}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
