"use client";

import Link from "next/link";
import type { ActionableIssue } from "@/lib/actionability/types";

export function ActionableIssueList({ issues }: { issues: ActionableIssue[] }) {
  return (
    <div className="space-y-2">
      {issues.map((i) => (
        <div key={i.id} className="rounded border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-sm font-semibold text-slate-100">{i.headline}</p>
          <p className="text-xs text-slate-300">
            <strong>{i.severity}</strong> · {i.entityName ?? i.entityId ?? i.label}
          </p>
          <p className="mt-1 text-sm text-slate-300"><strong>Why:</strong> {i.whyItMatters}</p>
          <p className="text-sm text-slate-300"><strong>Fix:</strong> {i.recommendedFix}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={i.primaryAction.href} className="bof-cc-action-btn bof-cc-action-btn-primary">
              {i.primaryAction.label}
            </Link>
            {(i.secondaryActions ?? []).map((a) => (
              <Link key={`${i.id}-${a.label}-${a.href}`} href={a.href} className="bof-cc-action-btn">
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

