"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BOF_TRAINING_LIBRARY,
  recommendTrainingForSafetyEvent,
  type BofTrainingAssignment,
} from "@/lib/bof-training-library";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";

export function SafetyTrainingLibrary({
  assignments,
}: {
  assignments: BofTrainingAssignment[];
}) {
  const [eventAssignments, setEventAssignments] = useState(assignments);

  useEffect(() => {
    let cancelled = false;
    async function loadRecommendations() {
      try {
        if (!(await isV3DataAvailable())) return;
        const data = await getV3OperationalData();
        const next = data.safetyEvents
          .filter((event) => event.coachingRequired || event.driverStatementRequired)
          .flatMap(recommendTrainingForSafetyEvent);
        if (!cancelled) setEventAssignments(next);
      } catch {
        // Keep the catalog available when the optional workbook is unavailable.
      }
    }
    void loadRecommendations();
    return () => {
      cancelled = true;
    };
  }, [assignments]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Safety operations</p>
          <h1 className="mt-2 text-3xl font-black text-white">Training &amp; Coaching Library</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            BOF-owned coaching modules and external FMCSA guidance stay distinct. Event recommendations reference the existing Safety event and driver records; completion does not close a resolution without supervisor review.
          </p>
        </header>

        <section aria-labelledby="training-catalog-heading">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="training-catalog-heading" className="text-xl font-bold text-white">Training catalog</h2>
            <Link href="/safety" className="text-sm font-semibold text-cyan-200 hover:text-white">Back to Safety</Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {BOF_TRAINING_LIBRARY.map((module) => (
              <article key={module.trainingId} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{module.category}</p>
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${module.ownership === "FMCSA" ? "border-blue-700/50 bg-blue-950/40 text-blue-200" : "border-teal-700/50 bg-teal-950/40 text-teal-200"}`}>
                    {module.ownership === "FMCSA" ? "External FMCSA" : "BOF internal"}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{module.description}</p>
                <p className="mt-4 text-xs text-slate-400">Audience: {module.audience}</p>
                <p className="mt-1 text-xs text-slate-400">Version {module.version} · Effective {module.effectiveDate}</p>
                <a href={module.resourceUrl} target={module.resourceUrl.startsWith("http") ? "_blank" : undefined} rel={module.resourceUrl.startsWith("http") ? "noreferrer" : undefined} className="mt-4 inline-flex text-sm font-bold text-cyan-200 hover:text-white">
                  {module.resourceLabel} →
                </a>
                {module.knowledgeCheck ? <p className="mt-3 text-xs font-semibold text-emerald-300">Knowledge check: {module.knowledgeCheck.length} question</p> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="training-recommendations-heading">
          <h2 id="training-recommendations-heading" className="text-xl font-bold text-white">Event-linked recommendations</h2>
          <p className="mt-2 text-sm text-slate-400">Recommendations are derived from existing Safety events. No assignment or completion is fabricated.</p>
          <div className="mt-4 space-y-3">
            {eventAssignments.length === 0 ? <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-400">No event-linked training recommendation is available.</p> : null}
            {eventAssignments.map((assignment) => (
              <article key={assignment.assignmentId} className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-white">{BOF_TRAINING_LIBRARY.find((module) => module.trainingId === assignment.trainingId)?.title ?? assignment.trainingId}</p>
                    <p className="mt-1 text-sm text-slate-300">{assignment.reason}</p>
                  </div>
                  <span className="rounded-full border border-amber-700/50 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-200">{assignment.status}</span>
                </div>
                <p className="mt-3 text-xs text-slate-400">Driver {assignment.driverId ?? "Not available"} · Resolution {assignment.resolutionId ?? "Not available"} · Due date {assignment.dueDate ?? "Not assigned"}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}