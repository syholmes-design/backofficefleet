"use client";

import type { ReactNode } from "react";

/**
 * Compact operational callout for BOF savings / efficiency — use inside workflows,
 * not as marketing chrome. Wire `value` / `delta` from real APIs later; until then
 * label estimates clearly in `subtitle` or `explanation`.
 */

export type BofAdvantageTone = "neutral" | "positive" | "caution";

export type BofAdvantageCardProps = {
  /** e.g. "BOF Advantage", "Estimated BOF Savings" */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Primary metric line */
  value: string;
  /** Optional comparison or range, e.g. "vs. prior period" */
  delta?: string;
  /** Fine print / methodology */
  explanation?: string;
  tone?: BofAdvantageTone;
};

export function BofAdvantageCard({
  eyebrow = "BOF Advantage",
  title,
  subtitle,
  value,
  delta,
  explanation,
  tone = "neutral",
}: BofAdvantageCardProps) {
  return (
    <article className={`bof-advantage-card bof-advantage-card--${tone}`}>
      <p className="bof-advantage-eyebrow">{eyebrow}</p>
      <h3 className="bof-advantage-title">{title}</h3>
      {subtitle ? <p className="bof-advantage-subtitle">{subtitle}</p> : null}
      <p className="bof-advantage-value">{value}</p>
      {delta ? <p className="bof-advantage-delta">{delta}</p> : null}
      {explanation ? <p className="bof-advantage-explanation">{explanation}</p> : null}
    </article>
  );
}

export function BofAdvantageStrip({ children }: { children: ReactNode }) {
  return (
    <div className="bof-advantage-strip" aria-label="BOF operational advantages">
      {children}
    </div>
  );
}
