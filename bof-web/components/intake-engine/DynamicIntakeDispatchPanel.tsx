"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { IntakeRecord } from "@/lib/intake-engine-types";
import { buildDraftLoadFromExtracted } from "@/lib/intake-engine-build-load";

type Props = {
  activeIntake: IntakeRecord | null | undefined;
  entityId: string;
};

function formatCurrency(amount?: number): string {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLocation(city?: string, state?: string, facility?: string): string {
  if (facility) return facility;
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  return "—";
}

export function DynamicIntakeDispatchPanel({ activeIntake, entityId }: Props) {
  const extracted = useMemo(() => activeIntake?.extracted, [activeIntake]);
  
  const generatedLoad = useMemo(() => {
    if (!extracted) return null;
    return buildDraftLoadFromExtracted(extracted, { intake_id: activeIntake?.intake_id });
  }, [extracted, activeIntake?.intake_id]);

  const readinessIssues = useMemo(() => {
    const issues: string[] = [];
    if (!extracted) return issues;
    
    if (!extracted.customer_or_broker) issues.push("Missing customer/broker");
    if (!extracted.pickup_facility && !extracted.pickup_address) issues.push("Missing pickup location");
    if (!extracted.delivery_facility && !extracted.delivery_address) issues.push("Missing delivery location");
    if (!extracted.pickup_date) issues.push("Missing pickup date");
    if (!extracted.rate_linehaul) issues.push("Missing rate information");
    if (!extracted.equipment) issues.push("Missing equipment type");
    
    return issues;
  }, [extracted]);

  const documentStatus = useMemo(() => {
    if (!activeIntake) return { total: 0, received: 0, needsReview: 0, missing: 0 };
    
    const total = activeIntake.attachments.length;
    const received = activeIntake.attachments.filter(a => a.attachment_status === "received").length;
    const needsReview = activeIntake.attachments.filter(a => a.attachment_status === "needs_review").length;
    const missing = activeIntake.attachments.filter(a => a.attachment_status === "rejected").length;
    
    return { total, received, needsReview, missing };
  }, [activeIntake]);

  if (!activeIntake) {
    return (
      <section className="bof-card" style={{ marginTop: 20 }}>
        <h2 className="bof-h2">Intake to Dispatch</h2>
        <p className="bof-muted">Select an intake record to view dynamic dispatch preparation details.</p>
      </section>
    );
  }

  return (
    <section className="bof-card" style={{ marginTop: 20 }}>
      <h2 className="bof-h2">Intake to Dispatch</h2>
      <p className="bof-muted bof-small">
        Live intake data and dispatch preparation for <code className="bof-code">{activeIntake.intake_id}</code>
      </p>

      {/* Core Load Information */}
      <div style={{ marginTop: 20 }}>
        <h3 className="bof-h3">Load Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginTop: 12 }}>
          <div>
            <span className="bof-muted bof-small">Customer/Broker</span>
            <div style={{ fontWeight: 600 }}>{extracted?.customer_or_broker || "—"}</div>
          </div>
          <div>
            <span className="bof-muted bof-small">Load Number</span>
            <div style={{ fontWeight: 600 }}>{extracted?.load_number || "—"}</div>
          </div>
          <div>
            <span className="bof-muted bof-small">Equipment</span>
            <div style={{ fontWeight: 600 }}>{extracted?.equipment || "—"}</div>
          </div>
          <div>
            <span className="bof-muted bof-small">Rate Linehaul</span>
            <div style={{ fontWeight: 600 }}>{formatCurrency(extracted?.rate_linehaul)}</div>
          </div>
        </div>
      </div>

      {/* Route Information */}
      <div style={{ marginTop: 24 }}>
        <h3 className="bof-h3">Route Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 12 }}>
          <div>
            <span className="bof-muted bof-small">Pickup</span>
            <div style={{ fontWeight: 600 }}>
              {formatLocation(extracted?.pickup_city, extracted?.pickup_state, extracted?.pickup_facility)}
            </div>
            {extracted?.pickup_address && (
              <div className="bof-muted bof-small">{extracted.pickup_address}</div>
            )}
            <div className="bof-muted bof-small">{formatDate(extracted?.pickup_date)}</div>
          </div>
          <div>
            <span className="bof-muted bof-small">Delivery</span>
            <div style={{ fontWeight: 600 }}>
              {formatLocation(extracted?.delivery_city, extracted?.delivery_state, extracted?.delivery_facility)}
            </div>
            {extracted?.delivery_address && (
              <div className="bof-muted bof-small">{extracted.delivery_address}</div>
            )}
            <div className="bof-muted bof-small">{formatDate(extracted?.delivery_date)}</div>
          </div>
        </div>
      </div>

      {/* Documents Status */}
      <div style={{ marginTop: 24 }}>
        <h3 className="bof-h3">Documents</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 12 }}>
          <div>
            <span className="bof-muted bof-small">Total Attachments</span>
            <div style={{ fontWeight: 600 }}>{documentStatus.total}</div>
          </div>
          <div>
            <span className="bof-muted bof-small">Received</span>
            <div style={{ fontWeight: 600, color: "#22c55e" }}>{documentStatus.received}</div>
          </div>
          <div>
            <span className="bof-muted bof-small">Needs Review</span>
            <div style={{ fontWeight: 600, color: "#f59e0b" }}>{documentStatus.needsReview}</div>
          </div>
          <div>
            <span className="bof-muted bof-small">Issues</span>
            <div style={{ fontWeight: 600, color: "#ef4444" }}>{documentStatus.missing}</div>
          </div>
        </div>

        {documentStatus.needsReview > 0 ? (
          <p className="bof-muted bof-small" style={{ marginTop: 12 }}>
            <Link href={`/intake/${activeIntake.intake_id}`} className="bof-link-secondary">
              Open intake to review flagged attachments
            </Link>
          </p>
        ) : null}

        {activeIntake.attachments.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="bof-muted bof-small mb-2">Document Types:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {activeIntake.attachments.map((att) => (
                <span
                  key={att.attachment_id}
                  className="bof-status-pill"
                  style={{
                    backgroundColor: att.attachment_status === "received" ? "#dcfce7" : 
                                   att.attachment_status === "needs_review" ? "#fef3c7" : "#fee2e2",
                    color: att.attachment_status === "received" ? "#166534" : 
                           att.attachment_status === "needs_review" ? "#92400e" : "#991b1b",
                  }}
                >
                  {att.doc_classification.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Readiness Assessment */}
      <div style={{ marginTop: 24 }}>
        <h3 className="bof-h3">Dispatch Readiness</h3>
        {readinessIssues.length > 0 ? (
          <div>
            <div style={{ color: "#dc2626", fontWeight: 600, marginBottom: 8 }}>
              {readinessIssues.length} Blocker{readinessIssues.length > 1 ? "s" : ""} Resolved Before Dispatch
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#dc2626" }}>
              {readinessIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{ color: "#16a34a", fontWeight: 600 }}>
            ✓ Ready for dispatch preparation
          </div>
        )}
      </div>

      {/* Generated Load Preview */}
      {generatedLoad && (
        <div style={{ marginTop: 24 }}>
          <h3 className="bof-h3">Generated Load Preview</h3>
          <div style={{ backgroundColor: "#f8fafc", padding: 16, borderRadius: 8, marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <span className="bof-muted bof-small">Load ID</span>
                <div style={{ fontWeight: 600 }}>{generatedLoad.load_id}</div>
              </div>
              <div>
                <span className="bof-muted bof-small">Customer</span>
                <div style={{ fontWeight: 600 }}>{generatedLoad.customer_name}</div>
              </div>
              <div>
                <span className="bof-muted bof-small">Origin</span>
                <div style={{ fontWeight: 600 }}>{generatedLoad.origin}</div>
              </div>
              <div>
                <span className="bof-muted bof-small">Destination</span>
                <div style={{ fontWeight: 600 }}>{generatedLoad.destination}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: 24 }}>
        <h3 className="bof-h3">Actions</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
          <Link
            href={`/dispatch/intake?intakeId=${encodeURIComponent(activeIntake.intake_id)}`}
            className="bof-btn-primary"
          >
            Open Dispatch Load Intake
          </Link>
          {readinessIssues.length === 0 && (
            <Link
              href={`/loads?new=${encodeURIComponent(entityId)}`}
              className="bof-btn-secondary"
            >
              Create Load
            </Link>
          )}
          <Link
            href={`/intake/${activeIntake.intake_id}`}
            className="bof-link-secondary"
          >
            Full Intake Details
          </Link>
        </div>
      </div>
    </section>
  );
}
