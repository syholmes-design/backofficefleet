"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OnboardingAction = "START_ONBOARDING" | "SAVE_ONBOARDING_METADATA" | "UPDATE_CHECKLIST" | "COMPLETE_ONBOARDING";
type ChecklistStatus = "COMPLETE" | "PENDING" | "BLOCKED" | "NOT_APPLICABLE";

type ChecklistItem = {
  key: string;
  label: string;
  status: ChecklistStatus;
  required: boolean;
  source: string;
  reason: string;
};

type Issue = {
  problem: string;
  cause: string;
  owner: string | null;
  requiredAction: string;
  businessImpact: string;
  nextAction: string;
};

type ApiPayload = {
  candidate: { candidateId: string; fullName: string; homeLocation: string; activationStage: string; activationStatus: string; auditTrail: unknown };
  position: { positionCode: string; title: string; homeTerminal: string; freightType: string; compensation: string };
  qualificationStatus: string;
  qualificationReason: string;
  offerStatus: string;
  onboardingStatus: "PENDING" | "IN_PROGRESS" | "COMPLETE";
  onboardingEligibility: { eligible: boolean; reason: string };
  onboardingSummary: { orientationDate: string | null; orientationLocation: string | null; onboardingNotes: string | null };
  onboardingChecklist: ChecklistItem[];
  currentDecision: string;
  blockingItems: Issue[];
  pendingItems: Issue[];
  completedItems: string[];
  nextRequiredAction: string;
  actions: OnboardingAction[];
  activationReadinessSummary: { activationStatus: string; activationStage: string; ready: boolean; nextRequiredAction: string };
  latestInterview: { interviewCode: string; status: string; recommendation: string } | null;
  offerMetadata: { offerStatus: string; startDate: string | null; orientationDate: string | null };
};

type Props = { candidateId: string };

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function safeText(value: string | null | undefined, fallback = "Not scheduled") {
  return value && value.trim() ? value : fallback;
}

function statusClass(status: string) {
  if (status === "READY" || status === "ACCEPTED" || status === "COMPLETE") return "border-emerald-500/50 bg-emerald-950/30 text-emerald-100";
  if (status === "BLOCKED" || status === "DECLINED" || status === "NOT ELIGIBLE") return "border-rose-500/50 bg-rose-950/35 text-rose-100";
  return "border-amber-500/50 bg-amber-950/30 text-amber-100";
}

function decisionClass(decision: string) {
  if (decision === "COMPLETE") return "border-emerald-500/70 bg-emerald-950/35 text-emerald-50";
  if (decision === "IN PROGRESS" || decision === "PENDING") return "border-amber-500/70 bg-amber-950/30 text-amber-50";
  return "border-rose-500/70 bg-rose-950/35 text-rose-50";
}

function auditRows(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatDateForInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function RecruitingV2OnboardingApiPanel({ candidateId }: Props) {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<OnboardingAction | null>(null);
  const [orientationDate, setOrientationDate] = useState("");
  const [orientationLocation, setOrientationLocation] = useState("");
  const [onboardingNotes, setOnboardingNotes] = useState("Synthetic Recruiting V2 onboarding metadata.");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const loadOnboarding = useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/recruiting-v2/onboarding/${encodeURIComponent(candidateId)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setPayload(null);
      setError(body?.error ?? "Unable to load onboarding state");
      return;
    }
    const nextPayload = body as ApiPayload;
    setPayload(nextPayload);
    setOrientationDate((current) => current || formatDateForInput(nextPayload.onboardingSummary.orientationDate ?? nextPayload.offerMetadata.orientationDate));
    setOrientationLocation((current) => current || nextPayload.onboardingSummary.orientationLocation || "");
    setOnboardingNotes((current) => current || nextPayload.onboardingSummary.onboardingNotes || "Synthetic Recruiting V2 onboarding metadata.");
    setChecklist(nextPayload.onboardingChecklist);
  }, [candidateId]);

  useEffect(() => {
    void loadOnboarding();
  }, [loadOnboarding]);

  async function runAction(action: OnboardingAction) {
    if (!payload) return;
    setBusyAction(action);
    setError(null);
    try {
      const statusByAction: Partial<Record<OnboardingAction, ApiPayload["onboardingStatus"]>> = {
        START_ONBOARDING: "IN_PROGRESS",
        COMPLETE_ONBOARDING: "COMPLETE",
      };
      const response = await fetch(`/api/recruiting-v2/onboarding/${encodeURIComponent(candidateId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          onboardingStatus: statusByAction[action] ?? payload.onboardingStatus,
          orientationDate: orientationDate || null,
          orientationLocation,
          onboardingNotes,
          onboardingChecklist: checklist,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to update onboarding metadata");
      const nextPayload = body as ApiPayload;
      setPayload(nextPayload);
      setChecklist(nextPayload.onboardingChecklist);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update onboarding metadata");
    } finally {
      setBusyAction(null);
    }
  }

  function setChecklistStatus(key: string, status: ChecklistStatus) {
    setChecklist((rows) => rows.map((row) => row.key === key ? { ...row, status, reason: status === "COMPLETE" ? `${row.label} completed in Recruiting V2 onboarding metadata.` : row.reason } : row));
  }

  if (error && !payload) return <p className="mt-5 rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</p>;
  if (!payload) return <p className="mt-5 text-sm text-slate-400">Loading onboarding state...</p>;

  const auditTrail = auditRows(payload.candidate.auditTrail);
  const issues = [...payload.blockingItems, ...payload.pendingItems];

  return (
    <section className="mt-5 rounded-xl border border-teal-800/70 bg-slate-950 p-4">
      {error ? <p className="mb-3 rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</p> : null}
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr_1fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Candidate</p>
          <h2 className="mt-1 text-xl font-black text-white">{payload.candidate.fullName}</h2>
          <p className="mt-1 text-sm text-slate-300">{payload.candidate.candidateId} · {payload.candidate.homeLocation}</p>
          <p className="mt-1 text-sm text-slate-300">{payload.position.title} · {payload.position.positionCode}</p>
          <p className="mt-1 text-sm text-slate-400">{payload.position.homeTerminal} · {payload.position.freightType}</p>
        </div>
        <div className={`rounded-xl border p-4 ${decisionClass(payload.currentDecision)}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">Current Onboarding Decision</p>
          <h2 className="mt-1 text-3xl font-black">{payload.currentDecision}</h2>
          <p className="mt-2 text-sm font-bold">Why: {payload.onboardingEligibility.reason}</p>
        </div>
        <div className="rounded-xl border border-teal-800/70 bg-teal-950/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Next Required Action</p>
          <h2 className="mt-1 text-xl font-black text-teal-50">{payload.nextRequiredAction}</h2>
          {payload.activationReadinessSummary.ready ? <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/activation`} className="mt-3 inline-flex rounded-md border border-teal-600 px-3 py-2 text-xs font-black text-teal-100 hover:bg-teal-900/50">Ready for Activation Review</Link> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {[['Qualification', payload.qualificationStatus], ['Offer', payload.offerStatus], ['Onboarding', payload.onboardingStatus], ['Eligibility', payload.onboardingEligibility.eligible ? 'READY' : 'BLOCKED'], ['Activation', payload.activationReadinessSummary.activationStatus]].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(value)}`}>{formatStatus(value)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Operational record viewer</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold text-slate-300">Orientation Date<input value={orientationDate} onChange={(event) => setOrientationDate(event.target.value)} type="date" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            <label className="grid gap-1 text-xs font-bold text-slate-300">Orientation Location<input value={orientationLocation} onChange={(event) => setOrientationLocation(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          </div>
          <label className="mt-3 grid gap-1 text-xs font-bold text-slate-300">Onboarding Notes<textarea value={onboardingNotes} onChange={(event) => setOnboardingNotes(event.target.value)} rows={3} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <div className="mt-3 flex flex-wrap gap-2">
            {payload.actions.includes("START_ONBOARDING") ? <button type="button" onClick={() => void runAction("START_ONBOARDING")} disabled={Boolean(busyAction)} className="rounded-md border border-teal-600 bg-teal-950/50 px-3 py-2 text-xs font-black text-teal-100 hover:bg-teal-900/60 disabled:opacity-50">{busyAction === "START_ONBOARDING" ? "Starting..." : "Start Onboarding"}</button> : null}
            {payload.actions.includes("SAVE_ONBOARDING_METADATA") ? <button type="button" onClick={() => void runAction("SAVE_ONBOARDING_METADATA")} disabled={Boolean(busyAction)} className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-800 disabled:opacity-50">{busyAction === "SAVE_ONBOARDING_METADATA" ? "Saving..." : "Save Onboarding Metadata"}</button> : null}
            {payload.actions.includes("UPDATE_CHECKLIST") ? <button type="button" onClick={() => void runAction("UPDATE_CHECKLIST")} disabled={Boolean(busyAction)} className="rounded-md border border-sky-600 bg-sky-950/50 px-3 py-2 text-xs font-black text-sky-100 hover:bg-sky-900/60 disabled:opacity-50">{busyAction === "UPDATE_CHECKLIST" ? "Updating..." : "Update Checklist"}</button> : null}
            {payload.actions.includes("COMPLETE_ONBOARDING") ? <button type="button" onClick={() => void runAction("COMPLETE_ONBOARDING")} disabled={Boolean(busyAction)} className="rounded-md border border-emerald-600 bg-emerald-950/50 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-900/60 disabled:opacity-50">{busyAction === "COMPLETE_ONBOARDING" ? "Completing..." : "Complete Onboarding"}</button> : null}
            {payload.actions.length === 0 ? <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Onboarding actions unavailable until prerequisites are satisfied</span> : null}
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Operational risks</p>
          <div className="mt-3 grid gap-2">
            {issues.length > 0 ? issues.slice(0, 5).map((issue) => (
              <div key={`${issue.problem}-${issue.cause}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                <p className="font-black text-white">{issue.problem}</p>
                <p>Cause: {issue.cause}</p>
                <p>Owner: {safeText(issue.owner, 'Not provided')}</p>
                <p>Required Action: {issue.requiredAction}</p>
                <p>Business Impact: {issue.businessImpact}</p>
                <p>Next Action: {issue.nextAction}</p>
              </div>
            )) : <p className="text-sm text-emerald-100">No unresolved onboarding risks.</p>}
          </div>
        </article>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Onboarding checklist</p>
        <div className="mt-3 grid gap-2">
          {checklist.map((item) => (
            <div key={item.key} className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300 md:grid-cols-[1fr_0.7fr_1.2fr]">
              <div><p className="font-black text-white">{item.label}</p><p className="text-xs text-slate-500">{item.source}</p></div>
              <select value={item.status} onChange={(event) => setChecklistStatus(item.key, event.target.value as ChecklistStatus)} disabled={!payload.actions.includes("UPDATE_CHECKLIST") || item.source !== "Recruiting V2 onboarding metadata"} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white disabled:opacity-60">
                {['COMPLETE', 'PENDING', 'BLOCKED', 'NOT_APPLICABLE'].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
              </select>
              <p>{item.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Business impact</p><p className="mt-2 text-sm text-slate-300">Qualification incomplete blocks onboarding entry. Offer not accepted blocks onboarding entry. Onboarding incomplete prevents activation readiness. Onboarding complete may proceed to Activation Review.</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Related enterprise objects</p><div className="mt-3 flex flex-wrap gap-2"><Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/qualification`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Qualification</Link><Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/documents`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Documents</Link><Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/interview`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Interview</Link><Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/offer`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Offer</Link><Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/activation`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Activation</Link></div></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Audit trail</p><p className="mt-2 text-sm text-slate-300">Current calculated state is separate from recorded historical events.</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">{auditTrail.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </div>
    </section>
  );
}