import type { BofData } from "@/lib/load-bof-data";
import { buildDispatchLoadsFromBofData } from "@/lib/dispatch-dashboard-seed";
import type { Load } from "@/types/dispatch";

type ResolveDispatchLoadForUiArgs = {
  loadId: string;
  data: BofData;
  storeLoads?: Load[];
};

/**
 * UI resolver for dispatch loads:
 * 1) prefer in-session store rows (includes generated URL updates)
 * 2) fall back to seeded BOF mapping from demo data
 */
export function resolveDispatchLoadForUi({
  loadId,
  data,
  storeLoads,
}: ResolveDispatchLoadForUiArgs): Load | null {
  const fromStore = storeLoads?.find((l) => l.load_id === loadId) ?? null;
  if (fromStore) return fromStore;
  return buildDispatchLoadsFromBofData(data).find((l) => l.load_id === loadId) ?? null;
}
