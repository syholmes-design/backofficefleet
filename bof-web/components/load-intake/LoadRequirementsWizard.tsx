"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  countWarnings,
  hasBlockingChecks,
  runAutoChecks,
} from "@/lib/load-requirements-intake-checks";
import type { IntakeWizardState, LoadPacket } from "@/lib/load-requirements-intake-types";

const SHIP_ID = "SHIP-INTAKE-DRAFT";
const FAC_ID = "FAC-INTAKE-DRAFT";
const LR_ID = "LR-INTAKE-DRAFT";
const REQ_ID = "CR-INTAKE-DRAFT";

function createInitialState(): IntakeWizardState {
  return {
    lastDraftSavedAt: null,
    shipper: {
      shipper_id: SHIP_ID,
      shipper_name: "",
      primary_contact_name: "",
      primary_contact_email: "",
      primary_contact_phone: "",
    },
    facility: {
      facility_id: FAC_ID,
      shipper_id: SHIP_ID,
      facility_name: "",
      address: "",
      city: "",
      state: "",
      facility_rules: "",
      appointment_required: false,
    },
    loadRequirement: {
      load_requirement_id: LR_ID,
      shipper_id: SHIP_ID,
      facility_id: FAC_ID,
      commodity: "",
      weight: 0,
      pallet_count: 0,
      piece_count: 0,
      equipment_type: "",
      special_handling: "",
      temperature_required: false,
      temperature_min: undefined,
      temperature_max: undefined,
    },
    compliance: {
      requirement_id: REQ_ID,
      load_requirement_id: LR_ID,
      seal_required: false,
      seal_number_required: false,
      pickup_photos_required: false,
      delivery_photos_required: false,
      cargo_photos_required: false,
      insurance_requirements: "",
      appointment_window_start: "",
      appointment_window_end: "",
      bol_instructions: "",
      pod_requirements: "",
      accessorial_rules: "",
      lumper_expected: false,
    },
    loadPacket: null,
  };
}

function YesNo({
  value,
  onChange,
  idPrefix,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  idPrefix: string;
  label: string;
}) {
  return (
    <div className="bof-load-intake-field">
      <span
        id={`${idPrefix}-label`}
        style={{
          display: "block",
          marginBottom: "0.35rem",
          fontSize: "0.72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#94a3b8",
        }}
      >
        {label}
      </span>
      <div
        className="bof-load-intake-yesno"
        role="group"
        aria-labelledby={`${idPrefix}-label`}
      >
        <button
          type="button"
          id={`${idPrefix}-yes`}
          aria-pressed={value === true}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          type="button"
          aria-pressed={value === false}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

const STEPS = [
  { n: 1, title: "Shipper & facility", short: "Shipper" },
  { n: 2, title: "Load requirements", short: "Load" },
  { n: 3, title: "Compliance & docs", short: "Compliance" },
  { n: 4, title: "Auto-checks & packet", short: "Review" },
] as const;

export function LoadRequirementsWizard() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<IntakeWizardState>(() => createInitialState());

  const touchDraft = useCallback(() => {
    setState((s) => ({
      ...s,
      lastDraftSavedAt: new Date().toISOString(),
    }));
  }, []);

  const checks = useMemo(
    () =>
      runAutoChecks(state.shipper, state.facility, state.loadRequirement, state.compliance),
    [state.shipper, state.facility, state.loadRequirement, state.compliance]
  );

  const blocking = hasBlockingChecks(checks);
  const warnings = countWarnings(checks);

  const goStep = (n: number) => setStep(n);

  const generatePacket = () => {
    if (blocking) return;
    const packet: LoadPacket = {
      load_packet_id: `LP-${Date.now()}`,
      load_requirement_id: state.loadRequirement.load_requirement_id,
      packet_status: "Ready for dispatch board",
      missing_items_count: warnings,
    };
    setState((s) => ({ ...s, loadPacket: packet }));
  };

  return (
    <div className="bof-load-intake">
      <div className="bof-load-intake-hero">
        <h1>Shipper requirements intake</h1>
        <p>
          Pre-dispatch operational capture: shipper rules, load profile, compliance, and BOF
          auto-validation. Output feeds the dispatch load packet — not a carrier signup flow.
        </p>
      </div>

      <div className="bof-load-intake-progress" role="navigation" aria-label="Wizard progress">
        {STEPS.map((s) => (
          <button
            key={s.n}
            type="button"
            className={`bof-load-intake-step-tab ${
              step === s.n
                ? "bof-load-intake-step-tab--active"
                : step > s.n
                  ? "bof-load-intake-step-tab--done"
                  : ""
            }`}
            onClick={() => goStep(s.n)}
          >
            <div style={{ color: "#64748b", fontWeight: 500, marginBottom: "0.15rem" }}>
              Step {s.n}
            </div>
            {s.title}
          </button>
        ))}
      </div>

      {step === 1 && (
        <section className="bof-load-intake-card" aria-labelledby="intake-s1">
          <h2 id="intake-s1">Step 1 — Shipper &amp; facility</h2>
          <p className="bof-muted">
            Legal shipper identity, primary operations contact, and origin / ship-from facility.
          </p>
          <div className="bof-load-intake-grid-2">
            <div className="bof-load-intake-field">
              <label htmlFor="shipper_name">Shipper name</label>
              <input
                id="shipper_name"
                value={state.shipper.shipper_name}
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    shipper: { ...s.shipper, shipper_name: e.target.value },
                  }));
                }}
                autoComplete="organization"
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="contact_name">Primary contact name</label>
              <input
                id="contact_name"
                value={state.shipper.primary_contact_name}
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    shipper: { ...s.shipper, primary_contact_name: e.target.value },
                  }));
                }}
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="contact_email">Primary contact email</label>
              <input
                id="contact_email"
                type="email"
                value={state.shipper.primary_contact_email}
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    shipper: { ...s.shipper, primary_contact_email: e.target.value },
                  }));
                }}
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="contact_phone">Primary contact phone</label>
              <input
                id="contact_phone"
                type="tel"
                value={state.shipper.primary_contact_phone}
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    shipper: { ...s.shipper, primary_contact_phone: e.target.value },
                  }));
                }}
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="facility_name">Facility name</label>
              <input
                id="facility_name"
                value={state.facility.facility_name}
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    facility: { ...s.facility, facility_name: e.target.value },
                  }));
                }}
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="facility_addr">Facility street address</label>
              <input
                id="facility_addr"
                value={state.facility.address}
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    facility: { ...s.facility, address: e.target.value },
                  }));
                }}
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="city">City</label>
              <input
                id="city"
                value={state.facility.city}
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    facility: { ...s.facility, city: e.target.value },
                  }));
                }}
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="state">State</label>
              <input
                id="state"
                value={state.facility.state}
                maxLength={2}
                placeholder="OH"
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    facility: { ...s.facility, state: e.target.value.toUpperCase() },
                  }));
                }}
              />
            </div>
            <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="facility_rules">Facility rules</label>
              <textarea
                id="facility_rules"
                value={state.facility.facility_rules}
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    facility: { ...s.facility, facility_rules: e.target.value },
                  }));
                }}
                placeholder="Dock hours, PPE, check-in process, restrictions…"
              />
            </div>
            <YesNo
              idPrefix="appt-fac"
              label="Appointment required at this facility?"
              value={state.facility.appointment_required}
              onChange={(v) => {
                touchDraft();
                setState((s) => ({
                  ...s,
                  facility: { ...s.facility, appointment_required: v },
                }));
              }}
            />
          </div>
          {state.lastDraftSavedAt && (
            <p className="bof-load-intake-draft">
              <strong>Draft progress</strong> — last local save timestamp:{" "}
              {new Date(state.lastDraftSavedAt).toLocaleString()}
            </p>
          )}
          <div className="bof-load-intake-toolbar">
            <span className="bof-muted" style={{ fontSize: "0.8rem" }}>
              IDs: <code className="bof-code">{SHIP_ID}</code> ·{" "}
              <code className="bof-code">{FAC_ID}</code>
            </span>
            <button type="button" className="bof-load-intake-btn bof-load-intake-btn--primary" onClick={() => goStep(2)}>
              Continue to load requirements
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="bof-load-intake-card" aria-labelledby="intake-s2">
          <h2 id="intake-s2">Step 2 — Load requirements</h2>
          <p className="bof-muted">Commodity, counts, equipment, handling, and temperature policy.</p>
          <div className="bof-load-intake-grid-2">
            <div className="bof-load-intake-field">
              <label htmlFor="commodity">Commodity</label>
              <input
                id="commodity"
                value={state.loadRequirement.commodity}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, commodity: e.target.value },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="equip">Equipment type</label>
              <select
                id="equip"
                value={state.loadRequirement.equipment_type}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, equipment_type: e.target.value },
                  }))
                }
              >
                <option value="">Select…</option>
                <option value="Dry van">Dry van</option>
                <option value="Reefer">Reefer</option>
                <option value="Flatbed">Flatbed</option>
                <option value="Tanker">Tanker</option>
                <option value="Step deck">Step deck</option>
                <option value="Power only">Power only</option>
              </select>
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="weight">Weight (lb)</label>
              <input
                id="weight"
                type="number"
                min={0}
                step={1}
                value={state.loadRequirement.weight || ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: {
                      ...s.loadRequirement,
                      weight: parseFloat(e.target.value) || 0,
                    },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="pallets">Pallet count</label>
              <input
                id="pallets"
                type="number"
                min={0}
                step={1}
                value={state.loadRequirement.pallet_count || ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: {
                      ...s.loadRequirement,
                      pallet_count: parseInt(e.target.value, 10) || 0,
                    },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="pieces">Piece count</label>
              <input
                id="pieces"
                type="number"
                min={0}
                step={1}
                value={state.loadRequirement.piece_count || ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: {
                      ...s.loadRequirement,
                      piece_count: parseInt(e.target.value, 10) || 0,
                    },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="special">Special handling instructions</label>
              <textarea
                id="special"
                value={state.loadRequirement.special_handling}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, special_handling: e.target.value },
                  }))
                }
                rows={3}
              />
            </div>
            <YesNo
              idPrefix="temp-req"
              label="Temperature control required?"
              value={state.loadRequirement.temperature_required}
              onChange={(v) =>
                setState((s) => ({
                  ...s,
                  loadRequirement: {
                    ...s.loadRequirement,
                    temperature_required: v,
                    temperature_min: v ? s.loadRequirement.temperature_min : undefined,
                    temperature_max: v ? s.loadRequirement.temperature_max : undefined,
                  },
                }))
              }
            />
            {state.loadRequirement.temperature_required && (
              <>
                <div className="bof-load-intake-field">
                  <label htmlFor="tmin">Temperature min (°F)</label>
                  <input
                    id="tmin"
                    type="number"
                    step={1}
                    value={state.loadRequirement.temperature_min ?? ""}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        loadRequirement: {
                          ...s.loadRequirement,
                          temperature_min: e.target.value === "" ? undefined : +e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="bof-load-intake-field">
                  <label htmlFor="tmax">Temperature max (°F)</label>
                  <input
                    id="tmax"
                    type="number"
                    step={1}
                    value={state.loadRequirement.temperature_max ?? ""}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        loadRequirement: {
                          ...s.loadRequirement,
                          temperature_max: e.target.value === "" ? undefined : +e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </>
            )}
          </div>
          <div className="bof-load-intake-toolbar">
            <button type="button" className="bof-load-intake-btn" onClick={() => goStep(1)}>
              Back
            </button>
            <button type="button" className="bof-load-intake-btn bof-load-intake-btn--primary" onClick={() => goStep(3)}>
              Continue to compliance
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="bof-load-intake-card" aria-labelledby="intake-s3">
          <h2 id="intake-s3">Step 3 — Compliance &amp; documentation</h2>
          <p className="bof-muted">
            Security, proof standards, timing, BOL/POD, and accessorial economics.
          </p>

          <div className="bof-load-intake-subsection">
            <h3>Shipment security</h3>
            <div className="bof-load-intake-grid-2">
              <YesNo
                idPrefix="seal"
                label="Seal required?"
                value={state.compliance.seal_required}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, seal_required: v, seal_number_required: v ? s.compliance.seal_number_required : false },
                  }))
                }
              />
              <YesNo
                idPrefix="sealnum"
                label="Seal number required before dispatch?"
                value={state.compliance.seal_number_required}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, seal_number_required: v },
                  }))
                }
              />
            </div>
          </div>

          <div className="bof-load-intake-subsection">
            <h3>Proof &amp; photos</h3>
            <div className="bof-load-intake-grid-2">
              <YesNo
                idPrefix="ph-pu"
                label="Pickup photos required?"
                value={state.compliance.pickup_photos_required}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, pickup_photos_required: v },
                  }))
                }
              />
              <YesNo
                idPrefix="ph-del"
                label="Delivery photos required?"
                value={state.compliance.delivery_photos_required}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, delivery_photos_required: v },
                  }))
                }
              />
            </div>
            <div
              className="bof-load-intake-field"
              style={{
                marginTop: "1rem",
                padding: "0.85rem",
                borderRadius: "8px",
                border: "1px solid rgba(20, 184, 166, 0.45)",
                background: "rgba(13, 148, 136, 0.08)",
              }}
            >
              <YesNo
                idPrefix="ph-cargo"
                label="Cargo photos required? (core documentation readiness)"
                value={state.compliance.cargo_photos_required}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, cargo_photos_required: v },
                  }))
                }
              />
              <p className="bof-muted" style={{ marginTop: "0.5rem", fontSize: "0.78rem" }}>
                When enabled, BOF treats cargo imaging criteria as blocking unless POD and BOL
                instructions document how photos are captured and submitted.
              </p>
            </div>
          </div>

          <div className="bof-load-intake-subsection">
            <h3>Appointment &amp; timing</h3>
            <div className="bof-load-intake-grid-2">
              <div className="bof-load-intake-field">
                <label htmlFor="aw-start">Appointment window start</label>
                <input
                  id="aw-start"
                  type="datetime-local"
                  value={state.compliance.appointment_window_start}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: { ...s.compliance, appointment_window_start: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="bof-load-intake-field">
                <label htmlFor="aw-end">Appointment window end</label>
                <input
                  id="aw-end"
                  type="datetime-local"
                  value={state.compliance.appointment_window_end}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: { ...s.compliance, appointment_window_end: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="bof-load-intake-subsection">
            <h3>Documentation</h3>
            <div className="bof-load-intake-grid-2">
              <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="ins">Insurance requirements</label>
                <textarea
                  id="ins"
                  value={state.compliance.insurance_requirements}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: { ...s.compliance, insurance_requirements: e.target.value },
                    }))
                  }
                  rows={2}
                />
              </div>
              <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="bol">BOL instructions</label>
                <textarea
                  id="bol"
                  value={state.compliance.bol_instructions}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: { ...s.compliance, bol_instructions: e.target.value },
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="pod">POD requirements</label>
                <textarea
                  id="pod"
                  value={state.compliance.pod_requirements}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: { ...s.compliance, pod_requirements: e.target.value },
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="bof-load-intake-subsection">
            <h3>Accessorials</h3>
            <div className="bof-load-intake-grid-2">
              <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="acc">Accessorial rules</label>
                <textarea
                  id="acc"
                  value={state.compliance.accessorial_rules}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: { ...s.compliance, accessorial_rules: e.target.value },
                    }))
                  }
                  rows={3}
                  placeholder="Detention, lumper authorization, fuel surcharge triggers…"
                />
              </div>
              <YesNo
                idPrefix="lumper"
                label="Lumper expected?"
                value={state.compliance.lumper_expected}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, lumper_expected: v },
                  }))
                }
              />
            </div>
          </div>

          <div className="bof-load-intake-toolbar">
            <button type="button" className="bof-load-intake-btn" onClick={() => goStep(2)}>
              Back
            </button>
            <button type="button" className="bof-load-intake-btn bof-load-intake-btn--primary" onClick={() => goStep(4)}>
              Run auto-checks &amp; summary
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <>
          <section className="bof-load-intake-card" aria-labelledby="intake-s4a">
            <h2 id="intake-s4a">Step 4 — BOF auto-checks</h2>
            <p className="bof-muted">
              Rules engine preview against captured shipper, facility, load, and compliance rows.
              Resolve <strong>blocking</strong> items before generating a dispatch packet.
            </p>

            {blocking && (
              <div className="bof-load-intake-alert bof-load-intake-alert--block" role="alert">
                <strong>Blocking</strong> — {checks.filter((c) => c.status === "Blocking").length}{" "}
                check(s) must pass before packet generation. Use{" "}
                <button type="button" className="bof-load-intake-jump" onClick={() => goStep(1)}>
                  Step 1
                </button>
                ,{" "}
                <button type="button" className="bof-load-intake-jump" onClick={() => goStep(2)}>
                  Step 2
                </button>
                , or{" "}
                <button type="button" className="bof-load-intake-jump" onClick={() => goStep(3)}>
                  Step 3
                </button>{" "}
                to correct source fields.
              </div>
            )}

            {warnings > 0 && (
              <div className="bof-load-intake-alert bof-load-intake-alert--warn">
                <strong>Warnings</strong> — {warnings} item(s) will not block the packet but should be
                reviewed with operations before tender.
              </div>
            )}

            <div style={{ maxHeight: "22rem", overflowY: "auto" }}>
              {checks.map((c) => (
                <div key={c.check_id} className="bof-load-intake-check">
                  <span
                    className={`bof-load-intake-badge ${
                      c.status === "Passed"
                        ? "bof-load-intake-badge--pass"
                        : c.status === "Warning"
                          ? "bof-load-intake-badge--warn"
                          : "bof-load-intake-badge--block"
                    }`}
                  >
                    {c.status}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: "0.15rem" }}>{c.check_type}</div>
                    <div className="bof-muted">{c.message}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bof-load-intake-toolbar">
              <button type="button" className="bof-load-intake-btn" onClick={() => goStep(3)}>
                Back to compliance
              </button>
            </div>
          </section>

          <section className="bof-load-intake-card" aria-labelledby="intake-s4b">
            <h2 id="intake-s4b">Load packet readiness</h2>
            <p className="bof-muted">
              Structured handoff summary. Overall state drives dispatch workflow eligibility.
            </p>

            <div
              className={`bof-load-intake-status-pill ${
                blocking ? "bof-load-intake-status-pill--bad" : "bof-load-intake-status-pill--ok"
              }`}
              role="status"
            >
              {blocking ? (
                <>Incomplete — missing required items</>
              ) : (
                <>Ready to Generate Load Packet</>
              )}
            </div>

            <dl className="bof-load-intake-summary-dl">
              <dt>Shipper</dt>
              <dd>{state.shipper.shipper_name || "—"}</dd>
              <dt>Facility</dt>
              <dd>
                {state.facility.facility_name || "—"} — {state.facility.city}, {state.facility.state}
              </dd>
              <dt>Commodity / weight</dt>
              <dd>
                {state.loadRequirement.commodity || "—"} · {state.loadRequirement.weight || "—"} lb
              </dd>
              <dt>Equipment</dt>
              <dd>{state.loadRequirement.equipment_type || "—"}</dd>
              <dt>Temperature</dt>
              <dd>
                {state.loadRequirement.temperature_required
                  ? `${state.loadRequirement.temperature_min ?? "—"}–${state.loadRequirement.temperature_max ?? "—"} °F`
                  : "Not required"}
              </dd>
              <dt>Seals</dt>
              <dd>
                Required: {state.compliance.seal_required ? "Yes" : "No"} · Seal # before dispatch:{" "}
                {state.compliance.seal_number_required ? "Yes" : "No"}
              </dd>
              <dt>Photos</dt>
              <dd>
                Pickup {state.compliance.pickup_photos_required ? "yes" : "no"} · Delivery{" "}
                {state.compliance.delivery_photos_required ? "yes" : "no"} ·{" "}
                <strong style={{ color: "#5eead4" }}>
                  Cargo {state.compliance.cargo_photos_required ? "yes" : "no"}
                </strong>
              </dd>
              <dt>BOL / POD</dt>
              <dd>
                BOL on file: {state.compliance.bol_instructions.trim() ? "Yes" : "No"} · POD on file:{" "}
                {state.compliance.pod_requirements.trim() ? "Yes" : "No"}
              </dd>
              <dt>Appointment</dt>
              <dd>
                {state.compliance.appointment_window_start || "—"} → {state.compliance.appointment_window_end || "—"}
              </dd>
              <dt>Accessorials</dt>
              <dd>{state.compliance.accessorial_rules.trim() ? "Captured" : "—"}</dd>
              <dt>Auto-checks</dt>
              <dd>
                {checks.filter((x) => x.status === "Passed").length} passed ·{" "}
                {checks.filter((x) => x.status === "Warning").length} warnings ·{" "}
                {checks.filter((x) => x.status === "Blocking").length} blocking
              </dd>
            </dl>

            <div className="bof-load-intake-toolbar">
              <button
                type="button"
                className="bof-load-intake-btn bof-load-intake-btn--primary"
                disabled={blocking}
                onClick={generatePacket}
              >
                Generate load packet
              </button>
            </div>

            {state.loadPacket && !blocking && (
              <p className="bof-muted" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
                Packet <code className="bof-code">{state.loadPacket.load_packet_id}</code> — status{" "}
                <strong>{state.loadPacket.packet_status}</strong>, open warnings recorded as{" "}
                {state.loadPacket.missing_items_count}. Continue to{" "}
                <Link href="/dispatch" className="bof-link-secondary">
                  Dispatch
                </Link>{" "}
                or{" "}
                <Link href="/loads" className="bof-link-secondary">
                  Loads
                </Link>
                .
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
