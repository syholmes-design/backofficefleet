"use client";

import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildPretripTabletModel } from "@/lib/pretrip-tablet";
import { getLoadProofItems } from "@/lib/load-proof";
import { DemoBackButton } from "@/components/navigation/DemoBackButton";

export function RuntimeLoadDetailFallback({ loadId }: { loadId: string }) {
  const { data } = useBofDemoData();
  const rawLoad = data.loads.find((l) => l.id === loadId);

  if (!rawLoad) {
    return (
      <div className="bof-page bg-slate-50 text-slate-900 min-h-screen p-6">
        <h1 className="text-2xl font-bold text-slate-950">Load not found</h1>
        <p className="mt-2 text-sm text-slate-600">This load is not present in seeded data or the current demo session.</p>
        <p className="mt-4">
          <Link href="/loads" className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Back to loads
          </Link>
        </p>
      </div>
    );
  }

  const pretripModel = buildPretripTabletModel(data, rawLoad.id);
  const proofItems = getLoadProofItems(data, rawLoad.id);

  const load = rawLoad as typeof rawLoad & {
    customerName?: string;
    brokerName?: string;
    commodity?: string;
    weight?: number;
    trailerNumber?: string;
    rateConfirmationNumber?: string;
    bolNumber?: string;
    pickupSeal?: string;
    deliverySeal?: string;
    settlementHold?: boolean;
    settlementHoldReason?: string;
    lumperAmount?: number;
    fuelSurcharge?: number;
  };

  return (
    <div className="bof-page bg-slate-50 text-slate-900 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <DemoBackButton fallbackHref="/loads" />
      </div>

      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
        <Link href="/loads" className="font-semibold text-slate-700 hover:text-slate-950 hover:underline">
          Loads / Dispatch
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-bold text-slate-950">Load {load.number || load.id}</span>
      </nav>

      {/* Hero Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Load {load.id}</h1>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                load.status === "Delivered" ? "border-emerald-300 bg-emerald-100 text-emerald-800" :
                load.status === "En Route" ? "border-sky-300 bg-sky-100 text-sky-800" :
                "border-amber-300 bg-amber-100 text-amber-800"
              }`}>
                {load.status}
              </span>
              {pretripModel ? (
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  pretripModel.overall === "READY" ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-rose-300 bg-rose-100 text-rose-800"
                }`}>
                  Pre-trip: {pretripModel.overall}
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-lg font-semibold text-slate-800">
              {load.origin} → {load.destination}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span>Customer: <strong className="text-slate-950">{load.customerName || "Peachtree Foods"}</strong></span>
              {load.brokerName ? <span>Broker: <strong className="text-slate-950">{load.brokerName}</strong></span> : null}
              {load.commodity ? <span>Commodity: <strong className="text-slate-950">{load.commodity}</strong></span> : null}
              {load.weight ? <span>Weight: <strong className="text-slate-950">{load.weight.toLocaleString()} lbs</strong></span> : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/pretrip/${load.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900 transition hover:bg-teal-100"
            >
              Pre-trip tablet
            </Link>
            <Link
              href={`/trip-release/${load.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
            >
              Trip release
            </Link>
          </div>
        </div>

        {/* Assignments Bar */}
        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Driver</span>
            <p className="mt-1 text-base font-bold text-slate-950">
              {pretripModel?.driverName || load.driverId}
            </p>
            <Link href={`/drivers/${load.driverId}`} className="mt-1 inline-block text-xs font-semibold text-teal-800 hover:underline">
              View driver profile ({load.driverId}) →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Power Unit</span>
            <p className="mt-1 text-base font-bold text-slate-950">
              {pretripModel?.assetId || load.assetId || "T-102"}
            </p>
            <Link href={`/maintenance/${pretripModel?.assetId || load.assetId || "T-102"}`} className="mt-1 inline-block text-xs font-semibold text-teal-800 hover:underline">
              View truck status →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Trailer & Seals</span>
            <p className="mt-1 text-base font-bold text-slate-950">
              {load.trailerNumber || "TRL-2854"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Pickup Seal: <strong className="font-mono text-slate-900">{load.pickupSeal || "SEAL-83921"}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference Numbers</span>
            <p className="mt-1 text-xs font-mono font-medium text-slate-900">
              Rate Con: {load.rateConfirmationNumber || "RC-501-204"}
            </p>
            <p className="text-xs font-mono font-medium text-slate-900">
              BOL: {load.bolNumber || "BOL-501-9935"}
            </p>
          </div>
        </div>
      </section>

      {/* Pre-Trip Report Summary Section */}
      {pretripModel ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Pre-Trip Report Inspection Summary</h2>
              <p className="text-sm text-slate-600">Operational inspection controls across documents, driver, vehicle, and route conditions.</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              pretripModel.overall === "READY" ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-rose-300 bg-rose-100 text-rose-800"
            }`}>
              {pretripModel.overall}
            </span>
          </div>

          {pretripModel.blockReasons.length > 0 ? (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h3 className="text-sm font-bold text-rose-950">Pre-Trip Inspection Block Reasons:</h3>
              <ul className="mt-2 list-disc list-inside space-y-1 text-xs font-medium text-rose-900">
                {pretripModel.blockReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pretripModel.sections.map((section) => (
              <div key={section.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800">
                    {section.letter}
                  </span>
                  <h3 className="text-sm font-bold text-slate-950">{section.title}</h3>
                </div>
                <div className="space-y-2">
                  {section.lines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                      <span className="font-semibold text-slate-900">{line.label}</span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        line.status === "OK" ? "border-emerald-300 bg-emerald-100 text-emerald-800" :
                        line.status === "Warning" ? "border-amber-300 bg-amber-100 text-amber-800" :
                        "border-rose-300 bg-rose-100 text-rose-800"
                      }`}>
                        {line.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Proof & Evidence Artifacts Section */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950 mb-4">Operational Proof & Evidence Items</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {proofItems.map((p) => (
            <div key={p.type} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.type}</span>
              <p className="mt-1 text-sm font-bold text-slate-950">{p.status}</p>
              {p.riskNote || p.notes || p.rfAction ? (
                <p className="mt-1 text-xs text-slate-600">{p.riskNote || p.notes || p.rfAction}</p>
              ) : null}
              {p.fileUrl || p.previewUrl ? (
                <Link href={p.fileUrl || p.previewUrl || "#"} className="mt-3 inline-block text-xs font-semibold text-teal-800 hover:underline">
                  {p.rfAction || "View proof"} →
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

