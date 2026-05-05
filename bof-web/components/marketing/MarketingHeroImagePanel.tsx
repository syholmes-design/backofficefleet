/**
 * BOF Shared Component:
 * Used by: shared marketing hero wrappers (private/government/vault)
 * Do not edit for one page unless props/page-specific overrides are used.
 * See docs/BOF_ROUTE_MAP.md.
 */
import type { CSSProperties } from "react";

type MarketingHeroImagePanelProps = {
  windowTitle: string;
  caption: string;
  imagePath: string;
  fallbackImagePath?: string;
};

type HeroImageVars = CSSProperties & {
  "--bof-mkt-hero-image-url": string;
  "--bof-mkt-hero-image-fallback-url": string;
};

/**
 * Premium hero image panel for marketing sectors.
 * Uses layered CSS backgrounds so missing primary assets gracefully fall back.
 */
export function MarketingHeroImagePanel({
  windowTitle,
  caption,
  imagePath,
  fallbackImagePath,
}: MarketingHeroImagePanelProps) {
  const imageVars: HeroImageVars = {
    "--bof-mkt-hero-image-url": `url("${imagePath}")`,
    "--bof-mkt-hero-image-fallback-url": fallbackImagePath
      ? `url("${fallbackImagePath}")`
      : "none",
  };

  return (
    <div className="bof-mkt-hero-visual-card bof-mkt-hero-image-card">
      <div className="bof-mkt-hero-visual-frame" aria-hidden>
        <div className="bof-mkt-hero-visual-header">
          <span className="bof-mkt-hero-visual-dot" />
          <span className="bof-mkt-hero-visual-dot" />
          <span className="bof-mkt-hero-visual-dot" />
          <span className="bof-mkt-hero-visual-title">{windowTitle}</span>
        </div>
        <div
          className="bof-mkt-hero-image-surface"
          style={imageVars}
          role="img"
          aria-label={`${windowTitle} hero visual`}
        />
      </div>
      <p className="bof-mkt-hero-visual-caption">{caption}</p>
    </div>
  );
}
