"use client";

export type OpsWorkflowStep = {
  step: string;
  title: string;
  detail: string;
  value?: string | number;
  tone?: "ready" | "warning" | "blocked" | "neutral";
};

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  steps: OpsWorkflowStep[];
  variant?: "dark" | "light";
  headingId?: string;
};

export function OpsWorkflowRail({
  eyebrow,
  title,
  description,
  steps,
  variant = "dark",
  headingId = "bof-ops-flow-title",
}: Props) {
  return (
    <section className={`bof-ops-flow bof-ops-flow--${variant}`} aria-labelledby={headingId}>
      <div className="bof-ops-flow__head">
        <p className="bof-ops-flow__eyebrow">{eyebrow}</p>
        <h2 id={headingId} className="bof-ops-flow__title">
          {title}
        </h2>
        {description ? <p className="bof-ops-flow__lede">{description}</p> : null}
      </div>
      <ol className="bof-ops-flow__track">
        {steps.map((item, index) => (
          <li
            key={`${item.step}-${item.title}`}
            className={`bof-ops-flow__step bof-ops-flow__step--${item.tone ?? "neutral"}`}
          >
            <span className="bof-ops-flow__index">{String(index + 1).padStart(2, "0")}</span>
            <span className="bof-ops-flow__step-label">{item.step}</span>
            {item.value !== undefined ? (
              <strong className="bof-ops-flow__value">{item.value}</strong>
            ) : null}
            <span className="bof-ops-flow__step-title">{item.title}</span>
            <span className="bof-ops-flow__step-detail">{item.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
