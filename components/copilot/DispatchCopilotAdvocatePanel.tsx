"use client";

import { useMemo } from "react";
import { CopilotAdvocateViewShell } from "@/components/copilot/CopilotAdvocateViewShell";
import { useCopilotAdvocateSession } from "@/components/copilot/use-copilot-advocate-session";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
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
  const view = useMemo(() => {
    if (!access.allowed) return null;
    return buildDispatchCopilotAdvocateView({ data, v3, scope });
  }, [access.allowed, data, v3, scope]);

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
