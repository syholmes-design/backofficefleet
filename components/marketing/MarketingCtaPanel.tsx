import type { ReactNode } from "react";

export function MarketingCtaPanel({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bof-mkt-cta-final" aria-labelledby={id}>
      <div className="bof-mkt-container bof-mkt-cta-final-inner">
        <h2 id={id} className="bof-mkt-cta-final-title">
          {title}
        </h2>
        {lead ? <p className="bof-mkt-cta-final-lead">{lead}</p> : null}
        <div className="bof-mkt-hero-premium-ctas">{children}</div>
      </div>
    </section>
  );
}
