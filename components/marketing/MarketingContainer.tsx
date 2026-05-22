import type { ReactNode } from "react";

/** Max-width marketing column — matches `.bof-mkt-container`. */
export function MarketingContainer({ children }: { children: ReactNode }) {
  return <div className="bof-mkt-container">{children}</div>;
}
