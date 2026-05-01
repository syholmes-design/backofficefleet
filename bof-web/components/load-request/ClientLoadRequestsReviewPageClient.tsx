"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  clientRequestToIntakeRecord,
  getClientLoadRequests,
  setClientLoadRequests,
  validateClientLoadRequestDraft,
  type ClientLoadRequest,
} from "@/lib/client-load-requests";
import type { IntakeWizardState } from "@/lib/load-requirements-intake-types";
import { normalizeLoadIntake } from "@/lib/load-intake/normalize-intake";
import { normalizeLoadIntakeForm } from "@/lib/load-intake-normalize";
import { buildDispatchLoadsFromBofData } from "@/lib/dispatch-dashboard-seed";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";

function buildIntakeStateFromRequest(request: ClientLoadRequest): IntakeWizardState {
  return {
    lastDraftSavedAt: null,
    shipper: {
      shipper_id: "SHIP-CLIENT-REQUEST",
      shipper_name: request.companyName,
      primary_contact_name: request.contactName,
      primary_contact_email: request.contactEmail,
      primary_contact_phone: request.contactPhone,
    },
    facility: {
      facility_id: "FAC-CLIENT-REQUEST",
      shipper_id: "SHIP-CLIENT-REQUEST",
      facility_name: request.pickupFacilityName,
      address: request.pickupAddress1,
      city: request.pickupCity,
      state: request.pickupState,
      zip: request.pickupZip,
      facility_rules: request.pickupInstructions || "",
      appointment_required: true,
    },
    loadRequirement: {
      load_requirement_id: `LR-${request.requestId}`,
      shipper_id: "SHIP-CLIENT-REQUEST",
      facility_id: "FAC-CLIENT-REQUEST",
      load_id_input: "",
      pickup_at: `${request.pickupDate}T${request.pickupTime || "08:00"}`,
      delivery_at: `${request.deliveryDate}T${request.deliveryTime || "17:00"}`,
      commodity: request.commodity,
      weight: request.weight || 0,
      pallet_count: request.palletCount || 0,
      piece_count: request.palletCount || 0,
      rate_linehaul: request.quotedRate || 0,
      assigned_driver_id: "",
      truck_id: "",
      trailer_id: "",
      intake_status: "scheduled",
      bol_number: request.bolNumber || "",
      invoice_number: "",
      seal_number: request.sealNumber || "",
      rfid_proof_required: false,
      insurance_requirements_summary: request.specialInsuranceNotes || "",
      pod_bol_instructions: request.deliveryInstructions || "",
      backhaul_pay: 0,
      claim_damage_flag: false,
      equipment_type: request.equipmentType,
      special_handling: request.specialHandlingInstructions || "",
      destination_facility_name: request.deliveryFacilityName,
      destination_address: request.deliveryAddress1,
      destination_city: request.deliveryCity,
      destination_state: request.deliveryState,
      destination_zip: request.deliveryZip,
      route_memory_key: "",
      temperature_required: Boolean(request.temperatureRequirement),
      temperature_min: undefined,
      temperature_max: undefined,
    },
    compliance: {
      requirement_id: `REQ-${request.requestId}`,
      load_requirement_id: `LR-${request.requestId}`,
      seal_required: Boolean(request.sealRequired),
      seal_number_required: Boolean(request.sealRequired),
      pickup_photos_required: false,
      delivery_photos_required: true,
      cargo_photos_required: Boolean(request.cargoPhotoRequired),
      insuranceRequirementType: "Standard COI",
      cargoCoverageLevel: "$250k",
      certificateRequired: Boolean(request.insuranceRequired),
      additionalInsuredRequired: false,
      facilityEndorsementRequired: false,
      bolRequirementType: "Standard shipper BOL",
      signedBolRequired: true,
      palletCountRequired: true,
      pieceCountRequired: true,
      sealNotationRequired: Boolean(request.sealRequired),
      bolSpecialInstructions: request.pickupInstructions || "",
      podRequirementType: "POD + photo evidence",
      signedPodRequired: true,
      receiverPrintedNameRequired: true,
      deliveryPhotoRequired: true,
      emptyTrailerPhotoRequired: false,
      sealVerificationRequired: Boolean(request.sealRequired),
      gpsTimestampRequired: true,
      podSpecialInstructions: request.deliveryInstructions || "",
      insurance_requirements: request.specialInsuranceNotes || "",
      appointment_window_start: `${request.pickupDate}T${request.pickupTime || "08:00"}`,
      appointment_window_end: `${request.deliveryDate}T${request.deliveryTime || "17:00"}`,
      bol_instructions: request.pickupInstructions || "",
      pod_requirements: request.deliveryInstructions || "",
      accessorial_rules: request.paymentTerms || "",
      lumper_expected: Boolean(request.pickupInstructions?.toLowerCase().includes("lumper")),
    },
    loadPacket: null,
  };
}

export function ClientLoadRequestsReviewPageClient() {
  const { data, setFullData } = useBofDemoData();
  const upsertDispatchLoad = useDispatchDashboardStore((s) => s.upsertLoad);
  const [editingId, setEditingId] = useState<string | null>(null);
  const requests = useMemo(() => getClientLoadRequests(data), [data]);
  const editing = requests.find((r) => r.requestId === editingId) || null;

  const updateRequest = (requestId: string, patch: Partial<ClientLoadRequest>) => {
    const nextRequests = requests.map((r) => {
      if (r.requestId !== requestId) return r;
      const merged = { ...r, ...patch };
      const review = validateClientLoadRequestDraft(merged);
      return {
        ...merged,
        warnings: review.warnings,
        missingRequiredFields: review.missingRequiredFields,
        status: patch.status
          ? patch.status
          : merged.status === "converted_to_load" || merged.status === "rejected"
            ? merged.status
            : review.missingRequiredFields.length > 0 || review.warnings.length > 0
              ? "needs_review"
              : "submitted",
      };
    });
    const next = structuredClone(data);
    setClientLoadRequests(next, nextRequests);
    setFullData(next);
  };

  const convertRequest = (request: ClientLoadRequest) => {
    const review = normalizeLoadIntake({
      sourceType: "client_manual",
      fields: clientRequestToIntakeRecord(request),
    });
    if (review.missingRequiredFields.length > 0) {
      updateRequest(request.requestId, {
        status: "needs_review",
        warnings: review.warnings,
        missingRequiredFields: review.missingRequiredFields,
      });
      return;
    }
    const intakeState = buildIntakeStateFromRequest(request);
    const normalized = normalizeLoadIntakeForm(intakeState, data, {
      ...review.normalized,
      sourceType: "client_manual",
      reviewedAt: new Date().toISOString(),
      reviewedBy: "internal_bof",
    });
    const next = structuredClone(data);
    const existingIdx = next.loads.findIndex((l) => l.id === normalized.bofLoad.id);
    if (existingIdx >= 0) next.loads[existingIdx] = normalized.bofLoad;
    else next.loads.push(normalized.bofLoad);
    next.loadProofBundles = {
      ...(next.loadProofBundles || {}),
      [normalized.canonical.loadId]: normalized.loadProofBundle,
    };
    const nextRequests = requests.map((r) =>
      r.requestId === request.requestId
        ? {
            ...r,
            status: "converted_to_load" as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: "internal_bof",
            warnings: review.warnings,
            missingRequiredFields: review.missingRequiredFields,
            convertedLoadId: normalized.canonical.loadId,
          }
        : r
    );
    setClientLoadRequests(next, nextRequests);
    setFullData(next);
    const mappedDispatch = buildDispatchLoadsFromBofData(next).find((l) => l.load_id === normalized.canonical.loadId);
    if (mappedDispatch) upsertDispatchLoad(mappedDispatch);
  };

  return (
    <div className="bof-page">
      <h1 className="bof-title">Client Load Requests</h1>
      <p className="bof-lead">Internal BOF review queue for client-submitted load requests.</p>
      <p className="bof-muted bof-small">Client submissions remain pending review until converted.</p>
      <div className="bof-cc-table-wrap">
        <table className="bof-cc-table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Company / Contact</th>
              <th>Lane</th>
              <th>Pickup Date</th>
              <th>Missing / Warnings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.requestId}>
                <td>{request.requestId}</td>
                <td>{request.companyName} · {request.contactName}</td>
                <td>{request.pickupCity}, {request.pickupState} → {request.deliveryCity}, {request.deliveryState}</td>
                <td>{request.pickupDate}</td>
                <td>{request.missingRequiredFields.length} / {request.warnings.length}</td>
                <td>{request.status}</td>
                <td>
                  <div className="bof-cc-action-wrap">
                    <button type="button" className="bof-cc-action-btn" onClick={() => setEditingId(request.requestId)}>Review</button>
                    <button type="button" className="bof-cc-action-btn" onClick={() => updateRequest(request.requestId, { status: "approved" })}>Approve</button>
                    <button type="button" className="bof-cc-action-btn bof-cc-action-btn-danger" onClick={() => updateRequest(request.requestId, { status: "rejected" })}>Reject</button>
                    <button type="button" className="bof-cc-action-btn bof-cc-action-btn-primary" onClick={() => convertRequest(request)}>
                      Convert to Load
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing ? (
        <section className="bof-load-intake-card">
          <h2>Review {editing.requestId}</h2>
          <div className="bof-load-intake-grid-2">
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="companyName" label="Company" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="contactEmail" label="Contact Email" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="pickupAddress1" label="Pickup Address" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="deliveryAddress1" label="Delivery Address" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="commodity" label="Commodity" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="equipmentType" label="Equipment Type" />
          </div>
        </section>
      ) : null}
      <p className="bof-muted bof-small">
        <Link href="/load-request" className="bof-link-secondary">← New client request</Link>
      </p>
    </div>
  );
}

function EditField({
  request,
  onChange,
  k,
  label,
}: {
  request: ClientLoadRequest;
  onChange: (patch: Partial<ClientLoadRequest>) => void;
  k: keyof ClientLoadRequest;
  label: string;
}) {
  return (
    <div className="bof-load-intake-field">
      <label>{label}</label>
      <input value={String(request[k] ?? "")} onChange={(e) => onChange({ [k]: e.target.value } as Partial<ClientLoadRequest>)} />
    </div>
  );
}

