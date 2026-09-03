"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ActivationIssue = {
  problem: string;
  cause: string;
  owner: string | null;
  correction: string;
  businessImpact: string;
  nextAction: string;
  recheck: string;
};

type ApiPayload = {
  candidate: { candidateId: string; fullName: string; email: string; phone: string; homeLocation: string; cdlClass: string; cdlState: string; cdlNumberMasked: string; recordedActivationStage: string; auditTrail: unknown };
  position: { positionCode: string; title: string; homeTerminal: string; freightType: string; primaryLanes: string; compensation: string; description: string };
  qualificationStatus: string;
  offerStatus: string;
  onboardingStatus: string;
  activationStage: string;
  activationStatus: string;
  activationReadiness: { ready: boolean; currentDecision: string; activationStatus: string; readinessReasons: string[] };
  readinessReasons: string[];
  blockingItems: ActivationIssue[];
  pendingItems: ActivationIssue[];
  nextRequiredAction: string;
  offerMetadata: { startDate: string | null; orientationDate: string | null; offerStatus: string };
  onboardingMetadata: { orientationDate: string | null; orientationLocation: string | null; onboardingStatus: string; onboardingChecklist: Array<{ label: string; status: string; source: string }>; onboardingNotes: string | null };
  latestInterview: { interviewCode: string; status: string; recommendation: string } | null;
  documentGateSummary: { total: number; blocked: number; open: number; satisfied: number };
  paylocityHandoffPreview: { label: string; status: string; payload: Record<string, unknown> };
  manualActivation: { implemented: boolean; reason: string };
};

type Props = { candidateId: string };

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function safeText(value: string | null | undefined) {
  return value && value.trim() ? value : "Not configured";
}

function decisionClass(status: string) {
  if (status === "READY") return "border-emerald-500/70 bg-emerald-950/35 text-emerald-50";
  if (status === "ACTIVE") return "border-sky-500/70 bg-sky-950/35 text-sky-50";
  return "border-rose-500/70 bg-rose-950/35 text-rose-50";
}

function statusPillClass(status: string) {
  if (status === "READY" || status === "ACCEPTED" || status === "COMPLETE") return "border-emerald-500/50 bg-emerald-950/30 text-emerald-100";
  if (status === "PENDING" || status === "IN_PROGRESS" || status === "SENT") return "border-amber-500/50 bg-amber-950/30 text-amber-100";
  return "border-rose-500/50 bg-rose-950/35 text-rose-100";
}

function auditRows(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function RecruitingV2ActivationApiPanel({ candidateId }: Props) {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadActivation = useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/recruiting-v2/activation/${encodeURIComponent(candidateId)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setPayload(null);
      setError(body?.error ?? "Unable to load activation readiness");
      return;
    }
    setPayload(body as ApiPayload);
  }, [candidateId]);

  useEffect(() => {
    void loadActivation();
  }, [loadActivation]);

  if (error) return <p className="mt-5 rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</p>;
  if (!payload) return <p className="mt-5 text-sm text-slate-400">Loading activation readiness...</p>;

  const auditTrail = auditRows(payload.candidate.auditTrail);
  const issueRows = [...payload.blockingItems, ...payload.pendingItems];

  return (
    <section className="mt-5 rounded-xl border border-teal-800/70 bg-slate-950 p-4">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr_1fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Candidate</p>
          <h2 className="mt-1 text-xl font-black text-white">{payload.candidate.fullName}</h2>
          <p className="mt-1 text-sm text-slate-300">{payload.candidate.candidateId} · {payload.candidate.homeLocation}</p>
          <p className="mt-1 text-sm text-slate-300">{payload.position.title} · {payload.position.positionCode}</p>
          <p className="mt-1 text-sm text-slate-400">{payload.position.homeTerminal} · {payload.position.freightType}</p>
        </div>
        <div className={`rounded-xl border p-4 ${decisionClass(payload.activationStatus)}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">Current Activation Decision</p>
          <h2 className="mt-1 text-3xl font-black">{payload.activationReadiness.currentDecision}</h2>
          <p className="mt-2 text-sm font-bold">Why: {payload.readinessReasons[0] ?? issueRows[0]?.cause ?? "Activation prerequisites are incomplete."}</p>
        </div>
        <div className="rounded-xl border border-teal-800/70 bg-teal-950/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Next Required Action</p>
          <h2 className="mt-1 text-xl font-black text-teal-50">{payload.nextRequiredAction}</h2>
          <p className="mt-2 text-sm text-teal-100">Ready means ready for authorized handoff review. It does not create a Driver or Paylocity employee.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {[['Qualification', payload.qualificationStatus], ['Offer', payload.offerStatus], ['Onboarding', payload.onboardingStatus], ['Activation Status', payload.activationStatus], ['Activation Stage', payload.activationStage]].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusPillClass(value)}`}>{formatStatus(value)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Activation readiness</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            <p>Ready: <strong className="text-white">{payload.activationReadiness.ready ? "YES" : "NO"}</strong></p>
            <p>Document Gates: {payload.documentGateSummary.satisfied} satisfied · {payload.documentGateSummary.open} open · {payload.documentGateSummary.blocked} blocked</p>
            <p>Latest Interview: {payload.latestInterview ? `${payload.latestInterview.interviewCode} · ${formatStatus(payload.latestInterview.status)} · ${formatStatus(payload.latestInterview.recommendation)}` : "Not configured"}</p>
            <p>Orientation: {safeText(payload.onboardingMetadata.orientationDate)} · {safeText(payload.onboardingMetadata.orientationLocation)}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {payload.qualificationStatus !== "READY" ? <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/qualification`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Complete Qualification</Link> : null}
            {payload.offerStatus !== "ACCEPTED" ? <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/offer`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Offer Acceptance Required</Link> : null}
            {payload.offerStatus === "ACCEPTED" && payload.onboardingStatus !== "COMPLETE" ? <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/onboarding`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Complete Onboarding</Link> : null}
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Responsibility / exceptions</p>
          <div className="mt-3 grid gap-2">
            {issueRows.length > 0 ? issueRows.map((issue) => (
              <div key={`${issue.problem}-${issue.cause}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                <p className="font-black text-white">{issue.problem}</p>
                <p>Cause: {issue.cause}</p>
                <p>Owner: {safeText(issue.owner)}</p>
                <p>Correction: {issue.correction}</p>
                <p>Business Impact: {issue.businessImpact}</p>
                <p>Recheck: {issue.recheck}</p>
              </div>
            )) : <p className="text-sm text-emerald-100">No unresolved activation readiness issues.</p>}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Operational record viewer</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            <p>Offer start date: {safeText(payload.offerMetadata.startDate)}</p>
            <p>Offer orientation date: {safeText(payload.offerMetadata.orientationDate)}</p>
            <p>Onboarding notes: {safeText(payload.onboardingMetadata.onboardingNotes)}</p>
          </div>
          <div className="mt-3 grid gap-2">
            {payload.onboardingMetadata.onboardingChecklist.length > 0 ? payload.onboardingMetadata.onboardingChecklist.map((item) => (
              <div key={`${item.label}-${item.source}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                <span>{item.label}</span>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusPillClass(item.status)}`}>{formatStatus(item.status)}</span>
              </div>
            )) : <p className="text-sm text-slate-300">No onboarding checklist metadata configured.</p>}
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Paylocity handoff preview</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-amber-100">PREVIEW ONLY · NOT SENT · NOT CREATED IN PAYLOCITY</p>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">{JSON.stringify(payload.paylocityHandoffPreview.payload, null, 2)}</pre>
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Driver handoff</p>
          <p className="mt-2 text-sm text-slate-300">Recruiting V2 Candidate to future Driver creation / activation to existing BOF Driver, Driver Vault, DQF, and Dispatch Eligibility. No Driver record is created here.</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Manual activation behavior</p>
          <p className="mt-2 text-sm text-slate-300">{payload.manualActivation.reason}</p>
          <span className="mt-3 inline-flex rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Activation not implemented</span>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Audit trail</p>
          <p className="mt-2 text-sm text-slate-300">Calculated activation readiness is separate from recorded activation events.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">{auditTrail.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>
    </section>
  );
}