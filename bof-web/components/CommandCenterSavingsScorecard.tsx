"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ExplainableSavingsMetric,
  SavingsEngineScorecard,
} from "@/lib/bof-savings-engine";
import { formatUsd } from "@/lib/format-money";

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function drivenLine(base: ExplainableSavingsMetric["inputs"]) {
  return `Driven by: RF coverage ${pct(base.rfCoverage)} · Compliance ${pct(base.complianceScore)} · Issue rate ${pct(base.riskScore)}`;
}

function whyNarrative(
  kind: "insurance" | "legal" | "recovered" | "cashFlow",
  m: ExplainableSavingsMetric
): string {
  switch (kind) {
    case "insurance": {
      const raw = m.detail.rawRate as number;
      const hitFloor = raw < 0;
      const hitCeil = raw > 0.25;
      let t = `Raw rate before clamp was ${pct(raw)}. `;
      if (hitFloor) t += "Floor at 0% stopped negative exposure. ";
      if (hitCeil) t += "Ceiling at 25% capped upside. ";
      if (!hitFloor && !hitCeil) t += "No clamp applied. ";
      t += `Higher verified-POD share and RF coverage raise the rate; more loads-with-issues lowers it.`;
      return t;
    }
    case "legal":
      return `More loads flagged with issues increase incident count; higher RF coverage widens reductionRate (${pct(m.rate)}).`;
    case "recovered":
      return `Each issue load contributes revenue×0.25×recoveryRate. RF coverage lifts recoveryRate to ${pct(m.rate)}.`;
    case "cashFlow":
      return `${m.detail.delayedLoads as number} loads lack verified POD, so ${pct(m.rate)} of fleet is treated as payment-delayed vs daily revenue/30.`;
    default:
      return "";
  }
}

const CARD_DEF: {
  kind: "insurance" | "legal" | "recovered" | "cashFlow";
  label: string;
  subtext: string;
  rateLabel: string;
  getMetric: (s: SavingsEngineScorecard) => ExplainableSavingsMetric;
  displayRate: (m: ExplainableSavingsMetric) => number;
}[] = [
  {
    kind: "insurance",
    label: "Insurance Savings (Est.)",
    subtext: "Auditable rate × revenue × 0.4",
    rateLabel: "Savings rate (clamped)",
    getMetric: (s) => s.insurance,
    displayRate: (m) => m.rate,
  },
  {
    kind: "legal",
    label: "Legal Cost Reduction",
    subtext: "Issues × $1,500 × reduction rate",
    rateLabel: "Reduction rate",
    getMetric: (s) => s.legal,
    displayRate: (m) => m.rate,
  },
  {
    kind: "recovered",
    label: "Recovered Revenue",
    subtext: "Issue loads: at-risk × recovery rate",
    rateLabel: "Recovery rate",
    getMetric: (s) => s.recovered,
    displayRate: (m) => m.rate,
  },
  {
    kind: "cashFlow",
    label: "Cash Flow Impact",
    subtext: "Delayed POD loads × daily revenue × 0.2",
    rateLabel: "Fleet delayed (POD)",
    getMetric: (s) => s.cashFlow,
    displayRate: (m) => m.rate,
  },
];

export function CommandCenterSavingsScorecard({
  scorecard,
}: {
  scorecard: SavingsEngineScorecard;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <section
      className="bof-cc-savings-section"
      aria-label="Savings scorecard"
    >
      <div className="bof-cc-savings-head">
        <h2 className="bof-cc-savings-title">Savings scorecard</h2>
        <p className="bof-cc-savings-lead">
          Values trace to <code className="bof-code">loads[]</code>,{" "}
          <code className="bof-code">settlements[]</code>, and the RF action
          queue. Click a card for formulas and inputs.
        </p>
      </div>
      <div className="bof-cc-savings-grid">
        {CARD_DEF.map((c) => {
          const m = c.getMetric(scorecard);
          const id = `cc-save-${c.kind}`;
          const expanded = open === c.kind;
          return (
            <article
              key={c.kind}
              className={
                expanded
                  ? "bof-cc-savings-card bof-cc-savings-card--expanded"
                  : "bof-cc-savings-card"
              }
            >
              <button
                type="button"
                id={id}
                className="bof-cc-savings-card-hit"
                aria-expanded={expanded}
                aria-controls={`${id}-detail`}
                onClick={() => setOpen(expanded ? null : c.kind)}
              >
                <span className="bof-cc-savings-card-label">{c.label}</span>
                <span className="bof-cc-savings-card-value">
                  {formatUsd(m.value)}
                </span>
                <span className="bof-cc-savings-card-rate">
                  {c.rateLabel}:{" "}
                  <strong>{pct(c.displayRate(m))}</strong>
                </span>
                <span className="bof-cc-savings-card-driven">
                  {drivenLine(m.inputs)}
                </span>
                <span className="bof-cc-savings-card-sub">{c.subtext}</span>
                <span className="bof-cc-savings-card-hint">
                  {expanded ? "Click to collapse" : "Click for audit detail"}
                </span>
              </button>
              {expanded && (
                <div
                  id={`${id}-detail`}
                  className="bof-cc-savings-expand"
                  role="region"
                  aria-labelledby={id}
                >
                  <p className="bof-cc-savings-expand-why">
                    <strong>Why this number:</strong> {whyNarrative(c.kind, m)}
                  </p>
                  <div className="bof-cc-savings-expand-cols">
                    <div>
                      <h3 className="bof-cc-savings-expand-h">Formula</h3>
                      <ol className="bof-cc-savings-formula-list">
                        {m.formulaLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h3 className="bof-cc-savings-expand-h">Base inputs</h3>
                      <ul className="bof-cc-savings-inputs-list">
                        <li>totalLoads: {m.inputs.totalLoads}</li>
                        <li>
                          totalRevenue: {formatUsd(m.inputs.totalRevenue)}
                        </li>
                        <li>loadsWithIssues: {m.inputs.loadsWithIssues}</li>
                        <li>loadsWithRF: {m.inputs.loadsWithRf}</li>
                        <li>
                          loadsWithVerifiedPOD:{" "}
                          {m.inputs.loadsDeliveredVerified}
                        </li>
                        <li>settlementsHeld: {m.inputs.settlementsHeld}</li>
                      </ul>
                      <h3 className="bof-cc-savings-expand-h">Scalars</h3>
                      <pre className="bof-cc-savings-detail-pre">
                        {JSON.stringify(m.detail, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
