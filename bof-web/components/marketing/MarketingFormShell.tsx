import type { ReactNode } from "react";

/** Placeholder shell for a future multi-step assessment form (Phase C). */
export function MarketingFormShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <div className="bof-mkt-form-shell">
      <h3 className="bof-mkt-form-shell-title">{title}</h3>
      <p className="bof-mkt-form-shell-lead">{lead}</p>
      {children}
    </div>
  );
}
