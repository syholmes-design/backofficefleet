import type { ReactNode } from "react";

export type MarketingIconCardItem = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function MarketingIconCardGrid({
  items,
  variant,
  listClassName,
}: {
  items: readonly MarketingIconCardItem[];
  variant: "pain" | "feature";
  /** Override grid class when needed. */
  listClassName?: string;
}) {
  const gridClass =
    listClassName ??
    (variant === "pain" ? "bof-mkt-pain-grid-premium" : "bof-mkt-feature-grid-premium");
  const cardClass =
    variant === "pain" ? "bof-mkt-pain-card-premium" : "bof-mkt-feature-card-premium";
  const iconWrapClass =
    variant === "pain" ? "bof-mkt-pain-card-premium-icon" : "bof-mkt-feature-card-premium-icon";

  if (variant === "pain") {
    return (
      <ul className={gridClass}>
        {items.map((item) => (
          <li key={item.title} className={cardClass}>
            <div className={iconWrapClass} aria-hidden>
              {item.icon}
            </div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <article key={item.title} className={cardClass}>
          <div className={iconWrapClass} aria-hidden>
            {item.icon}
          </div>
          <div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
