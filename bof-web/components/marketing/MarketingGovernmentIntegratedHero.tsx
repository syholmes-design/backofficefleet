import Image from "next/image";
import type { ReactNode } from "react";

export type MarketingGovernmentIntegratedHeroProps = {
  titleId: string;
  sectionAriaLabelledBy?: string;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  support: string;
  trustItems: readonly string[];
  trustAriaLabel: string;
  ctas: ReactNode;
  /** Public path e.g. `/assets/images/hero-government-fleets.png` */
  imageSrc: string;
  imageAlt: string;
  /** Short line on the image (not a product mock; editorial caption bar). */
  imageCaption?: string;
};

/**
 * Government marketing: one hero band — copy + value strip + CTA in a dark panel,
 * photograph as the right column (no browser chrome / mockup card).
 */
export function MarketingGovernmentIntegratedHero({
  titleId,
  sectionAriaLabelledBy,
  eyebrow,
  title,
  subtitle,
  support,
  trustItems,
  trustAriaLabel,
  ctas,
  imageSrc,
  imageAlt,
  imageCaption,
}: MarketingGovernmentIntegratedHeroProps) {
  return (
    <section
      className="bof-mkt-gov-hero-integrated"
      aria-labelledby={sectionAriaLabelledBy ?? titleId}
    >
      <div className="bof-mkt-gov-hero-integrated__grid">
        <div className="bof-mkt-gov-hero-integrated__copy">
          <p className="bof-mkt-gov-hero-integrated__eyebrow">{eyebrow}</p>
          <h1 id={titleId} className="bof-mkt-gov-hero-integrated__title">
            {title}
          </h1>
          <p className="bof-mkt-gov-hero-integrated__sub">{subtitle}</p>
          <p className="bof-mkt-gov-hero-integrated__support">{support}</p>
          <div className="bof-mkt-gov-hero-integrated__ctas">{ctas}</div>
          {trustItems.length > 0 ? (
            <ul className="bof-mkt-gov-hero-integrated__trust" aria-label={trustAriaLabel}>
              {trustItems.map((label) => (
                <li key={label}>
                  <span className="bof-mkt-gov-hero-integrated__trust-mark" aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="bof-mkt-gov-hero-integrated__visual">
          <div className="bof-mkt-gov-hero-integrated__image-wrap">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 899px) 100vw, 50vw"
              className="bof-mkt-gov-hero-integrated__image"
            />
            {imageCaption ? (
              <p className="bof-mkt-gov-hero-integrated__image-figcaption">{imageCaption}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
