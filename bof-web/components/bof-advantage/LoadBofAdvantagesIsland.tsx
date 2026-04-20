"use client";

import { useMemo } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildDispatchLoadsFromBofData } from "@/lib/dispatch-dashboard-seed";
import { computeDocumentationReadiness } from "@/lib/documentation-readiness";
import { getLoadProofItems, getLoadProofSummary } from "@/lib/load-proof";
import { BofAdvantageCard, BofAdvantageStrip } from "./BofAdvantageCard";

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n
  );
}

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

  const linehaulRef = load.revenue;
  const fuelDemo = Math.max(120, Math.round(linehaulRef * 0.014 + (loadId.length % 7) * 35));

  const docTone =
    docReport.overall === "Ready" ? ("positive" as const) : docReport.missingRequired.length >= 3 ? ("caution" as const) : ("neutral" as const);

  return (
    <BofAdvantageStrip>
      <BofAdvantageCard
        eyebrow="Estimated BOF Savings"
        title="Fuel-network pricing on this lane"
        subtitle="Demo estimate from linehaul reference + BOF index (not live rack)"
        value={`~${formatUsd(fuelDemo)} trip-level fuel`}
        delta="Illustrative vs. unmanaged retail card"
        explanation="Wire to fuel desk / network actuals when available. Shown on load detail to align dispatch with margin story."
        tone="positive"
      />
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
