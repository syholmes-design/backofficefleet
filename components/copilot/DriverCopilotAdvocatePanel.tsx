"use client";

import { useEffect, useMemo, useState } from "react";
import { CopilotAdvocateViewShell } from "@/components/copilot/CopilotAdvocateViewShell";
import { useCopilotAdvocateSession } from "@/components/copilot/use-copilot-advocate-session";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { enrichDriverCopilotWithLiveSummary } from "@/lib/copilot/copilot-live-driver-enrichment";
import { buildDriverCopilotAdvocateView } from "@/lib/copilot/driver-copilot-advocate-display";
import type { CopilotScope } from "@/lib/copilot/copilot-shared";
import type { DriverOperationalSummary } from "@/lib/services/driverOperationalReadModelService";

type Props = CopilotScope & {
  variant?: "full" | "compact";
  tone?: "command" | "ops";
};

export function DriverCopilotAdvocatePanel({
  loadId = null,
  driverId = null,
  assetId = null,
  variant = "full",
  tone = "ops",
}: Props) {
  const { data } = useBofDemoData();
  const { access, v3 } = useCopilotAdvocateSession();
  const scope = useMemo(() => ({ loadId, driverId, assetId }), [loadId, driverId, assetId]);
  const [liveSummary, setLiveSummary] = useState<DriverOperationalSummary | null>(null);

  useEffect(() => {
    if (!access.allowed || !driverId?.trim()) {
      setLiveSummary(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/drivers/${encodeURIComponent(driverId)}/operational-summary`, { cache: "no-store" })
      .then(async (response) => (response.ok ? (response.json() as Promise<DriverOperationalSummary>) : null))
      .then((summary) => {
        if (!cancelled) setLiveSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setLiveSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [access.allowed, driverId]);

  const view = useMemo(() => {
    if (!access.allowed) return null;
    const base = buildDriverCopilotAdvocateView({ data, v3, scope });
    return enrichDriverCopilotWithLiveSummary(base, liveSummary);
  }, [access.allowed, data, v3, scope, liveSummary]);

  const compactHref = driverId
    ? `/drivers/${encodeURIComponent(driverId)}#driver-copilot-advocate`
    : "/drivers#driver-copilot-advocate";

  return (
    <CopilotAdvocateViewShell
      variant={variant}
      tone={tone}
      headingId="driver-copilot-advocate"
      kicker="Driver Copilot Advocate"
      title="Driver operating guidance"
      compactHref={compactHref}
      compactLabel={driverId ? "Open Driver Copilot Advocate on this driver file" : "Open Driver Copilot Advocate"}
      access={access}
      view={view}
    />
  );
}
