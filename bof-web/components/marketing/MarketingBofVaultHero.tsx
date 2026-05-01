import Image from "next/image";
import type { ReactNode } from "react";

export type MarketingBofVaultHeroProps = {
  titleId: string;
  sectionAriaLabelledBy?: string;
  eyebrow: string;
  title: ReactNode;
  belowHeroHeadline?: ReactNode;
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
  layout?: "twoColumn" | "imageFirst";
};

const HERO_IMAGE_WIDTH = 1920;
const HERO_IMAGE_HEIGHT = 960;

function CopyBlock({
  titleId,
  eyebrow,
  heading,
  subtitle,
  support,
  trustItems,
  trustAriaLabel,
  ctas,
}: {
  titleId: string;
  eyebrow: string;
  heading: ReactNode;
  subtitle: string;
  support: string;
  trustItems: readonly string[];
  trustAriaLabel: string;
  ctas: ReactNode;
}) {
  return (
    <div className="bof-mkt-vault-hero__copy bof-mkt-vault-hero__copy--below-hero">
      <p className="bof-mkt-vault-hero__eyebrow">{eyebrow}</p>
      <h1 id={titleId} className="bof-mkt-vault-hero__title bof-mkt-vault-hero__title--below-hero">
        {heading}
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
  );
}

/**
 * BOF Vault marketing hero: default two-column, or `imageFirst` full-width graphic with copy below.
 */
export function MarketingBofVaultHero({
  titleId,
  sectionAriaLabelledBy,
  eyebrow,
  title,
  belowHeroHeadline,
  subtitle,
  support,
  trustItems,
  trustAriaLabel,
  ctas,
  imageSrc,
  imageAlt,
  imageCaption,
  className,
  layout = "twoColumn",
}: MarketingBofVaultHeroProps) {
  const imageFirst = layout === "imageFirst";
  const sectionClass = ["bof-mkt-vault-hero", imageFirst ? "bof-image-first-hero" : "", className || ""]
    .filter(Boolean)
    .join(" ");

  const visual = (
    <div className="bof-mkt-vault-hero__visual">
      <div
        className={
          imageFirst
            ? "bof-mkt-hero-image-surface bof-mkt-vault-hero__image-wrap"
            : "bof-mkt-vault-hero__image-wrap bof-mkt-hero-image-panel--private-fleets-size"
        }
      >
        {imageFirst ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={HERO_IMAGE_WIDTH}
            height={HERO_IMAGE_HEIGHT}
            priority
            sizes="(max-width: 1024px) 100vw, min(92vw, 1500px)"
            className="bof-mkt-hero-image bof-mkt-vault-hero__image"
          />
        ) : (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 899px) 100vw, 50vw"
            className="bof-mkt-vault-hero__image"
          />
        )}
      </div>
      {imageCaption ? (
        <div className="bof-mkt-vault-hero__caption">
          <p className="bof-mkt-vault-hero__image-caption">{imageCaption}</p>
        </div>
      ) : null}
    </div>
  );

  const copy = (
    <CopyBlock
      titleId={titleId}
      eyebrow={eyebrow}
      heading={belowHeroHeadline ?? title}
      subtitle={subtitle}
      support={support}
      trustItems={trustItems}
      trustAriaLabel={trustAriaLabel}
      ctas={ctas}
    />
  );

  return (
    <section className={sectionClass} aria-labelledby={sectionAriaLabelledBy ?? titleId}>
      <div className="bof-mkt-vault-hero__grid">
        {imageFirst ? (
          <>
            {visual}
            {copy}
          </>
        ) : (
          <>
            {copy}
            {visual}
          </>
        )}
      </div>
    </section>
  );
}
