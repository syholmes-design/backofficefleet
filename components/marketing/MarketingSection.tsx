import type { ReactNode } from "react";

export type MarketingSectionVariant = "light" | "white" | "alt" | "ink" | "none";

const VARIANT_CLASS: Record<MarketingSectionVariant, string> = {
  light: "bof-mkt-section bof-mkt-section-light",
  white: "bof-mkt-section bof-mkt-section-white",
  alt: "bof-mkt-section bof-mkt-section-alt",
  ink: "bof-mkt-section bof-mkt-section-ink",
  none: "bof-mkt-section",
};

export function MarketingSection({
  variant,
  id,
  ariaLabelledBy,
  className,
  children,
}: {
  variant: MarketingSectionVariant;
  id?: string;
  ariaLabelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  const base = VARIANT_CLASS[variant];
  return (
    <section
      id={id}
      className={[base, className].filter(Boolean).join(" ")}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </section>
  );
}
