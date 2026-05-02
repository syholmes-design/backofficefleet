"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  blockingFixRoute,
  drawerTabNeededForBlocking,
  panelNeededForBlocking,
  type DrawerDocTab,
} from "@/lib/load-intake-blocking-fixes";
import { buildLoadIntakeTemplateRegistry } from "@/lib/load-intake/template-registry";
import { countWarnings, hasBlockingChecks } from "@/lib/load-requirements-intake-checks";
import type { AutoCheckResult, IntakeWizardState } from "@/lib/load-requirements-intake-types";
import type { LoadIntakeRecord } from "@/lib/load-requirements-intake-types";
import type {
  IntakeFieldKey,
  LoadIntakeDocumentType,
  LoadIntakeTemplateRegistryItem,
  TemplateRegistryStatus,
} from "@/lib/load-intake/types";

function YesNoMini({
  value,
  onChange,
  label,
  idPrefix,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  idPrefix: string;
}) {
  return (
    <div className="bof-load-intake-field">
      <span
        id={`${idPrefix}-lbl`}
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
      <div className="bof-load-intake-yesno" role="group" aria-labelledby={`${idPrefix}-lbl`}>
        <button type="button" aria-pressed={value === true} onClick={() => onChange(true)}>
          Yes
        </button>
        <button type="button" aria-pressed={value === false} onClick={() => onChange(false)}>
          No
        </button>
      </div>
    </div>
  );
}

type Props = {
  state: IntakeWizardState;
  setState: React.Dispatch<React.SetStateAction<IntakeWizardState>>;
  checks: AutoCheckResult[];
  goStep: (n: number) => void;
  generatePacket: () => void;
  onSaveLoad: () => void;
  validationErrors: string[];
  submitError: string | null;
  submitSuccess: string | null;
  /** Pipeline source label for review header (e.g. manual / upload / client_manual). */
  intakeReviewLabel: string;
  /** When false, save + post-save alerts are handled on Step 5 of the parent wizard. */
  showEmbeddedSave?: boolean;
  normalizedReview: {
    normalized: LoadIntakeRecord;
    warnings: string[];
    missingRequiredFields: string[];
    status: "draft" | "needs_review" | "ready_to_save";
  };
};

export function LoadIntakeStep4PacketReview({
  state,
  setState,
  checks,
  goStep,
  generatePacket,
  onSaveLoad,
  validationErrors,
  submitError,
  submitSuccess,
  intakeReviewLabel,
  showEmbeddedSave = true,
  normalizedReview,
}: Props) {
  const { data } = useBofDemoData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerDocTab>("bol");

  const blocking = hasBlockingChecks(checks);
  const warnings = countWarnings(checks);
  const passed = checks.filter((c) => c.status === "Passed").length;
  const blockingCount = checks.filter((c) => c.status === "Blocking").length;

  const blockingCheckIds = useMemo(
    () => checks.filter((c) => c.status === "Blocking").map((c) => c.check_id),
    [checks]
  );
  const intakeLoadIdInput = state.loadRequirement.load_id_input?.trim().toUpperCase() || undefined;
  const selectedDriverId = state.loadRequirement.assigned_driver_id?.trim() || undefined;
  const savedRuntimeLoadId = useMemo(() => {
    const hit = data.loads.find((load) =>
      String(load.dispatchOpsNotes || "").includes(
        `Intake generated load from ${state.loadRequirement.load_requirement_id}`
      )
    );
    return hit?.id;
  }, [data.loads, state.loadRequirement.load_requirement_id]);
  const registryLoadId = savedRuntimeLoadId || intakeLoadIdInput;
  const templateRows = useMemo(
    () =>
      buildLoadIntakeTemplateRegistry({
        loadId: registryLoadId,
        driverId: selectedDriverId,
      }),
    [registryLoadId, selectedDriverId]
  );

  const documentSections = useMemo(() => {
    type Bucket = "core" | "reference" | "proof" | "exceptions";
    function bucketFor(dt: LoadIntakeDocumentType): Bucket {
      if (dt === "trip_schedule" || dt === "master_agreement") return "reference";
      if (dt === "claim_packet") return "exceptions";
      if (
        dt === "seal_cargo_photo_sheet" ||
        dt === "pod" ||
        dt === "lumper_receipt" ||
        dt === "rfid_proof"
      ) {
        return "proof";
      }
      return "core";
    }
    const filtered = templateRows.filter((row) => {
      if (row.documentType !== "claim_packet") return true;
      return Boolean(state.loadRequirement.claim_damage_flag);
    });
    const order: Array<{ key: Bucket; title: string }> = [
      { key: "core", title: "Core trip documents" },
      { key: "reference", title: "Reference documents" },
      { key: "proof", title: "Proof & media" },
      { key: "exceptions", title: "Exceptions / claims" },
    ];
    return order.map((sec) => ({
      ...sec,
      rows: filtered.filter((r) => bucketFor(r.documentType) === sec.key),
    }));
  }, [templateRows, state.loadRequirement.claim_damage_flag]);

  function fieldValue(field: IntakeFieldKey): string | number | boolean | undefined {
    const shipper = state.shipper;
    const facility = state.facility;
    const req = state.loadRequirement;
    const compliance = state.compliance;
    const map: Record<IntakeFieldKey, string | number | boolean | undefined> = {
      load_id_input: req.load_id_input,
      shipper_name: shipper.shipper_name,
      pickup_at: req.pickup_at || compliance.appointment_window_start,
      delivery_at: req.delivery_at || compliance.appointment_window_end,
      pickup_facility_name: facility.facility_name,
      pickup_address: facility.address,
      pickup_city: facility.city,
      pickup_state: facility.state,
      pickup_zip: facility.zip,
      destination_facility_name: req.destination_facility_name,
      destination_address: req.destination_address,
      destination_city: req.destination_city,
      destination_state: req.destination_state,
      destination_zip: req.destination_zip,
      commodity: req.commodity,
      weight: req.weight,
      pallet_count: req.pallet_count,
      piece_count: req.piece_count,
      equipment_type: req.equipment_type,
      rate_linehaul: req.rate_linehaul,
      backhaul_pay: req.backhaul_pay,
      assigned_driver_id: req.assigned_driver_id,
      truck_id: req.truck_id,
      trailer_id: req.trailer_id,
      bol_number: req.bol_number,
      invoice_number: req.invoice_number,
      seal_number: req.seal_number,
      rfid_proof_required: req.rfid_proof_required,
      claim_damage_flag: req.claim_damage_flag,
      special_handling: req.special_handling,
      appointment_window_start: compliance.appointment_window_start,
      appointment_window_end: compliance.appointment_window_end,
      insurance_requirements: compliance.insurance_requirements,
      bol_instructions: compliance.bol_instructions,
      pod_requirements: compliance.pod_requirements,
      accessorial_rules: compliance.accessorial_rules,
      lumper_expected: compliance.lumper_expected,
    };
    return map[field];
  }

  function missingRequiredFieldsForRow(row: LoadIntakeTemplateRegistryItem): IntakeFieldKey[] {
    return row.requiredFields.filter((field) => {
      const value = fieldValue(field);
      if (typeof value === "boolean") return false;
      if (typeof value === "number") return Number.isNaN(value) || value <= 0;
      return !String(value ?? "").trim();
    });
  }

  function displayStatusForRow(row: LoadIntakeTemplateRegistryItem): TemplateRegistryStatus {
    const hasRealUrl = Boolean(row.outputPath && String(row.outputPath).startsWith("/"));
    if (hasRealUrl) return "available";
    if (row.status === "missing" || row.status === "broken") return row.status;
    return "needsMapping";
  }

  function statusPillClass(status: TemplateRegistryStatus): string {
    if (status === "available") return "bof-load-intake-badge bof-load-intake-badge--pass";
    if (status === "needsMapping") return "bof-load-intake-badge bof-load-intake-badge--warn";
    return "bof-load-intake-badge bof-load-intake-badge--block";
  }

  useEffect(() => {
    if (typeof process === "undefined" || process.env.NODE_ENV === "production") return;
    for (const row of templateRows) {
      const status = displayStatusForRow(row);
      if (status === "missing" || status === "broken") {
        console.warn("[load-intake-template-registry] unresolved document", {
          documentType: row.documentType,
          displayName: row.displayName,
          status,
          templatePath: row.templatePath,
          outputPath: row.outputPath,
          relatedLoadId: row.relatedLoadId,
          relatedDriverId: row.relatedDriverId,
        });
      }
    }
  }, [templateRows]);

  useEffect(() => {
    if (!blocking) return;
    setState((s) => (s.loadPacket ? { ...s, loadPacket: null } : s));
  }, [blocking, setState]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const actOnBlockingCheck = useCallback((checkId: string) => {
    const r = blockingFixRoute(checkId);
    if (r.drawerTab) {
      setDrawerTab(r.drawerTab);
      setDrawerOpen(true);
      return;
    }
    if (r.inlinePanel) {
      setDrawerOpen(false);
      requestAnimationFrame(() => {
        document
          .getElementById(`bof-readiness-inline-${r.inlinePanel}`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, []);

  const openDrawer = useCallback((tab: DrawerDocTab) => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  }, []);

  const showQuickFixes = blockingCount > 0;

  return (
    <>
      <section className="bof-load-intake-card" aria-labelledby="intake-s4a">
        <h2 id="intake-s4a">Step 4 — BOF auto-checks</h2>
        <p className="bof-muted">
          Rules engine preview against captured shipper, facility, load, and compliance rows.
          Blocking rows include actions — fix inline in <strong>Load packet readiness</strong> below or
          open the documentation drawer without leaving this load.
        </p>

        <div className="bof-load-intake-metrics" aria-live="polite">
          <span>
            <strong>{passed}</strong> passed
          </span>
          <span>
            <strong>{warnings}</strong> warnings
          </span>
          <span>
            <strong>{blockingCount}</strong> blocking
          </span>
        </div>

        {blocking && (
          <div className="bof-load-intake-alert bof-load-intake-alert--block" role="alert">
            <strong>Blocking</strong> — resolve using the actions on each row or the readiness panel
            below. Edits rerun checks immediately. Optional wizard steps:{" "}
            <button type="button" className="bof-load-intake-jump" onClick={() => goStep(1)}>
              Step 1
            </button>
            {" · "}
            <button type="button" className="bof-load-intake-jump" onClick={() => goStep(2)}>
              Step 2
            </button>
            {" · "}
            <button type="button" className="bof-load-intake-jump" onClick={() => goStep(3)}>
              Step 3
            </button>
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
              <div className="bof-load-intake-check-row" style={{ width: "100%" }}>
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
                <div className="bof-load-intake-check-body">
                  <div style={{ fontWeight: 700, marginBottom: "0.15rem" }}>{c.check_type}</div>
                  <div className="bof-muted">{c.message}</div>
                </div>
                {c.status === "Blocking" ? (
                  <button
                    type="button"
                    className="bof-load-intake-fix-btn"
                    onClick={() => actOnBlockingCheck(c.check_id)}
                  >
                    {blockingFixRoute(c.check_id).actionLabel}
                  </button>
                ) : null}
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

      <section className="bof-load-intake-card" aria-label="Unified intake review">
        <h2>Unified intake review ({intakeReviewLabel})</h2>
        <p className="bof-muted">
          Manual and upload flows both pass through the same canonical intake normalizer before save.
        </p>
        <div className="bof-load-intake-metrics">
          <span>
            <strong>Status</strong>: {normalizedReview.status}
          </span>
          <span>
            <strong>Missing</strong>: {normalizedReview.missingRequiredFields.length}
          </span>
          <span>
            <strong>Warnings</strong>: {normalizedReview.warnings.length}
          </span>
        </div>
        {normalizedReview.missingRequiredFields.length > 0 ? (
          <div className="bof-load-intake-alert bof-load-intake-alert--warn">
            Missing required fields: {normalizedReview.missingRequiredFields.join(", ")}
          </div>
        ) : null}
        {normalizedReview.warnings.length > 0 ? (
          <ul className="bof-cc-change-list">
            {normalizedReview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="bof-load-intake-card" aria-labelledby="intake-s4b">
        <h2 id="intake-s4b">Load packet readiness</h2>
        <p className="bof-muted">
          Operational control: clear blocking items on this screen. Changes apply to the current load
          and <strong>rerun BOF auto-checks immediately</strong> — no need to revisit earlier wizard steps
          for minor fixes.
        </p>

        <div className="bof-load-intake-metrics" aria-live="polite">
          <span>
            <strong>{passed}</strong> passed
          </span>
          <span>
            <strong>{warnings}</strong> warnings
          </span>
          <span>
            <strong>{blockingCount}</strong> blocking
          </span>
        </div>

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

        {showQuickFixes && (
          <details className="bof-load-intake-readiness-fixes" open>
            <summary>Inline quick fixes · edits rerun checks immediately</summary>

            {panelNeededForBlocking(blockingCheckIds, "shipper") && (
              <div id="bof-readiness-inline-shipper" className="bof-load-intake-inline-panel">
                <h4>Shipper &amp; primary contact</h4>
                <div className="bof-load-intake-grid-2">
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-shipper-name">Shipper name</label>
                    <input
                      id="rf-shipper-name"
                      value={state.shipper.shipper_name}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          shipper: { ...s.shipper, shipper_name: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-contact-name">Primary contact name</label>
                    <input
                      id="rf-contact-name"
                      value={state.shipper.primary_contact_name}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          shipper: { ...s.shipper, primary_contact_name: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-contact-email">Primary contact email</label>
                    <input
                      id="rf-contact-email"
                      type="email"
                      value={state.shipper.primary_contact_email}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          shipper: { ...s.shipper, primary_contact_email: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-contact-phone">Primary contact phone</label>
                    <input
                      id="rf-contact-phone"
                      type="tel"
                      value={state.shipper.primary_contact_phone}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          shipper: { ...s.shipper, primary_contact_phone: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {panelNeededForBlocking(blockingCheckIds, "facility") && (
              <div id="bof-readiness-inline-facility" className="bof-load-intake-inline-panel">
                <h4>Facility</h4>
                <div className="bof-load-intake-grid-2">
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-fac-name">Facility name</label>
                    <input
                      id="rf-fac-name"
                      value={state.facility.facility_name}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          facility: { ...s.facility, facility_name: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-fac-addr">Street address</label>
                    <input
                      id="rf-fac-addr"
                      value={state.facility.address}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          facility: { ...s.facility, address: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-fac-city">City</label>
                    <input
                      id="rf-fac-city"
                      value={state.facility.city}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          facility: { ...s.facility, city: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-fac-state">State</label>
                    <input
                      id="rf-fac-state"
                      value={state.facility.state}
                      maxLength={2}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          facility: { ...s.facility, state: e.target.value.toUpperCase() },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <YesNoMini
                    idPrefix="rf-appt-fac"
                    label="Appointment required at facility?"
                    value={state.facility.appointment_required}
                    onChange={(v) =>
                      setState((s) => ({
                        ...s,
                        facility: { ...s.facility, appointment_required: v },
                        loadPacket: null,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {panelNeededForBlocking(blockingCheckIds, "load") && (
              <div id="bof-readiness-inline-load" className="bof-load-intake-inline-panel">
                <h4>Load requirements</h4>
                <div className="bof-load-intake-grid-2">
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-commodity">Commodity</label>
                    <input
                      id="rf-commodity"
                      value={state.loadRequirement.commodity}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          loadRequirement: { ...s.loadRequirement, commodity: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-equip">Equipment type</label>
                    <select
                      id="rf-equip"
                      value={state.loadRequirement.equipment_type}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          loadRequirement: { ...s.loadRequirement, equipment_type: e.target.value },
                          loadPacket: null,
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
                    <label htmlFor="rf-weight">Weight (lb)</label>
                    <input
                      id="rf-weight"
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
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {panelNeededForBlocking(blockingCheckIds, "appointment") && (
              <div id="bof-readiness-inline-appointment" className="bof-load-intake-inline-panel">
                <h4>Appointment window</h4>
                <div className="bof-load-intake-grid-2">
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-aw-start">Start</label>
                    <input
                      id="rf-aw-start"
                      type="datetime-local"
                      value={state.compliance.appointment_window_start}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          compliance: { ...s.compliance, appointment_window_start: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <div className="bof-load-intake-field">
                    <label htmlFor="rf-aw-end">End</label>
                    <input
                      id="rf-aw-end"
                      type="datetime-local"
                      value={state.compliance.appointment_window_end}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          compliance: { ...s.compliance, appointment_window_end: e.target.value },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {panelNeededForBlocking(blockingCheckIds, "temperature") && (
              <div id="bof-readiness-inline-temperature" className="bof-load-intake-inline-panel">
                <h4>Temperature control</h4>
                <YesNoMini
                  idPrefix="rf-temp-req"
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
                      loadPacket: null,
                    }))
                  }
                />
                {state.loadRequirement.temperature_required && (
                  <div className="bof-load-intake-grid-2" style={{ marginTop: "0.75rem" }}>
                    <div className="bof-load-intake-field">
                      <label htmlFor="rf-tmin">Min °F</label>
                      <input
                        id="rf-tmin"
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
                            loadPacket: null,
                          }))
                        }
                      />
                    </div>
                    <div className="bof-load-intake-field">
                      <label htmlFor="rf-tmax">Max °F</label>
                      <input
                        id="rf-tmax"
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
                            loadPacket: null,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {panelNeededForBlocking(blockingCheckIds, "photos") && (
              <div id="bof-readiness-inline-photos" className="bof-load-intake-inline-panel">
                <h4>Photo requirements (toggle off or expand POD in drawer)</h4>
                <div className="bof-load-intake-grid-2">
                  <YesNoMini
                    idPrefix="rf-ph-pu"
                    label="Pickup photos required?"
                    value={state.compliance.pickup_photos_required}
                    onChange={(v) =>
                      setState((s) => ({
                        ...s,
                        compliance: { ...s.compliance, pickup_photos_required: v },
                        loadPacket: null,
                      }))
                    }
                  />
                  <YesNoMini
                    idPrefix="rf-ph-del"
                    label="Delivery photos required?"
                    value={state.compliance.delivery_photos_required}
                    onChange={(v) =>
                      setState((s) => ({
                        ...s,
                        compliance: { ...s.compliance, delivery_photos_required: v },
                        loadPacket: null,
                      }))
                    }
                  />
                  <YesNoMini
                    idPrefix="rf-ph-cargo"
                    label="Cargo photos required?"
                    value={state.compliance.cargo_photos_required}
                    onChange={(v) =>
                      setState((s) => ({
                        ...s,
                        compliance: { ...s.compliance, cargo_photos_required: v },
                        loadPacket: null,
                      }))
                    }
                  />
                </div>
                <p className="bof-muted bof-small" style={{ marginTop: "0.5rem" }}>
                  If photos stay on, open <strong>POD / photos</strong> in the drawer and add criteria
                  (min. length enforced by BOF checks).
                </p>
              </div>
            )}

            <div className="bof-load-intake-doc-launch">
              {drawerTabNeededForBlocking(blockingCheckIds, "bol") ||
              drawerTabNeededForBlocking(blockingCheckIds, "insurance") ||
              drawerTabNeededForBlocking(blockingCheckIds, "pod") ||
              drawerTabNeededForBlocking(blockingCheckIds, "accessorial") ? (
                <>
                  {drawerTabNeededForBlocking(blockingCheckIds, "bol") ? (
                    <button type="button" className="bof-load-intake-launch-btn" onClick={() => openDrawer("bol")}>
                      BOL &amp; seal text
                    </button>
                  ) : null}
                  {drawerTabNeededForBlocking(blockingCheckIds, "insurance") ? (
                    <button
                      type="button"
                      className="bof-load-intake-launch-btn"
                      onClick={() => openDrawer("insurance")}
                    >
                      Insurance requirements
                    </button>
                  ) : null}
                  {drawerTabNeededForBlocking(blockingCheckIds, "pod") ? (
                    <button type="button" className="bof-load-intake-launch-btn" onClick={() => openDrawer("pod")}>
                      POD / photo criteria
                    </button>
                  ) : null}
                  {drawerTabNeededForBlocking(blockingCheckIds, "accessorial") ? (
                    <button
                      type="button"
                      className="bof-load-intake-launch-btn"
                      onClick={() => openDrawer("accessorial")}
                    >
                      Accessorial rules
                    </button>
                  ) : null}
                </>
              ) : (
                <span className="bof-muted" style={{ fontSize: "0.78rem" }}>
                  No documentation drawer needed for current blockers.
                </span>
              )}
            </div>
          </details>
        )}

        <dl className="bof-load-intake-summary-dl">
          <dt>Shipper</dt>
          <dd>{state.shipper.shipper_name || "—"}</dd>
          <dt>Facility</dt>
          <dd>
            {state.facility.facility_name || "—"} — {state.facility.city}, {state.facility.state}{" "}
            {state.facility.zip || ""}
          </dd>
          <dt>Route memory</dt>
          <dd>
            {state.loadRequirement.destination_facility_name
              ? `${state.facility.facility_name || "Origin"} → ${state.loadRequirement.destination_facility_name}`
              : "—"}
          </dd>
          <dt>Delivery address</dt>
          <dd>
            {state.loadRequirement.destination_address ||
            state.loadRequirement.destination_city ||
            state.loadRequirement.destination_state ? (
              <>
                {state.loadRequirement.destination_facility_name || "—"} ·{" "}
                {state.loadRequirement.destination_address || "—"},{" "}
                {state.loadRequirement.destination_city || "—"},{" "}
                {state.loadRequirement.destination_state || "—"}{" "}
                {state.loadRequirement.destination_zip || ""}
              </>
            ) : (
              "—"
            )}
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
            {state.compliance.bolRequirementType} · {state.compliance.podRequirementType}
          </dd>
          <dt>Insurance profile</dt>
          <dd>
            {state.compliance.insuranceRequirementType} · Coverage {state.compliance.cargoCoverageLevel}
          </dd>
          <dt>Appointment</dt>
          <dd>
            {state.compliance.appointment_window_start || "—"} → {state.compliance.appointment_window_end || "—"}
          </dd>
          <dt>Accessorials</dt>
          <dd>{state.compliance.accessorial_rules.trim() ? "Captured" : "—"}</dd>
          <dt>Auto-checks</dt>
          <dd>
            {passed} passed · {warnings} warnings · {blockingCount} blocking
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
          {showEmbeddedSave ? (
            <button
              type="button"
              className="bof-load-intake-btn bof-load-intake-btn--primary"
              onClick={onSaveLoad}
            >
              Save load to BOF
            </button>
          ) : (
            <button
              type="button"
              className="bof-load-intake-btn bof-load-intake-btn--primary"
              disabled={blocking}
              onClick={() => goStep(5)}
            >
              Continue to Step 5 — Save to dispatch
            </button>
          )}
        </div>

        {showEmbeddedSave && validationErrors.length > 0 && (
          <div className="bof-load-intake-alert bof-load-intake-alert--warn" role="alert">
            <strong>Validation</strong> — {validationErrors.join(" ")}
          </div>
        )}
        {showEmbeddedSave && submitError && (
          <div className="bof-load-intake-alert bof-load-intake-alert--block" role="alert">
            <strong>Save failed</strong> — {submitError}
          </div>
        )}
        {showEmbeddedSave && submitSuccess && (
          <div className="bof-load-intake-alert bof-load-intake-alert--ok" role="status">
            <strong>Saved</strong> — {submitSuccess}{" "}
            <Link href="/loads" className="bof-link-secondary">
              Open Loads
            </Link>{" "}
            ·{" "}
            <Link href="/dispatch" className="bof-link-secondary">
              Open Dispatch
            </Link>
          </div>
        )}

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

      <section className="bof-load-intake-card" aria-labelledby="intake-s4-docs">
        <h2 id="intake-s4-docs">Document readiness checklist</h2>
        <p className="bof-muted">
          This checklist uses the BOF template registry plus existing generated/evidence outputs.
          Open links appear only when a real URL exists. Runtime-created loads may show{" "}
          <strong>Pending generation / needs review</strong> until manifests and generators populate
          paths.
        </p>
        {!registryLoadId && (
          <div className="bof-load-intake-alert bof-load-intake-alert--warn">
            <strong>Pending generation</strong> — save this load first to assign/finalize loadId, then
            run document generation to resolve runtime links.
          </div>
        )}
        <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Document</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Status</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Missing required fields</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Link</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Template</th>
              </tr>
            </thead>
            {documentSections.map((sec) =>
              sec.rows.length === 0 ? null : (
                <tbody key={sec.key} className="text-slate-200">
                  <tr className="bg-slate-900/60">
                    <td
                      colSpan={5}
                      className="border-b border-slate-800 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-teal-400"
                    >
                      {sec.title}
                    </td>
                  </tr>
                  {sec.rows.map((row) => {
                    const status = displayStatusForRow(row);
                    const missingRequired = missingRequiredFieldsForRow(row);
                    const openHref =
                      status === "available" && row.outputPath && row.outputPath.startsWith("/")
                        ? row.outputPath
                        : undefined;
                    const statusLabel =
                      status === "available"
                        ? "Ready"
                        : !registryLoadId
                          ? "Pending load ID / save"
                          : status === "missing" || status === "broken"
                            ? "Missing / needs review"
                            : "Pending generation / needs review";
                    return (
                      <tr key={row.documentType} className="border-b border-slate-800/80">
                        <td className="px-2 py-1.5">
                          <strong>{row.displayName}</strong>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={statusPillClass(status)} title={status}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          {missingRequired.length > 0 ? (
                            <span className="text-amber-300">{missingRequired.join(", ")}</span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          {openHref ? (
                            <a
                              href={openHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bof-link-secondary"
                            >
                              Open / View
                            </a>
                          ) : (
                            <span className="text-slate-500">Missing / Needs review</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-[10px] text-slate-500">
                          {row.templatePath || "Template missing"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )
            )}
          </table>
        </div>
      </section>

      {drawerOpen && (
        <div
          className="bof-load-intake-drawer-backdrop"
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            className="bof-load-intake-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="load-intake-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="bof-load-intake-drawer-head">
              <h2 id="load-intake-drawer-title">Documentation &amp; rules</h2>
              <button
                type="button"
                className="bof-load-intake-btn"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close drawer"
              >
                Close
              </button>
            </header>
            <div className="bof-load-intake-drawer-tabs" role="tablist">
              {(["bol", "insurance", "pod", "accessorial"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={drawerTab === tab}
                  className="bof-load-intake-drawer-tab"
                  onClick={() => setDrawerTab(tab)}
                >
                  {tab === "bol"
                    ? "BOL / seal"
                    : tab === "insurance"
                      ? "Insurance"
                      : tab === "pod"
                        ? "POD / photos"
                        : "Accessorials"}
                </button>
              ))}
            </div>
            <div className="bof-load-intake-drawer-body">
              {drawerTab === "bol" && (
                <>
                  <div className="bof-load-intake-grid-2" style={{ marginBottom: "1rem" }}>
                    <YesNoMini
                      idPrefix="dr-seal"
                      label="Seal required?"
                      value={state.compliance.seal_required}
                      onChange={(v) =>
                        setState((s) => ({
                          ...s,
                          compliance: {
                            ...s.compliance,
                            seal_required: v,
                            seal_number_required: v ? s.compliance.seal_number_required : false,
                          },
                          loadPacket: null,
                        }))
                      }
                    />
                    <YesNoMini
                      idPrefix="dr-sealnum"
                      label="Seal # before dispatch?"
                      value={state.compliance.seal_number_required}
                      onChange={(v) =>
                        setState((s) => ({
                          ...s,
                          compliance: { ...s.compliance, seal_number_required: v },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                  <div className="bof-load-intake-field">
                    <label htmlFor="dr-bol">BOL instructions</label>
                    <textarea
                      id="dr-bol"
                      rows={10}
                      value={state.compliance.bolSpecialInstructions}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          compliance: {
                            ...s.compliance,
                            bolSpecialInstructions: e.target.value,
                            bol_instructions: e.target.value,
                          },
                          loadPacket: null,
                        }))
                      }
                      placeholder="Seal procedures, reference numbers, shipper clauses…"
                    />
                  </div>
                </>
              )}
              {drawerTab === "insurance" && (
                <div className="bof-load-intake-field">
                  <label htmlFor="dr-ins">Insurance requirements</label>
                  <textarea
                    id="dr-ins"
                    rows={12}
                    value={state.compliance.insurance_requirements}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        compliance: { ...s.compliance, insurance_requirements: e.target.value },
                        loadPacket: null,
                      }))
                    }
                  />
                </div>
              )}
              {drawerTab === "pod" && (
                <div className="bof-load-intake-field">
                  <label htmlFor="dr-pod">POD requirements (include photo criteria when required)</label>
                  <textarea
                    id="dr-pod"
                    rows={14}
                    value={state.compliance.podSpecialInstructions}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        compliance: {
                          ...s.compliance,
                          podSpecialInstructions: e.target.value,
                          pod_requirements: e.target.value,
                        },
                        loadPacket: null,
                      }))
                    }
                  />
                </div>
              )}
              {drawerTab === "accessorial" && (
                <div className="bof-load-intake-field">
                  <label htmlFor="dr-acc">Accessorial rules</label>
                  <textarea
                    id="dr-acc"
                    rows={12}
                    value={state.compliance.accessorial_rules}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        compliance: { ...s.compliance, accessorial_rules: e.target.value },
                        loadPacket: null,
                      }))
                    }
                  />
                  <div style={{ marginTop: "1rem" }}>
                    <YesNoMini
                      idPrefix="dr-lumper"
                      label="Lumper expected?"
                      value={state.compliance.lumper_expected}
                      onChange={(v) =>
                        setState((s) => ({
                          ...s,
                          compliance: { ...s.compliance, lumper_expected: v },
                          loadPacket: null,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
            <footer className="bof-load-intake-drawer-foot">
              <span className="bof-muted" style={{ fontSize: "0.75rem" }}>
                Changes apply immediately · close when done
              </span>
              <button type="button" className="bof-load-intake-btn bof-load-intake-btn--primary" onClick={() => setDrawerOpen(false)}>
                Done
              </button>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
