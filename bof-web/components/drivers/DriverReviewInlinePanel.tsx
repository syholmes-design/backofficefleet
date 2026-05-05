"use client";

import Link from "next/link";
import type { DriverReviewExplanation } from "@/lib/driver-review-explanation";

export function DriverReviewInlinePanel({
  explanation,
}: {
  explanation: DriverReviewExplanation;
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/60 p-3">
      <p className="bof-cc-panel-title" style={{ marginBottom: "0.35rem" }}>
        Issue: {explanation.headline}
      </p>
      <p className="bof-cc-driver-meta" style={{ marginBottom: "0.35rem" }}>
        <strong>Why:</strong> {explanation.reason}
      </p>
      <p className="bof-cc-driver-meta" style={{ marginBottom: "0.35rem" }}>
        <strong>Why this matters:</strong> {explanation.impact}
      </p>
      <p className="bof-cc-driver-meta" style={{ marginBottom: "0.55rem" }}>
        <strong>Recommended fix:</strong> {explanation.recommendedFix}
      </p>
      <div className="flex flex-wrap gap-2">
        {explanation.actions.map((a) =>
          a.href ? (
            <Link key={`${a.label}-${a.href}`} href={a.href} className="bof-cc-action-btn">
              {a.label}
            </Link>
          ) : null
        )}
      </div>
    </div>
  );
}
