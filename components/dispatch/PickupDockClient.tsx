"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, getErrorMessage, requestJson } from "@/lib/dispatch-workflow-ui";

type DockView = {
  authorization: { id: string; status: string; expiresAt: string; physicalIdentityClass: string; physicalEquipmentClass: string };
  shipment: { loadId: string; customerName: string; origin: string; destination: string; carrierName: string };
  authorized: { driverDisplay: string; tractorUnitNumber: string; trailerUnitNumber: string | null };
  physical: {
    disposition: string;
    dimensions: { driver: string; tractor: string; trailer: string; load: string; authorization: string };
    identityClass: string;
    identityPhysicalClass: string;
    equipmentPhysicalClass: string;
    reason: string;
    evidenceReference: string | null;
  } | null;
  physicalVerificationNote: string;
};

export function PickupDockClient() {
  const [authorizationId, setAuthorizationId] = useState("");
  const [token, setToken] = useState("");
  const [arrivingDriverId, setArrivingDriverId] = useState("");
  const [arrivingTractorUnitNumber, setArrivingTractorUnitNumber] = useState("");
  const [arrivingTrailerUnitNumber, setArrivingTrailerUnitNumber] = useState("");
  const [arrivingVin, setArrivingVin] = useState("");
  const [arrivingQr, setArrivingQr] = useState("");
  const [stopReason, setStopReason] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [view, setView] = useState<DockView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadDock() {
    setBusy(true);
    setError(null);
    try {
      const next = await requestJson<DockView>(
        `/api/dispatch/pickup-authorization/${encodeURIComponent(authorizationId)}/dock`,
      );
      setView(next);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function reconcile(intendedDisposition: "RELEASE" | "STOP") {
    setBusy(true);
    setError(null);
    try {
      const result = await requestJson<{ physical: DockView["physical"] }>(
        `/api/dispatch/pickup-authorization/${encodeURIComponent(authorizationId)}/physical-reconcile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            method: arrivingQr.trim() ? "QR_BARCODE" : "SHIPPER_DOCK",
            intendedDisposition,
            stopReason: intendedDisposition === "STOP" ? stopReason : null,
            evidenceReference: evidenceReference || null,
            arrivingAuthorizationId: authorizationId,
            arrivingDriverId: arrivingDriverId || null,
            arrivingTractorUnitNumber: arrivingTractorUnitNumber || null,
            arrivingTrailerUnitNumber: arrivingTrailerUnitNumber || null,
            arrivingVin: arrivingVin || null,
            arrivingQr: arrivingQr || null,
          }),
        },
      );
      setView((current) => (current ? { ...current, physical: result.physical } : current));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      if (nextError instanceof ApiError && nextError.body && typeof nextError.body === "object") {
        const body = nextError.body as { physical?: DockView["physical"] };
        if (body.physical) {
          setView((current) => (current ? { ...current, physical: body.physical ?? null } : current));
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="rounded-xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Secure Pickup · Phase 2</p>
        <h1 className="mt-2 text-3xl font-black text-white">Shipper dock verification</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Compare arriving driver and equipment identifiers to the Phase 1 pickup authorization. Matching records is
          not physical identity verification. Driver&apos;s license, photo, liveness, GPS, and telematics remain
          unverified until a real provider is connected.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Phase 1 desk:{" "}
          <Link className="text-teal-200 underline" href="/dispatch/pickup">
            /dispatch/pickup
          </Link>
          {" · "}
          Phase 2 dock:{" "}
          <Link className="text-teal-200 underline" href="/dispatch/pickup/dock">
            /dispatch/pickup/dock
          </Link>
        </p>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="dock-auth-id">
          Pickup authorization
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="dock-auth-id"
            className="min-w-[16rem] flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={authorizationId}
            onChange={(event) => setAuthorizationId(event.target.value)}
          />
          <button
            type="button"
            disabled={busy || !authorizationId.trim()}
            onClick={() => void loadDock()}
            className="rounded border border-teal-500/50 px-3 py-2 text-sm text-teal-100"
          >
            Load shipment
          </button>
        </div>
        <label className="mt-4 block text-xs uppercase tracking-wide text-slate-500" htmlFor="dock-token">
          Authorization credential
        </label>
        <input
          id="dock-token"
          className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </section>

      {view ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-500">Shipment</p>
          <p className="mt-2 font-semibold text-white">{view.shipment.customerName}</p>
          <p>
            {view.shipment.origin} → {view.shipment.destination}
          </p>
          <p className="text-slate-400">Carrier: {view.shipment.carrierName}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Authorized assignment</p>
          <p className="mt-1">Driver: {view.authorized.driverDisplay}</p>
          <p>Tractor: {view.authorized.tractorUnitNumber}</p>
          <p>Trailer: {view.authorized.trailerUnitNumber || "none"}</p>
          <p className="mt-2 text-xs text-slate-500">{view.physicalVerificationNote}</p>
        </section>
      ) : null}

      <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-5 sm:grid-cols-2">
        <label className="text-xs uppercase tracking-wide text-slate-500">
          Arriving driver record
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={arrivingDriverId}
            onChange={(event) => setArrivingDriverId(event.target.value)}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500">
          Arriving tractor unit
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={arrivingTractorUnitNumber}
            onChange={(event) => setArrivingTractorUnitNumber(event.target.value)}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500">
          Arriving trailer unit
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={arrivingTrailerUnitNumber}
            onChange={(event) => setArrivingTrailerUnitNumber(event.target.value)}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500">
          VIN (optional scan)
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={arrivingVin}
            onChange={(event) => setArrivingVin(event.target.value)}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 sm:col-span-2">
          QR / barcode
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={arrivingQr}
            onChange={(event) => setArrivingQr(event.target.value)}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 sm:col-span-2">
          Evidence reference (optional)
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={evidenceReference}
            onChange={(event) => setEvidenceReference(event.target.value)}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 sm:col-span-2">
          Stop reason
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={stopReason}
            onChange={(event) => setStopReason(event.target.value)}
          />
        </label>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !authorizationId.trim() || !token.trim()}
          onClick={() => void reconcile("RELEASE")}
          className="rounded border border-emerald-500/50 px-3 py-2 text-sm text-emerald-100"
        >
          Release
        </button>
        <button
          type="button"
          disabled={busy || !authorizationId.trim() || !token.trim()}
          onClick={() => void reconcile("STOP")}
          className="rounded border border-rose-500/50 px-3 py-2 text-sm text-rose-100"
        >
          Stop
        </button>
      </div>

      {view?.physical ? (
        <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-500">Phase 2 disposition</p>
          <p className="mt-2 text-2xl font-black text-white">{view.physical.disposition}</p>
          <ul className="mt-3 space-y-1 text-xs">
            <li>Driver arrival: {view.physical.dimensions.driver}</li>
            <li>Tractor arrival: {view.physical.dimensions.tractor}</li>
            <li>Trailer arrival: {view.physical.dimensions.trailer}</li>
            <li>Load arrival: {view.physical.dimensions.load}</li>
            <li>Authorization: {view.physical.dimensions.authorization}</li>
            <li>Identity class: {view.physical.identityClass}</li>
            <li>Physical identity: {view.physical.identityPhysicalClass}</li>
            <li>Physical equipment: {view.physical.equipmentPhysicalClass}</li>
          </ul>
          <p className="mt-3 text-slate-400">{view.physical.reason}</p>
        </section>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
