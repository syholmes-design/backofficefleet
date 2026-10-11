"use client";

import { useEffect, useState } from "react";

import { RecipientSignaturePad } from "@/components/dispatch/RecipientSignaturePad";
import { getErrorMessage, requestJson } from "@/lib/dispatch-workflow-ui";
import type { EpodView } from "@/lib/services/epod/epodAssembly";

type Bundle = { view: EpodView; connectionRequired: true };

function evidenceSrc(loadId: string, evidenceId: string | null) {
  if (!evidenceId) return null;
  return `/api/dispatch/load/${encodeURIComponent(loadId)}/delivery/evidence/${encodeURIComponent(evidenceId)}`;
}

async function fileToDataUrl(file: File) {
  const bytes = await file.arrayBuffer();
  const view = new Uint8Array(bytes);
  let binary = "";
  view.forEach((part) => {
    binary += String.fromCharCode(part);
  });
  return `data:${file.type};base64,${btoa(binary)}`;
}

export function LoadDeliveryScreen({ loadId }: { loadId: string }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [place, setPlace] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [facility, setFacility] = useState("");
  const [disposition, setDisposition] = useState("ACCEPTED");
  const [exceptions, setExceptions] = useState("");
  const [refusalReason, setRefusalReason] = useState("");
  const [statementAccepted, setStatementAccepted] = useState(false);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    const next = await requestJson<Bundle>(`/api/dispatch/load/${encodeURIComponent(loadId)}/delivery`);
    setBundle(next);
  }

  useEffect(() => {
    let cancelled = false;
    reload()
      .catch((error: unknown) => {
        if (!cancelled) setMessage(getErrorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [loadId]);

  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      await work();
      await reload();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const view = bundle?.view;
  const loadedSrc = evidenceSrc(loadId, view?.loadedTrailer.evidenceId ?? null);
  const emptySrc = evidenceSrc(loadId, view?.emptyTrailer.evidenceId ?? null);
  const signatureSrc = evidenceSrc(loadId, view?.acknowledgment?.evidenceId ?? null);

  return (
    <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery</h3>
      <p className="text-sm text-slate-300">A connection to BOF is required. Offline signing is not available. GPS evidence not connected. RFID evidence not connected. Local application storage is not production object storage.</p>
      {message ? <p className="text-sm text-amber-100">{message}</p> : null}
      {view ? (
        <>
          <dl className="grid gap-2 text-sm text-slate-200 md:grid-cols-2">
            <div>Load {view.loadNumber}</div>
            <div>Carrier {view.carrierName}</div>
            <div>Driver {view.driverName ?? "Unassigned"}</div>
            <div>Truck {view.truckNumber ?? "Unassigned"}</div>
            <div>Trailer {view.trailerNumber ?? "Unassigned"}</div>
            <div>Pickup {view.pickupFacility}</div>
            <div>Delivery {view.deliveryFacility}</div>
            <div>Pickup authorization {view.pickupAuthorizationId ?? "None stored"}</div>
            <div>Stage {view.stage}</div>
            <div>Operator verification {view.operatorVerification}</div>
            <div>Settlement hold {view.settlementHold ? "Held" : "No hold stored"}</div>
          </dl>
          <div className="grid gap-3 md:grid-cols-2">
            <figure className="rounded border border-slate-700 p-2">
              <figcaption className="text-xs uppercase text-slate-400">Loaded trailer</figcaption>
              {loadedSrc ? <img src={loadedSrc} alt="Loaded trailer" className="mt-2 max-h-48 w-full object-contain" /> : <p className="mt-2 text-sm text-amber-100">Loaded-trailer photograph is missing.</p>}
            </figure>
            <figure className="rounded border border-slate-700 p-2">
              <figcaption className="text-xs uppercase text-slate-400">Empty trailer</figcaption>
              {emptySrc ? <img src={emptySrc} alt="Empty trailer" className="mt-2 max-h-48 w-full object-contain" /> : <p className="mt-2 text-sm text-amber-100">Empty-trailer photograph is missing.</p>}
            </figure>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} className="rounded border border-slate-600 px-3 py-1.5 text-xs" onClick={() => run(() => requestJson(`/api/dispatch/load/${encodeURIComponent(loadId)}/delivery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ARRIVE", place }) }))}>Record arrival</button>
            <button type="button" disabled={busy} className="rounded border border-slate-600 px-3 py-1.5 text-xs" onClick={() => run(() => requestJson(`/api/dispatch/load/${encodeURIComponent(loadId)}/delivery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "START_UNLOADING", place: "" }) }))}>Start unloading</button>
            <button type="button" disabled={busy} className="rounded border border-slate-600 px-3 py-1.5 text-xs" onClick={() => run(() => requestJson(`/api/dispatch/load/${encodeURIComponent(loadId)}/delivery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "READY_FOR_ACKNOWLEDGMENT", place: "" }) }))}>Ready for recipient</button>
          </div>
          <label className="block text-xs text-slate-300">
            Arrival place, not a GPS fix
            <input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1" value={place} onChange={(event) => setPlace(event.target.value)} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-slate-300">
              Loaded-trailer photograph
              <input className="mt-1 block w-full text-xs" type="file" accept="image/png,image/jpeg" capture="environment" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                run(async () => requestJson(`/api/dispatch/load/${encodeURIComponent(loadId)}/delivery/photos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "LOADED_TRAILER", mimeType: file.type, image: await fileToDataUrl(file) }) }));
              }} />
            </label>
            <label className="text-xs text-slate-300">
              Empty-trailer photograph
              <input className="mt-1 block w-full text-xs" type="file" accept="image/png,image/jpeg" capture="environment" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                run(async () => requestJson(`/api/dispatch/load/${encodeURIComponent(loadId)}/delivery/photos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "EMPTY_TRAILER", mimeType: file.type, image: await fileToDataUrl(file) }) }));
              }} />
            </label>
          </div>
          <div className="space-y-2 rounded border border-slate-700 p-3">
            <p className="text-xs font-semibold uppercase text-slate-300">Recipient acknowledgment</p>
            <p className="text-[11px] text-slate-400">The signed-in driver is the session holder. The name below is the receiving representative. A self-declared title is not independently verified authority.</p>
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" placeholder="Position / title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" placeholder="Receiving facility" value={facility} onChange={(event) => setFacility(event.target.value)} />
            <select className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" value={disposition} onChange={(event) => setDisposition(event.target.value)}>
              <option value="ACCEPTED">Accepted</option>
              <option value="ACCEPTED_WITH_EXCEPTIONS">Accepted with exceptions</option>
              <option value="REFUSED">Refused</option>
            </select>
            <textarea className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" placeholder="Shortages, damage, or other exceptions" value={exceptions} onChange={(event) => setExceptions(event.target.value)} />
            <textarea className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" placeholder="Refusal reason" value={refusalReason} onChange={(event) => setRefusalReason(event.target.value)} />
            <label className="flex items-start gap-2 text-xs text-slate-200">
              <input type="checkbox" checked={statementAccepted} onChange={(event) => setStatementAccepted(event.target.checked)} />
              I represent the receiving facility named here and I am authorized to acknowledge this delivery.
            </label>
            <RecipientSignaturePad onChange={setSignature} />
            {signatureSrc ? <img src={signatureSrc} alt="Stored recipient signature" className="max-h-24 bg-white" /> : null}
            <button type="button" disabled={busy || !signature} className="rounded border border-teal-500 px-3 py-1.5 text-xs" onClick={() => run(() => requestJson(`/api/dispatch/load/${encodeURIComponent(loadId)}/delivery/acknowledgment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, title, facility, disposition, exceptions, refusalReason, statementAccepted, channel: "TABLET", signaturePng: signature }) }))}>Save recipient signature</button>
          </div>
          <div className="rounded border border-slate-700 p-3 text-sm text-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Generated electronic POD</p>
            <p className="mt-2">{view.gps.label}. {view.rfid.label}.</p>
            <p className="mt-1">Disposition {view.acknowledgment?.disposition ?? "Not acknowledged"}. Exceptions {view.acknowledgment?.exceptions || view.acknowledgment?.refusalReason || "None recorded"}.</p>
            <p className="mt-1">Generated artifact {view.generatedEvidenceId ?? "Not generated"}. Operator verification stays on the Proof tab and does not run when this POD is generated. A settlement hold is not released.</p>
            <button type="button" disabled={busy} className="mt-3 rounded border border-slate-500 px-3 py-1.5 text-xs" onClick={() => run(() => requestJson(`/api/dispatch/load/${encodeURIComponent(loadId)}/delivery/epod`, { method: "POST" }))}>Assemble electronic POD</button>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-400">Delivery record is loading.</p>
      )}
    </section>
  );
}
