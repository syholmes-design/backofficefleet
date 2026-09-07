"use client";

import { useMemo } from "react";
import { CopilotAdvocateViewShell } from "@/components/copilot/CopilotAdvocateViewShell";
import { useCopilotAdvocateSession } from "@/components/copilot/use-copilot-advocate-session";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildLoadFileCopilotAdvocateView } from "@/lib/copilot/load-file-copilot-advocate-display";
import type { CopilotScope } from "@/lib/copilot/copilot-shared";

type Props = CopilotScope & {
  variant?: "full" | "compact";
  tone?: "command" | "ops";
};

export function LoadFileCopilotAdvocatePanel({
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
    return buildLoadFileCopilotAdvocateView({ data, v3, scope });
  }, [access.allowed, data, v3, scope]);

  const compactHref = loadId
    ? `/loads/${encodeURIComponent(loadId)}#load-file-copilot-advocate`
    : "/loads#load-file-copilot-advocate";

  return (
    <CopilotAdvocateViewShell
      variant={variant}
      tone={tone}
      headingId="load-file-copilot-advocate"
      kicker="Load File Copilot Advocate"
      title="Load File operating guidance"
      compactHref={compactHref}
      compactLabel={loadId ? "Open Load File Copilot Advocate on this load file" : "Open Load File Copilot Advocate"}
      access={access}
      view={view}
    />
  );
}
