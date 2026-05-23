/**
 * BOF Route Owner:
 * URL: /carriers/:carrierId/packet
 * Type: DEMO
 * Primary component: CarrierPacketPreviewPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Customer-safe carrier packet preview. No live APIs or PDF generation.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCarrierById,
  getCarrierDispatchExplanation,
  getCarrierPacketSummary,
  getCarrierRegistry,
  getCarrierStatusTone,
  type CarrierPacketItem,
} from "@/lib/carrier-registry";

export const metadata = {
  title: "Carrier Packet Preview | BOF",
  description: "Customer-safe carrier packet readiness preview",
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

const customerSafeDocs = [
  {
    title: "W-9",
    note: "Included in BOF packet controls; sensitive tax identifiers are hidden from the customer-safe view.",
    itemId: "w9",
  },
  {
    title: "Certificate of Insurance",
    note: "Auto and cargo policy status, limits, insurer, and expiration are visible for readiness review.",
    itemId: "coi",
  },
  {
    title: "Operating authority",
    note: "Authority status, authority type, safety rating, and last BOF check are visible.",
    itemId: "authority",
  },
  {
    title: "Broker/carrier agreement",
    note: "Agreement presence is shown; confidential commercial terms stay internal.",
    itemId: "agreement",
  },
  {
    title: "Safety/compliance profile",
    note: "Safety rating, authority notes, risk flags, and dispatch readiness are summarized.",
    itemId: "authority",
  },
  {
    title: "Equipment and lane qualifications",
    note: "Equipment types and approved operating lanes are shown for load-fit review.",
    itemId: "equipment",
  },
];

export function generateStaticParams() {
  return getCarrierRegistry().map((carrier) => ({ carrierId: carrier.id }));
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${className}`}>
      {children}
    </span>
  );
}

function findPacketStatus(items: CarrierPacketItem[], itemId: string): CarrierPacketItem["status"] {
  if (itemId === "equipment") return "ready";
  return items.find((item) => item.id === itemId)?.status ?? "review";
}

function findPacketItem(items: CarrierPacketItem[], itemId: string): CarrierPacketItem | undefined {
  return items.find((item) => item.id === itemId);
}

function publicStatusLabel(status: CarrierPacketItem["status"]) {
  if (status === "ready") return "Included";
  if (status === "blocked") return "Blocked";
  if (status === "expiring") return "Renewal watch";
  return "Review";
}

export default async function CarrierPacketPreviewPage({ params }: Props) {
  const { carrierId } = await params;
  const carrier = getCarrierById(carrierId);

  if (!carrier) {
    notFound();
  }

  const packet = getCarrierPacketSummary(carrier);
  const readinessTone = getCarrierStatusTone(carrier.readinessStatus);

  return (
    <div className="bof-page">
      <div className="mb-4 flex flex-wrap gap-3">
        <Link href={`/carriers/${carrier.id}`} className="text-sm font-bold text-teal-300 hover:text-teal-200">
          Back to carrier profile
        </Link>
        <Link href="/carriers" className="text-sm font-bold text-slate-300 hover:text-white">
          Carrier registry
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-6 shadow-2xl shadow-black/20 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-300">Carrier packet preview</p>
              <Pill className={toneClasses[readinessTone]}>{carrier.readinessStatus}</Pill>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">{carrier.dba}</h1>
            <p className="mt-2 text-lg text-slate-300">{carrier.legalName}</p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              BOF assembles a customer-safe packet view from carrier onboarding, insurance, authority, safety,
              equipment, and lane controls. Sensitive tax and payment details remain internal while dispatch can still see
              whether the carrier is eligible, under review, or blocked.
            </p>
          </div>

          <div className="rounded-xl border border-teal-400/30 bg-teal-400/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Packet readiness</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <strong className="block text-4xl text-white">{packet.percent}%</strong>
                <span className="text-xs text-teal-100/75">Complete</span>
              </div>
              <div>
                <strong className="block text-4xl text-white">{carrier.readinessScore}</strong>
                <span className="text-xs text-teal-100/75">Readiness</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-teal-50">{packet.ready}/{packet.total} packet controls ready.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Customer-safe carrier snapshot">
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <p className="text-sm text-slate-400">Authority</p>
          <strong className="mt-2 block text-lg text-white">{carrier.authority.status}</strong>
          <p className="mt-1 text-sm text-slate-400">{carrier.authority.authorityType}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <p className="text-sm text-slate-400">Insurance</p>
          <strong className="mt-2 block text-lg text-white">
            {carrier.insurance.every((policy) => policy.status === "current") ? "Current" : "Review required"}
          </strong>
          <p className="mt-1 text-sm text-slate-400">{carrier.insurance.length} policies tracked</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <p className="text-sm text-slate-400">Dispatch eligibility</p>
          <strong className="mt-2 block text-lg text-white">{carrier.dispatchEligibility}</strong>
          <p className="mt-1 text-sm text-slate-400">{carrier.statusReason}</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Included documents</h2>
            <p className="mt-1 text-sm text-slate-400">
              Customer-facing readiness without exposing tax IDs, bank instructions, or internal packet owner notes.
            </p>
          </div>
          <Pill className={packet.blocked > 0 ? toneClasses.blocked : packet.expiring > 0 || packet.review > 0 ? toneClasses.review : toneClasses.ready}>
            {packet.percent}% ready
          </Pill>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customerSafeDocs.map((doc) => {
            const status = findPacketStatus(carrier.packetItems, doc.itemId);
            const item = findPacketItem(carrier.packetItems, doc.itemId);
            return (
              <div key={doc.title} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black text-white">{doc.title}</h3>
                  <Pill className={itemTone[status]}>{publicStatusLabel(status)}</Pill>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{doc.note}</p>
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Readiness timing</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {item?.timing ?? "Reviewed with equipment and lane qualification."}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item?.consequence ?? carrier.backhaulReadyStatus}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="customer-safe" className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <h2 className="text-2xl font-black text-white">Customer-safe packet view</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This view is suitable for a shipper or customer review because it confirms the operating controls that matter
            without exposing the carrier&apos;s tax profile, ACH instructions, internal review notes, or commercial terms.
          </p>
          <dl className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <dt className="text-sm text-slate-500">DOT / MC</dt>
              <dd className="mt-1 font-semibold text-white">{carrier.dotNumber} / {carrier.mcNumber}</dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <dt className="text-sm text-slate-500">Safety rating</dt>
              <dd className="mt-1 font-semibold text-white">{carrier.authority.safetyRating}</dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <dt className="text-sm text-slate-500">Equipment</dt>
              <dd className="mt-1 font-semibold text-white">{carrier.equipmentTypes.join(", ")}</dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <dt className="text-sm text-slate-500">Lanes</dt>
              <dd className="mt-1 font-semibold text-white">{carrier.lanes.join(", ")}</dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 md:col-span-2">
              <dt className="text-sm text-slate-500">Backhaul-ready status</dt>
              <dd className="mt-1 font-semibold text-white">{carrier.backhaulReadyStatus}</dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-2xl border border-teal-400/30 bg-teal-400/10 p-5">
          <h2 className="text-2xl font-black text-white">Dispatch eligibility</h2>
          <p className="mt-3 text-sm leading-6 text-teal-50">{getCarrierDispatchExplanation(carrier)}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dispatch" className="rounded-lg border border-teal-300/50 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
              Open dispatch
            </Link>
            <Link href={`/carriers/${carrier.id}`} className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-slate-800">
              Open full carrier profile
            </Link>
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
        <h2 className="text-2xl font-black text-white">Packet actions</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Packet actions keep customer release, dispatch eligibility, and finance review tied to the same readiness controls.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="#customer-safe" className="rounded-lg border border-teal-300/50 bg-teal-400/10 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
            Preview customer packet
          </a>
          <Link href="/dispatch" className="rounded-lg border border-teal-300/50 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-300/10">
            Review dispatch eligibility
          </Link>
          <button
            type="button"
            className="cursor-not-allowed rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300"
            aria-disabled="true"
          >
            Queue export request
          </button>
        </div>
      </section>
    </div>
  );
}
