import Image from "next/image";
import type { ReactNode } from "react";

export type MarketingGovernmentHeroProps = {
  titleId: string;
  sectionAriaLabelledBy?: string;
  eyebrow: string;
  title: ReactNode;
  /** Shorter H1 below the hero when `layout="imageFirst"` (graphic already carries headline). */
  belowHeroHeadline?: ReactNode;
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
  /**
   * `imageFirst`: full-width hero graphic, copy + CTAs below (Government / Vault marketing only).
   * Default: two-column hero (legacy).
   */
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
  prefix,
}: {
  titleId: string;
  eyebrow: string;
  heading: ReactNode;
  subtitle: string;
  support: string;
  trustItems: readonly string[];
  trustAriaLabel: string;
  ctas: ReactNode;
  prefix: "government" | "vault";
}) {
  const p = `bof-mkt-${prefix}-hero`;
  return (
    <div className={`${p}__copy ${p}__copy--below-hero`}>
      <p className={`${p}__eyebrow`}>{eyebrow}</p>
      <h1 id={titleId} className={`${p}__title ${p}__title--below-hero`}>
        {heading}
      </h1>
      <p className={`${p}__sub`}>{subtitle}</p>
      <p className={`${p}__support`}>{support}</p>
      <div className={`${p}__ctas`}>{ctas}</div>
      {trustItems.length > 0 ? (
        <ul className={`${p}__trust`} aria-label={trustAriaLabel}>
          {trustItems.map((label) => (
            <li key={label}>
              <span className={`${p}__trust-mark`} aria-hidden />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Government marketing hero: default two-column, or `imageFirst` full-width graphic with copy below.
 */
export function MarketingGovernmentHero({
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
}: MarketingGovernmentHeroProps) {
  const imageFirst = layout === "imageFirst";
  const sectionClass = [
    "bof-mkt-government-hero",
    imageFirst ? "bof-image-first-hero" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  const visual = (
    <div className="bof-mkt-government-hero__visual">
      <div
        className={
          imageFirst
            ? "bof-mkt-hero-image-surface bof-mkt-government-hero__image-wrap"
            : "bof-mkt-government-hero__image-wrap bof-mkt-hero-image-panel--private-fleets-size"
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
            className="bof-mkt-hero-image bof-mkt-government-hero__image"
          />
        ) : (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 899px) 100vw, 50vw"
            className="bof-mkt-government-hero__image"
          />
        )}
      </div>
      {imageCaption ? (
        <div className="bof-mkt-government-hero__caption">
          <p className="bof-mkt-government-hero__image-caption">{imageCaption}</p>
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
      prefix="government"
    />
  );

  return (
    <section className={sectionClass} aria-labelledby={sectionAriaLabelledBy ?? titleId}>
      <div className="bof-mkt-government-hero__grid">
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
