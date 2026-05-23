/**
 * BOF Route Owner:
 * URL: /carriers/:carrierId/packet/:evidenceId
 * Type: DEMO
 * Primary component: CarrierPacketEvidencePage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Static carrier packet evidence preview. No live APIs, uploads, or PDF generation.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCarrierById } from "@/lib/carrier-registry";
import {
  formatEvidenceVisibility,
  getAllCarrierPacketEvidenceParams,
  getCarrierPacketEvidenceById,
} from "@/lib/carrier-packet-evidence";

export const metadata = {
  title: "Carrier Packet Evidence | BOF",
  description: "Static carrier packet evidence preview",
};

type Props = { params: Promise<{ carrierId: string; evidenceId: string }> };

const statusClass = "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";

export function generateStaticParams() {
  return getAllCarrierPacketEvidenceParams();
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${statusClass}`}>
      {children}
    </span>
  );
}

export default async function CarrierPacketEvidencePage({ params }: Props) {
  const { carrierId, evidenceId } = await params;
  const carrier = getCarrierById(carrierId);
  const evidence = getCarrierPacketEvidenceById(carrierId, evidenceId);

  if (!carrier || !evidence) {
    notFound();
  }

  return (
    <div className="bof-page">
      <div className="mb-4 flex flex-wrap gap-3">
        <Link href={`/carriers/${carrier.id}/packet`} className="text-sm font-bold text-teal-300 hover:text-teal-200">
          Back to packet
        </Link>
        <Link href={`/carriers/${carrier.id}`} className="text-sm font-bold text-slate-300 hover:text-white">
          Carrier profile
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-6 shadow-2xl shadow-black/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-300">{carrier.id} packet evidence</p>
              <Pill>{evidence.status}</Pill>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">{evidence.title}</h1>
            <p className="mt-3 text-lg text-slate-300">{carrier.legalName}</p>
            <p className="mt-5 max-w-4xl text-base leading-7 text-slate-300">{evidence.packetRole}</p>
          </div>
          <div className="rounded-xl border border-teal-400/30 bg-teal-400/10 p-5 text-sm text-teal-50 lg:max-w-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Packet visibility</p>
            <strong className="mt-2 block text-xl text-white">{formatEvidenceVisibility(evidence.visibility)}</strong>
            <p className="mt-3 leading-6">{evidence.customerSafeSummary}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Review / expiration", evidence.expirationOrReview],
          ["Reviewed", evidence.reviewDate],
          ["Dispatch relevance", evidence.dispatchRelevance],
          ["Finance relevance", evidence.financeRelevance],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-700 bg-white p-6 text-slate-950 shadow-2xl shadow-black/20">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-700">Delta Advanced Trucking, Inc.</p>
            <h2 className="mt-2 text-3xl font-black">{evidence.title}</h2>
            <p className="mt-2 text-sm text-slate-600">Static BOF carrier packet preview record</p>
          </div>

          <dl className="mt-5 grid gap-3 md:grid-cols-2">
            {evidence.fields.map((field) => (
              <div key={field.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{field.label}</dt>
                <dd className={`mt-1 font-semibold ${field.masked ? "font-mono tracking-wider text-slate-800" : "text-slate-950"}`}>
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Operational consequence if missing</p>
            <p className="mt-2 text-sm leading-6 text-slate-800">{evidence.consequenceIfMissing}</p>
          </div>
        </div>

        <aside className="space-y-4">
          {evidence.sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
              <h2 className="text-xl font-black text-white">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                {section.items.map((item) => (
                  <li key={item} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl border border-teal-400/30 bg-teal-400/10 p-5">
            <h2 className="text-xl font-black text-white">BOF packet control</h2>
            <p className="mt-2 text-sm leading-6 text-teal-50">
              This preview ties one carrier document to dispatch eligibility, customer release, and L011 finance readiness
              without exposing live integrations, uploads, or production credentials.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/dispatch" className="rounded-lg border border-teal-300/50 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
                Review dispatch eligibility
              </Link>
              <Link href="/settlements" className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-slate-800">
                Review finance handoff
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
