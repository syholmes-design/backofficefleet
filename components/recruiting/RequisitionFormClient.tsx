"use client";

import Link from "next/link";
import { useState } from "react";
import { REQUISITION_FIELD_LABELS, REQUISITION_FORM_SECTIONS } from "@/lib/recruiting/requisition-fields";
import { isCdlRequisition } from "@/lib/recruiting/requisition-transitions";
import "./recruiting.css";

type Approval = {
  id: string;
  approvalRole: string;
  decision: string;
  reviewerName: string | null;
  notes: string | null;
  signatureName: string | null;
  signatureCaptureKind: string;
  decidedAt: string | null;
};

type RequisitionRecord = {
  id: string;
  publicNumber: string;
  status: string;
  recruitingPipelineState: string;
  recruitingOpenedAt: string | null;
  fleetId: string;
  fleet: { id: string; name: string };
  createdBy: { email: string | null; name: string | null };
  requestingManagerName: string | null;
  dateSubmitted: string | null;
  targetStartDate: string | null;
  numberOfPositions: number;
  minimumAge: number | null;
  cdlClass: string | null;
  approvals: Approval[];
  [key: string]: unknown;
};

const TEXT_FIELDS_BY_SECTION: Record<number, string[]> = {
  1: ["requestingCarrierName", "usdot", "mcNumber", "terminalDomicile", "statesOfOperation"],
  2: ["requestingManagerName", "department", "supervisor"],
  3: ["positionClassification", "employmentClassification", "flsaClassification", "urgency", "positionTitle", "reportingStructure"],
  4: ["workLocation", "homeTimePattern", "routeLane", "typicalNightsAway", "equipmentType", "soloTeamOperation"],
  5: ["cdlClass", "endorsements", "experienceRequirements", "mvrSafetyRequirements"],
  6: ["compensationStructure", "payRange", "accessorialPay", "signOnBonus", "performanceBonus", "benefits"],
  7: ["positionSummary", "essentialFunctions", "physicalRequirements", "schedule", "hosCycle"],
  8: ["recruitingInstructions", "sourcingChannels", "screeningRequirements", "applicationRouting", "targetFillMetrics"],
  9: ["budgetStatus", "headcount", "financialJustification", "estimatedRecruitingCost", "exceptions"],
};

const LONG_FIELDS = new Set([
  "positionSummary",
  "essentialFunctions",
  "physicalRequirements",
  "recruitingInstructions",
  "screeningRequirements",
  "financialJustification",
  "exceptions",
  "bofHrUse",
]);

const BOOLEAN_FIELDS_BY_SECTION: Record<number, string[]> = {
  4: ["borderCrossings"],
  5: ["pspRequired", "clearinghouseRequired", "medicalRequired", "drugTestingRequired", "backgroundCheckRequired", "tsaRequired"],
};

function asString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function toDateInput(value: unknown) {
  const raw = asString(value);
  if (!raw) return "";
  return raw.slice(0, 10);
}

export function RequisitionFormClient({ initial }: { initial: RequisitionRecord }) {
  const [record, setRecord] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [approvalDrafts, setApprovalDrafts] = useState<Record<string, { notes: string; signatureName: string; reviewerName: string }>>({});
  const readOnly = record.status !== "DRAFT";

  function patchLocal(field: string, value: unknown) {
    setRecord((current) => ({ ...current, [field]: value }));
  }

  async function persistDraft() {
    const body: Record<string, unknown> = {};
    for (const fields of Object.values(TEXT_FIELDS_BY_SECTION)) {
      for (const field of fields) body[field] = record[field] ?? null;
    }
    for (const fields of Object.values(BOOLEAN_FIELDS_BY_SECTION)) {
      for (const field of fields) body[field] = record[field] ?? false;
    }
    body.numberOfPositions = record.numberOfPositions;
    body.minimumAge = record.minimumAge;
    body.targetStartDate = record.targetStartDate;
    body.bofHrUse = record.bofHrUse ?? null;
    const response = await fetch(`/api/recruiting/requisitions/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Save failed");
    setRecord(payload);
    return payload;
  }

  async function saveDraft() {
    setBusy(true);
    setError(null);
    try {
      await persistDraft();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(action: string) {
    setBusy(true);
    setError(null);
    try {
      if (action === "submit" && record.status === "DRAFT") {
        await persistDraft();
      }
      const response = await fetch(`/api/recruiting/requisitions/${record.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `${action} failed`);
      setRecord(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `${action} failed`);
    } finally {
      setBusy(false);
    }
  }

  async function recordApproval(approvalRole: string, decision: string) {
    setBusy(true);
    setError(null);
    try {
      const draft = approvalDrafts[approvalRole] ?? { notes: "", signatureName: "", reviewerName: "" };
      const response = await fetch(`/api/recruiting/requisitions/${record.id}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalRole, decision, ...draft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Approval failed");
      setRecord(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Approval failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bof-recruiting">
      <p>
        <Link href="/recruiting">Back to requisitions</Link>
      </p>
      <div className="bof-recruiting-header">
        <div>
          <h1>{record.publicNumber}</h1>
          <p className="bof-recruiting-lede">
            CDL Driver Requisition · {record.fleet.name} · {record.status.replaceAll("_", " ")} · Pipeline {record.recruitingPipelineState.replaceAll("_", " ")}
          </p>
        </div>
      </div>
      {error ? <p className="bof-recruiting-error">{error}</p> : null}
      <div className="bof-recruiting-actions">
        {record.status === "DRAFT" ? (
          <>
            <button type="button" disabled={busy} onClick={saveDraft}>
              Save draft
            </button>
            <button type="button" disabled={busy} onClick={() => runAction("submit")}>
              Submit
            </button>
          </>
        ) : null}
        {record.status === "SUBMITTED" ? (
          <button type="button" disabled={busy} onClick={() => runAction("review")}>
            Start review
          </button>
        ) : null}
        {record.status === "UNDER_REVIEW" || record.status === "ON_HOLD" ? (
          <button type="button" disabled={busy} onClick={() => runAction("approve")}>
            Approve
          </button>
        ) : null}
        {["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(record.status) ? (
          <button type="button" disabled={busy} onClick={() => runAction("hold")}>
            Place on hold
          </button>
        ) : null}
        {record.status === "ON_HOLD" ? (
          <button type="button" disabled={busy} onClick={() => runAction("review")}>
            Return to review
          </button>
        ) : null}
        {record.status === "APPROVED" ? (
          <button type="button" disabled={busy} onClick={() => runAction("fill")}>
            Mark filled
          </button>
        ) : null}
        {!["CANCELLED", "FILLED"].includes(record.status) ? (
          <button type="button" disabled={busy} onClick={() => runAction("cancel")}>
            Cancel
          </button>
        ) : null}
      </div>

      {REQUISITION_FORM_SECTIONS.map((section) => (
        <section className="bof-recruiting-section" key={section.id}>
          <h2>
            {section.id}. {section.title}
          </h2>
          {section.id === 1 ? (
            <div className="bof-recruiting-grid">
              <label>
                Requisition identity
                <input value={record.publicNumber} readOnly />
              </label>
              <label>
                Fleet ID
                <input value={record.fleetId} readOnly />
              </label>
              <label>
                Date submitted
                <input value={toDateInput(record.dateSubmitted)} readOnly />
              </label>
              <label>
                Target start date
                <input type="date" value={toDateInput(record.targetStartDate)} disabled={readOnly} onChange={(event) => patchLocal("targetStartDate", event.target.value || null)} />
              </label>
              <label>
                Number of positions
                <input type="number" min={1} value={record.numberOfPositions} disabled={readOnly} onChange={(event) => patchLocal("numberOfPositions", Number(event.target.value))} />
              </label>
            </div>
          ) : null}
          {section.id === 10 ? (
            <div>
              <p className="bof-recruiting-note">
                Phase 1 endpoint: an APPROVED requisition becomes READY FOR RECRUITING. Candidate, Screening, Offer, Driver, DriverIntake, qualification, vault, and readiness are not created from this form.
              </p>
              <div className="bof-recruiting-grid">
                <label>
                  Pipeline state
                  <input value={record.recruitingPipelineState.replaceAll("_", " ")} readOnly />
                </label>
                <label>
                  Recruiting opened
                  <input value={record.recruitingOpenedAt ? new Date(record.recruitingOpenedAt).toLocaleString() : "Not open"} readOnly />
                </label>
              </div>
            </div>
          ) : null}
          {section.id === 11 ? (
            <div>
              <p className="bof-recruiting-note">
                Signatures are stored as form fields, not legal electronic signatures. Fleet Safety Director is required before Approve when CDL class is present.
                {isCdlRequisition(asString(record.cdlClass)) ? " This requisition is treated as a CDL requisition." : " No CDL class entered — Safety Director approval is not required."}
              </p>
              {record.approvals.map((approval) => {
                const draft = approvalDrafts[approval.approvalRole] ?? {
                  notes: approval.notes ?? "",
                  signatureName: approval.signatureName ?? "",
                  reviewerName: approval.reviewerName ?? "",
                };
                return (
                  <div className="bof-recruiting-section" key={approval.id}>
                    <strong>{approval.approvalRole.replaceAll("_", " ")}</strong>
                    <p className="bof-recruiting-note">
                      {approval.decision.replaceAll("_", " ")}
                      {approval.decidedAt ? ` · ${new Date(approval.decidedAt).toLocaleString()}` : ""}
                    </p>
                    <div className="bof-recruiting-grid">
                      <label>
                        Reviewer name
                        <input
                          value={draft.reviewerName}
                          disabled={readOnly && record.status === "DRAFT"}
                          onChange={(event) =>
                            setApprovalDrafts((current) => ({ ...current, [approval.approvalRole]: { ...draft, reviewerName: event.target.value } }))
                          }
                        />
                      </label>
                      <label>
                        Signature (form field)
                        <input
                          value={draft.signatureName}
                          onChange={(event) =>
                            setApprovalDrafts((current) => ({ ...current, [approval.approvalRole]: { ...draft, signatureName: event.target.value } }))
                          }
                        />
                      </label>
                      <label>
                        Notes / reason
                        <textarea
                          value={draft.notes}
                          onChange={(event) => setApprovalDrafts((current) => ({ ...current, [approval.approvalRole]: { ...draft, notes: event.target.value } }))}
                        />
                      </label>
                    </div>
                    <div className="bof-recruiting-actions">
                      <button type="button" disabled={busy || record.status === "DRAFT"} onClick={() => recordApproval(approval.approvalRole, "APPROVED")}>
                        Record approved
                      </button>
                      <button type="button" disabled={busy || record.status === "DRAFT"} onClick={() => recordApproval(approval.approvalRole, "NOT_APPROVED")}>
                        Record not approved
                      </button>
                    </div>
                  </div>
                );
              })}
              <label>
                BOF HR use
                <textarea value={asString(record.bofHrUse)} disabled={readOnly} onChange={(event) => patchLocal("bofHrUse", event.target.value)} />
              </label>
            </div>
          ) : null}
          {TEXT_FIELDS_BY_SECTION[section.id]?.length ? (
            <div className="bof-recruiting-grid">
              {TEXT_FIELDS_BY_SECTION[section.id].map((field) => (
                <label key={field}>
                  {REQUISITION_FIELD_LABELS[field]?.label ?? field}
                  {LONG_FIELDS.has(field) ? (
                    <textarea value={asString(record[field])} disabled={readOnly} onChange={(event) => patchLocal(field, event.target.value)} />
                  ) : (
                    <input value={asString(record[field])} disabled={readOnly} onChange={(event) => patchLocal(field, event.target.value)} />
                  )}
                </label>
              ))}
              {section.id === 5 ? (
                <label>
                  Minimum age
                  <input type="number" value={record.minimumAge ?? ""} disabled={readOnly} onChange={(event) => patchLocal("minimumAge", event.target.value === "" ? null : Number(event.target.value))} />
                </label>
              ) : null}
            </div>
          ) : null}
          {BOOLEAN_FIELDS_BY_SECTION[section.id]?.map((field) => (
            <label className="bof-recruiting-check" key={field}>
              <input type="checkbox" checked={Boolean(record[field])} disabled={readOnly} onChange={(event) => patchLocal(field, event.target.checked)} />
              {REQUISITION_FIELD_LABELS[field]?.label ?? field}
            </label>
          ))}
        </section>
      ))}
    </div>
  );
}
