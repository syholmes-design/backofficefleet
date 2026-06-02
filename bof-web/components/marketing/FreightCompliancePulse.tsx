import Link from "next/link";
import { getBofRegulatoryFeedDemoItems, type BofRegulatoryFeedItem } from "@/lib/regulatory-feed-demo";

type FreightCompliancePulseProps = {
  variant?: "compact" | "full";
};

const urgencyTone: Record<BofRegulatoryFeedItem["urgency"], string> = {
  Low: "border-slate-300 bg-slate-100 text-slate-700",
  Medium: "border-cyan-300 bg-cyan-50 text-cyan-800",
  High: "border-amber-300 bg-amber-50 text-amber-800",
};

const categoryTone: Record<BofRegulatoryFeedItem["category"], string> = {
  Claims: "bg-rose-50 text-rose-700",
  Compliance: "bg-teal-50 text-teal-800",
  Dispatch: "bg-blue-50 text-blue-800",
  "Driver Files": "bg-indigo-50 text-indigo-800",
  Maintenance: "bg-orange-50 text-orange-800",
  Market: "bg-slate-100 text-slate-700",
  Safety: "bg-emerald-50 text-emerald-800",
};

function formatFeedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function FreightCompliancePulse({ variant = "full" }: FreightCompliancePulseProps) {
  const isCompact = variant === "compact";
  const items = getBofRegulatoryFeedDemoItems();
  const visibleItems = isCompact ? items.slice(0, 3) : items;

  if (isCompact) {
    return (
      <section
        id="freight-compliance-pulse"
        className="bof-home-section bof-home-section--soft py-14 md:py-16"
        aria-labelledby="freight-compliance-pulse-heading"
      >
        <div className="bof-mkt-container">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="bof-home-eyebrow">Public-source awareness</p>
              <h2 id="freight-compliance-pulse-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Freight Compliance Pulse
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                BOF monitors public FMCSA, DOT, NHTSA, CSA, and federal rulemaking updates and maps them to carrier
                workflows before they become dispatch, safety, or document problems.
              </p>
            </div>
            <Link href="/compliance" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary shrink-0">
              View Compliance Pulse
            </Link>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {visibleItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${categoryTone[item.category]}`}>
                    {item.category}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${urgencyTone[item.urgency]}`}>
                    {item.urgency}
                  </span>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{item.source}</p>
                <h3 className="mt-2 text-lg font-black leading-6 text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm font-black text-teal-700 hover:text-teal-900"
                >
                  View official source
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="freight-compliance-pulse"
      className="bof-home-section bof-home-section--soft"
      aria-labelledby="freight-compliance-pulse-heading"
    >
      <div className="bof-mkt-container">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 md:p-8">
            <p className="bof-home-eyebrow">Public-source awareness</p>
            <h2 id="freight-compliance-pulse-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Freight Compliance Pulse
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Live public-source updates from FMCSA, DOT, NHTSA, CSA, and federal rulemaking sources &mdash; organized
              by BOF around the workflows carriers actually manage.
            </p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-slate-100">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">BOF operating lens</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                BOF monitors public FMCSA, DOT, NHTSA, CSA, and federal rulemaking sources and translates updates into
                operational awareness for dispatch, safety, compliance, driver files, claims, and maintenance.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                See BOF Demo
              </Link>
              <Link href="/documents" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                View Compliance Workflows
              </Link>
            </div>
          </div>

          <div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item, index) => (
                <article
                  key={item.id}
                  className={[
                    "flex min-h-[320px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5",
                    index === 0 ? "md:col-span-2 xl:col-span-1" : "",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${categoryTone[item.category]}`}>
                      {item.category}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${urgencyTone[item.urgency]}`}>
                      {item.urgency}
                    </span>
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      {item.source} / {formatFeedDate(item.publishedAt)}
                    </p>
                    <h3 className="mt-3 text-xl font-black leading-7 text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
                  </div>
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">BOF impact</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.bofImpact}</p>
                  </div>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex pt-5 text-sm font-black text-teal-700 hover:text-teal-900"
                  >
                    View official source
                  </a>
                </article>
              ))}
            </div>
            <p className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
              Public-source updates are provided for operational awareness only. Carriers should verify legal
              obligations through the official agency source or qualified compliance counsel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
