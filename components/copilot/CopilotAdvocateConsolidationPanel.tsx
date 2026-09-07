"use client";

import { useMemo } from "react";
import { CopilotAdvocateViewShell } from "@/components/copilot/CopilotAdvocateViewShell";
import { useCopilotAdvocateSession } from "@/components/copilot/use-copilot-advocate-session";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildCopilotAdvocateConsolidationView } from "@/lib/copilot/copilot-advocate-consolidation-display";

type Props = {
  variant?: "full" | "compact";
  tone?: "command" | "ops";
};

export function CopilotAdvocateConsolidationPanel({ variant = "compact", tone = "command" }: Props) {
  const { data } = useBofDemoData();
  const { access, v3 } = useCopilotAdvocateSession();
  const view = useMemo(() => {
    if (!access.allowed) return null;
    return buildCopilotAdvocateConsolidationView({ data, v3 });
  }, [access.allowed, data, v3]);

  return (
    <CopilotAdvocateViewShell
      variant={variant}
      tone={tone}
      headingId="copilot-advocate-consolidation"
      kicker="Copilot Advocate consolidation"
      title="Cross-domain operating observation"
      compactHref="/command-center#copilot-advocate-consolidation"
      compactLabel="Open Copilot Advocate consolidation"
      access={access}
      view={view}
    />
  );
}
