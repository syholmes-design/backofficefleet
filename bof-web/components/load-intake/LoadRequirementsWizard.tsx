"use client";

import { useCallback, useMemo, useState } from "react";
import {
  countWarnings,
  hasBlockingChecks,
  runAutoChecks,
} from "@/lib/load-requirements-intake-checks";
import type { IntakeWizardState, LoadPacket } from "@/lib/load-requirements-intake-types";
import { LoadIntakeStep4PacketReview } from "@/components/load-intake/LoadIntakeStep4PacketReview";
import { LoadIntakeAddressCombo } from "@/components/load-intake/LoadIntakeAddressCombo";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { buildDispatchLoadsFromBofData } from "@/lib/dispatch-dashboard-seed";
import { normalizeLoadIntakeForm } from "@/lib/load-intake-normalize";
import { BofIntakeFormPrimaryPanel } from "@/components/documents/BofIntakeFormPrimaryPanel";
import { BofWorkflowFormShortcuts } from "@/components/documents/BofWorkflowFormShortcuts";
import { BofTemplateUsageSurface } from "@/components/documents/BofTemplateUsageSurface";
import { toBofIntakeEntityId } from "@/lib/bof-intake-entity";
import { buildBofIntakeSurfaceContextFromWizard } from "@/lib/bof-intake-surface-context";
import {
  applyFacilityMatch,
  buildLoadIntakeIntelligence,
  findFacilityByName,
  routesForOriginFacility,
} from "@/lib/load-intake-intelligence";

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
      zip: "",
      facility_rules: "",
      appointment_required: false,
    },
    loadRequirement: {
      load_requirement_id: LR_ID,
      shipper_id: SHIP_ID,
      facility_id: FAC_ID,
      load_id_input: "",
      pickup_at: "",
      delivery_at: "",
      commodity: "",
      weight: 0,
      pallet_count: 0,
      piece_count: 0,
      rate_linehaul: 0,
      assigned_driver_id: "",
      truck_id: "",
      trailer_id: "",
      intake_status: "scheduled",
      bol_number: "",
      invoice_number: "",
      seal_number: "",
      rfid_proof_required: false,
      insurance_requirements_summary: "",
      pod_bol_instructions: "",
      backhaul_pay: 0,
      claim_damage_flag: false,
      equipment_type: "",
      special_handling: "",
      destination_facility_name: "",
      destination_address: "",
      destination_city: "",
      destination_state: "",
      destination_zip: "",
      route_memory_key: "",
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
      insuranceRequirementType: "Standard COI",
      cargoCoverageLevel: "$250k",
      certificateRequired: true,
      additionalInsuredRequired: false,
      facilityEndorsementRequired: false,
      bolRequirementType: "Standard shipper BOL",
      signedBolRequired: true,
      palletCountRequired: true,
      pieceCountRequired: true,
      sealNotationRequired: false,
      bolSpecialInstructions: "",
      podRequirementType: "POD + photo evidence",
      signedPodRequired: true,
      receiverPrintedNameRequired: true,
      deliveryPhotoRequired: true,
      emptyTrailerPhotoRequired: false,
      sealVerificationRequired: false,
      gpsTimestampRequired: true,
      podSpecialInstructions: "",
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
  const { data, setFullData } = useBofDemoData();
  const upsertDispatchLoad = useDispatchDashboardStore((s) => s.upsertLoad);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<IntakeWizardState>(() => createInitialState());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const formEntityId = toBofIntakeEntityId(state.loadRequirement.load_requirement_id);
  const intakeSurfaceContext = useMemo(
    () => buildBofIntakeSurfaceContextFromWizard(formEntityId, state),
    [formEntityId, state]
  );

  const intelligence = useMemo(() => buildLoadIntakeIntelligence(data), [data]);
  const placesSessionToken = useMemo(() => {
    if (typeof globalThis !== "undefined" && globalThis.crypto && "randomUUID" in globalThis.crypto) {
      return globalThis.crypto.randomUUID();
    }
    return `sess-${Date.now()}`;
  }, []);

  const pickupSyncSig = [
    state.facility.facility_name,
    state.facility.address,
    state.facility.city,
    state.facility.state,
    state.facility.zip ?? "",
  ].join("|");
  const pickupDraftLine = [state.facility.facility_name, state.facility.address].filter(Boolean).join(" · ");

  const deliverySyncSig = [
    state.loadRequirement.destination_facility_name ?? "",
    state.loadRequirement.destination_address ?? "",
    state.loadRequirement.destination_city ?? "",
    state.loadRequirement.destination_state ?? "",
    state.loadRequirement.destination_zip ?? "",
  ].join("|");
  const deliveryDraftLine = [state.loadRequirement.destination_facility_name, state.loadRequirement.destination_address]
    .filter(Boolean)
    .join(" · ");

  const suggestedRoutes = useMemo(
    () => routesForOriginFacility(intelligence.routeMemories, state.facility.facility_name),
    [intelligence.routeMemories, state.facility.facility_name]
  );

  const touchDraft = useCallback(() => {
    setState((s) => ({
      ...s,
      lastDraftSavedAt: new Date().toISOString(),
    }));
  }, []);

  const applyKnownFacility = useCallback(
    (facilityName: string) => {
      const match = findFacilityByName(intelligence.facilities, facilityName);
      if (!match) return;
      touchDraft();
      setState((s) => ({
        ...s,
        shipper: match.shipperName
          ? {
              ...s.shipper,
              shipper_name: s.shipper.shipper_name || match.shipperName,
            }
          : s.shipper,
        facility: applyFacilityMatch(s.facility, match),
      }));
    },
    [intelligence.facilities, touchDraft]
  );

  const applyRouteMemory = useCallback(
    (routeKey: string) => {
      const route = intelligence.routeMemories.find((r) => r.key === routeKey);
      if (!route) return;
      touchDraft();
      setState((s) => ({
        ...s,
        loadRequirement: {
          ...s.loadRequirement,
          ...route.defaultLoadPatch,
        },
        compliance: {
          ...s.compliance,
          ...route.defaultCompliancePatch,
        },
      }));
    },
    [intelligence.routeMemories, touchDraft]
  );

  const checks = useMemo(
    () =>
      runAutoChecks(state.shipper, state.facility, state.loadRequirement, state.compliance),
    [state.shipper, state.facility, state.loadRequirement, state.compliance]
  );

  const blocking = hasBlockingChecks(checks);

  const goStep = (n: number) => setStep(n);

  const generatePacket = () => {
    if (blocking) return;
    setSubmitError(null);
    const packet: LoadPacket = {
      load_packet_id: `LP-${Date.now()}`,
      load_requirement_id: state.loadRequirement.load_requirement_id,
      packet_status: "Ready for dispatch board",
      missing_items_count: countWarnings(checks),
    };
    setState((s) => ({ ...s, loadPacket: packet }));
  };

  const validationErrors = useMemo(() => {
    const out: string[] = [];
    const req = state.loadRequirement;
    const pickupAddress = state.facility.address.trim();
    const deliveryAddress = (req.destination_address || "").trim();
    const pickupAt = req.pickup_at || state.compliance.appointment_window_start;
    const deliveryAt = req.delivery_at || state.compliance.appointment_window_end;
    if (!state.shipper.shipper_name.trim()) out.push("Missing customer / broker (shipper name).");
    if (!state.facility.facility_name.trim()) out.push("Missing pickup facility.");
    if (!pickupAddress) out.push("Missing pickup address.");
    if (!(req.destination_facility_name || "").trim()) out.push("Missing delivery facility.");
    if (!deliveryAddress) out.push("Missing delivery address.");
    if (!req.commodity.trim()) out.push("Missing commodity.");
    if (!(Number(req.rate_linehaul) > 0)) out.push("Missing or invalid rate / linehaul amount.");
    if (!(Number(req.weight) > 0)) out.push("Invalid weight.");
    if (pickupAt && deliveryAt && new Date(pickupAt).getTime() > new Date(deliveryAt).getTime()) {
      out.push("Delivery appointment must be after pickup appointment.");
    }
    if (req.assigned_driver_id?.trim()) {
      const exists = data.drivers.some((d) => d.id === req.assigned_driver_id?.trim());
      if (!exists) out.push(`Assigned driver does not exist: ${req.assigned_driver_id}.`);
    }
    return out;
  }, [data.drivers, state]);

  const runtimeIntakeLoadIds = useMemo(
    () =>
      data.loads
        .filter(
          (l) =>
            Boolean((l as { intakeStatus?: string }).intakeStatus) ||
            String(l.dispatchOpsNotes || "").includes("Intake generated load from")
        )
        .map((l) => l.id),
    [data.loads]
  );

  const exportRuntimeIntakeLoads = useCallback(() => {
    const ids = new Set(runtimeIntakeLoadIds);
    const payload = {
      exportedAt: new Date().toISOString(),
      type: "bof-runtime-intake-loads",
      count: ids.size,
      loads: data.loads.filter((l) => ids.has(l.id)),
      loadProofBundles: Object.fromEntries(
        Object.entries(data.loadProofBundles || {}).filter(([loadId]) => ids.has(loadId))
      ),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bof-runtime-intake-loads-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }, [data.loadProofBundles, data.loads, runtimeIntakeLoadIds]);

  const saveIntakeLoad = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(null);
    if (validationErrors.length > 0) {
      setSubmitError(validationErrors.join(" "));
      return;
    }
    try {
      const normalized = normalizeLoadIntakeForm(state, data);
      const next = structuredClone(data);
      const existingIdx = next.loads.findIndex((l) => l.id === normalized.bofLoad.id);
      if (existingIdx >= 0) next.loads[existingIdx] = normalized.bofLoad;
      else next.loads.push(normalized.bofLoad);
      next.loadProofBundles = {
        ...(next.loadProofBundles || {}),
        [normalized.canonical.loadId]: normalized.loadProofBundle,
      };
      setFullData(next);
      const mappedDispatch = buildDispatchLoadsFromBofData(next).find(
        (l) => l.load_id === normalized.canonical.loadId
      );
      if (mappedDispatch) {
        upsertDispatchLoad(mappedDispatch);
      }
      setSubmitSuccess(
        `Saved ${normalized.canonical.loadId}. Pending generation — run npm run generate:load-docs && npm run generate:load-evidence.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save intake load.";
      setSubmitError(msg);
    }
  }, [data, setFullData, state, upsertDispatchLoad, validationErrors]);

  return (
    <div className="bof-load-intake">
      <div className="bof-load-intake-hero">
        <h1>Shipper requirements intake</h1>
        <p>
          Pre-dispatch operational capture: shipper rules, load profile, compliance, and BOF
          auto-validation. Output feeds the dispatch load packet — not a carrier signup flow.
        </p>
      </div>

      <BofIntakeFormPrimaryPanel entityId={formEntityId} />
      <BofWorkflowFormShortcuts
        context="intake"
        entityId={formEntityId}
        title="Open BOF load forms while you work this intake"
      />
      <BofTemplateUsageSurface
        context="load_intake"
        entityId={formEntityId}
        intakeContextPayload={intakeSurfaceContext}
        title="Intake docs mapped to BOF workflow"
        subtitle="Editable intake-first forms with live customer/facility/route/contract context before load creation."
      />

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

            <div
              className="bof-load-intake-subsection"
              style={{ marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--bof-border)" }}
            >
              <h3>Pickup facility &amp; address</h3>
              <LoadIntakeAddressCombo
                variant="pickup"
                label="Search pickup (facility or address)"
                hint="BOF-known demo locations appear first; Google Places suggestions follow when configured."
                sessionToken={placesSessionToken}
                bofCandidates={intelligence.facilities}
                syncSignature={pickupSyncSig}
                draftFromFields={pickupDraftLine}
                onSelectBof={(m) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    shipper: m.shipperName
                      ? {
                          ...s.shipper,
                          shipper_name: s.shipper.shipper_name || m.shipperName,
                        }
                      : s.shipper,
                    facility: applyFacilityMatch(s.facility, m),
                  }));
                }}
                onSelectGoogle={(p) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    facility: {
                      ...s.facility,
                      facility_name: p.facilityName || s.facility.facility_name,
                      address: p.address,
                      city: p.city,
                      state: (p.state || "").slice(0, 2).toUpperCase(),
                      zip: p.zip,
                    },
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
                onBlur={(e) => applyKnownFacility(e.target.value)}
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
            <div className="bof-load-intake-field">
              <label htmlFor="facility_zip">ZIP</label>
              <input
                id="facility_zip"
                value={state.facility.zip ?? ""}
                maxLength={10}
                onChange={(e) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    facility: { ...s.facility, zip: e.target.value },
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

            <div className="bof-load-intake-subsection">
              <h3>Delivery facility &amp; address</h3>
              <LoadIntakeAddressCombo
                variant="delivery"
                label="Search delivery (facility or address)"
                hint="BOF-known destinations from demo load history appear first; Google Places follows when configured."
                sessionToken={placesSessionToken}
                bofCandidates={intelligence.destinationFacilities}
                syncSignature={deliverySyncSig}
                draftFromFields={deliveryDraftLine}
                onSelectBof={(m) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    loadRequirement: {
                      ...s.loadRequirement,
                      destination_facility_name: m.facilityName,
                      destination_address: m.address ?? "",
                      destination_city: m.city,
                      destination_state: m.state,
                      destination_zip: m.zip ?? "",
                    },
                  }));
                }}
                onSelectGoogle={(p) => {
                  touchDraft();
                  setState((s) => ({
                    ...s,
                    loadRequirement: {
                      ...s.loadRequirement,
                      destination_facility_name: p.facilityName || s.loadRequirement.destination_facility_name,
                      destination_address: p.address,
                      destination_city: p.city,
                      destination_state: (p.state || "").slice(0, 2).toUpperCase(),
                      destination_zip: p.zip,
                    },
                  }));
                }}
              />
              <div className="bof-load-intake-grid-2" style={{ marginTop: "1rem" }}>
                <div className="bof-load-intake-field">
                  <label htmlFor="destination_facility_name">Delivery facility name</label>
                  <input
                    id="destination_facility_name"
                    value={state.loadRequirement.destination_facility_name ?? ""}
                    onChange={(e) => {
                      touchDraft();
                      setState((s) => ({
                        ...s,
                        loadRequirement: {
                          ...s.loadRequirement,
                          destination_facility_name: e.target.value,
                        },
                      }));
                    }}
                  />
                </div>
                <div className="bof-load-intake-field">
                  <label htmlFor="destination_address">Delivery street address</label>
                  <input
                    id="destination_address"
                    value={state.loadRequirement.destination_address ?? ""}
                    onChange={(e) => {
                      touchDraft();
                      setState((s) => ({
                        ...s,
                        loadRequirement: {
                          ...s.loadRequirement,
                          destination_address: e.target.value,
                        },
                      }));
                    }}
                  />
                </div>
                <div className="bof-load-intake-field">
                  <label htmlFor="destination_city">Delivery city</label>
                  <input
                    id="destination_city"
                    value={state.loadRequirement.destination_city ?? ""}
                    onChange={(e) => {
                      touchDraft();
                      setState((s) => ({
                        ...s,
                        loadRequirement: {
                          ...s.loadRequirement,
                          destination_city: e.target.value,
                        },
                      }));
                    }}
                  />
                </div>
                <div className="bof-load-intake-field">
                  <label htmlFor="destination_state">Delivery state</label>
                  <input
                    id="destination_state"
                    value={state.loadRequirement.destination_state ?? ""}
                    maxLength={2}
                    onChange={(e) => {
                      touchDraft();
                      setState((s) => ({
                        ...s,
                        loadRequirement: {
                          ...s.loadRequirement,
                          destination_state: e.target.value.toUpperCase(),
                        },
                      }));
                    }}
                  />
                </div>
                <div className="bof-load-intake-field">
                  <label htmlFor="destination_zip">Delivery ZIP</label>
                  <input
                    id="destination_zip"
                    value={state.loadRequirement.destination_zip ?? ""}
                    maxLength={10}
                    onChange={(e) => {
                      touchDraft();
                      setState((s) => ({
                        ...s,
                        loadRequirement: {
                          ...s.loadRequirement,
                          destination_zip: e.target.value,
                        },
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="route_memory">Prior route memory</label>
              <select
                id="route_memory"
                value={state.loadRequirement.route_memory_key ?? ""}
                onChange={(e) => applyRouteMemory(e.target.value)}
              >
                <option value="">Select prior route template (optional)…</option>
                {suggestedRoutes.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="bof-muted" style={{ marginTop: "0.4rem", fontSize: "0.78rem" }}>
                Selecting a prior route applies known destination and documentation defaults. You can edit any auto-filled value.
              </p>
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
            <div className="bof-load-intake-field">
              <label htmlFor="load_id_input">Load ID (optional)</label>
              <input
                id="load_id_input"
                placeholder="Auto-generated when blank"
                value={state.loadRequirement.load_id_input ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, load_id_input: e.target.value.toUpperCase() },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="rate_linehaul">Rate / linehaul amount</label>
              <input
                id="rate_linehaul"
                type="number"
                min={0}
                step={0.01}
                value={state.loadRequirement.rate_linehaul || ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: {
                      ...s.loadRequirement,
                      rate_linehaul: parseFloat(e.target.value) || 0,
                    },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="pickup_at">Pickup appointment</label>
              <input
                id="pickup_at"
                type="datetime-local"
                value={state.loadRequirement.pickup_at ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, pickup_at: e.target.value },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="delivery_at">Delivery appointment</label>
              <input
                id="delivery_at"
                type="datetime-local"
                value={state.loadRequirement.delivery_at ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, delivery_at: e.target.value },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="assigned_driver_id">Assigned driver</label>
              <select
                id="assigned_driver_id"
                value={state.loadRequirement.assigned_driver_id ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, assigned_driver_id: e.target.value },
                  }))
                }
              >
                <option value="">Unassigned</option>
                {data.drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="truck_id">Truck / asset</label>
              <input
                id="truck_id"
                placeholder="T-101"
                value={state.loadRequirement.truck_id ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, truck_id: e.target.value.toUpperCase() },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="trailer_id">Trailer (optional)</label>
              <input
                id="trailer_id"
                placeholder="TR-201"
                value={state.loadRequirement.trailer_id ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, trailer_id: e.target.value.toUpperCase() },
                  }))
                }
              />
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="intake_status">Initial status</label>
              <select
                id="intake_status"
                value={state.loadRequirement.intake_status ?? "scheduled"}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: {
                      ...s.loadRequirement,
                      intake_status: e.target.value as
                        | "scheduled"
                        | "dispatched"
                        | "in_transit"
                        | "delivered",
                    },
                  }))
                }
              >
                <option value="scheduled">Scheduled</option>
                <option value="dispatched">Dispatched</option>
                <option value="in_transit">In transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div className="bof-load-intake-field">
              <label htmlFor="backhaul_pay">Backhaul opportunity/pay</label>
              <input
                id="backhaul_pay"
                type="number"
                min={0}
                step={0.01}
                value={state.loadRequirement.backhaul_pay || ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, backhaul_pay: parseFloat(e.target.value) || 0 },
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
              <div className="bof-load-intake-field">
                <label htmlFor="seal_number">Seal number (if known)</label>
                <input
                  id="seal_number"
                  value={state.loadRequirement.seal_number ?? ""}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      loadRequirement: { ...s.loadRequirement, seal_number: e.target.value },
                    }))
                  }
                />
              </div>
              <YesNo
                idPrefix="rfid-proof"
                label="RFID/proof workflow required?"
                value={state.loadRequirement.rfid_proof_required ?? false}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, rfid_proof_required: v },
                  }))
                }
              />
              <YesNo
                idPrefix="claim-flag"
                label="Claim / damage flag?"
                value={state.loadRequirement.claim_damage_flag ?? false}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    loadRequirement: { ...s.loadRequirement, claim_damage_flag: v },
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
              <div className="bof-load-intake-field">
                <label htmlFor="ins-type">Insurance requirement type</label>
                <select
                  id="ins-type"
                  value={state.compliance.insuranceRequirementType}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: {
                        ...s.compliance,
                        insuranceRequirementType: e.target.value as typeof s.compliance.insuranceRequirementType,
                      },
                    }))
                  }
                >
                  <option value="Standard COI">Standard COI</option>
                  <option value="Enhanced COI + waiver">Enhanced COI + waiver</option>
                  <option value="Customer-specific">Customer-specific</option>
                </select>
              </div>
              <div className="bof-load-intake-field">
                <label htmlFor="ins-cov">Cargo coverage level</label>
                <select
                  id="ins-cov"
                  value={state.compliance.cargoCoverageLevel}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: {
                        ...s.compliance,
                        cargoCoverageLevel: e.target.value as typeof s.compliance.cargoCoverageLevel,
                      },
                    }))
                  }
                >
                  <option value="$100k">$100k</option>
                  <option value="$250k">$250k</option>
                  <option value="$500k">$500k</option>
                  <option value="$1M+">$1M+</option>
                </select>
              </div>
              <YesNo
                idPrefix="ins-cert"
                label="Certificate required?"
                value={state.compliance.certificateRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, certificateRequired: v },
                  }))
                }
              />
              <YesNo
                idPrefix="ins-additional"
                label="Additional insured required?"
                value={state.compliance.additionalInsuredRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, additionalInsuredRequired: v },
                  }))
                }
              />
              <YesNo
                idPrefix="ins-endorse"
                label="Facility endorsement required?"
                value={state.compliance.facilityEndorsementRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, facilityEndorsementRequired: v },
                  }))
                }
              />
              <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="ins-note">Insurance special instructions</label>
                <textarea
                  id="ins-note"
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
              <div className="bof-load-intake-field">
                <label htmlFor="invoice_number">Invoice number (optional)</label>
                <input
                  id="invoice_number"
                  value={state.loadRequirement.invoice_number ?? ""}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      loadRequirement: { ...s.loadRequirement, invoice_number: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="bof-load-intake-subsection">
            <h3>BOL requirements</h3>
            <div className="bof-load-intake-grid-2">
              <div className="bof-load-intake-field">
                <label htmlFor="bol-type">BOL requirement type</label>
                <select
                  id="bol-type"
                  value={state.compliance.bolRequirementType}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: {
                        ...s.compliance,
                        bolRequirementType: e.target.value as typeof s.compliance.bolRequirementType,
                      },
                    }))
                  }
                >
                  <option value="Standard shipper BOL">Standard shipper BOL</option>
                  <option value="Customer BOL template">Customer BOL template</option>
                  <option value="Dual-signature BOL">Dual-signature BOL</option>
                </select>
              </div>
              <YesNo
                idPrefix="bol-signed"
                label="Signed BOL required?"
                value={state.compliance.signedBolRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, signedBolRequired: v },
                  }))
                }
              />
              <YesNo
                idPrefix="bol-pallet"
                label="Pallet count required?"
                value={state.compliance.palletCountRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, palletCountRequired: v },
                  }))
                }
              />
              <YesNo
                idPrefix="bol-piece"
                label="Piece count required?"
                value={state.compliance.pieceCountRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, pieceCountRequired: v },
                  }))
                }
              />
              <YesNo
                idPrefix="bol-seal"
                label="Seal notation required?"
                value={state.compliance.sealNotationRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, sealNotationRequired: v },
                  }))
                }
              />
              <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="bol">BOL special instructions</label>
                <textarea
                  id="bol"
                  value={state.compliance.bolSpecialInstructions}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: {
                        ...s.compliance,
                        bolSpecialInstructions: e.target.value,
                        bol_instructions: e.target.value,
                      },
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="bof-load-intake-field">
                <label htmlFor="bol_number">BOL number (optional)</label>
                <input
                  id="bol_number"
                  value={state.loadRequirement.bol_number ?? ""}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      loadRequirement: { ...s.loadRequirement, bol_number: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="bof-load-intake-subsection">
            <h3>POD requirements</h3>
            <div className="bof-load-intake-grid-2">
              <div className="bof-load-intake-field">
                <label htmlFor="pod-type">POD requirement type</label>
                <select
                  id="pod-type"
                  value={state.compliance.podRequirementType}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: {
                        ...s.compliance,
                        podRequirementType: e.target.value as typeof s.compliance.podRequirementType,
                      },
                    }))
                  }
                >
                  <option value="Standard POD">Standard POD</option>
                  <option value="POD + photo evidence">POD + photo evidence</option>
                  <option value="Strict POD + GPS/receiver validation">
                    Strict POD + GPS/receiver validation
                  </option>
                </select>
              </div>
              <YesNo
                idPrefix="pod-signed"
                label="Signed POD required?"
                value={state.compliance.signedPodRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, signedPodRequired: v },
                  }))
                }
              />
              <YesNo
                idPrefix="pod-recv"
                label="Receiver printed name required?"
                value={state.compliance.receiverPrintedNameRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, receiverPrintedNameRequired: v },
                  }))
                }
              />
              <YesNo
                idPrefix="pod-photo-del"
                label="Delivery photo required?"
                value={state.compliance.deliveryPhotoRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: {
                      ...s.compliance,
                      deliveryPhotoRequired: v,
                      delivery_photos_required: v,
                    },
                  }))
                }
              />
              <YesNo
                idPrefix="pod-photo-empty"
                label="Empty trailer photo required?"
                value={state.compliance.emptyTrailerPhotoRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, emptyTrailerPhotoRequired: v },
                  }))
                }
              />
              <YesNo
                idPrefix="pod-seal-verify"
                label="Seal verification required?"
                value={state.compliance.sealVerificationRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, sealVerificationRequired: v },
                  }))
                }
              />
              <YesNo
                idPrefix="pod-gps"
                label="GPS timestamp required?"
                value={state.compliance.gpsTimestampRequired}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    compliance: { ...s.compliance, gpsTimestampRequired: v },
                  }))
                }
              />
              <div className="bof-load-intake-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="pod">POD special instructions</label>
                <textarea
                  id="pod"
                  value={state.compliance.podSpecialInstructions}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      compliance: {
                        ...s.compliance,
                        podSpecialInstructions: e.target.value,
                        pod_requirements: e.target.value,
                      },
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
          <LoadIntakeStep4PacketReview
            state={state}
            setState={setState}
            checks={checks}
            goStep={goStep}
            generatePacket={generatePacket}
            onSaveLoad={saveIntakeLoad}
            validationErrors={validationErrors}
            submitError={submitError}
            submitSuccess={submitSuccess}
          />
          <section className="bof-load-intake-card" aria-label="Runtime export">
            <h2>Session export</h2>
            <p className="bof-muted">
              Demo-created intake loads are stored in session/local demo data. Export them as JSON to
              promote into seed data when needed.
            </p>
            <div className="bof-load-intake-toolbar">
              <button
                type="button"
                className="bof-load-intake-btn"
                onClick={exportRuntimeIntakeLoads}
                disabled={runtimeIntakeLoadIds.length === 0}
              >
                Export runtime intake loads JSON
              </button>
              <span className="bof-muted bof-small">
                {runtimeIntakeLoadIds.length} runtime load(s) available
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
