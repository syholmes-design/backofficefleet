"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  blockingFixRoute,
  drawerTabNeededForBlocking,
  panelNeededForBlocking,
  type DrawerDocTab,
} from "@/lib/load-intake-blocking-fixes";
import { countWarnings, hasBlockingChecks } from "@/lib/load-requirements-intake-checks";
import type { AutoCheckResult, IntakeWizardState } from "@/lib/load-requirements-intake-types";

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
};

export function LoadIntakeStep4PacketReview({
  state,
  setState,
  checks,
  goStep,
  generatePacket,
}: Props) {
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
                      value={state.compliance.bol_instructions}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          compliance: { ...s.compliance, bol_instructions: e.target.value },
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
                    value={state.compliance.pod_requirements}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        compliance: { ...s.compliance, pod_requirements: e.target.value },
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
