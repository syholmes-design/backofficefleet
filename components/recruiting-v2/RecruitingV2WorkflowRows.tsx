"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ArtifactSummary = {
  attached: boolean;
  viewUrl: string | null;
  downloadUrl: string | null;
  fileName: string | null;
};

type ApiDocumentRecord = {
  documentCode: string;
  documentType: string;
  status: string;
  expirationDate: string | null;
  uploadedBy: string | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  artifact?: ArtifactSummary;
  createdAt: string;
  updatedAt: string;
};

type ApiGate = {
  documentType: string;
  label: string;
  templateLabel: string;
  templateHref: string | null;
  documentStatus: string;
  gateState: string;
  reason: string;
  requiredAction: string;
  latestDocument: ApiDocumentRecord | null;
};

type Interview = {
  status: string;
  score: number | null;
  recommendation: string;
};

type Props = { candidateId: string };

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not provided" : parsed.toLocaleDateString();
}

function statusClass(status: string) {
  const normalized = status.replace(/ /g, "_").toUpperCase();
  if (["READY", "COMPLETE", "SATISFIED", "VERIFIED", "COMPLETED", "ACCEPTED", "ADVANCE"].includes(normalized)) {
    return "border-emerald-500/50 bg-emerald-950/40 text-emerald-100";
  }
  if (["BLOCKED", "NOT_PROVIDED", "MISSING"].includes(normalized)) {
    return "border-rose-500/50 bg-rose-950/40 text-rose-100";
  }
  return "border-amber-500/50 bg-amber-950/40 text-amber-100";
}

export function RecruitingV2WorkflowRows({ candidateId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<{
    candidateCode: string;
    fullName: string;
    gates: ApiGate[];
    interview: Interview | null;
    offerStatus: string;
    qualificationStatus: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [documentsRes, interviewsRes, offerRes, qualificationRes] = await Promise.all([
          fetch(`/api/recruiting-v2/documents/${encodeURIComponent(candidateId)}`, { cache: "no-store" }),
          fetch(`/api/recruiting-v2/interviews/${encodeURIComponent(candidateId)}`, { cache: "no-store" }),
          fetch(`/api/recruiting-v2/offer/${encodeURIComponent(candidateId)}`, { cache: "no-store" }),
          fetch(`/api/recruiting-v2/qualification/${encodeURIComponent(candidateId)}`, { cache: "no-store" }),
        ]);
        const [documentsBody, interviewsBody, offerBody, qualificationBody] = await Promise.all([
          documentsRes.json(),
          interviewsRes.json(),
          offerRes.json(),
          qualificationRes.json(),
        ]);
        if (cancelled) return;
        if (!documentsRes.ok || !interviewsRes.ok || !offerRes.ok || !qualificationRes.ok) {
          setError("Candidate workflow state could not be loaded from Recruiting V2 APIs.");
          return;
        }
        const interviews = Array.isArray(interviewsBody.interviews) ? interviewsBody.interviews : [];
        const latest = interviews[0] ?? null;
        const records: ApiDocumentRecord[] = Array.isArray(documentsBody.documentRecords) ? documentsBody.documentRecords : [];
        const gates: ApiGate[] = (Array.isArray(documentsBody.gates) ? documentsBody.gates : []).map((gate: ApiGate) => {
          const fromGate = gate.latestDocument;
          const fromList = fromGate
            ? records.find((record) => record.documentCode === fromGate.documentCode)
            : records.find((record) => record.documentType === gate.documentType);
          return {
            ...gate,
            latestDocument: fromList ?? fromGate,
          };
        });
        setPayload({
          candidateCode: documentsBody.candidate?.candidateId ?? candidateId,
          fullName: documentsBody.candidate?.fullName ?? "",
          gates,
          interview: latest
            ? {
                status: latest.status ?? "NOT_SCHEDULED",
                score: typeof latest.score === "number" ? latest.score : null,
                recommendation: latest.recommendation ?? "PENDING",
              }
            : null,
          offerStatus: offerBody.offerMetadata?.offerStatus ?? offerBody.offerStatus ?? "NOT_PROVIDED",
          qualificationStatus: qualificationBody.qualificationSummary?.status ?? "UNKNOWN",
        });
      } catch {
        if (!cancelled) setError("Candidate workflow state could not be loaded from Recruiting V2 APIs.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (error) return <p className="text-[16px] text-amber-100">{error}</p>;
  if (!payload) return <p className="text-[16px] text-slate-400">Loading candidate workflow records…</p>;

  const applicationHref = `/recruiting-v2/candidates/${encodeURIComponent(payload.candidateCode)}/application`;
  const interviewHref = `/recruiting-v2/candidates/${encodeURIComponent(payload.candidateCode)}/interview`;
  const offerHref = `/recruiting-v2/candidates/${encodeURIComponent(payload.candidateCode)}/offer`;

  return (
    <div className="grid gap-3">
      <p className="text-[16px] leading-6 text-slate-200">
        Qualification: <strong className="text-white">{formatStatus(payload.qualificationStatus)}</strong>
        {" · "}
        Offer: <strong className="text-white">{formatStatus(payload.offerStatus)}</strong>
      </p>
      <article className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Template</p>
            <h3 className="mt-1 text-[22px] font-bold text-white">Generic BOF application template</h3>
            <p className="mt-1 text-[16px] leading-6 text-slate-300">TEMPLATE — Generic BOF Template</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Required / candidate record</p>
            <h3 className="mt-1 text-[22px] font-bold text-white">Application</h3>
            <p className="mt-1 text-[16px] leading-6 text-slate-300">{payload.fullName} · {payload.candidateCode}</p>
            <Link href={applicationHref} className="mt-3 inline-flex rounded-md border border-teal-700 px-3 py-2 text-[16px] font-semibold text-teal-100 hover:bg-teal-950">
              Open Candidate Application
            </Link>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Verification / gate</p>
            <p className="mt-1 text-[16px] leading-6 text-slate-200">Application is a candidate workspace, not a DocumentRecord.</p>
          </div>
        </div>
      </article>

      <article className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Template</p>
            <h3 className="mt-1 text-[22px] font-bold text-white">Generic interview workspace</h3>
            <p className="mt-1 text-[16px] leading-6 text-slate-300">TEMPLATE — Generic BOF Template</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Required / candidate record</p>
            <h3 className="mt-1 text-[22px] font-bold text-white">Interview</h3>
            <p className="mt-1 text-[16px] leading-6 text-slate-300">{payload.fullName} · {payload.candidateCode}</p>
            <Link href={interviewHref} className="mt-3 inline-flex rounded-md border border-teal-700 px-3 py-2 text-[16px] font-semibold text-teal-100 hover:bg-teal-950">
              Open Candidate Interview
            </Link>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Verification / gate</p>
            {payload.interview ? (
              <>
                <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-[14px] font-semibold ${statusClass(payload.interview.status)}`}>{formatStatus(payload.interview.status)}</span>
                <p className="mt-2 text-[16px] leading-6 text-slate-200">Recommendation: {formatStatus(payload.interview.recommendation)}</p>
                <p className="mt-1 text-[16px] leading-6 text-slate-200">Score: {payload.interview.score ?? "Not scored"}</p>
              </>
            ) : (
              <p className="mt-1 text-[16px] font-semibold text-rose-100">NO INTERVIEW RECORD</p>
            )}
          </div>
        </div>
      </article>

      {payload.gates.map((gate) => {
        const record = gate.latestDocument;
        const documentHref = record
          ? `/recruiting-v2/candidates/${encodeURIComponent(payload.candidateCode)}/documents/${encodeURIComponent(record.documentCode)}`
          : null;
        const artifactAttached = Boolean(record?.artifact?.attached && record.artifact.viewUrl);
        return (
          <article key={gate.documentType} className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Template</p>
                <h3 className="mt-1 text-[22px] font-bold text-white">{gate.templateLabel}</h3>
                {gate.templateHref ? (
                  <>
                    <p className="mt-1 text-[16px] leading-6 text-slate-300">TEMPLATE — Generic BOF Template</p>
                    <Link href={gate.templateHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-md border border-slate-700 px-3 py-2 text-[16px] font-semibold text-slate-200 hover:bg-slate-800">
                      View Template
                    </Link>
                  </>
                ) : (
                  <p className="mt-2 text-[16px] text-slate-400">No generic template configured</p>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Document record</p>
                <h3 className="mt-1 text-[22px] font-bold text-white">{gate.label}</h3>
                {record ? (
                  <>
                    <p className="mt-1 break-all text-[16px] leading-6 text-slate-200">{record.documentCode}</p>
                    <p className="mt-1 text-[16px] leading-6 text-slate-300">{payload.fullName} · {payload.candidateCode}</p>
                    <p className="mt-1 text-[16px] leading-6 text-slate-300">Type: {record.documentType}</p>
                    <p className="mt-1 text-[16px] leading-6 text-slate-300">Status: {formatStatus(record.status)}</p>
                    {documentHref ? (
                      <Link href={documentHref} className="mt-3 inline-flex rounded-md border border-teal-700 px-3 py-2 text-[16px] font-semibold text-teal-100 hover:bg-teal-950">
                        Open Candidate Document
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-[16px] font-semibold text-rose-100">DOCUMENT REQUIRED</p>
                    <p className="mt-1 text-[16px] font-semibold text-rose-100">MISSING</p>
                    <p className="mt-1 text-[16px] text-slate-300">NO FILE ATTACHED</p>
                  </>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Actual document / verification / gate</p>
                {record ? (
                  <>
                    <p className="mt-1 text-[16px] leading-6 text-slate-200">{artifactAttached ? "Actual Document Attached" : "No file attached"}</p>
                    {artifactAttached ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {record.artifact?.viewUrl ? (
                          <Link href={record.artifact.viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-md border border-emerald-700 px-3 py-2 text-[16px] font-semibold text-emerald-100 hover:bg-emerald-950">
                            View Document
                          </Link>
                        ) : null}
                        {record.artifact?.downloadUrl ? (
                          <Link href={record.artifact.downloadUrl} className="inline-flex rounded-md border border-emerald-700 px-3 py-2 text-[16px] font-semibold text-emerald-100 hover:bg-emerald-950">
                            Download Document
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                    <p className="mt-2 text-[16px] leading-6 text-slate-200">Uploaded by: {record.uploadedBy?.trim() || "Not provided"}</p>
                    <p className="mt-1 text-[16px] leading-6 text-slate-200">Verified by: {record.verifiedBy?.trim() || "Not provided"}</p>
                    <p className="mt-1 text-[16px] leading-6 text-slate-200">Notes: {record.verificationNotes?.trim() || "Not provided"}</p>
                    <p className="mt-1 text-[16px] leading-6 text-slate-200">Expiration: {formatDate(record.expirationDate)}</p>
                    <p className="mt-1 text-[16px] leading-6 text-slate-300">Created: {formatDate(record.createdAt)}</p>
                    <p className="mt-1 text-[16px] leading-6 text-slate-300">Updated: {formatDate(record.updatedAt)}</p>
                    <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[14px] font-semibold ${statusClass(gate.gateState)}`}>Gate: {gate.gateState}</span>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-[16px] font-semibold text-rose-100">NO FILE ATTACHED</p>
                    <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[14px] font-semibold ${statusClass(gate.gateState)}`}>Gate: {gate.gateState}</span>
                    <p className="mt-2 text-[16px] leading-6 text-slate-300">{gate.requiredAction}</p>
                  </>
                )}
              </div>
            </div>
          </article>
        );
      })}

      <article className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Template</p>
            <h3 className="mt-1 text-[22px] font-bold text-white">Generic offer workspace</h3>
            <p className="mt-1 text-[16px] leading-6 text-slate-300">TEMPLATE — Generic BOF Template</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Required / candidate record</p>
            <h3 className="mt-1 text-[22px] font-bold text-white">Offer</h3>
            <p className="mt-1 text-[16px] leading-6 text-slate-300">{payload.fullName} · {payload.candidateCode}</p>
            <Link href={offerHref} className="mt-3 inline-flex rounded-md border border-teal-700 px-3 py-2 text-[16px] font-semibold text-teal-100 hover:bg-teal-950">
              Open Candidate Offer
            </Link>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Verification / gate</p>
            <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-[14px] font-semibold ${statusClass(payload.offerStatus)}`}>{formatStatus(payload.offerStatus)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
