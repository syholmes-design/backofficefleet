"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type GateState = "OPEN" | "BLOCKED" | "SATISFIED";
type QualificationStatus = "READY" | "PENDING" | "BLOCKED";

type ApiDocumentRecord = {
  documentCode: string;
  documentType: string;
  status: string;
  expirationDate: string | null;
  uploadedBy: string | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  updatedAt: string;
};

type ApiGate = {
  documentType: string;
  label: string;
  documentStatus: string;
  gateState: GateState;
  reason: string;
  requiredAction: string;
  expirationStatus: string;
  expirationWarning: string | null;
  latestDocument: ApiDocumentRecord | null;
};

type ApiInterview = {
  interviewCode: string;
  interviewDate: string | null;
  interviewType: string;
  location: string;
  status: string;
  score: number | null;
  recommendation: string;
  interviewers: unknown;
};

type ApiRisk = {
  problem: string;
  cause: string;
  owner: string | null;
  requiredAction: string;
  businessImpact: string;
  nextAction: string;
  source: string;
  severity: "BLOCKING" | "PENDING";
};

type ApiPayload = {
  candidate: {
    candidateId: string;
    fullName: string;
    homeLocation: string;
    cdlClass: string;
    cdlState: string;
    cdlNumberMasked: string;
    applicationStatus: string;
    qualificationStatus: string;
    documentReviewStatus: string;
    complianceStatus: string;
    activationStage: string;
    auditTrail: unknown;
  };
  position: {
    positionCode: string;
    title: string;
    homeTerminal: string;
    freightType: string;
    primaryLanes: string;
    compensation: string;
  };
  qualificationSummary: {
    status: QualificationStatus;
    reason: string;
    blockingItems: string[];
    pendingItems: string[];
    satisfiedItems: string[];
    nextRequiredAction: string;
    calculatedStateLabel: string;
    gateCounts: { blocked: number; open: number; satisfied: number; total: number };
    interviewEvaluation: { label: string; status: string; reason: string; requiredAction: string };
  };
  documentGates: ApiGate[];
  latestInterview: ApiInterview | null;
  operationalRisks: ApiRisk[];
  currentDecision: QualificationStatus;
  nextRequiredAction: string;
  complianceGateRecords: Array<{ documentType: string; state: GateState; updatedAt: string }>;
};

type Props = { candidateId: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function interviewerNames(value: unknown) {
  if (!Array.isArray(value)) return "Not yet provided";
  const names = value.flatMap((entry) => {
    if (typeof entry === "string" && entry.trim()) return [entry.trim()];
    const record = asRecord(entry);
    return typeof record?.name === "string" && record.name.trim() ? [record.name.trim()] : [];
  });
  return names.length > 0 ? names.join(", ") : "Not yet provided";
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { timeZone: "UTC" }) : "Not yet provided";
}

function decisionClass(status: QualificationStatus) {
  if (status === "READY") return "border-emerald-500/70 bg-emerald-950/35 text-emerald-50";
  if (status === "PENDING") return "border-amber-500/70 bg-amber-950/30 text-amber-50";
  return "border-rose-500/70 bg-rose-950/35 text-rose-50";
}

function gateClass(state: GateState) {
  if (state === "SATISFIED") return "border-emerald-500/50 bg-emerald-950/30 text-emerald-100";
  if (state === "OPEN") return "border-amber-500/50 bg-amber-950/30 text-amber-100";
  return "border-rose-500/50 bg-rose-950/35 text-rose-100";
}

function safeText(value: string | null | undefined) {
  return value && value.trim() ? value : "Not yet provided";
}

function auditRows(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function RecruitingV2QualificationApiPanel({ candidateId }: Props) {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQualification = useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/recruiting-v2/qualification/${encodeURIComponent(candidateId)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setPayload(null);
      setError(body?.error ?? "Unable to load qualification state");
      return;
    }
    setPayload(body as ApiPayload);
  }, [candidateId]);

  useEffect(() => {
    void loadQualification();
  }, [loadQualification]);

  if (error) return <p className="mt-5 rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</p>;
  if (!payload) return <p className="mt-5 text-sm text-slate-400">Loading qualification state...</p>;

  const summary = payload.qualificationSummary;
  const primaryRisks = payload.operationalRisks.slice(0, 5);
  const auditTrail = auditRows(payload.candidate.auditTrail);

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
        <div className={`rounded-xl border p-4 ${decisionClass(payload.currentDecision)}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">Current Qualification Decision</p>
          <h2 className="mt-1 text-3xl font-black">{payload.currentDecision}</h2>
          <p className="mt-2 text-sm font-bold">Why: {summary.reason}</p>
          <p className="mt-2 text-xs font-black uppercase tracking-wider">{summary.calculatedStateLabel}</p>
        </div>
        <div className="rounded-xl border border-teal-800/70 bg-teal-950/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Next Required Action</p>
          <h2 className="mt-1 text-xl font-black text-teal-50">{payload.nextRequiredAction}</h2>
          <p className="mt-2 text-sm text-teal-100">Ready does not create an offer or activate a driver. Offer review remains a separate V2 workspace.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-rose-800/70 bg-rose-950/25 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-rose-200">Blocking</p><p className="mt-1 text-2xl font-black text-white">{summary.blockingItems.length}</p></div>
        <div className="rounded-lg border border-amber-800/70 bg-amber-950/25 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Pending</p><p className="mt-1 text-2xl font-black text-white">{summary.pendingItems.length}</p></div>
        <div className="rounded-lg border border-emerald-800/70 bg-emerald-950/25 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Satisfied</p><p className="mt-1 text-2xl font-black text-white">{summary.satisfiedItems.length}</p></div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gate Snapshot</p><p className="mt-1 text-sm text-white">{summary.gateCounts.satisfied} satisfied · {summary.gateCounts.open} open · {summary.gateCounts.blocked} blocked</p></div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Latest Interview</p>
          {payload.latestInterview ? (
            <div className="mt-2 grid gap-2 text-sm text-slate-200">
              <p><strong className="text-white">{payload.latestInterview.interviewCode}</strong></p>
              <p>{formatDate(payload.latestInterview.interviewDate)} · {payload.latestInterview.interviewType}</p>
              <p>Status: {formatStatus(payload.latestInterview.status)} · Recommendation: {formatStatus(payload.latestInterview.recommendation)}</p>
              <p>Overall Score: {payload.latestInterview.score ?? "Not yet provided"}</p>
              <p>Interviewers: {interviewerNames(payload.latestInterview.interviewers)}</p>
              <p className="text-amber-100">{summary.interviewEvaluation.label}: {summary.interviewEvaluation.requiredAction}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-100">Interview required: {summary.interviewEvaluation.requiredAction}</p>
          )}
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Operational Risks</p>
          <div className="mt-3 grid gap-2">
            {primaryRisks.length > 0 ? primaryRisks.map((risk) => (
              <div key={`${risk.source}-${risk.problem}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                <p className="font-black text-white">{risk.problem}</p>
                <p>Cause: {risk.cause}</p>
                <p>Owner: {safeText(risk.owner)}</p>
                <p>Required Action: {risk.requiredAction}</p>
                <p>Business Impact: {risk.businessImpact}</p>
                <p>Next Action: {risk.nextAction}</p>
              </div>
            )) : <p className="text-sm text-emerald-100">No unresolved qualification risks.</p>}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-3">
        {payload.documentGates.map((gate) => (
          <article key={gate.documentType} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="grid gap-4 xl:grid-cols-[0.8fr_1fr_0.9fr_1fr]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Document Type</p>
                <h3 className="mt-1 text-lg font-black text-white">{gate.label}</h3>
                <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${gateClass(gate.gateState)}`}>{gate.gateState}</span>
              </div>
              <div className="text-sm text-slate-300">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Latest Document</p>
                <p className="mt-1 font-bold text-white">{gate.latestDocument?.documentCode ?? "NOT PROVIDED"}</p>
                <p>Document Status: {formatStatus(gate.documentStatus)}</p>
                <p>Expiration: {gate.latestDocument ? formatDate(gate.latestDocument.expirationDate) : "Not yet provided"}</p>
              </div>
              <div className="text-sm text-slate-300">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Verification Status</p>
                <p className="mt-1">Verified By: {safeText(gate.latestDocument?.verifiedBy)}</p>
                <p>Notes: {safeText(gate.latestDocument?.verificationNotes)}</p>
                <p>Expiration State: {formatStatus(gate.expirationStatus)}</p>
                {gate.expirationWarning ? <p className="text-amber-100">{gate.expirationWarning}</p> : null}
              </div>
              <div className="text-sm text-slate-300">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Reason / Action</p>
                <p className="mt-1">Reason: {gate.reason}</p>
                <p>Required Action: {gate.requiredAction}</p>
                <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/documents`} className="mt-2 inline-flex rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Open Documents</Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Operational Queues</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            <p>Qualification Review: {payload.currentDecision}</p>
            <p>Document Review: {summary.gateCounts.open > 0 || summary.gateCounts.blocked > 0 ? "Active" : "Clear"}</p>
            <p>Compliance Review: {summary.gateCounts.blocked > 0 ? "Blocked" : summary.gateCounts.open > 0 ? "Pending" : "Satisfied"}</p>
            <p>Interview Review: {summary.interviewEvaluation.label}</p>
            <p>Offer Review: {payload.currentDecision === "READY" ? "Eligible for Offer Review" : "Not eligible"}</p>
            <p>Onboarding: Separate V2 workspace</p>
          </div>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Audit Trail</p>
          <p className="mt-2 text-sm text-slate-300">Qualification summary is calculated now. Historical recorded events remain separate.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">{auditTrail.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Override Behavior</p>
          <p className="mt-2 text-sm text-slate-300">Qualification override not implemented. No arbitrary BLOCKED to READY change is available in this phase.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/interview`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Interview</Link>
            <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/offer`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Offer</Link>
            <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/onboarding`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Onboarding</Link>
          </div>
        </article>
      </div>
    </section>
  );
}