"use client";

import { useMemo } from "react";
import { CopilotAdvocateViewShell } from "@/components/copilot/CopilotAdvocateViewShell";
import { useCopilotAdvocateSession } from "@/components/copilot/use-copilot-advocate-session";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildEquipmentCopilotAdvocateView } from "@/lib/copilot/equipment-copilot-advocate-display";
import type { CopilotScope } from "@/lib/copilot/copilot-shared";

type Props = CopilotScope & {
  variant?: "full" | "compact";
  tone?: "command" | "ops";
};

export function EquipmentCopilotAdvocatePanel({
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
    return buildEquipmentCopilotAdvocateView({ data, v3, scope });
  }, [access.allowed, data, v3, scope]);

  const compactHref = assetId
    ? `/maintenance/${encodeURIComponent(assetId)}#equipment-copilot-advocate`
    : "/maintenance#equipment-copilot-advocate";

  return (
    <CopilotAdvocateViewShell
      variant={variant}
      tone={tone}
      headingId="equipment-copilot-advocate"
      kicker="Equipment Copilot Advocate"
      title="Equipment operating guidance"
      compactHref={compactHref}
      compactLabel={assetId ? "Open Equipment Copilot Advocate on this asset" : "Open Equipment Copilot Advocate"}
      access={access}
      view={view}
    />
  );
}
