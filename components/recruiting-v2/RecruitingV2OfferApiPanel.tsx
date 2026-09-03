"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OfferAction = "CREATE_DRAFT" | "UPDATE_DRAFT" | "SEND_OFFER" | "RECORD_ACCEPTANCE" | "RECORD_DECLINE";
type OfferStatus = "NOT_PROVIDED" | "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED";

type ApiPayload = {
  candidate: { candidateId: string; fullName: string; homeLocation: string; activationStage: string };
  position: { positionCode: string; title: string; homeTerminal: string; freightType: string; primaryLanes: string; compensation: string; description: string };
  qualificationDecision: { status: "READY" | "PENDING" | "BLOCKED"; reason: string; nextRequiredAction: string; interviewEvaluation: { label: string; status: string; reason: string; requiredAction: string } };
  latestInterview: { interviewCode: string; interviewDate: string | null; interviewType: string; status: string; score: number | null; recommendation: string; interviewers: unknown } | null;
  offerMetadata: { offerCode: string | null; offerStatus: OfferStatus; compensation: string | null; startDate: string | null; orientationDate: string | null; notes: string | null; createdAt: string | null; updatedAt: string | null; sentAt: string | null; acceptedAt: string | null; declinedAt: string | null; declineReason: string | null };
  offerDecision: { currentDecision: string; reason: string; nextRequiredAction: string; qualificationPrerequisite: string; offerActions: OfferAction[] };
  currentDecision: string;
  nextRequiredAction: string;
  template: { label: string; href: string | null; status: string };
};

type Props = { candidateId: string };

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { timeZone: "UTC" }) : "Not configured";
}

function safeText(value: string | null | undefined) {
  return value && value.trim() ? value : "Not configured";
}

function decisionClass(decision: string) {
  if (decision === "Offer Accepted" || decision === "Eligible for Offer Review") return "border-emerald-500/70 bg-emerald-950/35 text-emerald-50";
  if (decision === "Offer Draft" || decision === "Offer Sent") return "border-amber-500/70 bg-amber-950/30 text-amber-50";
  return "border-rose-500/70 bg-rose-950/35 text-rose-50";
}

function qualificationClass(status: string) {
  if (status === "READY") return "border-emerald-500/50 bg-emerald-950/30 text-emerald-100";
  if (status === "PENDING") return "border-amber-500/50 bg-amber-950/30 text-amber-100";
  return "border-rose-500/50 bg-rose-950/35 text-rose-100";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function interviewerNames(value: unknown) {
  if (!Array.isArray(value)) return "Not configured";
  const rows = value.flatMap((entry) => {
    if (typeof entry === "string" && entry.trim()) return [entry.trim()];
    const record = asRecord(entry);
    return typeof record?.name === "string" && record.name.trim() ? [record.name.trim()] : [];
  });
  return rows.length > 0 ? rows.join(", ") : "Not configured";
}

export function RecruitingV2OfferApiPanel({ candidateId }: Props) {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<OfferAction | null>(null);
  const [compensation, setCompensation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [orientationDate, setOrientationDate] = useState("");
  const [notes, setNotes] = useState("Synthetic Recruiting V2 offer metadata record.");
  const [declineReason, setDeclineReason] = useState("Candidate declined synthetic offer metadata.");

  const loadOffer = useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/recruiting-v2/offer/${encodeURIComponent(candidateId)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setPayload(null);
      setError(body?.error ?? "Unable to load offer state");
      return;
    }
    const nextPayload = body as ApiPayload;
    setPayload(nextPayload);
    setCompensation((current) => current || nextPayload.offerMetadata.compensation || nextPayload.position.compensation || "");
  }, [candidateId]);

  useEffect(() => {
    void loadOffer();
  }, [loadOffer]);

  async function runAction(action: OfferAction) {
    if (!payload) return;
    setBusyAction(action);
    setError(null);
    try {
      const offerStatusByAction: Record<OfferAction, OfferStatus> = {
        CREATE_DRAFT: "DRAFT",
        UPDATE_DRAFT: "DRAFT",
        SEND_OFFER: "SENT",
        RECORD_ACCEPTANCE: "ACCEPTED",
        RECORD_DECLINE: "DECLINED",
      };
      const response = await fetch(`/api/recruiting-v2/offer/${encodeURIComponent(candidateId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          offerStatus: offerStatusByAction[action],
          compensation,
          startDate,
          orientationDate,
          notes,
          declineReason: action === "RECORD_DECLINE" ? declineReason : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to update offer metadata");
      setPayload(body as ApiPayload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update offer metadata");
    } finally {
      setBusyAction(null);
    }
  }

  if (error && !payload) return <p className="mt-5 rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</p>;
  if (!payload) return <p className="mt-5 text-sm text-slate-400">Loading offer state...</p>;

  const actions = payload.offerDecision.offerActions;
  const offer = payload.offerMetadata;

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
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">Current Offer Decision</p>
          <h2 className="mt-1 text-3xl font-black">{payload.currentDecision}</h2>
          <p className="mt-2 text-sm font-bold">Why: {payload.offerDecision.reason}</p>
        </div>
        <div className="rounded-xl border border-teal-800/70 bg-teal-950/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Next Required Action</p>
          <h2 className="mt-1 text-xl font-black text-teal-50">{payload.nextRequiredAction}</h2>
          {offer.offerStatus === "ACCEPTED" ? <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/onboarding`} className="mt-3 inline-flex rounded-md border border-teal-600 px-3 py-2 text-xs font-black text-teal-100 hover:bg-teal-900/50">Start Onboarding</Link> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Qualification prerequisite</p>
          <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${qualificationClass(payload.qualificationDecision.status)}`}>{payload.qualificationDecision.status}</span>
          <p className="mt-2 text-sm text-slate-300">{payload.offerDecision.qualificationPrerequisite}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Latest interview recommendation</p>
          <p className="mt-1 text-sm font-black text-white">{payload.latestInterview ? formatStatus(payload.latestInterview.recommendation) : "Not configured"}</p>
          <p className="mt-1 text-sm text-slate-300">{payload.qualificationDecision.interviewEvaluation.label}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Business impact</p>
          <p className="mt-1 text-sm text-slate-300">Offer cannot be drafted or sent until Qualification V2 returns READY. Acceptance does not start onboarding automatically.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Offer metadata record</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            <p><strong className="text-white">Offer Status:</strong> {formatStatus(offer.offerStatus)}</p>
            <p><strong className="text-white">Offer Code:</strong> {safeText(offer.offerCode)}</p>
            <p><strong className="text-white">Compensation:</strong> {safeText(offer.compensation)}</p>
            <p><strong className="text-white">Start Date:</strong> {formatDate(offer.startDate)}</p>
            <p><strong className="text-white">Orientation Date:</strong> {formatDate(offer.orientationDate)}</p>
            <p><strong className="text-white">Notes:</strong> {safeText(offer.notes)}</p>
            <p><strong className="text-white">Created:</strong> {formatDate(offer.createdAt)}</p>
            <p><strong className="text-white">Updated:</strong> {formatDate(offer.updatedAt)}</p>
            <p><strong className="text-white">Sent:</strong> {formatDate(offer.sentAt)}</p>
            <p><strong className="text-white">Accepted:</strong> {formatDate(offer.acceptedAt)}</p>
            <p><strong className="text-white">Declined:</strong> {formatDate(offer.declinedAt)}</p>
            <p><strong className="text-white">Decline Reason:</strong> {safeText(offer.declineReason)}</p>
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Operational record viewer</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold text-slate-300">Compensation<input value={compensation} onChange={(event) => setCompensation(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            <label className="grid gap-1 text-xs font-bold text-slate-300">Start Date<input value={startDate} onChange={(event) => setStartDate(event.target.value)} type="date" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            <label className="grid gap-1 text-xs font-bold text-slate-300">Orientation Date<input value={orientationDate} onChange={(event) => setOrientationDate(event.target.value)} type="date" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            <label className="grid gap-1 text-xs font-bold text-slate-300">Decline Reason<input value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          </div>
          <label className="mt-3 grid gap-1 text-xs font-bold text-slate-300">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.includes("CREATE_DRAFT") ? <button type="button" onClick={() => void runAction("CREATE_DRAFT")} disabled={Boolean(busyAction)} className="rounded-md border border-teal-600 bg-teal-950/50 px-3 py-2 text-xs font-black text-teal-100 hover:bg-teal-900/60 disabled:opacity-50">{busyAction === "CREATE_DRAFT" ? "Creating..." : "Create Draft"}</button> : null}
            {actions.includes("UPDATE_DRAFT") ? <button type="button" onClick={() => void runAction("UPDATE_DRAFT")} disabled={Boolean(busyAction)} className="rounded-md border border-teal-600 bg-teal-950/50 px-3 py-2 text-xs font-black text-teal-100 hover:bg-teal-900/60 disabled:opacity-50">{busyAction === "UPDATE_DRAFT" ? "Updating..." : "Update Draft"}</button> : null}
            {actions.includes("SEND_OFFER") ? <button type="button" onClick={() => void runAction("SEND_OFFER")} disabled={Boolean(busyAction)} className="rounded-md border border-sky-600 bg-sky-950/50 px-3 py-2 text-xs font-black text-sky-100 hover:bg-sky-900/60 disabled:opacity-50">{busyAction === "SEND_OFFER" ? "Sending..." : "Send Offer"}</button> : null}
            {actions.includes("RECORD_ACCEPTANCE") ? <button type="button" onClick={() => void runAction("RECORD_ACCEPTANCE")} disabled={Boolean(busyAction)} className="rounded-md border border-emerald-600 bg-emerald-950/50 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-900/60 disabled:opacity-50">{busyAction === "RECORD_ACCEPTANCE" ? "Recording..." : "Record Acceptance"}</button> : null}
            {actions.includes("RECORD_DECLINE") ? <button type="button" onClick={() => void runAction("RECORD_DECLINE")} disabled={Boolean(busyAction)} className="rounded-md border border-rose-600 bg-rose-950/50 px-3 py-2 text-xs font-black text-rose-100 hover:bg-rose-900/60 disabled:opacity-50">{busyAction === "RECORD_DECLINE" ? "Recording..." : "Record Decline"}</button> : null}
            {actions.length === 0 ? <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">No offer action available in the current state</span> : null}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Interview state</p>
          <p className="mt-2 text-sm text-slate-300">{payload.latestInterview ? `${payload.latestInterview.interviewCode} · ${formatStatus(payload.latestInterview.status)} · ${formatStatus(payload.latestInterview.recommendation)}` : "Not configured"}</p>
          <p className="mt-1 text-sm text-slate-300">Interviewers: {payload.latestInterview ? interviewerNames(payload.latestInterview.interviewers) : "Not configured"}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Related enterprise objects</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/qualification`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Qualification</Link>
            <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/documents`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Documents</Link>
            <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/interview`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Interview</Link>
            <Link href={`/recruiting-v2/candidates/${payload.candidate.candidateId}/onboarding`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Onboarding</Link>
          </div>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Template relationship</p>
          <p className="mt-2 text-sm text-slate-300">{payload.template.status}</p>
          <span className="mt-3 inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs font-black text-slate-300">Template != Offer Record</span>
        </article>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Honest non-actions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['PDF generation not implemented', 'Electronic signature not implemented', 'Email delivery not implemented', 'External offer delivery not implemented', 'Approval routing not implemented', 'Offer rescind not implemented', 'Revision history not implemented'].map((item) => <span key={item} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">{item}</span>)}
        </div>
      </div>
    </section>
  );
}