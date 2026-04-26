import Image from "next/image";
import type { ReactNode } from "react";

export type MarketingPrivateFleetsHeroProps = {
  titleId: string;
  sectionAriaLabelledBy?: string;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  support: string;
  trustItems: readonly string[];
  trustAriaLabel: string;
  ctas: ReactNode;
  /** Public path e.g. `/assets/images/hero-private-fleets-bof.png` */
  imageSrc: string;
  imageAlt: string;
  /** Short line on the image (not a product mock; editorial caption bar). */
  imageCaption?: string;
};

/**
 * Private Fleets hero: two-column layout with left copy and right image
 * Mirrors the home page hero structure for proper integration
 */
export function MarketingPrivateFleetsHero({
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
}: MarketingPrivateFleetsHeroProps) {
  return (
    <section
      className="bof-mkt-private-fleets-hero"
      aria-labelledby={sectionAriaLabelledBy ?? titleId}
    >
      <div className="bof-mkt-private-fleets-hero__grid">
        <div className="bof-mkt-private-fleets-hero__copy">
          <p className="bof-mkt-private-fleets-hero__eyebrow">{eyebrow}</p>
          <h1 id={titleId} className="bof-mkt-private-fleets-hero__title">
            {title}
          </h1>
          <p className="bof-mkt-private-fleets-hero__sub">{subtitle}</p>
          <p className="bof-mkt-private-fleets-hero__support">{support}</p>
          <div className="bof-mkt-private-fleets-hero__ctas">{ctas}</div>
          {trustItems.length > 0 ? (
            <ul className="bof-mkt-private-fleets-hero__trust" aria-label={trustAriaLabel}>
              {trustItems.map((label) => (
                <li key={label}>
                  <span className="bof-mkt-private-fleets-hero__trust-mark" aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="bof-mkt-private-fleets-hero__visual">
          <div className="bof-mkt-private-fleets-hero__image-wrap">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 899px) 100vw, 50vw"
              className="bof-mkt-private-fleets-hero__image"
            />
          </div>
          {imageCaption ? (
            <div className="bof-mkt-private-fleets-hero__caption">
              <p className="bof-mkt-private-fleets-hero__image-caption">{imageCaption}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
