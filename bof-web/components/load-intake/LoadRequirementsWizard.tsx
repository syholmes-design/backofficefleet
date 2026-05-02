"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  countWarnings,
  hasBlockingChecks,
  runAutoChecks,
} from "@/lib/load-requirements-intake-checks";
import type { IntakeWizardState, LoadPacket } from "@/lib/load-requirements-intake-types";
import type { LoadIntakeRecord } from "@/lib/load-requirements-intake-types";
import { LoadIntakeStep4PacketReview } from "@/components/load-intake/LoadIntakeStep4PacketReview";
import { LoadIntakeAddressCombo } from "@/components/load-intake/LoadIntakeAddressCombo";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import type { LoadIntakeSourceType } from "@/lib/load-requirements-intake-types";
import { buildWizardIntakeRecord } from "@/lib/load-intake/build-wizard-intake-record";
import { commitIntakeWizardToBof } from "@/lib/load-intake/commit-intake-to-bof";
import { buildIntakeWizardStateFromClientRequest } from "@/lib/load-intake/prefill-client-request-intake";
import { getClientLoadRequests } from "@/lib/client-load-requests";
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
import { normalizeLoadIntake } from "@/lib/load-intake/normalize-intake";
import { createLoadIntakeWizardState } from "@/lib/load-intake/wizard-initial-state";
import {
  intakeRecordSupportsLoadWizard,
  mergeIntakeEngineRecordIntoWizardState,
} from "@/lib/load-intake/map-intake-engine-to-wizard";
import { useIntakeEngineStore } from "@/lib/stores/intake-engine-store";

type ExtractionResponse = {
  providerName: "local";
  status: "success" | "needs_review" | "failed";
  confidence: number;
  normalizedFields: Partial<LoadIntakeRecord>;
  extractedTextPreview: string;
  warnings: string[];
  fieldConfidence: Record<string, number>;
};

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

function ConfidenceBadge({
  score,
}: {
  score?: number;
}) {
  if (typeof score !== "number") return null;
  const pct = Math.round(score * 100);
  const tone = pct >= 80 ? "high" : pct >= 60 ? "medium" : "low";
  return <span className={`bof-intake-confidence bof-intake-confidence-${tone}`}>{pct}%</span>;
}

function applyExtractedFieldsToState(state: IntakeWizardState, fields: Partial<LoadIntakeRecord>): IntakeWizardState {
  const next = structuredClone(state);
  if (fields.customerName) next.shipper.shipper_name = String(fields.customerName);
  if (fields.shipperName && !next.shipper.shipper_name) next.shipper.shipper_name = String(fields.shipperName);
  if (fields.pickupFacilityName) next.facility.facility_name = String(fields.pickupFacilityName);
  if (fields.pickupAddress1) next.facility.address = String(fields.pickupAddress1);
  if (fields.pickupCity) next.facility.city = String(fields.pickupCity);
  if (fields.pickupState) next.facility.state = String(fields.pickupState);
  if (fields.pickupZip) next.facility.zip = String(fields.pickupZip);
  if (fields.deliveryFacilityName) next.loadRequirement.destination_facility_name = String(fields.deliveryFacilityName);
  if (fields.deliveryAddress1) next.loadRequirement.destination_address = String(fields.deliveryAddress1);
  if (fields.deliveryCity) next.loadRequirement.destination_city = String(fields.deliveryCity);
  if (fields.deliveryState) next.loadRequirement.destination_state = String(fields.deliveryState);
  if (fields.deliveryZip) next.loadRequirement.destination_zip = String(fields.deliveryZip);
  if (fields.pickupAppointmentDate) {
    next.loadRequirement.pickup_at = `${fields.pickupAppointmentDate}T${String(fields.pickupAppointmentTime || "08:00").slice(0, 5)}`;
  }
  if (fields.deliveryAppointmentDate) {
    next.loadRequirement.delivery_at = `${fields.deliveryAppointmentDate}T${String(fields.deliveryAppointmentTime || "17:00").slice(0, 5)}`;
  }
  if (fields.commodity) next.loadRequirement.commodity = String(fields.commodity);
  if (fields.weight) next.loadRequirement.weight = Number(fields.weight) || next.loadRequirement.weight;
  if (fields.equipmentType) next.loadRequirement.equipment_type = String(fields.equipmentType);
  if (fields.rate) next.loadRequirement.rate_linehaul = Number(fields.rate) || next.loadRequirement.rate_linehaul;
  if (fields.bolNumber) next.loadRequirement.bol_number = String(fields.bolNumber);
  if (fields.sealNumber) next.loadRequirement.seal_number = String(fields.sealNumber);
  if (typeof fields.sealRequired !== "undefined") next.compliance.seal_required = Boolean(fields.sealRequired);
  if (fields.specialInstructions) next.loadRequirement.special_handling = String(fields.specialInstructions);
  if (fields.detentionTerms) next.compliance.accessorial_rules = String(fields.detentionTerms);
  if (fields.cargoInsuranceMinimum) {
    const v = String(fields.cargoInsuranceMinimum);
    if (v.includes("100")) next.compliance.cargoCoverageLevel = "$100k";
    else if (v.includes("500")) next.compliance.cargoCoverageLevel = "$500k";
    else if (v.includes("1M")) next.compliance.cargoCoverageLevel = "$1M+";
    else next.compliance.cargoCoverageLevel = "$250k";
  }
  return next;
}

const STEPS = [
  { n: 1, title: "Shipper & facility", short: "Shipper" },
  { n: 2, title: "Load requirements", short: "Load" },
  { n: 3, title: "Compliance, proof & financial", short: "Compliance" },
  { n: 4, title: "Review & packet", short: "Review" },
  { n: 5, title: "Save to dispatch", short: "Save" },
] as const;

export type IntakeEntrySource = "manual_entry" | "upload_parser" | "client_request" | "intake_engine";

function toPipelineSourceType(entry: IntakeEntrySource): LoadIntakeSourceType {
  if (entry === "upload_parser") return "upload";
  if (entry === "client_request") return "client_manual";
  if (entry === "intake_engine") return "email";
  return "manual";
}

export function LoadRequirementsWizard() {
  const searchParams = useSearchParams();
  const { data, setFullData } = useBofDemoData();
  const upsertDispatchLoad = useDispatchDashboardStore((s) => s.upsertLoad);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<IntakeWizardState>(() => createLoadIntakeWizardState());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [lastSavedLoadId, setLastSavedLoadId] = useState<string | null>(null);
  const [intakeEntrySource, setIntakeEntrySource] = useState<IntakeEntrySource>("manual_entry");
  const clientPrefillAppliedRef = useRef<string | null>(null);
  const intakeEnginePrefillRef = useRef<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null);
  const pipelineSourceType = useMemo(
    () => toPipelineSourceType(intakeEntrySource),
    [intakeEntrySource]
  );

  useEffect(() => {
    if (searchParams.get("intakeId")) return;
    const id = searchParams.get("clientRequestId");
    if (!id) {
      clientPrefillAppliedRef.current = null;
      return;
    }
    if (clientPrefillAppliedRef.current === id) return;
    const row = getClientLoadRequests(data).find((r) => r.requestId === id);
    if (!row) return;
    clientPrefillAppliedRef.current = id;
    intakeEnginePrefillRef.current = null;
    setIntakeEntrySource("client_request");
    setState(buildIntakeWizardStateFromClientRequest(row));
    setStep(1);
    setSubmitError(null);
    setSubmitSuccess(null);
    setExtractionResult(null);
  }, [data, searchParams]);

  useEffect(() => {
    const intakeId = searchParams.get("intakeId");
    if (!intakeId) {
      intakeEnginePrefillRef.current = null;
      return;
    }
    if (intakeEnginePrefillRef.current === intakeId) return;
    const row = useIntakeEngineStore.getState().getIntake(intakeId);
    if (!row || !intakeRecordSupportsLoadWizard(row)) return;
    intakeEnginePrefillRef.current = intakeId;
    clientPrefillAppliedRef.current = null;
    setIntakeEntrySource("intake_engine");
    setState(mergeIntakeEngineRecordIntoWizardState(row));
    setStep(1);
    setSubmitError(null);
    setSubmitSuccess(null);
    setExtractionResult(null);
  }, [searchParams]);

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
  const normalizedReview = useMemo(
    () =>
      normalizeLoadIntake({
        sourceType: pipelineSourceType,
        fields: buildWizardIntakeRecord(state, pipelineSourceType, extractionResult),
      }),
    [extractionResult, pipelineSourceType, state]
  );
  const fieldConfidence = extractionResult?.fieldConfidence ?? {};

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
    if (normalizedReview.status !== "ready_to_save" && normalizedReview.status !== "needs_review") {
      setSubmitError("Intake record is not ready for review.");
      return;
    }
    if (normalizedReview.missingRequiredFields.length > 0) {
      setSubmitError(`Missing required fields: ${normalizedReview.missingRequiredFields.join(", ")}.`);
      return;
    }
    if (validationErrors.length > 0) {
      setSubmitError(validationErrors.join(" "));
      return;
    }
    try {
      const committed = commitIntakeWizardToBof(data, state, {
        normalizedRecord: normalizedReview.normalized,
        sourceType: pipelineSourceType,
        uploadFileName: uploadFile?.name ?? null,
        extractionProvider: extractionResult?.providerName,
        extractionConfidence: extractionResult?.confidence,
        extractionWarnings: extractionResult?.warnings,
        reviewedBy:
          intakeEntrySource === "client_request"
            ? "client_request_import"
            : intakeEntrySource === "intake_engine"
              ? "intake_engine_import"
              : "dispatcher",
      });
      setFullData(committed.nextData);
      if (committed.dispatchLoad) {
        upsertDispatchLoad(committed.dispatchLoad);
      }
      setLastSavedLoadId(committed.loadId);
      setSubmitSuccess(
        `Saved ${committed.loadId}. Pending generation — run npm run generate:load-docs && npm run generate:load-evidence.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save intake load.";
      setSubmitError(msg);
    }
  }, [
    data,
    extractionResult?.confidence,
    extractionResult?.providerName,
    extractionResult?.warnings,
    intakeEntrySource,
    pipelineSourceType,
    normalizedReview.missingRequiredFields,
    normalizedReview.normalized,
    normalizedReview.status,
    setFullData,
    state,
    uploadFile?.name,
    upsertDispatchLoad,
    validationErrors,
  ]);

  const extractUploadDocument = useCallback(async () => {
    setExtractionError(null);
    setExtractionResult(null);
    if (!uploadFile) {
      setExtractionError("Select a PDF file to extract.");
      return;
    }
    setExtracting(true);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      const res = await fetch("/api/load-intake/extract", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as ExtractionResponse & { error?: string };
      if (!res.ok) {
        throw new Error(json.error || "Extraction failed.");
      }
      setExtractionResult(json);
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  }, [uploadFile]);

  return (
    <div className="bof-load-intake">
      <div className="bof-load-intake-hero">
        <h1>BOF Load Intake Command</h1>
        <p>
          One canonical pipeline: capture requirements, normalize, review, save to BOF loads, sync
          dispatch, and initialize proof bundles. Manual entry, PDF extraction (when configured), and
          client requests all converge here before save.
        </p>
      </div>

      <section className="bof-load-intake-card" aria-label="Intake source">
        <h2 className="bof-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Intake source
        </h2>
        <div className="bof-load-intake-toolbar" style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            className={`bof-load-intake-btn ${intakeEntrySource === "manual_entry" ? "bof-load-intake-btn--primary" : ""}`}
            onClick={() => {
              setIntakeEntrySource("manual_entry");
              setExtractionResult(null);
            }}
          >
            Manual entry
          </button>
          <button
            type="button"
            className={`bof-load-intake-btn ${intakeEntrySource === "upload_parser" ? "bof-load-intake-btn--primary" : ""}`}
            onClick={() => setIntakeEntrySource("upload_parser")}
          >
            Upload / parser
          </button>
          <button
            type="button"
            className={`bof-load-intake-btn ${intakeEntrySource === "client_request" ? "bof-load-intake-btn--primary" : ""}`}
            onClick={() => setIntakeEntrySource("client_request")}
          >
            Client request
          </button>
        </div>
        <p className="bof-muted bof-small" style={{ marginTop: "0.75rem" }}>
          {intakeEntrySource === "intake_engine" ? (
            <>
              Prefilled from the{" "}
              <Link href="/intake" className="bof-link-secondary">
                Intake Engine
              </Link>{" "}
              using only stored extraction fields — review and complete missing requirements before save.
            </>
          ) : intakeEntrySource === "client_request" ? (
            <>
              Open the{" "}
              <Link href="/load-requests" className="bof-link-secondary">
                client request queue
              </Link>{" "}
              or launch a row with{" "}
              <code className="bof-code">/load-intake?clientRequestId=…</code> to prefill this wizard.
            </>
          ) : intakeEntrySource === "upload_parser" ? (
            <>
              PDF extraction uses the local provider when available. If extraction is unavailable, use
              manual fields — the demo does not fabricate parser output.
            </>
          ) : (
            <>Typed intake uses the same normalization and save path as upload and client flows.</>
          )}
        </p>
      </section>

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
              IDs: <code className="bof-code">{state.shipper.shipper_id}</code> ·{" "}
              <code className="bof-code">{state.facility.facility_id}</code>
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
          {intakeEntrySource === "upload_parser" && (
            <div className="bof-load-intake-subsection" style={{ marginBottom: "1rem" }}>
              <h3>Upload Rate Con / PO / Tender</h3>
              <div className="bof-load-intake-grid-2">
                <div className="bof-load-intake-field">
                  <label htmlFor="intake-upload-file">PDF document</label>
                  <input
                    id="intake-upload-file"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="bof-load-intake-field">
                  <label>Actions</label>
                  <div className="bof-load-intake-toolbar">
                    <button
                      type="button"
                      className="bof-load-intake-btn bof-load-intake-btn--primary"
                      disabled={extracting || !uploadFile}
                      onClick={extractUploadDocument}
                    >
                      {extracting ? "Extracting..." : "Extract fields"}
                    </button>
                    {extractionResult ? (
                      <button
                        type="button"
                        className="bof-load-intake-btn"
                        onClick={() => setState((s) => applyExtractedFieldsToState(s, extractionResult.normalizedFields))}
                      >
                        Apply to form
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              {extractionError ? (
                <div className="bof-load-intake-alert bof-load-intake-alert--block">{extractionError}</div>
              ) : null}
              {extractionResult ? (
                <div style={{ marginTop: "0.7rem" }}>
                  <p className="bof-muted">
                    Provider: <strong>{extractionResult.providerName}</strong> · Confidence:{" "}
                    <strong>{Math.round(extractionResult.confidence * 100)}%</strong> · Status:{" "}
                    <strong>{extractionResult.status}</strong>
                  </p>
                  {extractionResult.warnings.length > 0 ? (
                    <ul className="bof-cc-change-list">
                      {extractionResult.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  ) : null}
                  <details style={{ marginTop: "0.5rem" }}>
                    <summary>Extracted text preview</summary>
                    <pre className="bof-load-intake-code">{extractionResult.extractedTextPreview}</pre>
                  </details>
                  <details style={{ marginTop: "0.5rem" }}>
                    <summary>Field confidence breakdown</summary>
                    <div className="bof-load-intake-confidence-list">
                      {Object.entries(extractionResult.fieldConfidence)
                        .sort((a, b) => a[1] - b[1])
                        .map(([field, score]) => (
                          <div key={field} className="bof-load-intake-confidence-row">
                            <span>{field}</span>
                            <ConfidenceBadge score={score} />
                          </div>
                        ))}
                    </div>
                  </details>
                </div>
              ) : null}
            </div>
          )}
          <div className="bof-load-intake-grid-2">
            <div className="bof-load-intake-field">
              <label htmlFor="commodity">Commodity</label>
                <ConfidenceBadge score={fieldConfidence.commodity} />
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
                <ConfidenceBadge score={fieldConfidence.equipmentType} />
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
                <ConfidenceBadge score={fieldConfidence.weight} />
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
                <ConfidenceBadge score={fieldConfidence.rate} />
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
                <ConfidenceBadge score={Math.max(fieldConfidence.pickupAppointmentDate ?? 0, fieldConfidence.pickupAppointmentTime ?? 0)} />
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
                <ConfidenceBadge score={Math.max(fieldConfidence.deliveryAppointmentDate ?? 0, fieldConfidence.deliveryAppointmentTime ?? 0)} />
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
          <h2 id="intake-s3">Step 3 — Compliance, proof &amp; financial</h2>
          <p className="bof-muted">
            Security, proof standards, timing, BOL/POD, insurance, and accessorial economics.
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
                <ConfidenceBadge score={fieldConfidence.sealNumber} />
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
                <ConfidenceBadge score={fieldConfidence.bolNumber} />
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
              Continue to review &amp; packet
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <>
          <BofIntakeFormPrimaryPanel entityId={formEntityId} />
          <BofWorkflowFormShortcuts
            context="intake"
            entityId={formEntityId}
            title="Open BOF load forms while you review this intake"
          />
          <BofTemplateUsageSurface
            context="load_intake"
            entityId={formEntityId}
            intakeContextPayload={intakeSurfaceContext}
            title="Template &amp; document packet readiness"
            subtitle="Mapped to the BOF load template library — compact view for Step 4 only."
          />
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
            normalizedReview={normalizedReview}
            intakeReviewLabel={pipelineSourceType}
            showEmbeddedSave={false}
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

      {step === 5 && (
        <section className="bof-load-intake-card" aria-labelledby="intake-s5">
          <h2 id="intake-s5">Step 5 — Save to dispatch</h2>
          <p className="bof-muted">
            Commit writes the load into BOF demo data, attaches the proof bundle shell, and upserts the
            dispatch board row. Run document generation scripts afterward for full HTML artifacts.
          </p>
          <dl className="bof-muted" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
            <dt style={{ fontWeight: 600, color: "#e2e8f0" }}>Customer</dt>
            <dd>{state.shipper.shipper_name || "—"}</dd>
            <dt style={{ fontWeight: 600, color: "#e2e8f0" }}>Lane</dt>
            <dd>
              {state.facility.city}, {state.facility.state} → {state.loadRequirement.destination_city},{" "}
              {state.loadRequirement.destination_state}
            </dd>
            <dt style={{ fontWeight: 600, color: "#e2e8f0" }}>Pipeline</dt>
            <dd>{pipelineSourceType}</dd>
          </dl>
          {validationErrors.length > 0 ? (
            <div className="bof-load-intake-alert bof-load-intake-alert--warn" role="alert">
              <strong>Validation</strong> — {validationErrors.join(" ")}
            </div>
          ) : null}
          {submitError ? (
            <div className="bof-load-intake-alert bof-load-intake-alert--block" role="alert">
              <strong>Save failed</strong> — {submitError}
            </div>
          ) : null}
          {submitSuccess ? (
            <div className="bof-load-intake-alert bof-load-intake-alert--ok" role="status">
              <strong>Saved</strong> — {submitSuccess}
              <div className="bof-load-intake-toolbar" style={{ marginTop: "0.75rem" }}>
                {lastSavedLoadId ? (
                  <>
                    <Link
                      href={`/loads/${lastSavedLoadId}`}
                      className="bof-load-intake-btn bof-load-intake-btn--primary"
                    >
                      Open load
                    </Link>
                    <Link href="/dispatch" className="bof-load-intake-btn">
                      Open dispatch
                    </Link>
                    <Link
                      href={`/loads/${lastSavedLoadId}/readiness-summary`}
                      className="bof-load-intake-btn"
                    >
                      Open trip packet
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/loads" className="bof-load-intake-btn">
                      Open loads
                    </Link>
                    <Link href="/dispatch" className="bof-load-intake-btn">
                      Open dispatch
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : null}
          <div className="bof-load-intake-toolbar">
            <button type="button" className="bof-load-intake-btn" onClick={() => goStep(4)}>
              Back to review
            </button>
            <button type="button" className="bof-load-intake-btn bof-load-intake-btn--primary" onClick={saveIntakeLoad}>
              Save load to BOF &amp; sync dispatch
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
