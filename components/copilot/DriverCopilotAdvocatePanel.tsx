"use client";

import { useMemo } from "react";
import { CopilotAdvocateViewShell } from "@/components/copilot/CopilotAdvocateViewShell";
import { useCopilotAdvocateSession } from "@/components/copilot/use-copilot-advocate-session";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildDriverCopilotAdvocateView } from "@/lib/copilot/driver-copilot-advocate-display";
import type { CopilotScope } from "@/lib/copilot/copilot-shared";

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
  const view = useMemo(() => {
    if (!access.allowed) return null;
    return buildDriverCopilotAdvocateView({ data, v3, scope });
  }, [access.allowed, data, v3, scope]);

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
