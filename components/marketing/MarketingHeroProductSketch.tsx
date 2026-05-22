/** Abstract product window used in premium marketing heroes (home + sectors). */
export function MarketingHeroProductSketch({
  windowTitle = "Operations command view",
  caption,
}: {
  windowTitle?: string;
  caption: string;
}) {
  return (
    <div className="bof-mkt-hero-visual-card">
      <div className="bof-mkt-hero-visual-frame" aria-hidden>
        <div className="bof-mkt-hero-visual-header">
          <span className="bof-mkt-hero-visual-dot" />
          <span className="bof-mkt-hero-visual-dot" />
          <span className="bof-mkt-hero-visual-dot" />
          <span className="bof-mkt-hero-visual-title">{windowTitle}</span>
        </div>
        <div className="bof-mkt-hero-visual-body">
          <div className="bof-mkt-hero-visual-row bof-mkt-hero-visual-row--accent" />
          <div className="bof-mkt-hero-visual-row" />
          <div className="bof-mkt-hero-visual-row" />
          <div className="bof-mkt-hero-visual-row bof-mkt-hero-visual-row--muted" />
        </div>
      </div>
      <p className="bof-mkt-hero-visual-caption">{caption}</p>
    </div>
  );
}
