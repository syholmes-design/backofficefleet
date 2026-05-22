export function MarketingValuePillars({
  items,
}: {
  items: readonly { title: string; text: string }[];
}) {
  return (
    <div className="bof-mkt-value-grid">
      {items.map((item) => (
        <div key={item.title} className="bof-mkt-value-card">
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </div>
      ))}
    </div>
  );
}
