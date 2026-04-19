"use client";

/**
 * Client boundary: seeds {@link BofDemoDataProvider} from server-read JSON so every
 * (bof) route can call useBofDemoData() after hydration from localStorage.
 */

import type { ReactNode } from "react";
import type { BofData } from "@/lib/load-bof-data";
import { BofDemoDataProvider } from "@/lib/bof-demo-data-context";

export function BofDemoDataShell({
  seed,
  children,
}: {
  seed: BofData;
  children: ReactNode;
}) {
  return <BofDemoDataProvider seed={seed}>{children}</BofDemoDataProvider>;
}
