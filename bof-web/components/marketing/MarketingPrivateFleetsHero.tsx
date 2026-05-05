/**
 * BOF Shared Component:
 * Used by: /private-fleets
 * Do not edit for one page unless props/page-specific overrides are used.
 * See docs/BOF_ROUTE_MAP.md.
 */
"use client";

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
  imageSrc: string;
  imageAlt: string;
  imageCaption?: string;
};

/**
 * Private Fleets hero:
 * Full-bleed image with BOF copy layered over the left side.
 * This avoids the detached "text slab + image slab" feel and gives the
 * left side of the hero true negative space for readable BOF copy.
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
      <div className="bof-mkt-private-fleets-hero__shell">
        <div className="bof-mkt-private-fleets-hero__media bof-mkt-hero-image-panel--private-fleets-size">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="bof-mkt-private-fleets-hero__image"
          />
          <div
            className="bof-mkt-private-fleets-hero__overlay"
            aria-hidden
          />
        </div>

        <div className="bof-mkt-private-fleets-hero__container">
          <div className="bof-mkt-private-fleets-hero__content">
            <p className="bof-mkt-private-fleets-hero__eyebrow">{eyebrow}</p>
            <h1 id={titleId} className="bof-mkt-private-fleets-hero__title">
              {title}
            </h1>
            <p className="bof-mkt-private-fleets-hero__sub">{subtitle}</p>
            <p className="bof-mkt-private-fleets-hero__support">{support}</p>

            <div className="bof-mkt-private-fleets-hero__ctas">{ctas}</div>

            {trustItems.length > 0 ? (
              <ul
                className="bof-mkt-private-fleets-hero__trust"
                aria-label={trustAriaLabel}
              >
                {trustItems.map((label) => (
                  <li key={label}>
                    <span
                      className="bof-mkt-private-fleets-hero__trust-mark"
                      aria-hidden
                    />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {imageCaption ? (
          <div className="bof-mkt-private-fleets-hero__caption">
            <p className="bof-mkt-private-fleets-hero__image-caption">
              {imageCaption}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
