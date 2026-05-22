export type MarketingProcessStep = {
  title: string;
  description: string;
};

export function MarketingProcessSteps({ steps }: { steps: readonly MarketingProcessStep[] }) {
  return (
    <div className="bof-mkt-process">
      {steps.map((s) => (
        <div key={s.title} className="bof-mkt-process-step">
          <h3>{s.title}</h3>
          <p>{s.description}</p>
        </div>
      ))}
    </div>
  );
}
