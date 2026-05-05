"use client";

import { ActionableIssueList } from "@/components/actionability/ActionableIssueList";
import type { ActionableIssue } from "@/lib/actionability/types";

export function ActionableIssueDrawer({
  title,
  issues,
}: {
  title: string;
  issues: ActionableIssue[];
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/60 p-3">
      <p className="bof-cc-panel-title">{title}</p>
      <ActionableIssueList issues={issues} />
    </div>
  );
}

