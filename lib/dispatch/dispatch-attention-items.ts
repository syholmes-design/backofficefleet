import type { BofData } from "@/lib/load-bof-data";
import { buildCommandCenterItems } from "@/lib/executive-layer";

const SEVERITY_ORDER: Record<"critical" | "high" | "medium", number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

export type DispatchAttentionRow = {
  id: string;
  bucket: string;
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium";
  nextAction: string;
  href: string;
};

/**
 * Command Center–style attention preview for dispatch / loads workflows.
 * Uses the same canonical queue as Command Center (`buildCommandCenterItems`).
 */
export function getDispatchAttentionItems(
  data: BofData,
  limit = 8
): DispatchAttentionRow[] {
  const items = buildCommandCenterItems(data);
  const sorted = [...items].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
  return sorted.slice(0, limit).map((item) => ({
    id: item.id,
    bucket: item.bucket,
    title: item.title,
    detail: item.detail,
    severity: item.severity,
    nextAction: item.nextAction,
    href: item.loadId
      ? `/loads/${item.loadId}`
      : item.driverId
        ? `/drivers/${item.driverId}`
        : "/command-center",
  }));
}
