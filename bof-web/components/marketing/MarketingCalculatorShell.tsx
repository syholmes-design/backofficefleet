import type { ReactNode } from "react";

/** Card shell for a future fleet savings calculator (Phase C). */
export function MarketingCalculatorShell({
  title,
  badge = "Preview",
  body,
  footer,
}: {
  title: string;
  badge?: string;
  body: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bof-mkt-calculator-shell">
      <div className="bof-mkt-calculator-shell-head">
        <h3 className="bof-mkt-calculator-shell-title">{title}</h3>
        <span className="bof-mkt-calculator-shell-badge">{badge}</span>
      </div>
      <p className="bof-mkt-calculator-shell-body">{body}</p>
      {footer}
    </div>
  );
}
