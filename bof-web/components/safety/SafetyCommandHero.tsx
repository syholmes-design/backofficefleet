"use client";

type HeroStats = {
  driversAtRisk: number;
  openHosOosIssues: number;
  preTripCompliancePct: number;
  podCertificationPct: number;
  safetyBonusEligibleDrivers: number;
};

export function SafetyCommandHero({ stats }: { stats: HeroStats }) {
  const cards = [
    { label: "Drivers at risk", value: stats.driversAtRisk, hint: "Performance tier At Risk" },
    { label: "Open HOS / OOS issues", value: stats.openHosOosIssues, hint: "Protocol + inspection findings" },
    { label: "Pre-trip compliance", value: `${stats.preTripCompliancePct}%`, hint: "Equipment + pickup proof (manifest)" },
    { label: "POD certification rate", value: `${stats.podCertificationPct}%`, hint: "Verified vs recorded POD" },
    { label: "Safety bonus eligible", value: stats.safetyBonusEligibleDrivers, hint: "Dispatch-ready + tier gate" },
  ];

  return (
    <section className="rounded-xl border border-slate-800/90 bg-gradient-to-br from-slate-950 via-slate-900/80 to-slate-950 p-4 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-400/90">BOF Operations</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">Safety Command Center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Driver risk, HOS/OOS alerts, pre-trip compliance, proof certification, and safety bonus eligibility — unified
            for dispatch and compliance desks.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map((c) => (
              <div
                key={c.label}
                className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2.5 ring-1 ring-teal-900/20"
              >
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-white">{c.value}</p>
                <p className="mt-0.5 text-[9px] leading-snug text-slate-600">{c.hint}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden shrink-0 lg:block lg:w-[220px]" aria-hidden>
          <MiniEldPanel />
        </div>
      </div>
    </section>
  );
}

function MiniEldPanel() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-teal-800/40 bg-slate-950/80 p-3">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-teal-500/90">ELD / DVIR pulse</p>
      <svg viewBox="0 0 200 120" className="mt-2 h-28 w-full text-teal-500/80">
        <rect x="8" y="8" width="184" height="72" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1" />
        <path
          d="M20 64 L44 48 L68 58 L92 36 L116 52 L140 40 L164 50 L180 44"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="92" cy="36" r="3" fill="#2dd4bf" />
        <rect x="8" y="88" width="56" height="22" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <text x="14" y="103" fill="#94a3b8" fontSize="8" fontFamily="system-ui">
          HOS OK
        </text>
        <rect x="72" y="88" width="56" height="22" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <text x="78" y="103" fill="#94a3b8" fontSize="8" fontFamily="system-ui">
          DVIR
        </text>
        <rect x="136" y="88" width="56" height="22" rx="4" fill="#0f172a" stroke="#f97316" strokeWidth="1" />
        <text x="142" y="103" fill="#fdba74" fontSize="8" fontFamily="system-ui">
          Review
        </text>
      </svg>
      <p className="mt-auto text-[9px] leading-snug text-slate-600">Synthetic panel — ties HOS trend to coaching queue.</p>
    </div>
  );
}
