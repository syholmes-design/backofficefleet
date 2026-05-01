"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  getClientLoadRequests,
  setClientLoadRequests,
  type ClientLoadRequest,
  validateClientLoadRequestDraft,
} from "@/lib/client-load-requests";

function emptyRequest(): Partial<ClientLoadRequest> {
  return {
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    pickupFacilityName: "",
    pickupAddress1: "",
    pickupAddress2: "",
    pickupCity: "",
    pickupState: "",
    pickupZip: "",
    pickupDate: "",
    pickupTime: "",
    pickupInstructions: "",
    deliveryFacilityName: "",
    deliveryAddress1: "",
    deliveryAddress2: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryZip: "",
    deliveryDate: "",
    deliveryTime: "",
    deliveryInstructions: "",
    commodity: "",
    weight: undefined,
    palletCount: undefined,
    equipmentType: "",
    temperatureRequirement: "",
    hazmatFlag: false,
    highValueFlag: false,
    specialHandlingInstructions: "",
    poNumber: "",
    bolNumber: "",
    rateConfirmationNumber: "",
    quotedRate: undefined,
    paymentTerms: "",
    sealRequired: false,
    sealNumber: "",
    cargoPhotoRequired: false,
    insuranceRequired: false,
    cargoInsuranceMinimum: "",
    specialInsuranceNotes: "",
  };
}

export function ClientLoadRequestPageClient() {
  const { data, setFullData } = useBofDemoData();
  const [draft, setDraft] = useState<Partial<ClientLoadRequest>>(() => emptyRequest());
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const review = useMemo(() => validateClientLoadRequestDraft(draft), [draft]);

  const submit = () => {
    setSuccess(null);
    setError(null);
    if (review.missingRequiredFields.length > 0) {
      setError(`Missing required fields: ${review.missingRequiredFields.join(", ")}`);
      return;
    }
    const request: ClientLoadRequest = {
      requestId: `CLR-${Date.now()}`,
      sourceType: "client_manual",
      submittedAt: new Date().toISOString(),
      status: review.warnings.length > 0 ? "needs_review" : "submitted",
      companyName: String(draft.companyName || ""),
      contactName: String(draft.contactName || ""),
      contactEmail: String(draft.contactEmail || ""),
      contactPhone: String(draft.contactPhone || ""),
      pickupFacilityName: String(draft.pickupFacilityName || ""),
      pickupAddress1: String(draft.pickupAddress1 || ""),
      pickupAddress2: String(draft.pickupAddress2 || ""),
      pickupCity: String(draft.pickupCity || ""),
      pickupState: String(draft.pickupState || ""),
      pickupZip: String(draft.pickupZip || ""),
      pickupDate: String(draft.pickupDate || ""),
      pickupTime: String(draft.pickupTime || ""),
      pickupInstructions: String(draft.pickupInstructions || ""),
      deliveryFacilityName: String(draft.deliveryFacilityName || ""),
      deliveryAddress1: String(draft.deliveryAddress1 || ""),
      deliveryAddress2: String(draft.deliveryAddress2 || ""),
      deliveryCity: String(draft.deliveryCity || ""),
      deliveryState: String(draft.deliveryState || ""),
      deliveryZip: String(draft.deliveryZip || ""),
      deliveryDate: String(draft.deliveryDate || ""),
      deliveryTime: String(draft.deliveryTime || ""),
      deliveryInstructions: String(draft.deliveryInstructions || ""),
      commodity: String(draft.commodity || ""),
      weight: Number(draft.weight || 0) || undefined,
      palletCount: Number(draft.palletCount || 0) || undefined,
      equipmentType: String(draft.equipmentType || ""),
      temperatureRequirement: String(draft.temperatureRequirement || ""),
      hazmatFlag: Boolean(draft.hazmatFlag),
      highValueFlag: Boolean(draft.highValueFlag),
      specialHandlingInstructions: String(draft.specialHandlingInstructions || ""),
      poNumber: String(draft.poNumber || ""),
      bolNumber: String(draft.bolNumber || ""),
      rateConfirmationNumber: String(draft.rateConfirmationNumber || ""),
      quotedRate: Number(draft.quotedRate || 0) || undefined,
      paymentTerms: String(draft.paymentTerms || ""),
      sealRequired: Boolean(draft.sealRequired),
      sealNumber: String(draft.sealNumber || ""),
      cargoPhotoRequired: Boolean(draft.cargoPhotoRequired),
      insuranceRequired: Boolean(draft.insuranceRequired),
      cargoInsuranceMinimum: String(draft.cargoInsuranceMinimum || ""),
      specialInsuranceNotes: String(draft.specialInsuranceNotes || ""),
      warnings: review.warnings,
      missingRequiredFields: review.missingRequiredFields,
    };
    const requests = getClientLoadRequests(data);
    const next = structuredClone(data);
    setClientLoadRequests(next, [request, ...requests]);
    setFullData(next);
    setDraft(emptyRequest());
    setSuccess("Load request submitted. BOF will review and prepare the dispatch packet.");
  };

  return (
    <div className="bof-page">
      <h1 className="bof-title">Request a Load</h1>
      <p className="bof-lead">
        Submit pickup, delivery, freight, and documentation details. BOF will review and prepare the dispatch packet.
      </p>
      <p className="bof-muted bof-small">Demo intake request - not a live shipment tender.</p>

      {error ? <div className="bof-load-intake-alert bof-load-intake-alert--block">{error}</div> : null}
      {success ? <div className="bof-load-intake-alert bof-load-intake-alert--ok">{success}</div> : null}

      <section className="bof-load-intake-card">
        <h2>Contact / Company</h2>
        <Field draft={draft} setDraft={setDraft} k="companyName" label="Company Name" />
        <Field draft={draft} setDraft={setDraft} k="contactName" label="Contact Name" />
        <Field draft={draft} setDraft={setDraft} k="contactEmail" label="Contact Email" />
        <Field draft={draft} setDraft={setDraft} k="contactPhone" label="Contact Phone" />
      </section>

      <section className="bof-load-intake-card">
        <h2>Pickup</h2>
        <Field draft={draft} setDraft={setDraft} k="pickupFacilityName" label="Pickup Facility" />
        <Field draft={draft} setDraft={setDraft} k="pickupAddress1" label="Pickup Address 1" />
        <Field draft={draft} setDraft={setDraft} k="pickupAddress2" label="Pickup Address 2" />
        <Field draft={draft} setDraft={setDraft} k="pickupCity" label="Pickup City" />
        <Field draft={draft} setDraft={setDraft} k="pickupState" label="Pickup State" />
        <Field draft={draft} setDraft={setDraft} k="pickupZip" label="Pickup ZIP" />
        <Field draft={draft} setDraft={setDraft} k="pickupDate" label="Pickup Date" type="date" />
        <Field draft={draft} setDraft={setDraft} k="pickupTime" label="Pickup Time" type="time" />
        <Field draft={draft} setDraft={setDraft} k="pickupInstructions" label="Pickup Instructions" />
      </section>

      <section className="bof-load-intake-card">
        <h2>Delivery</h2>
        <Field draft={draft} setDraft={setDraft} k="deliveryFacilityName" label="Delivery Facility" />
        <Field draft={draft} setDraft={setDraft} k="deliveryAddress1" label="Delivery Address 1" />
        <Field draft={draft} setDraft={setDraft} k="deliveryAddress2" label="Delivery Address 2" />
        <Field draft={draft} setDraft={setDraft} k="deliveryCity" label="Delivery City" />
        <Field draft={draft} setDraft={setDraft} k="deliveryState" label="Delivery State" />
        <Field draft={draft} setDraft={setDraft} k="deliveryZip" label="Delivery ZIP" />
        <Field draft={draft} setDraft={setDraft} k="deliveryDate" label="Delivery Date" type="date" />
        <Field draft={draft} setDraft={setDraft} k="deliveryTime" label="Delivery Time" type="time" />
        <Field draft={draft} setDraft={setDraft} k="deliveryInstructions" label="Delivery Instructions" />
      </section>

      <section className="bof-load-intake-card">
        <h2>Freight / References / Compliance</h2>
        <Field draft={draft} setDraft={setDraft} k="commodity" label="Commodity" />
        <Field draft={draft} setDraft={setDraft} k="weight" label="Weight" type="number" />
        <Field draft={draft} setDraft={setDraft} k="palletCount" label="Pallet Count" type="number" />
        <Field draft={draft} setDraft={setDraft} k="equipmentType" label="Equipment Type" />
        <Field draft={draft} setDraft={setDraft} k="temperatureRequirement" label="Temperature Requirement" />
        <ToggleField draft={draft} setDraft={setDraft} k="hazmatFlag" label="Hazmat Flag" />
        <ToggleField draft={draft} setDraft={setDraft} k="highValueFlag" label="High Value Flag" />
        <Field draft={draft} setDraft={setDraft} k="specialHandlingInstructions" label="Special Handling" />
        <Field draft={draft} setDraft={setDraft} k="poNumber" label="PO Number" />
        <Field draft={draft} setDraft={setDraft} k="bolNumber" label="BOL Number" />
        <Field draft={draft} setDraft={setDraft} k="rateConfirmationNumber" label="Rate Confirmation Number" />
        <Field draft={draft} setDraft={setDraft} k="quotedRate" label="Quoted Rate" type="number" />
        <Field draft={draft} setDraft={setDraft} k="paymentTerms" label="Payment Terms" />
        <ToggleField draft={draft} setDraft={setDraft} k="sealRequired" label="Seal Required" />
        <Field draft={draft} setDraft={setDraft} k="sealNumber" label="Seal Number" />
        <ToggleField draft={draft} setDraft={setDraft} k="cargoPhotoRequired" label="Cargo Photo Required" />
        <ToggleField draft={draft} setDraft={setDraft} k="insuranceRequired" label="Insurance Required" />
        <Field draft={draft} setDraft={setDraft} k="cargoInsuranceMinimum" label="Cargo Insurance Minimum" />
        <Field draft={draft} setDraft={setDraft} k="specialInsuranceNotes" label="Special Insurance Notes" />
      </section>

      {review.warnings.length > 0 ? (
        <section className="bof-load-intake-card">
          <h2>Warnings</h2>
          <ul className="bof-cc-change-list">
            {review.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="bof-load-intake-toolbar">
        <button type="button" className="bof-load-intake-btn bof-load-intake-btn--primary" onClick={submit}>
          Submit Load Request
        </button>
        <Link href="/load-requests" className="bof-link-secondary">
          Internal review queue →
        </Link>
      </div>
    </div>
  );
}

function ToggleField({
  draft,
  setDraft,
  k,
  label,
}: {
  draft: Partial<ClientLoadRequest>;
  setDraft: React.Dispatch<React.SetStateAction<Partial<ClientLoadRequest>>>;
  k: keyof ClientLoadRequest;
  label: string;
}) {
  return (
    <div className="bof-load-intake-field">
      <label>{label}</label>
      <input
        type="checkbox"
        checked={Boolean(draft[k])}
        onChange={(e) => setDraft((s) => ({ ...s, [k]: e.target.checked }))}
      />
    </div>
  );
}

function Field({
  draft,
  setDraft,
  k,
  label,
  type = "text",
}: {
  draft: Partial<ClientLoadRequest>;
  setDraft: React.Dispatch<React.SetStateAction<Partial<ClientLoadRequest>>>;
  k: keyof ClientLoadRequest;
  label: string;
  type?: string;
}) {
  return (
    <div className="bof-load-intake-field">
      <label>{label}</label>
      <input
        type={type}
        value={String(draft[k] ?? "")}
        onChange={(e) => setDraft((s) => ({ ...s, [k]: type === "number" ? Number(e.target.value || 0) || "" : e.target.value }))}
      />
    </div>
  );
}

