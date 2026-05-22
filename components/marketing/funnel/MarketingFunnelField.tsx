"use client";

import type { ReactNode } from "react";

export function MarketingFunnelField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`bof-mkt-funnel-field ${error ? "bof-mkt-funnel-field--error" : ""}`}>
      <label className="bof-mkt-funnel-label" htmlFor={id}>
        {label}
      </label>
      {hint ? <p className="bof-mkt-funnel-hint">{hint}</p> : null}
      {children}
      {error ? <p className="bof-mkt-funnel-error">{error}</p> : null}
    </div>
  );
}
