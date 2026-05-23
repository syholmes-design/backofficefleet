/**
 * BOF Route Owner:
 * URL: /carriers/:carrierId
 * Type: DEMO
 * Primary component: CarrierDetailPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for carrier registry route-level MVP work.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCarrierById,
  getCarrierDispatchExplanation,
  getCarrierPacketSummary,
  getCarrierRegistry,
  getCarrierStatusTone,
  type CarrierInsurancePolicy,
  type CarrierPacketItem,
} from "@/lib/carrier-registry";
import {
  formatEvidenceVisibility,
  getCarrierPacketEvidence,
  type CarrierPacketEvidenceStatus,
} from "@/lib/carrier-packet-evidence";
import { getCarrierDispatchGate } from "@/lib/carrier-dispatch-gates";
import { getCarrierReloadFits } from "@/lib/carrier-reload-intelligence";

export const metadata = {
  title: "Carrier Profile | BOF",
  description: "Carrier packet readiness and dispatch eligibility detail",
};

type Props = { params: Promise<{ carrierId: string }> };

const toneClasses = {
  ready: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  review: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  watch: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  blocked: "border-red-400/40 bg-red-400/10 text-red-200",
};

const itemTone: Record<CarrierPacketItem["status"], string> = {
  ready: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  review: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  expiring: "border-orange-400/40 bg-orange-400/10 text-orange-200",
  blocked: "border-red-400/40 bg-red-400/10 text-red-200",
};

const insuranceTone: Record<CarrierInsurancePolicy["status"], string> = {
  current: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  renewal_watch: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  expired: "border-red-400/40 bg-red-400/10 text-red-200",
  missing: "border-red-400/40 bg-red-400/10 text-red-200",
};

export function generateStaticParams() {
  return getCarrierRegistry().map((carrier) => ({ carrierId: carrier.id }));
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${className}`}>{children}</span>;
}

function formatInsuranceStatus(status: CarrierInsurancePolicy["status"]) {
  return status.replace(/_/g, " ");
}

function evidenceTone(status: CarrierPacketEvidenceStatus) {
  if (status === "Blocked") return toneClasses.blocked;
  if (status === "Renewal Watch" || status === "Review Required" || status === "Pending") return toneClasses.review;
  return toneClasses.ready;
}

export default async function CarrierDetailPage({ params }: Props) {
  const { carrierId } = await params;
  const carrier = getCarrierById(carrierId);

  if (!carrier) {
    notFound();
  }

  const packet = getCarrierPacketSummary(carrier);
  const readinessTone = getCarrierStatusTone(carrier.readinessStatus);
  const evidenceRecords = getCarrierPacketEvidence(carrier.id);
  const gate = getCarrierDispatchGate(carrier);
  const reloadFits = getCarrierReloadFits(carrier.id);

  return (
    <div className="bof-page">
      <div className="mb-4">
        <Link href="/carriers" className="text-sm font-bold text-teal-300 hover:text-teal-200">
          Back to carrier registry
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-6 shadow-2xl shadow-black/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-300">{carrier.id}</p>
              <Pill className={toneClasses[readinessTone]}>{carrier.readinessStatus}</Pill>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">{carrier.dba}</h1>
            <p className="mt-2 text-lg text-slate-300">{carrier.legalName}</p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              {getCarrierDispatchExplanation(carrier)}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Operational reason</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{carrier.statusReason}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dispatch impact</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{carrier.dispatchImpact}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Packet consequence</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{carrier.packetConsequence}</p>
              </div>
              <div className="rounded-xl border border-teal-400/30 bg-teal-400/10 p-4 md:col-span-3">
                <p className="text-xs font-bold uppercase tracking-wide text-teal-200">Assignment simulation</p>
                <p className="mt-2 text-lg font-black text-white">{gate.assignmentSimulation}</p>
                <p className="mt-2 text-sm leading-6 text-teal-50">{gate.operationalRisk}</p>
              </div>
            </div>
          </div>

          <div className="grid min-w-64 grid-cols-2 gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <div>
              <p className="text-xs text-slate-500">Readiness score</p>
              <strong className="text-4xl text-white">{carrier.readinessScore}</strong>
            </div>
            <div>
              <p className="text-xs text-slate-500">Packet</p>
              <strong className="text-4xl text-white">{packet.percent}%</strong>
            </div>
            <div className="col-span-2 rounded-lg bg-slate-950/70 p-3">
              <p className="text-xs text-slate-500">Dispatch eligibility</p>
              <strong className="text-sm text-white">{gate.indicator}</strong>
              <p className="mt-1 text-xs text-slate-400">{carrier.dispatchEligibility}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Carrier identity">
        {[
          ["DOT", carrier.dotNumber],
          ["MC", carrier.mcNumber],
          ["Terminal", carrier.homeTerminal],
          ["BOF owner", carrier.managerOwner],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-sm text-slate-400">{label}</p>
            <strong className="mt-2 block text-lg text-white">{value}</strong>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Packet checklist</h2>
              <p className="text-sm text-slate-400">
                {packet.ready}/{packet.total} carrier controls ready. Blocking items prevent dispatch release.
              </p>
            </div>
            <Pill className={packet.blocked > 0 ? toneClasses.blocked : packet.expiring > 0 || packet.review > 0 ? toneClasses.review : toneClasses.ready}>
              {packet.percent}% complete
            </Pill>
          </div>

          <div className="mt-4 grid gap-3">
            {carrier.packetItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-black text-white">{item.label}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.timing}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.consequence}</p>
                    {item.dueDate && <p className="mt-1 text-xs text-slate-500">Due: {item.dueDate}</p>}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <Pill className={itemTone[item.status]}>{item.status}</Pill>
                    <span className="text-xs text-slate-500">Owner: {item.owner}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
            <h2 className="text-2xl font-black text-white">Authority summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Authority type</dt>
                <dd className="font-semibold text-white">{carrier.authority.authorityType}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Authority status</dt>
                <dd className="font-semibold text-white">{carrier.authority.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Safety rating</dt>
                <dd className="font-semibold text-white">{carrier.authority.safetyRating}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Last checked</dt>
                <dd className="font-semibold text-white">{carrier.authority.lastChecked}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-6 text-slate-300">{carrier.authority.notes}</p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
            <h2 className="text-2xl font-black text-white">Contact</h2>
            <p className="mt-3 font-bold text-white">{carrier.primaryContact.name}</p>
            <p className="text-sm text-slate-400">{carrier.primaryContact.role}</p>
            <p className="mt-3 text-sm text-slate-300">{carrier.primaryContact.phone}</p>
            <p className="text-sm text-slate-300">{carrier.primaryContact.email}</p>
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
        <h2 className="text-2xl font-black text-white">Insurance controls</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {carrier.insurance.map((policy) => (
            <div key={`${policy.type}-${policy.expirationDate}`} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-white">{policy.type}</h3>
                  <p className="mt-1 text-sm text-slate-400">{policy.insurer}</p>
                </div>
                <Pill className={insuranceTone[policy.status]}>{formatInsuranceStatus(policy.status)}</Pill>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Limit</dt>
                  <dd className="font-semibold text-white">{policy.limit}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Expires</dt>
                  <dd className="font-semibold text-white">{policy.expirationDate}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Certificate</dt>
                  <dd className="font-semibold text-white">{policy.certificateOnFile ? "On file" : "Missing"}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <h2 className="text-xl font-black text-white">Equipment</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {carrier.equipmentTypes.map((equipment) => (
              <span key={equipment} className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
                {equipment}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <h2 className="text-xl font-black text-white">Lanes</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {carrier.lanes.map((lane) => (
              <span key={lane} className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
                {lane}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <h2 className="text-xl font-black text-white">Reload intelligence bridge</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{carrier.backhaulReadyStatus}</p>
          <div className="mt-3 space-y-2">
            {carrier.preferredReloadLanes.map((lane) => (
              <p key={lane} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-200">
                {lane}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <h2 className="text-xl font-black text-white">Risk flags</h2>
          <div className="mt-3 space-y-2">
            {carrier.riskFlags.length > 0 ? (
              carrier.riskFlags.map((flag) => (
                <p key={flag} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-amber-100">
                  {flag}
                </p>
              ))
            ) : (
              <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">No active carrier packet flags.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Reload fit analysis</h2>
            <p className="mt-1 text-sm text-slate-400">
              BOF compares this carrier against reload opportunities using equipment, lane fit, packet gates,
              proof expectations, and finance release risk.
            </p>
          </div>
          <Pill className={toneClasses[gate.tone]}>{gate.indicator}</Pill>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {reloadFits.map((fit) => (
            <article key={fit.opportunity.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-wide text-teal-300">{fit.opportunity.id}</p>
                  <h3 className="mt-2 font-black text-white">{fit.opportunity.origin} to {fit.opportunity.destination}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {fit.opportunity.trailerType} · {fit.opportunity.deadheadMilesReduced} empty miles reduced · score {fit.opportunity.reloadScore}
                  </p>
                </div>
                <Pill className={toneClasses[fit.tone]}>{fit.label}</Pill>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{fit.reason}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <p className="rounded-lg bg-slate-950/70 px-3 py-2 text-xs leading-5 text-slate-300">{fit.opportunity.dispatchConsequence}</p>
                <p className="rounded-lg bg-slate-950/70 px-3 py-2 text-xs leading-5 text-slate-300">{fit.opportunity.financeConsequence}</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-400">Next: {fit.nextAction}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="carrier-loads" className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Carrier packet action links</h2>
            <p className="mt-1 text-sm text-slate-400">
              Dispatch, finance, and document teams use this packet before assigning freight or releasing payment.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
              <Link href={`/carriers/${carrier.id}/packet`} className="rounded-lg border border-teal-300/50 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
              Review packet
            </Link>
            <Link href="/dispatch" className="rounded-lg border border-teal-300/50 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
              Review dispatch eligibility
            </Link>
            <Link href="/settlements" className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-slate-800">
              Review settlement impact
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {carrier.recentLoads.length > 0 ? (
            carrier.recentLoads.map((loadId) => (
              <Link
                key={loadId}
                href={`/loads/${loadId}`}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-teal-400/60 hover:bg-slate-900"
              >
                <p className="font-mono text-sm font-black text-teal-300">{loadId}</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {loadId === "L011" ? "Finance / factoring packet tie-in" : "Recent dispatch packet"}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {loadId === "L011"
                    ? "Carrier readiness supports invoice, BOL, POD, proof packet, and factoring review."
                    : "Open the load record tied to this carrier readiness profile."}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
              No recent BOF demo loads are assigned to this carrier yet.
            </div>
          )}
        </div>

        {carrier.recentLoads.includes("L011") && (
          <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-200">L011 finance handoff</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50">
              {carrier.financeTieIn}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/loads/L011" className="rounded-lg border border-emerald-300/50 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10">
                Open L011 load file
              </Link>
              <Link href="/settlements" className="rounded-lg border border-emerald-300/50 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/10">
                Prepare customer release
              </Link>
            </div>
          </div>
        )}
      </section>

      {evidenceRecords.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Carrier packet evidence</h2>
              <p className="mt-1 text-sm text-slate-400">
                Static packet previews used by dispatch, finance, compliance, and customer release review.
              </p>
            </div>
            <Link href={`/carriers/${carrier.id}/packet`} className="rounded-lg border border-teal-300/50 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
              Review full packet
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {evidenceRecords.map((evidence) => (
              <Link
                key={evidence.id}
                href={`/carriers/${carrier.id}/packet/${evidence.id}`}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-teal-400/60 hover:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black text-white">{evidence.title}</h3>
                  <Pill className={evidenceTone(evidence.status)}>{evidence.status}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{evidence.packetRole}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {formatEvidenceVisibility(evidence.visibility)} - {evidence.expirationOrReview}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-teal-400/30 bg-teal-400/10 p-5">
        <h2 className="text-xl font-black text-white">BOF dispatch eligibility explanation</h2>
        <p className="mt-2 text-sm leading-6 text-teal-50">{getCarrierDispatchExplanation(carrier)}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-teal-300/25 bg-slate-950/40 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-200">Required action</p>
            <p className="mt-1 text-sm leading-6 text-teal-50">{gate.requiredNextAction}</p>
          </div>
          <div className="rounded-lg border border-teal-300/25 bg-slate-950/40 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-200">Customer consequence</p>
            <p className="mt-1 text-sm leading-6 text-teal-50">{gate.customerConsequence}</p>
          </div>
          <div className="rounded-lg border border-teal-300/25 bg-slate-950/40 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-200">Finance consequence</p>
            <p className="mt-1 text-sm leading-6 text-teal-50">{gate.financeConsequence}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dispatch" className="rounded-lg border border-teal-300/50 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
            Open dispatch
          </Link>
          <Link href={`/carriers/${carrier.id}/packet`} className="rounded-lg border border-teal-300/50 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
            Review packet
          </Link>
          <Link href="/documents" className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-slate-800">
            Open document cabinet
          </Link>
        </div>
      </section>
    </div>
  );
}
