"use client";

import { useMemo, useState } from "react";
import { ActionableCount } from "@/components/actionability/ActionableCount";
import { ActionableIssueList } from "@/components/actionability/ActionableIssueList";
import type { ActionableIssue } from "@/lib/actionability/types";

type Group = "all" | "load" | "driver" | "document" | "settlement" | "safety";

export function ActionableSummary({
  title,
  issues,
}: {
  title: string;
  issues: ActionableIssue[];
}) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<Group>("all");

  const grouped = useMemo(() => {
    return {
      all: issues,
      load: issues.filter((i) => i.entityType === "load" || i.entityType === "dispatch" || i.entityType === "proof"),
      driver: issues.filter((i) => i.entityType === "driver"),
      document: issues.filter((i) => i.entityType === "document"),
      settlement: issues.filter((i) => i.entityType === "settlement"),
      safety: issues.filter((i) => i.entityType === "safety"),
    };
  }, [issues]);

  const shown = group === "all" ? grouped.all : grouped[group] ?? grouped.all;

  return (
    <section className="bof-cc-panel" aria-label={title}>
      <div className="bof-cc-panel-head">
        <h3 className="bof-h2">{title}</h3>
        <button type="button" className="bof-cc-action-btn" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide issues" : "Show issues"}
        </button>
      </div>
      <div className="bof-drivers-filter-bar">
        <ActionableCount label="All" count={grouped.all.length} onClick={() => setGroup("all")} active={group === "all"} />
        <ActionableCount label="Loads" count={grouped.load.length} onClick={() => setGroup("load")} active={group === "load"} />
        <ActionableCount label="Drivers" count={grouped.driver.length} onClick={() => setGroup("driver")} active={group === "driver"} />
        <ActionableCount label="Documents" count={grouped.document.length} onClick={() => setGroup("document")} active={group === "document"} />
        <ActionableCount label="Settlements" count={grouped.settlement.length} onClick={() => setGroup("settlement")} active={group === "settlement"} />
        <ActionableCount label="Safety" count={grouped.safety.length} onClick={() => setGroup("safety")} active={group === "safety"} />
      </div>
      {open ? <ActionableIssueList issues={shown} /> : null}
    </section>
  );
}

