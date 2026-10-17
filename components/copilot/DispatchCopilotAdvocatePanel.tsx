"use client";

import { useEffect, useMemo, useState } from "react";
import { CopilotAdvocateViewShell } from "@/components/copilot/CopilotAdvocateViewShell";
import { useCopilotAdvocateSession } from "@/components/copilot/use-copilot-advocate-session";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { enrichLoadCopilotWithLiveProcess } from "@/lib/copilot/copilot-live-load-enrichment";
import { buildDispatchCopilotAdvocateView } from "@/lib/copilot/dispatch-copilot-advocate-display";
import type { CopilotScope } from "@/lib/copilot/copilot-shared";

type Props = CopilotScope & {
  variant?: "full" | "compact";
  tone?: "command" | "ops";
};

export function DispatchCopilotAdvocatePanel({
  loadId = null,
  driverId = null,
  assetId = null,
  variant = "full",
  tone = "command",
}: Props) {
  const { data } = useBofDemoData();
  const { access, v3 } = useCopilotAdvocateSession();
  const scope = useMemo(() => ({ loadId, driverId, assetId }), [loadId, driverId, assetId]);
  const [liveProcess, setLiveProcess] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!access.allowed || !loadId?.trim() || /^L\d{3}$/i.test(loadId.trim())) {
      setLiveProcess(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/load-process-intelligence/${encodeURIComponent(loadId)}`, { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled) setLiveProcess(payload);
      })
      .catch(() => {
        if (!cancelled) setLiveProcess(null);
      });
    return () => {
      cancelled = true;
    };
  }, [access.allowed, loadId]);

  const view = useMemo(() => {
    if (!access.allowed) return null;
    const base = buildDispatchCopilotAdvocateView({ data, v3, scope });
    return enrichLoadCopilotWithLiveProcess(base, liveProcess as Parameters<typeof enrichLoadCopilotWithLiveProcess>[1]);
  }, [access.allowed, data, v3, scope, liveProcess]);

  return (
    <CopilotAdvocateViewShell
      variant={variant}
      tone={tone}
      headingId="dispatch-copilot-advocate"
      kicker="Dispatch Copilot Advocate"
      title="Dispatch operating guidance"
      compactHref="/dispatch#dispatch-copilot-advocate"
      compactLabel="Open Dispatch Copilot Advocate on Dispatch"
      access={access}
      view={view}
    />
  );
}
