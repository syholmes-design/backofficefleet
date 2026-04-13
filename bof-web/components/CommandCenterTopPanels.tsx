import type { FleetScorecard, BofNetworkImpact } from "@/lib/command-center-system";
import { formatUsd } from "@/lib/format-money";

export function FleetScorecardPanel({ card }: { card: FleetScorecard }) {
  const subs = [
    { key: "compliance", label: "Compliance", value: card.compliance, hint: "Docs missing / expired" },
    { key: "safety", label: "Safety", value: card.safety, hint: "Incidents + seal / exception proxy" },
    { key: "operations", label: "Operations", value: card.operations, hint: "Dispatch, POD lag, mismatches" },
    { key: "financial", label: "Financial", value: card.financial, hint: "Money at risk + payroll holds" },
  ] as const;

  return (
    <section className="bof-cc-scorecard-premium" aria-label="Fleet scorecard">
      <div className="bof-cc-scorecard-hero">
        <span className="bof-cc-scorecard-kicker">Fleet score</span>
        <p className="bof-cc-scorecard-value-premium">
          <span className="bof-cc-score-num">{card.fleetScore}</span>
          <span className="bof-cc-score-denom">/100</span>
        </p>
        <p className="bof-cc-scorecard-sub-premium">
          Blended index from compliance, safety, operations, and financial signals
          in BOF data — same formula as before, executive view.
        </p>
      </div>
      <ul className="bof-cc-subscores-premium">
        {subs.map((s) => (
          <li key={s.key}>
            <div className="bof-cc-sub-head">
              <span className="bof-cc-sub-label">{s.label}</span>
              <span className="bof-cc-sub-val">{s.value}</span>
            </div>
            <div
              className="bof-cc-sub-bar-track"
              role="presentation"
              aria-hidden
            >
              <div
                className="bof-cc-sub-bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, s.value))}%` }}
              />
            </div>
            <span className="bof-cc-sub-hint">{s.hint}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BofNetworkImpactPanel({ impact }: { impact: BofNetworkImpact }) {
  const tiles = [
    {
      label: "Settlement recovery",
      value: impact.settlementRecoveryUsd,
      note: "At-risk loads / holds cleared via disciplined follow-up",
    },
    {
      label: "Claim exposure prevented",
      value: impact.claimExposurePreventedUsd,
      note: "RF + compliance containment vs. open claims",
    },
    {
      label: "Fuel efficiency opportunity",
      value: impact.fuelEfficiencyOpportunityUsd,
      note: "Delay / idle proxy from en-route + open POD lanes",
    },
    {
      label: "Maintenance avoidance",
      value: impact.maintenanceAvoidanceUsd,
      note: "PM discipline vs. outage risk from register",
    },
  ];

  return (
    <section className="bof-cc-savings-premium" aria-label="BOF network impact">
      <div className="bof-cc-savings-premium-head">
        <h2 className="bof-cc-savings-premium-title">BOF network impact</h2>
        <p className="bof-cc-savings-premium-lead">
          Here is the value BOF creates — estimated from recovery, prevention, and
          efficiency signals already in your registers (not generic filler).
        </p>
      </div>
      <div className="bof-cc-savings-grid-premium">
        {tiles.map((t) => (
          <div key={t.label} className="bof-cc-savings-tile-premium">
            <span className="bof-cc-savings-kpi-label">{t.label}</span>
            <span className="bof-cc-savings-kpi-value">
              {formatUsd(t.value)}
            </span>
            <span className="bof-cc-savings-kpi-note">{t.note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
