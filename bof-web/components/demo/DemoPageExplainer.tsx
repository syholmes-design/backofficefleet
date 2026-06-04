"use client";

export type DemoPageExplainerProps = {
  what: string;
  why: string;
  attention: string;
  className?: string;
};

const EXPLAINER_SUMMARY = "What am I looking at?";

export function DemoPageExplainer({
  what,
  why,
  attention,
  className = "",
}: DemoPageExplainerProps) {
  return (
    <details className={`bof-demo-page-explainer ${className}`.trim()}>
      <summary className="bof-demo-page-explainer__summary">{EXPLAINER_SUMMARY}</summary>
      <div className="bof-demo-page-explainer__body">
        <dl className="bof-demo-page-explainer__dl">
          <div className="bof-demo-page-explainer__row">
            <dt>What this page shows</dt>
            <dd>{what}</dd>
          </div>
          <div className="bof-demo-page-explainer__row">
            <dt>Why does it matter?</dt>
            <dd>{why}</dd>
          </div>
          <div className="bof-demo-page-explainer__row">
            <dt>What needs attention?</dt>
            <dd>{attention}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
