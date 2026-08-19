"use client";

import {
  formatShortDateTime,
  getJsonStringArray,
  statusTone,
  type DispatchReleaseRecord,
} from "@/lib/dispatch-workflow-ui";

type Props = {
  releases: DispatchReleaseRecord[];
  latestReleaseId?: string | null;
};

export function DispatchReleaseHistory({ releases, latestReleaseId }: Props) {
  if (releases.length === 0) {
    return <p className="bof-muted bof-small">No release history is stored for this load yet.</p>;
  }

  return (
    <div className="space-y-3">
      {releases.map((release) => {
        const reasonCodes = getJsonStringArray(release.reasonCodes);
        const latest = latestReleaseId === release.id;

        return (
          <article
            key={release.id}
            className={`rounded-lg border p-4 ${
              latest ? "border-teal-500/55 bg-teal-950/20" : "border-slate-800 bg-slate-950/55"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {latest ? "Latest release" : "History"}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{release.summary}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(release.disposition, "release")}`}>
                {release.disposition}
              </span>
            </div>
            <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
              <div>
                <dt className="uppercase tracking-wide text-slate-500">Evaluated</dt>
                <dd>{formatShortDateTime(release.evaluatedAt)}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-500">Evaluator</dt>
                <dd>{release.evaluatedByUserId ?? "System"}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-500">Policy</dt>
                <dd>{release.policyVersion}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-slate-500">Reason codes</dt>
                <dd>{reasonCodes.length > 0 ? reasonCodes.join(", ") : "None"}</dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}
