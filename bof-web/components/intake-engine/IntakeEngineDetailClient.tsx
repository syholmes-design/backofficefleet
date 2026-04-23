"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DocClassification, IntakeRecord } from "@/lib/intake-engine-types";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { useIntakeEngineStore } from "@/lib/stores/intake-engine-store";

function docLabel(c: DocClassification): string {
  const m: Record<DocClassification, string> = {
    rate_confirmation: "Rate confirmation",
    bill_of_lading: "BOL",
    proof_of_delivery: "POD",
    invoice: "Invoice",
    lumper_receipt: "Lumper receipt",
    claim_support: "Claim support",
    cdl: "CDL",
    medical_card: "Medical card",
    mvr: "MVR",
    employment_i9: "Employment / I-9",
    w9: "W-9",
    bank_info: "Bank info",
    unknown_mixed: "Unknown / mixed",
  };
  return m[c] ?? c;
}

function attChip(status: IntakeRecord["attachments"][0]["attachment_status"]): string {
  if (status === "parsed") return "bof-status-pill bof-status-pill-ok";
  if (status === "needs_review") return "bof-status-pill bof-status-pill-warn";
  if (status === "rejected") return "bof-status-pill bof-status-pill-danger";
  return "bof-status-pill bof-status-pill-muted";
}

export function IntakeEngineDetailClient() {
  const params = useParams();
  const router = useRouter();
  const intakeId = String(params.intakeId ?? "");
  const { data } = useBofDemoData();

  const intake = useIntakeEngineStore((s) => s.getIntake(intakeId));
  const patchIntake = useIntakeEngineStore((s) => s.patchIntake);
  const setExtracted = useIntakeEngineStore((s) => s.setExtracted);
  const approveIntake = useIntakeEngineStore((s) => s.approveIntake);
  const holdIntake = useIntakeEngineStore((s) => s.holdIntake);
  const requestInfo = useIntakeEngineStore((s) => s.requestInfo);
  const finalizeIntake = useIntakeEngineStore((s) => s.finalizeIntake);
  const splitIntoTrips = useIntakeEngineStore((s) => s.splitIntoTrips);
  const approveAllTrips = useIntakeEngineStore((s) => s.approveAllTrips);
  const approveTrip = useIntakeEngineStore((s) => s.approveTrip);
  const holdBatch = useIntakeEngineStore((s) => s.holdBatch);
  const matchToDriver = useIntakeEngineStore((s) => s.matchToDriver);
  const matchToLoad = useIntakeEngineStore((s) => s.matchToLoad);

  const [notice, setNotice] = useState<string | null>(null);
  const [driverPick, setDriverPick] = useState("");
  const [loadPick, setLoadPick] = useState("");

  const drivers = data.drivers;
  const loads = data.loads;

  const multi = intake?.intake_kind === "multi_trip";

  const canFinalize = useMemo(() => {
    if (!intake || intake.status === "finalized") return false;
    if (intake.intake_kind === "multi_trip") {
      return intake.proposed_trips.some((t) => t.trip_status === "approved");
    }
    return true;
  }, [intake]);

  if (!intake) {
    return (
      <div className="bof-page bof-intake-engine">
        <p className="bof-lead">Intake not found.</p>
        <Link href="/intake" className="bof-link-secondary">
          ← Back to inbox
        </Link>
      </div>
    );
  }

  const ex = intake.extracted;

  return (
    <div className="bof-page bof-intake-engine">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/intake" className="bof-link-secondary">
          Intake Engine
        </Link>
        <span aria-hidden> / </span>
        <span>{intake.intake_id}</span>
      </nav>

      <header className="bof-intake-engine-detail-head">
        <div>
          <h1 className="bof-title">{intake.intake_id}</h1>
          <p className="bof-muted bof-intake-engine-subject">{intake.subject_line}</p>
        </div>
        <span className="bof-status-pill bof-status-pill-info">{intake.status.replace(/_/g, " ")}</span>
      </header>

      {notice ? (
        <div className="bof-intake-engine-notice" role="status">
          {notice}
        </div>
      ) : null}

      <div className="bof-intake-engine-detail-grid">
        <section className="bof-intake-engine-card" aria-labelledby="int-sum">
          <h2 id="int-sum" className="bof-h2">
            Intake summary
          </h2>
          <dl className="bof-intake-engine-dl">
            <dt>Source</dt>
            <dd>
              {intake.source_type} · {intake.source_sender}
            </dd>
            <dt>Received</dt>
            <dd>{new Date(intake.received_at).toLocaleString()}</dd>
            <dt>Kind</dt>
            <dd>{intake.intake_kind.replace(/_/g, " ")}</dd>
            <dt>Match confidence</dt>
            <dd>{intake.match_confidence}</dd>
            <dt>Extraction confidence</dt>
            <dd>{intake.extraction_confidence}</dd>
            <dt>Linked driver</dt>
            <dd>{intake.linked_driver_id ?? "—"}</dd>
            <dt>Linked load</dt>
            <dd>{intake.linked_load_id ?? "—"}</dd>
            {intake.pricing_summary ? (
              <>
                <dt>Pricing</dt>
                <dd>{intake.pricing_summary}</dd>
              </>
            ) : null}
            {intake.finalized_at ? (
              <>
                <dt>Finalized</dt>
                <dd>{new Date(intake.finalized_at).toLocaleString()}</dd>
              </>
            ) : null}
            {intake.derived_load_ids.length > 0 ? (
              <>
                <dt>Draft loads</dt>
                <dd>
                  {intake.derived_load_ids.map((id) => (
                    <span key={id}>
                      <Link href="/dispatch" className="bof-link-secondary">
                        {id}
                      </Link>{" "}
                    </span>
                  ))}
                  <span className="bof-muted"> (open Dispatch board)</span>
                </dd>
              </>
            ) : null}
          </dl>
        </section>

        <section className="bof-intake-engine-card" aria-labelledby="int-att">
          <h2 id="int-att" className="bof-h2">
            Attachments
          </h2>
          <ul className="bof-intake-engine-attach-list">
            {intake.attachments.map((a) => (
              <li key={a.attachment_id} className="bof-intake-engine-attach-row">
                <div>
                  <div className="bof-intake-engine-cell-title">{a.file_name}</div>
                  <div className="bof-muted">{docLabel(a.doc_classification)}</div>
                </div>
                <span className={attChip(a.attachment_status)}>{a.attachment_status}</span>
                {a.preview_url ? (
                  <a
                    href={a.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Preview
                  </a>
                ) : (
                  <span className="bof-muted">—</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="bof-intake-engine-card bof-intake-engine-card--wide" aria-labelledby="int-ex">
          <h2 id="int-ex" className="bof-h2">
            Extracted details
          </h2>
          <div className="bof-intake-engine-form-grid">
            <label className="bof-intake-engine-field">
              <span>Customer / broker</span>
              <input
                value={ex.customer_or_broker ?? ""}
                onChange={(e) => setExtracted(intake.intake_id, { customer_or_broker: e.target.value })}
              />
            </label>
            <label className="bof-intake-engine-field">
              <span>Load #</span>
              <input
                value={ex.load_number ?? ""}
                onChange={(e) => setExtracted(intake.intake_id, { load_number: e.target.value })}
              />
            </label>
            <label className="bof-intake-engine-field">
              <span>Pickup facility</span>
              <input
                value={ex.pickup_facility ?? ""}
                onChange={(e) => setExtracted(intake.intake_id, { pickup_facility: e.target.value })}
              />
            </label>
            <label className="bof-intake-engine-field">
              <span>Delivery facility</span>
              <input
                value={ex.delivery_facility ?? ""}
                onChange={(e) => setExtracted(intake.intake_id, { delivery_facility: e.target.value })}
              />
            </label>
            <label className="bof-intake-engine-field">
              <span>Pickup date</span>
              <input
                value={ex.pickup_date ?? ""}
                onChange={(e) => setExtracted(intake.intake_id, { pickup_date: e.target.value })}
              />
            </label>
            <label className="bof-intake-engine-field">
              <span>Delivery date</span>
              <input
                value={ex.delivery_date ?? ""}
                onChange={(e) => setExtracted(intake.intake_id, { delivery_date: e.target.value })}
              />
            </label>
            <label className="bof-intake-engine-field">
              <span>Linehaul (USD)</span>
              <input
                type="number"
                value={ex.rate_linehaul ?? ""}
                onChange={(e) =>
                  setExtracted(intake.intake_id, {
                    rate_linehaul: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="bof-intake-engine-field">
              <span>Equipment</span>
              <input
                value={ex.equipment ?? ""}
                onChange={(e) => setExtracted(intake.intake_id, { equipment: e.target.value })}
              />
            </label>
            {intake.intake_kind === "driver_document" ? (
              <>
                <label className="bof-intake-engine-field">
                  <span>Credential</span>
                  <input
                    value={ex.credential_type ?? ""}
                    onChange={(e) => setExtracted(intake.intake_id, { credential_type: e.target.value })}
                  />
                </label>
                <label className="bof-intake-engine-field">
                  <span>Expiration (detected)</span>
                  <input
                    value={ex.expiration_detected ?? ""}
                    onChange={(e) => setExtracted(intake.intake_id, { expiration_detected: e.target.value })}
                  />
                </label>
              </>
            ) : null}
            <label className="bof-intake-engine-field bof-intake-engine-field--full">
              <span>Notes</span>
              <textarea
                rows={3}
                value={ex.notes ?? ""}
                onChange={(e) => setExtracted(intake.intake_id, { notes: e.target.value })}
              />
            </label>
          </div>
        </section>

        <section className="bof-intake-engine-card bof-intake-engine-card--wide" aria-labelledby="int-miss">
          <h2 id="int-miss" className="bof-h2">
            Missing items &amp; review
          </h2>
          {intake.missing_items.length ? (
            <ul className="bof-intake-engine-bullet">
              {intake.missing_items.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : (
            <p className="bof-muted">No blocking missing items flagged.</p>
          )}
          {intake.flagged_fields.length ? (
            <div className="bof-intake-engine-flagbox">
              <strong>Flagged fields</strong>
              <ul className="bof-intake-engine-bullet">
                {intake.flagged_fields.map((f) => (
                  <li key={f}>
                    <code className="bof-code">{f}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {intake.review_reason ? <p className="bof-intake-engine-warn">{intake.review_reason}</p> : null}
          <label className="bof-intake-engine-field bof-intake-engine-field--full">
            <span>Review notes</span>
            <textarea
              rows={3}
              value={intake.review_notes}
              onChange={(e) => patchIntake(intake.intake_id, { review_notes: e.target.value })}
            />
          </label>
          {intake.readiness_impact ? (
            <p className="bof-muted">
              Readiness impact: <strong>{intake.readiness_impact.replace(/_/g, " ")}</strong>
            </p>
          ) : null}
        </section>

        <section className="bof-intake-engine-card bof-intake-engine-card--wide" aria-labelledby="int-req">
          <h2 id="int-req" className="bof-h2">
            Requirements
          </h2>
          <div className="bof-intake-engine-form-grid">
            <label className="bof-intake-engine-field bof-intake-engine-field--full">
              <span>Insurance requirements</span>
              <textarea
                rows={2}
                value={intake.insurance_requirements}
                onChange={(e) => patchIntake(intake.intake_id, { insurance_requirements: e.target.value })}
              />
            </label>
            <label className="bof-intake-engine-field bof-intake-engine-field--full">
              <span>BOL requirements</span>
              <textarea
                rows={2}
                value={intake.bol_requirements}
                onChange={(e) => patchIntake(intake.intake_id, { bol_requirements: e.target.value })}
              />
            </label>
            <label className="bof-intake-engine-field bof-intake-engine-field--full">
              <span>POD requirements</span>
              <textarea
                rows={2}
                value={intake.pod_requirements}
                onChange={(e) => patchIntake(intake.intake_id, { pod_requirements: e.target.value })}
              />
            </label>
          </div>
        </section>

        {multi ? (
          <section className="bof-intake-engine-card bof-intake-engine-card--wide" aria-labelledby="int-trips">
            <h2 id="int-trips" className="bof-h2">
              Proposed trips
            </h2>
            <div className="bof-table-wrap">
              <table className="bof-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Pickup</th>
                    <th>Delivery</th>
                    <th>Rate</th>
                    <th>Missing</th>
                    <th>Status</th>
                    <th>Approve</th>
                  </tr>
                </thead>
                <tbody>
                  {intake.proposed_trips.map((t) => (
                    <tr key={t.trip_id}>
                      <td>{t.row_number}</td>
                      <td>{t.pickup}</td>
                      <td>{t.delivery}</td>
                      <td>${t.rate.toLocaleString()}</td>
                      <td className="bof-muted">{t.missing_items.length ? t.missing_items.join("; ") : "—"}</td>
                      <td>
                        <span className="bof-status-pill bof-status-pill-muted">{t.trip_status}</span>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={t.trip_status === "approved"}
                          disabled={t.trip_status === "held" || t.trip_status === "finalized"}
                          onChange={(e) => approveTrip(intake.intake_id, t.trip_id, e.target.checked)}
                          aria-label={`Approve trip ${t.row_number}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>

      <footer className="bof-intake-engine-actions">
        <div className="bof-intake-engine-actions-row">
          <button
            type="button"
            className="bof-intake-engine-btn"
            disabled={intake.status === "finalized"}
            onClick={() => {
              approveIntake(intake.intake_id);
              setNotice("Marked ready for approval.");
            }}
          >
            Approve
          </button>
          <button
            type="button"
            className="bof-intake-engine-btn"
            disabled={intake.status === "finalized"}
            onClick={() => {
              holdIntake(intake.intake_id);
              setNotice("Intake placed on hold.");
            }}
          >
            Hold
          </button>
          <button
            type="button"
            className="bof-intake-engine-btn"
            disabled={intake.status === "finalized"}
            onClick={() => {
              requestInfo(intake.intake_id);
              setNotice("Status set to awaiting info.");
            }}
          >
            Request info
          </button>
          {multi ? (
            <>
              <button
                type="button"
                className="bof-intake-engine-btn"
                disabled={intake.status === "finalized"}
                onClick={() => {
                  approveAllTrips(intake.intake_id);
                  setNotice("All open trips approved.");
                }}
              >
                Approve all trips
              </button>
              <button
                type="button"
                className="bof-intake-engine-btn"
                disabled={intake.status === "finalized"}
                onClick={() => {
                  holdBatch(intake.intake_id);
                  setNotice("Batch held.");
                }}
              >
                Hold batch
              </button>
              <button
                type="button"
                className="bof-intake-engine-btn"
                disabled={intake.status === "finalized"}
                onClick={() => {
                  splitIntoTrips(intake.intake_id);
                  setNotice("Split into single-trip child intakes. Parent finalized.");
                  router.push("/intake");
                }}
              >
                Split into trips
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="bof-intake-engine-btn bof-intake-engine-btn--primary"
            disabled={!canFinalize || intake.status === "finalized"}
            onClick={() => {
              const r = finalizeIntake(intake.intake_id);
              setNotice(r.ok ? r.message : r.message);
            }}
          >
            Finalize
          </button>
        </div>
        <div className="bof-intake-engine-actions-row bof-intake-engine-match">
          <label>
            <span className="bof-muted">Match driver</span>
            <select value={driverPick} onChange={(e) => setDriverPick(e.target.value)}>
              <option value="">Select…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} · {d.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="bof-intake-engine-btn"
            disabled={!driverPick || intake.status === "finalized"}
            onClick={() => {
              matchToDriver(intake.intake_id, driverPick);
              setNotice(`Linked driver ${driverPick}.`);
            }}
          >
            Apply driver match
          </button>
          <label>
            <span className="bof-muted">Match load</span>
            <select value={loadPick} onChange={(e) => setLoadPick(e.target.value)}>
              <option value="">Select…</option>
              {loads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} · {l.number}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="bof-intake-engine-btn"
            disabled={!loadPick || intake.status === "finalized"}
            onClick={() => {
              matchToLoad(intake.intake_id, loadPick);
              setNotice(`Linked load ${loadPick}.`);
            }}
          >
            Apply load match
          </button>
        </div>
      </footer>
    </div>
  );
}
