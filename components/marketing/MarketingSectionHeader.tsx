import type { ReactNode } from "react";

export function MarketingSectionHeader({
  titleId,
  title,
  lead,
  aside,
}: {
  titleId: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Optional eyebrow or badge row above title */
  aside?: ReactNode;
}) {
  return (
    <header className="bof-mkt-section-head">
      {aside}
      <h2 id={titleId} className="bof-mkt-section-title">
        {title}
      </h2>
      {lead ? <p className="bof-mkt-section-lead">{lead}</p> : null}
    </header>
  );
}
