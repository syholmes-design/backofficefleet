export function MarketingTrustStrip({
  label = "Built for",
  items,
}: {
  label?: string;
  items: readonly string[];
}) {
  return (
    <div className="bof-mkt-trust-strip">
      <span className="bof-mkt-trust-strip-label">{label}</span>
      {items.map((t) => (
        <span key={t} className="bof-mkt-trust-pill">
          {t}
        </span>
      ))}
    </div>
  );
}
