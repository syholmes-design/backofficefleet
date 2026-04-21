"use client";

import { useMemo } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildDispatchLoadsFromBofData } from "@/lib/dispatch-dashboard-seed";
import { computeDocumentationReadiness } from "@/lib/documentation-readiness";
import { getLoadProofItems, getLoadProofSummary } from "@/lib/load-proof";
import { BofAdvantageCard, BofAdvantageStrip } from "./BofAdvantageCard";

export function LoadBofAdvantagesIsland({ loadId }: { loadId: string }) {
  const { data } = useBofDemoData();
  const dispatchLoad = useMemo(
    () => buildDispatchLoadsFromBofData(data).find((l) => l.load_id === loadId) ?? null,
    [data, loadId]
  );
  const proofItems = useMemo(() => getLoadProofItems(data, loadId), [data, loadId]);
  const proofSummary = useMemo(() => getLoadProofSummary(proofItems), [proofItems]);
  const docReport = useMemo(() => {
    if (!dispatchLoad) return null;
    return computeDocumentationReadiness(dispatchLoad);
  }, [dispatchLoad]);

  const load = useMemo(() => data.loads.find((l) => l.id === loadId), [data.loads, loadId]);

  if (!dispatchLoad || !load || !docReport) return null;

  const docTone =
    docReport.overall === "Ready" ? ("positive" as const) : docReport.missingRequired.length >= 3 ? ("caution" as const) : ("neutral" as const);

  return (
    <BofAdvantageStrip>
      <BofAdvantageCard
        eyebrow="BOF Advantage"
        title="Documentation readiness & proof stack"
        subtitle={`Packet: ${docReport.overall} · ${docReport.missingRequired.length} required gap(s)`}
        value={`${proofSummary.completeCount}/${proofSummary.applicableCount} proof lines complete (${proofSummary.completionPct}%)`}
        delta={
          dispatchLoad.exception_flag
            ? "Seal / photo rules surface exceptions early"
            : "Centralized proof reduces back-and-forth before billing"
        }
        explanation="Counts come from BOF load proof items and dispatch packet rules on this load."
        tone={docTone}
      />
    </BofAdvantageStrip>
  );
}
