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
 * Private Fleets hero: integrated composition with BOF text on left and supervisor photo on right
 * Creates a single premium hero with clean layout and no text/image collisions
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
      <div className="bof-mkt-private-fleets-hero__integrated">
        {/* Left side: BOF text content */}
        <div className="bof-mkt-private-fleets-hero__content">
          <div className="bof-mkt-private-fleets-hero__text">
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

          {/* Right side: Integrated supervisor/photo */}
          <div className="bof-mkt-private-fleets-hero__visual">
            <div className="bof-mkt-private-fleets-hero__image-wrap">
              <div className="bof-mkt-private-fleets-hero__image-overlay">
                {/* Gradient overlay for readability */}
                <div className="bof-mkt-private-fleets-hero__image-gradient" />
              </div>
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
      </div>
    </section>
  );
}
