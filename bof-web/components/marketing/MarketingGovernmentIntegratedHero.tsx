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
  /** Optional custom className for page-specific styling */
  className?: string;
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
  className,
}: MarketingGovernmentIntegratedHeroProps) {
  return (
    <section
      className={`bof-mkt-gov-hero-integrated ${className || ''}`}
      aria-labelledby={sectionAriaLabelledBy ?? titleId}
    >
      {/* Full-width background image */}
      <div className="bof-mkt-gov-hero-integrated__background">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="bof-mkt-gov-hero-integrated__bg-image"
        />
      </div>
      
      {/* Dark gradient overlay for text readability */}
      <div className="bof-mkt-gov-hero-integrated__overlay" />
      
      {/* Content container with text and CTAs */}
      <div className="bof-mkt-gov-hero-integrated__container">
        <div className="bof-mkt-gov-hero-integrated__content">
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
      </div>
      
      {/* Optional caption overlay */}
      {imageCaption ? (
        <div className="bof-mkt-gov-hero-integrated__caption-overlay">
          <p className="bof-mkt-gov-hero-integrated__image-caption">{imageCaption}</p>
        </div>
      ) : null}
    </section>
  );
}
