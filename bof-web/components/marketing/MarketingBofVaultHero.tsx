import Image from "next/image";
import type { ReactNode } from "react";

export type MarketingBofVaultHeroProps = {
  titleId: string;
  sectionAriaLabelledBy?: string;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  support: string;
  trustItems: readonly string[];
  trustAriaLabel: string;
  ctas: ReactNode;
  /** Public path e.g. `/assets/images/hero-bof-vault.png` */
  imageSrc: string;
  imageAlt: string;
  /** Short line on the image (not a product mock; editorial caption bar). */
  imageCaption?: string;
  /** Optional custom className for page-specific styling */
  className?: string;
};

/**
 * BOF Vault hero: two-column layout with left copy and right image
 * Mirrors the home page hero structure for proper integration
 */
export function MarketingBofVaultHero({
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
}: MarketingBofVaultHeroProps) {
  return (
    <section
      className={`bof-mkt-vault-hero ${className || ''}`}
      aria-labelledby={sectionAriaLabelledBy ?? titleId}
    >
      <div className="bof-mkt-vault-hero__grid">
        <div className="bof-mkt-vault-hero__copy">
          <p className="bof-mkt-vault-hero__eyebrow">{eyebrow}</p>
          <h1 id={titleId} className="bof-mkt-vault-hero__title">
            {title}
          </h1>
          <p className="bof-mkt-vault-hero__sub">{subtitle}</p>
          <p className="bof-mkt-vault-hero__support">{support}</p>
          <div className="bof-mkt-vault-hero__ctas">{ctas}</div>
          {trustItems.length > 0 ? (
            <ul className="bof-mkt-vault-hero__trust" aria-label={trustAriaLabel}>
              {trustItems.map((label) => (
                <li key={label}>
                  <span className="bof-mkt-vault-hero__trust-mark" aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="bof-mkt-vault-hero__visual">
          <div className="bof-mkt-vault-hero__image-wrap bof-mkt-hero-image-panel--private-fleets-size">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 899px) 100vw, 50vw"
              className="bof-mkt-vault-hero__image"
            />
          </div>
          {imageCaption ? (
            <div className="bof-mkt-vault-hero__caption">
              <p className="bof-mkt-vault-hero__image-caption">{imageCaption}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
