"use client";

import { useCallback, useEffect, useState } from "react";

type ApiInterview = {
  id: string;
  interviewCode: string;
  interviewDate: string | null;
  interviewType: string;
  location: string;
  status: string;
  score: number | null;
  recommendation: string;
  interviewers: unknown;
  notes: string | null;
  scores: unknown;
};

type ApiPayload = {
  candidate: { candidateId: string; fullName: string; homeLocation?: string };
  position: {
    positionCode: string;
    title: string;
    homeTerminal?: string;
    freightType?: string;
    primaryLanes?: string;
    compensation?: string;
    description?: string;
  };
  interviews: ApiInterview[];
};

type Props = { candidateId: string };

type InterviewerRow = { name: string; role: string; email: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function safeText(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "N/A";
}

function interviewerRows(value: unknown): InterviewerRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string" && entry.trim()) return [{ name: entry.trim(), role: "N/A", email: "N/A" }];
    const record = asRecord(entry);
    if (!record) return [];
    const name = safeText(record.name);
    return name === "N/A" ? [] : [{ name, role: safeText(record.role), email: safeText(record.email) }];
  });
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") return asRecord(value) ?? {};
  try {
    return asRecord(JSON.parse(value)) ?? {};
  } catch {
    return { summary: value };
  }
}

function scoreValue(scores: unknown, key: string) {
  const record = asRecord(scores);
  if (!record) return "N/A";
  const value = record[key];
  return typeof value === "number" || typeof value === "string" ? String(value) : "N/A";
}

function latestInterview(interviews: ApiInterview[]) {
  return [...interviews].sort((a, b) => {
    const aTime = a.interviewDate ? new Date(a.interviewDate).getTime() : 0;
    const bTime = b.interviewDate ? new Date(b.interviewDate).getTime() : 0;
    return bTime - aTime;
  })[0] ?? null;
}

function currentDecision(interview: ApiInterview | null) {
  if (!interview) return "Interview required";
  if (interview.status === "Scheduled") return "Interview scheduled";
  if (interview.status === "Completed" && interview.recommendation === "Pending") return "Interview completed - recommendation pending";
  if (interview.recommendation === "Advance") return "Advance";
  if (interview.recommendation === "Hold For Review") return "Hold";
  if (interview.recommendation === "Do Not Advance") return "Reject";
  return interview.status;
}

function nextRequiredAction(interview: ApiInterview | null) {
  if (!interview) return "Schedule Interview";
  if (interview.status === "Scheduled") return "Complete interview";
  if (interview.status === "Completed" && interview.recommendation === "Pending") return "Record recommendation";
  if (interview.recommendation === "Advance") return "Proceed to offer when qualification is complete";
  if (interview.recommendation === "Hold For Review") return "Return to qualification";
  if (interview.recommendation === "Do Not Advance") return "Do not advance candidate";
  return "Review interview record";
}

function noteRows(notes: string | null) {
  const record = parseJsonRecord(notes);
  const summary = safeText(record.summary);
  return [
    ["Strengths", safeText(record.strengths)],
    ["Concerns", safeText(record.concerns)],
    ["Summary", summary === "N/A" && notes ? "Interview notes recorded" : summary],
  ] as const;
}

export function RecruitingV2InterviewApiPanel({ candidateId }: Props) {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadInterviews = useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/recruiting-v2/interviews/${encodeURIComponent(candidateId)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setPayload(null);
      setError(body?.error ?? "Unable to load interviews");
      return;
    }
    setPayload(body as ApiPayload);
  }, [candidateId]);

  useEffect(() => {
    void loadInterviews();
  }, [loadInterviews]);

  async function scheduleSyntheticInterview() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/recruiting-v2/interviews/${encodeURIComponent(candidateId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          interviewDate: "2026-09-08T15:00:00.000Z",
          interviewType: "Structured operations interview",
          location: "Video interview",
          interviewers: [{ name: "BOF Recruiting Coordinator", role: "Recruiting", email: "recruiting@example.test" }],
          notes: { summary: "Synthetic interview scheduled from the Recruiting V2 workspace." },
          scores: {},
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to schedule interview");
      await loadInterviews();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to schedule interview");
    } finally {
      setBusy(false);
    }
  }

  const latest = payload ? latestInterview(payload.interviews) : null;
  const earlier = payload && latest ? payload.interviews.filter((interview) => interview.id !== latest.id) : [];
  const latestInterviewers = latest ? interviewerRows(latest.interviewers) : [];

  return (
    <section className="mt-5 rounded-xl border border-sky-800/70 bg-slate-950 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">API-backed interview state</p>
          <h2 className="mt-1 text-xl font-black text-white">Interview Workspace Record</h2>
          <p className="mt-1 text-sm text-slate-300">Reads and schedules interviews through the isolated Recruiting V2 API for {candidateId}.</p>
        </div>
        <button type="button" onClick={() => void scheduleSyntheticInterview()} disabled={busy} className="rounded-md border border-sky-600 bg-sky-950/50 px-3 py-2 text-xs font-black text-sky-100 hover:bg-sky-900/60 disabled:opacity-50">
          {busy ? "Scheduling..." : "Schedule Interview"}
        </button>
      </div>

      {error ? <p className="mt-3 rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</p> : null}
      {!payload && !error ? <p className="mt-3 text-sm text-slate-400">Loading interviews...</p> : null}

      {payload ? (
        <div className="mt-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Candidate</p>
              <p className="mt-1 text-sm font-black text-white">{payload.candidate.fullName}</p>
              <p className="mt-1 text-sm text-slate-300">{payload.candidate.candidateId} · {payload.candidate.homeLocation ?? "Location not provided"}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Position</p>
              <p className="mt-1 text-sm font-black text-white">{payload.position.title}</p>
              <p className="mt-1 text-sm text-slate-300">{payload.position.positionCode} · {payload.position.homeTerminal ?? "Home terminal pending"}</p>
            </div>
            <div className="rounded-lg border border-amber-800/70 bg-amber-950/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Current Decision</p>
              <p className="mt-1 text-sm font-black text-amber-50">{currentDecision(latest)}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-teal-300">Next Required Action</p>
              <p className="mt-1 text-sm font-black text-teal-50">{nextRequiredAction(latest)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Linked position</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Title</p><p className="mt-1 text-sm text-white">{payload.position.title}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Home terminal</p><p className="mt-1 text-sm text-white">{payload.position.homeTerminal ?? "N/A"}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Freight type</p><p className="mt-1 text-sm text-white">{payload.position.freightType ?? "N/A"}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary lanes</p><p className="mt-1 text-sm text-white">{payload.position.primaryLanes ?? "N/A"}</p></div>
            </div>
            <p className="mt-3 text-sm text-slate-300"><strong className="text-slate-500">Compensation:</strong> {payload.position.compensation ?? "N/A"}</p>
            <p className="mt-1 text-sm text-slate-300"><strong className="text-slate-500">Description:</strong> {payload.position.description ?? "N/A"}</p>
          </div>

          {latest ? (
            <article className="mt-4 rounded-xl border border-sky-800/70 bg-slate-900/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">Latest Interview</p>
                  <h3 className="mt-1 text-lg font-black text-white">{latest.interviewCode}</h3>
                  <p className="mt-1 text-sm text-slate-300">{latest.interviewType} · {latest.location}</p>
                </div>
                <span className="rounded-full border border-sky-700 bg-sky-950/40 px-3 py-1 text-xs font-black text-sky-100">{latest.status}</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Interview date</p><p className="mt-1 text-sm text-white">{latest.interviewDate ?? "No interview scheduled"}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overall score</p><p className="mt-1 text-sm text-white">{latest.score ?? "N/A"}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recommendation</p><p className="mt-1 text-sm text-white">{latest.recommendation}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</p><p className="mt-1 text-sm text-white">{latest.status}</p></div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Interviewers</p>
                  <div className="mt-2 grid gap-2">
                    {latestInterviewers.length > 0 ? latestInterviewers.map((row) => (
                      <div key={`${row.name}-${row.email}`} className="rounded border border-slate-800 bg-slate-900/70 p-2">
                        <p className="font-bold text-white">{row.name}</p>
                        <p className="text-slate-300">{row.role}</p>
                        <p className="text-slate-400">{row.email}</p>
                      </div>
                    )) : <p className="text-sm text-slate-300">N/A</p>}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category scores</p>
                  <dl className="mt-2 grid gap-1 text-sm text-slate-200">
                    <div className="flex justify-between gap-3"><dt>Communication</dt><dd>{scoreValue(latest.scores, "communication")}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Safety</dt><dd>{scoreValue(latest.scores, "safety")}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Experience</dt><dd>{scoreValue(latest.scores, "experience")}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Professionalism</dt><dd>{scoreValue(latest.scores, "professionalism")}</dd></div>
                  </dl>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notes</p>
                  <dl className="mt-2 grid gap-2 text-sm text-slate-200">
                    {noteRows(latest.notes).map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd>{value}</dd></div>)}
                  </dl>
                </div>
              </div>
            </article>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-800/70 bg-amber-950/20 p-4">
              <h3 className="text-lg font-black text-white">No interview scheduled</h3>
              <p className="mt-1 text-sm text-amber-100">Current Decision: Interview required</p>
              <p className="mt-1 text-sm text-teal-100">Next Required Action: Schedule Interview</p>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Interview actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void scheduleSyntheticInterview()} disabled={busy} className="rounded-md border border-sky-600 bg-sky-950/50 px-3 py-2 text-xs font-black text-sky-100 hover:bg-sky-900/60 disabled:opacity-50">{busy ? "Scheduling..." : "Schedule Interview"}</button>
              <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Update Interview not implemented by API</span>
              <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Record Recommendation not implemented by API</span>
              <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Save Notes not implemented by API</span>
              <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Save Scores not implemented by API</span>
            </div>
          </div>

          {earlier.length > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Earlier interviews</p>
              <div className="mt-3 grid gap-2">
                {earlier.map((interview) => (
                  <div key={interview.id} className="rounded border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                    <strong className="text-white">{interview.interviewCode}</strong> · {interview.interviewDate ?? "No date"} · {interview.status} · {interview.recommendation}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
