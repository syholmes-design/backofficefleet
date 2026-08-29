import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCarrierById,
  getCarrierPacketSummary,
  getCarrierStatusTone,
} from "@/lib/carrier-registry";
import { getCarrierDispatchGate } from "@/lib/carrier-dispatch-gates";
import { getCarrierPacketEvidence } from "@/lib/carrier-packet-evidence";
import { getCarrierReloadFits } from "@/lib/carrier-reload-intelligence";

type Props = {
  params: Promise<{ id: string; subpath?: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const carrier = getCarrierById(id);
  if (!carrier) return { title: "Carrier Not Found | BOF" };
  return {
    title: `${carrier.dba} (${carrier.id}) | Carrier Registry | BOF`,
    description: `Carrier packet readiness, authority, insurance, and dispatch eligibility for ${carrier.legalName}.`,
  };
}

const toneClasses = {
  ready: "border-emerald-300 bg-emerald-100 text-emerald-800",
  review: "border-amber-300 bg-amber-100 text-amber-800",
  watch: "border-sky-300 bg-sky-100 text-sky-800",
  blocked: "border-red-300 bg-red-100 text-red-800",
};

export default async function CarrierDetailPage({ params }: Props) {
  const { id, subpath } = await params;
  const carrier = getCarrierById(id);

  if (!carrier) {
    notFound();
  }

  const packet = getCarrierPacketSummary(carrier);
  const tone = getCarrierStatusTone(carrier.readinessStatus);
  const gate = getCarrierDispatchGate(carrier);
  const evidenceList = getCarrierPacketEvidence(carrier.id);
  const reloadFits = getCarrierReloadFits(carrier.id);
  const activeSubpath = subpath ? subpath.join("/") : "";

  return (
    <div className="bof-page bg-slate-50 text-slate-900 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
        <Link href="/carriers" className="font-semibold text-slate-700 hover:text-slate-950 hover:underline">
          Carrier Registry
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-bold text-slate-950">{carrier.dba} ({carrier.id})</span>
        {activeSubpath ? (
          <>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 capitalize">{activeSubpath.replace(/\//g, " / ")}</span>
          </>
        ) : null}
      </nav>

      {/* Carrier Header / Hero Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">{carrier.dba}</h1>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${toneClasses[tone]}`}>
                {carrier.readinessStatus}
              </span>
            </div>
            <p className="mt-1 text-base text-slate-600">{carrier.legalName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-700">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono font-medium text-slate-800">
                {carrier.dotNumber}
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono font-medium text-slate-800">
                {carrier.mcNumber}
              </span>
              <span>Terminal: <strong className="text-slate-950">{carrier.homeTerminal}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center min-w-32 shadow-sm">
              <span className="text-3xl font-extrabold text-slate-950">{carrier.readinessScore}</span>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Readiness Score</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center min-w-36 shadow-sm">
              <span className="text-xl font-bold text-slate-950">{gate.indicator}</span>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Dispatch Eligibility</span>
            </div>
          </div>
        </div>

        {/* Primary Contact & Manager Owner */}
        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Contact</span>
            <p className="mt-1 text-sm font-semibold text-slate-950">{carrier.primaryContact.name}</p>
            <p className="text-xs text-slate-600">{carrier.primaryContact.role}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Channels</span>
            <p className="mt-1 text-sm font-medium text-slate-900">{carrier.primaryContact.phone}</p>
            <p className="text-xs text-slate-600 truncate">{carrier.primaryContact.email}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">BOF Packet Owner</span>
            <p className="mt-1 text-sm font-semibold text-slate-950">{carrier.managerOwner}</p>
            <p className="text-xs text-slate-600">Operations Lead</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Equipment & Lanes</span>
            <p className="mt-1 text-sm font-medium text-slate-900">{carrier.equipmentTypes.join(", ")}</p>
            <p className="text-xs text-slate-600">{carrier.lanes.slice(0, 2).join(" · ")}</p>
          </div>
        </div>
      </section>

      {/* Dispatch Gate & Operational Risk Banner */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Dispatch Gate & Operational Risk</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Operational Risk Assessment</span>
            <p className="mt-2 text-sm leading-6 text-slate-800">{gate.operationalRisk}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Required Next Action</span>
            <p className="mt-2 text-sm leading-6 text-slate-800 font-semibold">{gate.requiredNextAction}</p>
          </div>
        </div>
      </section>

      {/* Packet Controls & Compliance Items */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Carrier Packet Controls ({packet.ready}/{packet.total} Ready)</h2>
            <p className="text-sm text-slate-600">Verification status across authority, insurance, tax, and agreement controls.</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-950">{packet.percent}%</span>
            <span className="block text-xs text-slate-500">Complete</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {carrier.packetItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-950">{item.label}</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  item.status === "ready" ? "border-emerald-300 bg-emerald-100 text-emerald-800" :
                  item.status === "review" ? "border-amber-300 bg-amber-100 text-amber-800" :
                  item.status === "expiring" ? "border-sky-300 bg-sky-100 text-sky-800" :
                  "border-red-300 bg-red-100 text-red-800"
                }`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-5">{item.detail}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Owner: {item.owner}</span>
                <span>{item.timing}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Insurance Policies & Authority */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950 mb-4">Insurance Policies</h2>
          <div className="space-y-3">
            {carrier.insurance.map((policy) => (
              <div key={policy.type} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-950">{policy.type}</span>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    policy.status === "current" ? "border-emerald-300 bg-emerald-100 text-emerald-800" :
                    policy.status === "renewal_watch" ? "border-amber-300 bg-amber-100 text-amber-800" :
                    "border-red-300 bg-red-100 text-red-800"
                  }`}>
                    {policy.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                  <div>Insurer: <strong className="text-slate-900">{policy.insurer}</strong></div>
                  <div>Limit: <strong className="text-slate-900">{policy.limit}</strong></div>
                  <div>Expires: <strong className="text-slate-900">{policy.expirationDate}</strong></div>
                  <div>Certificate: <strong className="text-slate-900">{policy.certificateOnFile ? "On file" : "Missing"}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950 mb-4">Authority & Safety Status</h2>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-950">{carrier.authority.authorityType}</span>
              <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                {carrier.authority.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">Safety Rating: <strong className="text-slate-900">{carrier.authority.safetyRating}</strong> · Last checked: {carrier.authority.lastChecked}</p>
            <p className="mt-2 text-xs text-slate-700 leading-5">{carrier.authority.notes}</p>
          </div>

          <h3 className="text-base font-bold text-slate-950 mb-2">Reload Qualified Regions</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {carrier.reloadQualifiedRegions.map((region) => (
              <span key={region} className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                {region}
              </span>
            ))}
          </div>

          {reloadFits.length > 0 ? (
            <div>
              <h3 className="text-base font-bold text-slate-950 mb-2">Available Reload Matches</h3>
              <div className="space-y-2">
                {reloadFits.map((fit) => (
                  <div key={fit.opportunity.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                    <div>
                      <span className="font-bold text-slate-950">{fit.opportunity.origin} → {fit.opportunity.destination}</span>
                      <span className="text-slate-500 ml-2">({fit.opportunity.trailerType})</span>
                    </div>
                    <span className="font-bold text-teal-800">{fit.opportunity.reloadScore}% Match</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Packet Evidence Files */}
      {evidenceList.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950 mb-4">Packet Evidence Files ({evidenceList.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {evidenceList.map((ev) => (
              <div key={ev.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-950">{ev.title}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{ev.packetRole}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{ev.customerSafeSummary}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">{ev.expirationOrReview}</span>
                  <span className="text-slate-500 font-medium">{ev.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}