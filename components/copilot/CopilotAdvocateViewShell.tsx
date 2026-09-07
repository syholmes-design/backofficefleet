"use client";

import Link from "next/link";
import type { CopilotAccessDecision } from "@/lib/copilot/copilot-advocate-access";
import type { CopilotAdvocateView, CopilotClaimClass } from "@/lib/copilot/copilot-shared";

export type CopilotAdvocateViewShellProps = {
  variant?: "full" | "compact";
  tone?: "command" | "ops";
  headingId: string;
  kicker: string;
  title: string;
  compactHref: string;
  compactLabel: string;
  access: CopilotAccessDecision;
  view: CopilotAdvocateView | null;
};

function claimLabel(value: CopilotClaimClass): string {
  return value.replaceAll("_", " ");
}

export function CopilotAdvocateViewShell({
  variant = "full",
  tone = "command",
  headingId,
  kicker,
  title,
  compactHref,
  compactLabel,
  access,
  view,
}: CopilotAdvocateViewShellProps) {
  const compact = variant === "compact";
  const command = tone === "command";
  const shell = command
    ? "mb-6 min-w-0 overflow-x-hidden break-words rounded-xl border border-slate-700 bg-slate-900/75 p-5"
    : "bof-load-file-card min-w-0 overflow-x-hidden";
  const titleClass = command ? "mt-1 text-xl font-semibold text-white" : "bof-load-file-h2";
  const bodyClass = command ? "mt-2 max-w-3xl text-sm text-slate-300" : "bof-load-file-note";
  const cardClass = command ? "min-w-0 overflow-x-hidden rounded-lg border border-slate-700 bg-slate-950/50 p-3" : "bof-load-file-note min-w-0";
  const headingClass = command ? "text-sm font-semibold text-white" : "bof-load-file-h3";
  const textClass = command ? "text-sm text-slate-300 break-words" : "bof-load-file-body";
  const ctaClass = command
    ? "inline break-words text-teal-200 underline underline-offset-2"
    : "bof-load-file-cta";

  return (
    <section className={shell} aria-labelledby={headingId}>
      <p className={command ? "text-xs font-semibold uppercase tracking-[0.14em] text-teal-200" : "bof-load-file-kicker"}>
        {kicker}
      </p>
      <h2 id={headingId} className={titleClass}>
        {title}
      </h2>
      <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>{access.note}</p>
      {!view ? (
        <p className={bodyClass}>
          {access.reason === "AUTH_PENDING"
            ? "Checking existing BOF access. Protected Copilot information is not shown yet."
            : "Copilot Advocate information is not available for this role."}
        </p>
      ) : (
        <>
          <p className={bodyClass}>{view.overview}</p>
          <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>
            Claim class: {claimLabel(view.overviewClass)}. {view.reasoningNote}
          </p>
          <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>{view.readOnlyNote}</p>
          <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>{view.permissionNote}</p>
          {view.assignmentProtectionNote ? (
            <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>{view.assignmentProtectionNote}</p>
          ) : null}
          {view.triageNote ? (
            <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>{view.triageNote}</p>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className={cardClass}>
              <h3 className={headingClass}>Authoritative facts</h3>
              {view.facts.length === 0 ? (
                <p className={`mt-2 ${textClass}`}>Honest empty — no in-scope facts copied.</p>
              ) : (
                <ul className="mt-2 grid gap-3">
                  {(compact ? view.facts.slice(0, 3) : view.facts).map((row) => (
                    <li key={row.id} className={textClass}>
                      <p>
                        <strong>{row.domain}</strong>
                        {" · "}
                        {row.fact}
                      </p>
                      <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>
                        Source: {row.source}. Class: {row.sourceClass}. Cause: {row.causeClass.replaceAll("_", " ")}. {row.recordedCause}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={cardClass}>
              <h3 className={headingClass}>Source conflicts</h3>
              {view.conflicts.length === 0 ? (
                <p className={`mt-2 ${textClass}`}>No conflicting authoritative statements were copied in this scope.</p>
              ) : (
                <ul className="mt-2 grid gap-3">
                  {view.conflicts.map((row) => (
                    <li key={row.id} className={textClass}>
                      {row.sources.map((source) => (
                        <p key={`${row.id}-${source.name}`}>
                          <strong>{source.name}</strong> ({source.authority}): {source.statement}
                        </p>
                      ))}
                      <p className="mt-1">{row.explanation}</p>
                      <p className="mt-1">Owner: {row.owner}</p>
                      {row.href ? (
                        <p className="mt-1">
                          <Link className={ctaClass} href={row.href}>
                            {row.resolutionLabel}
                          </Link>
                          {" "}
                          <span className={command ? "text-xs text-slate-500" : undefined}>(navigation only)</span>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={`mt-4 ${cardClass}`}>
            <h3 className={headingClass}>Recommendations</h3>
            <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>
              Suggested order is Copilot-derived. Copilot does not execute the workflow.
            </p>
            {view.guidance.length === 0 ? (
              <p className={`mt-2 ${textClass}`}>No recommendation is manufactured without an existing workflow CTA.</p>
            ) : (
              <ol className="mt-2 grid gap-3">
                {(compact ? view.guidance.slice(0, 3) : view.guidance).map((row) => (
                  <li key={row.id} className={textClass}>
                    <p>
                      <span aria-label={`Derived priority ${row.derivedPriority}`}>{row.derivedPriority.replaceAll("_", " ")}</span>
                      {" · "}
                      {row.workflow}
                    </p>
                    <p className="mt-1"><strong>Source:</strong> {row.source}</p>
                    <p className="mt-1"><strong>Fact:</strong> {row.fact}</p>
                    <p className="mt-1"><strong>Interpretation:</strong> {row.interpretation}</p>
                    <p className="mt-1">
                      <strong>Recommended action:</strong>{" "}
                      <Link className={ctaClass} href={row.href}>
                        {row.recommendedAction}
                      </Link>
                      {" "}
                      <span className={command ? "text-xs text-slate-500" : undefined}>(navigation, not execution)</span>
                    </p>
                    <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>
                      Owner: {row.owner}. {row.priorityNote} Executable: {String(row.executable)}.
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {compact ? (
            <p className={`mt-3 ${textClass}`}>
              <Link className={ctaClass} href={compactHref}>
                {compactLabel}
              </Link>
            </p>
          ) : (
            <>
              <div className={`mt-4 ${cardClass}`}>
                <h3 className={headingClass}>Derived interpretations</h3>
                {view.interpretations.length === 0 ? (
                  <p className={`mt-2 ${textClass}`}>No derived interpretation beyond copied facts.</p>
                ) : (
                  <ul className="mt-2 grid gap-2">
                    {view.interpretations.map((row) => (
                      <li key={row.id} className={textClass}>
                        {row.text} Claim class: {claimLabel(row.claimClass)}.
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {view.decisionSupport && view.decisionSupport.length > 0 ? (
                <div className={`mt-4 ${cardClass}`}>
                  <h3 className={headingClass}>Decision support</h3>
                  <p className={command ? "mt-1 text-xs text-slate-500" : "bof-load-file-note"}>
                    Options and tradeoffs are Copilot-derived. Copilot does not select or execute a Dispatch decision.
                  </p>
                  <ul className="mt-2 grid gap-2">
                    {view.decisionSupport.map((row) => (
                      <li key={row.id} className={textClass}>
                        {row.text} Claim class: {claimLabel(row.claimClass)}.
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className={`mt-4 ${cardClass}`}>
                <h3 className={headingClass}>Cross-workflow relationships</h3>
                <ul className="mt-2 grid gap-2">
                  {view.crossWorkflow.map((row) => (
                    <li key={row.relationship} className={textClass}>
                      <strong>{row.relationship}</strong> ({row.relationshipClass}): {row.note}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`mt-4 ${cardClass}`}>
                <h3 className={headingClass}>Unsupported / unavailable</h3>
                <ul className="mt-2 grid gap-2">
                  {view.unsupported.map((row) => (
                    <li key={row} className={textClass}>
                      {row}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
