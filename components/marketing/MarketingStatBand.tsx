export type MarketingStat = {
  label: string;
  value: string;
  hint?: string;
};

export function MarketingStatBand({ stats }: { stats: readonly MarketingStat[] }) {
  return (
    <div className="bof-mkt-stat-band" role="group" aria-label="Operational snapshot">
      {stats.map((s) => (
        <div key={s.label} className="bof-mkt-stat">
          <p className="bof-mkt-stat-label">{s.label}</p>
          <p className="bof-mkt-stat-value">{s.value}</p>
          {s.hint ? <p className="bof-mkt-stat-hint">{s.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
