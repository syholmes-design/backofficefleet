import Image from "next/image";
import type { ReactNode } from "react";

export type MarketingHomeIntegratedHeroProps = {
  titleId: string;
  sectionAriaLabelledBy?: string;
  className?: string;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  support?: string;
  trustItems?: readonly string[];
  ctas: ReactNode;
  /** Accessible name for the hero trust bullet list. */
  trustAriaLabel?: string;
  /** Optional brand block shown above eyebrow. */
  brand?: ReactNode;
  /** Public path e.g. `/assets/images/hero-landing-bof.png` */
  imageSrc: string;
  imageAlt: string;
};

/**
 * Home page integrated hero: left column copy, right column full-height image
 * No caption or frame - true integrated hero media
 */
export function MarketingHomeIntegratedHero({
  titleId,
  sectionAriaLabelledBy,
  className,
  eyebrow,
  title,
  subtitle,
  support,
  trustItems,
  ctas,
  trustAriaLabel = "Highlights",
  brand,
  imageSrc,
  imageAlt,
}: MarketingHomeIntegratedHeroProps) {
  const rootClassName = className
    ? `bof-mkt-home-hero-integrated ${className}`
    : "bof-mkt-home-hero-integrated";

  return (
    <section
      className={rootClassName}
      aria-labelledby={sectionAriaLabelledBy ?? titleId}
    >
      <div className="bof-mkt-home-hero-integrated__grid">
        <div className="bof-mkt-home-hero-integrated__copy">
          {brand ? <div className="bof-mkt-home-hero-integrated__brand">{brand}</div> : null}
          <p className="bof-mkt-home-hero-integrated__eyebrow">{eyebrow}</p>
          <h1 id={titleId} className="bof-mkt-home-hero-integrated__title">
            {title}
          </h1>
          <p className="bof-mkt-home-hero-integrated__sub">{subtitle}</p>
          {support ? <p className="bof-mkt-home-hero-integrated__support">{support}</p> : null}
          <div className="bof-mkt-home-hero-integrated__ctas">{ctas}</div>
          {trustItems && trustItems.length > 0 ? (
            <ul className="bof-mkt-home-hero-integrated__trust" aria-label={trustAriaLabel}>
              {trustItems.map((label) => (
                <li key={label}>
                  <span className="bof-mkt-home-hero-integrated__trust-mark" aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="bof-mkt-home-hero-integrated__visual">
          <div className="bof-mkt-home-hero-integrated__image-wrap">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 899px) 100vw, 50vw"
              className="bof-mkt-home-hero-integrated__image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
