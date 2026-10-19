"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import type { WorkspaceCandidate, WorkspacePosition, WorkspaceRequisitionSummary } from "@/lib/recruiting/workspace-model";
import {
  INTERVIEW_RECOMMENDATIONS,
  STRUCTURED_INTERVIEW_CATEGORIES,
  emptyInterviewResponses,
  interviewGuidance,
  validateStructuredInterview,
  type InterviewCategoryResponse,
  type InterviewEvaluation,
  type InterviewRecommendation,
} from "@/lib/recruiting/structured-interview";

/**
 * Controls added to the approved Recruiting & Onboarding workspace to connect it to the requisition
 * front door, the Recruiting V2 records and the Oct-17 activation. Styled with the workspace's own
 * card, label and button classes so the approved design is unchanged.
 */

const card = "rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs";
const eyebrow = "text-[10px] font-black uppercase tracking-[0.18em] text-teal-300";
const smallButton = "rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50";
const primaryButton = "rounded-lg border border-teal-600 bg-teal-950 px-3 py-1.5 text-xs font-bold text-teal-100 hover:bg-teal-900 disabled:opacity-50";
const input = "w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white";

function stateChip(state: string) {
  const s = state.toUpperCase();
  const tone = /FILLED|READY|PASS|MET|VERIFIED|SATISFIED|COMPLETE|ACCEPTED|ACTIVE|APPROVED/.test(s) && !/NOT_/.test(s)
    ? "border-emerald-700 bg-emerald-950 text-emerald-200"
    : /FAIL|BLOCK|REJECT|NOT_MET|DECLINED|EXPIRED/.test(s)
      ? "border-rose-700 bg-rose-950/60 text-rose-200"
      : "border-amber-700 bg-amber-950/40 text-amber-200";
  return <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${tone} border`}>{state.replace(/_/g, " ")}</span>;
}

export function RequisitionPositionsPanel({
  positions,
  unopened,
  selectedPositionId,
  onSelect,
  onOpenPosition,
  requisitionsHref,
  busy,
}: {
  positions: WorkspacePosition[];
  unopened: WorkspaceRequisitionSummary[];
  selectedPositionId: string | null;
  onSelect: (positionId: string) => void;
  onOpenPosition: (requisitionId: string) => void;
  requisitionsHref: string;
  busy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6" data-testid="requisition-positions">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Approved Requisitions in Recruiting</h2>
          <p className="mt-1 text-xs text-slate-400">Each recruiting position is opened from an approved driver requisition. Candidates belong to the requisition they were recruited for.</p>
        </div>
        <Link href={requisitionsHref} className={smallButton}>
          Requisitions &rarr;
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {positions.map((pos) => (
          <button
            key={pos.id}
            type="button"
            onClick={() => onSelect(pos.id)}
            className={`rounded-xl border p-4 text-left transition ${pos.id === selectedPositionId ? "border-teal-500 bg-teal-950/30" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-teal-300">{pos.requisition?.publicNumber ?? pos.positionCode}</span>
              {stateChip(pos.requisition?.pipelineState ?? pos.status)}
            </div>
            <strong className="mt-1 block text-sm text-white">{pos.title}</strong>
            <p className="mt-1 text-[11px] text-slate-400">
              {pos.requisition?.carrier ?? pos.requisition?.fleetName ?? "—"} · {pos.location}
            </p>
            <p className="mt-2 text-[11px] text-slate-300">
              {pos.counts.activated} of {pos.counts.requested} filled · {pos.counts.inProcess} in process · {pos.counts.remaining} remaining
            </p>
          </button>
        ))}
        {positions.length === 0 ? <p className="text-xs text-slate-400">No approved requisition has opened a recruiting position yet.</p> : null}
      </div>
      {unopened.length ? (
        <div className="mt-4 space-y-2">
          {unopened.map((req) => (
            <div key={req.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-800/70 bg-amber-950/20 p-3 text-xs text-amber-100">
              <span>
                <strong className="font-mono">{req.publicNumber}</strong> is approved but its recruiting position is not open yet.
              </span>
              <button type="button" disabled={busy} onClick={() => onOpenPosition(req.id)} className={primaryButton}>
                Open recruiting position
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PositionRequisitionBlock({ position }: { position: WorkspacePosition }) {
  const req = position.requisition;
  const c = position.counts;
  return (
    <div className="rounded-xl border border-teal-900/70 bg-slate-950 p-4" data-testid="originating-requisition">
      <span className="font-bold uppercase text-slate-400">Originating Requisition</span>
      {req ? (
        <>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-white">
            <Link href={req.href} className="font-mono text-teal-300 hover:underline">
              {req.publicNumber}
            </Link>
            {stateChip(req.status)} {stateChip(req.pipelineState)}
          </p>
          <p className="mt-1 text-slate-300">
            {req.carrier ?? req.fleetName} · {req.approvalsApproved}/{req.approvalsTotal} approvals recorded{req.targetStartDate ? ` · Start by ${req.targetStartDate.slice(0, 10)}` : ""}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
            {[
              ["Requested", c.requested],
              ["In process", c.inProcess],
              ["Screened", c.screened],
              ["Interviewed", c.interviewed],
              ["Offered", c.offered],
              ["Accepted", c.accepted],
              ["Activated", c.activated],
              ["Rejected", c.rejected],
              ["Remaining", c.remaining],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                <strong className="block text-base text-white">{value}</strong>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
              </div>
            ))}
          </div>
          {req.screeningRequirements.length ? (
            <div className="mt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Screening requirements from the requisition</span>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-300">
                {req.screeningRequirements.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-slate-300">This position was not opened from a requisition.</p>
      )}
    </div>
  );
}

const MICHAEL_ANDERSON = {
  fullName: "Michael Anderson",
  email: "michael.anderson@demo-candidate.bof.example",
  phone: "(216) 555-0182",
  homeLocation: "Cleveland, OH",
  cdlClass: "A",
  cdlState: "OH",
  cdlNumber: "OH00008821",
  experienceYears: "4",
  endorsements: "N",
  equipmentExperience: "4 years 53' refrigerated and dry van, Freightliner Cascadia",
};

export function AttachCandidateForm({
  position,
  onAttach,
  busy,
  offerMichael = true,
}: {
  position: WorkspacePosition;
  onAttach: (body: Record<string, unknown>) => void;
  busy: boolean;
  /** False once Michael Anderson is already in the workspace (e.g. the seeded demonstration), so he is not duplicated. */
  offerMichael?: boolean;
}) {
  const blank = { fullName: "", email: "", phone: "", homeLocation: "", cdlClass: "A", cdlState: "", cdlNumber: "", experienceYears: "", endorsements: "", equipmentExperience: "" };
  const [form, setForm] = useState(blank);
  const set = (key: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <form
      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
      data-testid="attach-candidate"
      onSubmit={(e) => {
        e.preventDefault();
        onAttach({ ...form, experienceYears: Number(form.experienceYears), endorsements: form.endorsements.split(",").map((x) => x.trim()).filter(Boolean) });
        setForm(blank);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold uppercase text-slate-400">Attach Candidate to {position.requisition?.publicNumber ?? position.positionCode}</span>
        {offerMichael ? (
          <button type="button" onClick={() => setForm(MICHAEL_ANDERSON)} className="text-[11px] font-bold text-teal-300 hover:underline">
            Use fictional candidate Michael Anderson
          </button>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(
          [
            ["fullName", "Full name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["homeLocation", "Home location"],
            ["cdlClass", "CDL class"],
            ["cdlState", "CDL state"],
            ["cdlNumber", "CDL number (stored masked)"],
            ["experienceYears", "Years of experience"],
            ["endorsements", "Endorsements (comma separated)"],
            ["equipmentExperience", "Equipment experience"],
          ] as Array<[keyof typeof blank, string]>
        ).map(([key, label]) => (
          <label key={key} className="block text-[11px] font-bold text-slate-300">
            {label}
            <input value={form[key]} onChange={set(key)} className={`mt-1 ${input}`} name={key} required={key === "fullName" || key === "email" || key === "cdlClass"} />
          </label>
        ))}
      </div>
      <button type="submit" disabled={busy} className={`mt-3 ${primaryButton}`}>
        Attach candidate &rarr;
      </button>
    </form>
  );
}

export function ScreeningPanel({
  candidate,
  onScreen,
  onConfirm,
  busy,
}: {
  candidate: WorkspaceCandidate;
  onScreen: () => void;
  onConfirm: (key: string) => void;
  busy: boolean;
}) {
  const s = candidate.screening;
  const screened = candidate.applicationStatus === "COMPLETE" || candidate.applicationStatus === "READY";
  return (
    <section className={`mt-5 ${card}`} data-testid="screening-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={eyebrow}>Screening against {candidate.requisitionNumber ?? "the position"}</p>
          <h2 className="mt-1 text-xl font-black text-white">Requisition requirements vs candidate</h2>
        </div>
        <div className="flex items-center gap-2">
          {stateChip(s.status)}
          {screened ? stateChip("Application review complete") : null}
          <button type="button" disabled={busy || screened} onClick={onScreen} className={primaryButton}>
            {screened ? "Screened" : "Screen against requisition"}
          </button>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-2">Requirement</th>
              <th className="p-2">Requisition</th>
              <th className="p-2">Candidate</th>
              <th className="p-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {s.results.map((r) => (
              <tr key={r.key} className="border-t border-slate-800 align-top">
                <td className="p-2 font-bold text-white">{r.label}</td>
                <td className="p-2 text-slate-300">{r.requirement}</td>
                <td className="p-2 text-slate-300">{r.candidateValue}</td>
                <td className="p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {stateChip(r.status)}
                    {r.status === "RECRUITER_CONFIRMATION" ? (
                      <button type="button" disabled={busy} onClick={() => onConfirm(r.key)} className={smallButton}>
                        Confirm
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{r.evidence}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DOC_LABELS: Record<string, string> = {
  CDL: "CDL",
  MEDICAL: "Medical certificate",
  MVR: "MVR",
  CLEARINGHOUSE: "Clearinghouse",
  I9: "I-9",
  W9: "W-9",
  ROAD_TEST: "Road test",
  EMPLOYMENT_VERIFICATION: "Employment verification",
};

export function DocumentActionsPanel({
  candidate,
  onRecord,
  onVerify,
  onUploaded,
  demo = false,
  busy,
}: {
  candidate: WorkspaceCandidate;
  onRecord: (documentType: string) => void;
  onVerify: (documentCode: string, documentType: string) => void;
  /** Called after a file upload so the workspace reloads from the source of record. */
  onUploaded?: () => void;
  /** The public demonstration has no server to store files, so it records documents without them. */
  demo?: boolean;
  busy: boolean;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  async function upload(documentCode: string, file: File | undefined) {
    if (!file) return;
    setUploading(documentCode);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("uploadedBy", "Recruiting & Onboarding workspace");
      const response = await fetch(`/api/recruiting-v2/documents/${encodeURIComponent(candidate.candidateCode)}/${encodeURIComponent(documentCode)}/file`, { method: "POST", body: form });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Upload failed (${response.status})`);
      onUploaded?.();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }
  return (
    <section className={`mt-5 ${card}`} data-testid="document-gates">
      <p className={eyebrow}>Qualification documents</p>
      <h2 className="mt-1 text-xl font-black text-white">Document gates (Recruiting V2)</h2>
      <p className="mt-1 text-slate-400">Qualification is READY only when every gate is satisfied, the application review is complete and the interview supports advancing.</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {candidate.documentGates.map((gate) => {
          const doc = gate.latestDocument;
          return (
            <div key={gate.documentType} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <strong className="text-slate-100">{DOC_LABELS[gate.documentType] ?? gate.label}</strong>
                {stateChip(gate.gateState)}
              </div>
              <p className="mt-1 text-slate-300">{gate.reason}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {!doc ? (
                  <button type="button" disabled={busy} onClick={() => onRecord(gate.documentType)} className={smallButton}>
                    Record received
                  </button>
                ) : null}
                {doc && doc.status !== "VERIFIED" ? (
                  <button type="button" disabled={busy} onClick={() => onVerify(doc.documentCode, gate.documentType)} className={primaryButton}>
                    Verify
                  </button>
                ) : null}
                {doc?.status === "VERIFIED" ? <span className="text-[11px] text-emerald-300">Verified by {doc.verifiedBy}</span> : null}
              </div>
              {doc && !demo ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  {candidate.documentFiles[doc.documentCode] ? (
                    <>
                      <a href={candidate.documentFiles[doc.documentCode].viewUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-teal-300 hover:underline">
                        View file{candidate.documentFiles[doc.documentCode].synthetic ? " (synthetic)" : ""}
                      </a>
                      <a href={candidate.documentFiles[doc.documentCode].downloadUrl} className="font-bold text-teal-300 hover:underline">
                        Download
                      </a>
                    </>
                  ) : (
                    <span className="text-slate-500">No file attached</span>
                  )}
                  <label className="cursor-pointer font-bold text-slate-300 hover:text-white">
                    {uploading === doc.documentCode ? "Uploading…" : candidate.documentFiles[doc.documentCode] ? "Replace file" : "Attach file"}
                    <input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
                      className="sr-only"
                      data-testid={`upload-${gate.documentType}`}
                      disabled={busy || uploading !== null}
                      onChange={(event) => void upload(doc.documentCode, event.target.files?.[0])}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {uploadError ? <p className="mt-2 text-[11px] text-rose-300" role="alert">{uploadError}</p> : null}
      {!demo ? <p className="mt-2 text-[11px] text-slate-500">Files: PDF, JPG or PNG, up to 2 MB.</p> : null}
    </section>
  );
}

export function StructuredInterviewPanel({
  candidate,
  onComplete,
  busy,
}: {
  candidate: WorkspaceCandidate;
  onComplete: (questionnaire: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const recorded = candidate.interview?.structured ?? null;
  const [categories, setCategories] = useState<InterviewCategoryResponse[]>(() => recorded?.categories ?? emptyInterviewResponses());
  const [recommendation, setRecommendation] = useState<InterviewRecommendation | null>(recorded?.recommendation ?? null);
  const [conditions, setConditions] = useState(recorded?.conditions ?? "");
  const [decisionNotes, setDecisionNotes] = useState(recorded?.decisionNotes ?? "");
  const [interviewer, setInterviewer] = useState(recorded?.interviewer ?? "");
  const guidance = useMemo(() => interviewGuidance(categories, recommendation), [categories, recommendation]);
  const errors = validateStructuredInterview({ categories, recommendation, conditions, decisionNotes, interviewer });
  const update = (key: string, patch: Partial<InterviewCategoryResponse>) => setCategories((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <section className={`mt-5 ${card}`} data-testid="structured-interview">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={eyebrow}>Structured interview</p>
          <h2 className="mt-1 text-xl font-black text-white">Interview questions, responses and evaluation</h2>
          <p className="mt-1 max-w-3xl text-slate-400">
            Newly integrated (2026-10-19): no historical questionnaire was recoverable. The recommendation is recorded on the candidate&apos;s interview and gates the offer.
          </p>
        </div>
        {recorded ? stateChip(`Recorded: ${INTERVIEW_RECOMMENDATIONS.find((r) => r.value === recorded.recommendation)?.label ?? recorded.recommendation}`) : stateChip(candidate.interview?.status ?? "Not interviewed")}
      </div>
      <div className="mt-4 space-y-3">
        {STRUCTURED_INTERVIEW_CATEGORIES.map((cat) => {
          const row = categories.find((r) => r.key === cat.key)!;
          return (
            <fieldset key={cat.key} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3" data-category={cat.key}>
              <legend className="px-1 text-sm font-bold text-white">
                {cat.label}
                {cat.optional ? <span className="ml-1 text-[10px] font-normal text-slate-500">(optional)</span> : null}
              </legend>
              <div className="grid gap-2 lg:grid-cols-2">
                {cat.questions.map((question, index) => (
                  <label key={question} className="block text-[11px] text-slate-300">
                    {question}
                    <textarea
                      rows={2}
                      value={row.responses[index] ?? ""}
                      onChange={(e) => update(cat.key, { responses: row.responses.map((r, i) => (i === index ? e.target.value : r)) })}
                      className={`mt-1 ${input}`}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[220px_1fr]">
                <label className="block text-[11px] font-bold text-slate-300">
                  Evaluation
                  <select value={row.evaluation} onChange={(e) => update(cat.key, { evaluation: e.target.value as InterviewEvaluation })} className={`mt-1 ${input}`} name={`evaluation-${cat.key}`}>
                    <option value="NOT_ASSESSED">Not assessed</option>
                    <option value="MEETS">Meets</option>
                    <option value="MEETS_WITH_CONDITIONS">Meets with conditions</option>
                    <option value="CONCERN">Concern</option>
                  </select>
                </label>
                <label className="block text-[11px] font-bold text-slate-300">
                  Recruiter notes
                  <input value={row.notes} onChange={(e) => update(cat.key, { notes: e.target.value })} className={`mt-1 ${input}`} />
                </label>
              </div>
            </fieldset>
          );
        })}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div>
          <span className="text-[11px] font-bold text-slate-300">Recommendation</span>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {INTERVIEW_RECOMMENDATIONS.map((rec) => (
              <label key={rec.value} className={`cursor-pointer rounded-lg border p-2 ${recommendation === rec.value ? "border-teal-500 bg-teal-950/40" : "border-slate-800 bg-slate-900/70"}`}>
                <input type="radio" name="recommendation" value={rec.value} checked={recommendation === rec.value} onChange={() => setRecommendation(rec.value)} className="mr-2" />
                <strong className="text-white">{rec.label}</strong>
                <span className="mt-0.5 block text-[11px] text-slate-400">{rec.meaning}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-300">
            Conditions (for proceed with conditions)
            <textarea rows={2} value={conditions} onChange={(e) => setConditions(e.target.value)} className={`mt-1 ${input}`} name="conditions" />
          </label>
          <label className="block text-[11px] font-bold text-slate-300">
            Decision notes
            <textarea rows={2} value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} className={`mt-1 ${input}`} name="decisionNotes" />
          </label>
          <label className="block text-[11px] font-bold text-slate-300">
            Interviewer
            <input value={interviewer} onChange={(e) => setInterviewer(e.target.value)} className={`mt-1 ${input}`} name="interviewer" />
          </label>
        </div>
      </div>
      {guidance.length ? (
        <ul className="mt-3 list-disc space-y-1 rounded-lg border border-amber-800/70 bg-amber-950/20 p-3 pl-6 text-amber-100">
          {guidance.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || errors.length > 0}
          onClick={() => onComplete({ categories, recommendation, conditions, decisionNotes, interviewer })}
          className={primaryButton}
        >
          Record interview &amp; recommendation
        </button>
        {errors.length ? <span className="text-[11px] text-slate-400">{errors[0]}</span> : null}
      </div>
    </section>
  );
}

export function OfferPanel({
  candidate,
  position,
  onOffer,
  busy,
}: {
  candidate: WorkspaceCandidate;
  position: WorkspacePosition | undefined;
  onOffer: (body: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const offer = candidate.offer;
  const [compensation, setCompensation] = useState(offer.compensation ?? position?.compensation ?? "");
  const [startDate, setStartDate] = useState(offer.startDate?.slice(0, 10) ?? position?.requisition?.targetStartDate?.slice(0, 10) ?? "");
  const [orientationDate, setOrientationDate] = useState(offer.orientationDate?.slice(0, 10) ?? "");
  const conditions = candidate.interview?.structured?.conditions;
  const fields = { compensation, startDate, orientationDate, notes: conditions ? `Interview conditions: ${conditions}` : undefined };
  return (
    <section className={`mt-5 ${card}`} data-testid="offer-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={eyebrow}>Offer (Recruiting V2 offer engine)</p>
          <h2 className="mt-1 text-xl font-black text-white">Offer status {offer.offerStatus.replace(/_/g, " ")}</h2>
        </div>
        {stateChip(offer.offerStatus)}
      </div>
      {candidate.offerBlockedReason && offer.offerStatus === "NOT_PROVIDED" ? (
        <p className="mt-2 rounded-lg border border-amber-800/70 bg-amber-950/20 p-2 text-amber-100">{candidate.offerBlockedReason}</p>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="block text-[11px] font-bold text-slate-300">
          Compensation (from the requisition)
          <input value={compensation} onChange={(e) => setCompensation(e.target.value)} className={`mt-1 ${input}`} name="compensation" />
        </label>
        <label className="block text-[11px] font-bold text-slate-300">
          Start date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`mt-1 ${input}`} name="startDate" />
        </label>
        <label className="block text-[11px] font-bold text-slate-300">
          Orientation date
          <input type="date" value={orientationDate} onChange={(e) => setOrientationDate(e.target.value)} className={`mt-1 ${input}`} name="orientationDate" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {offer.offerStatus === "NOT_PROVIDED" ? (
          <button type="button" disabled={busy} onClick={() => onOffer({ offerStatus: "DRAFT", ...fields })} className={smallButton}>
            Prepare offer
          </button>
        ) : null}
        {offer.offerStatus === "DRAFT" ? (
          <button type="button" disabled={busy} onClick={() => onOffer({ offerStatus: "SENT", ...fields })} className={primaryButton}>
            Send offer
          </button>
        ) : null}
        {offer.offerStatus === "SENT" ? (
          <>
            <button type="button" disabled={busy} onClick={() => onOffer({ offerStatus: "ACCEPTED" })} className={primaryButton}>
              Record offer accepted
            </button>
            <button type="button" disabled={busy} onClick={() => onOffer({ offerStatus: "DECLINED", declineReason: "Candidate declined the offer" })} className={smallButton}>
              Record declined
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}

export function OnboardingControls({
  candidate,
  onUpdate,
  busy,
}: {
  candidate: WorkspaceCandidate;
  onUpdate: (body: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const [orientationDate, setOrientationDate] = useState(candidate.orientation.date?.slice(0, 10) ?? candidate.offer.orientationDate?.slice(0, 10) ?? "");
  const [orientationLocation, setOrientationLocation] = useState(candidate.orientation.location ?? "");
  const eligible = candidate.onboardingDecision.onboardingEligible;
  const manual = candidate.onboardingItems.filter((item) => item.key === "training" || item.key === "equipment-assignment");
  const checklistWith = (key: string) =>
    candidate.onboardingItems.map((item) => ({ key: item.key, label: item.label, status: item.key === key ? "COMPLETE" : item.status, source: item.source, reason: item.reason }));
  const status = candidate.onboardingStatus;
  return (
    <div className="mt-6 rounded-xl border border-teal-900/70 bg-slate-950 p-5 text-xs" data-testid="onboarding-controls">
      <p className={eyebrow}>Onboarding record (Recruiting V2 onboarding engine)</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-black text-white">Onboarding status {status.replace(/_/g, " ")}</h3>
        {stateChip(status)}
      </div>
      {!eligible ? (
        <p className="mt-2 rounded-lg border border-amber-800/70 bg-amber-950/20 p-2 text-amber-100">
          {candidate.onboardingDecision.blockingItems[0]?.requiredAction ?? "Onboarding opens after qualification is READY and the offer is accepted."}
        </p>
      ) : (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block text-[11px] font-bold text-slate-300">
              Orientation date
              <input type="date" value={orientationDate} onChange={(e) => setOrientationDate(e.target.value)} className={`mt-1 ${input}`} name="onboardingOrientationDate" />
            </label>
            <label className="block text-[11px] font-bold text-slate-300">
              Orientation location
              <input value={orientationLocation} onChange={(e) => setOrientationLocation(e.target.value)} className={`mt-1 ${input}`} name="orientationLocation" />
            </label>
            <button
              type="button"
              disabled={busy || !orientationDate || !orientationLocation}
              onClick={() => onUpdate({ onboardingStatus: status === "PENDING" ? "IN_PROGRESS" : status, orientationDate, orientationLocation })}
              className={smallButton}
            >
              {status === "PENDING" ? "Start onboarding" : "Save orientation"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {manual.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={busy || item.status === "COMPLETE" || status === "PENDING"}
                onClick={() => onUpdate({ onboardingStatus: status, onboardingChecklist: checklistWith(item.key) })}
                className={item.status === "COMPLETE" ? primaryButton : smallButton}
              >
                {item.status === "COMPLETE" ? `${item.label} recorded` : `Record ${item.label.toLowerCase()} complete`}
              </button>
            ))}
            <button
              type="button"
              disabled={busy || status !== "IN_PROGRESS"}
              onClick={() => onUpdate({ onboardingStatus: "COMPLETE" })}
              className={primaryButton}
            >
              Complete onboarding
            </button>
          </div>
          {candidate.onboardingDecision.pendingItems.length ? (
            <p className="mt-2 text-slate-400">Open items: {candidate.onboardingDecision.pendingItems.map((i) => i.problem).join(" · ")}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

type ActivationPanelProps = {
  candidate: WorkspaceCandidate;
  onActivate: () => void;
  busy: boolean;
  demo: boolean;
};

export function ActivationPanel(props: ActivationPanelProps) {
  return (
    <>
      <ActivationPanelBody {...props} />
      {props.demo ? null : <PayrollHandoffPreview candidateCode={props.candidate.candidateCode} />}
    </>
  );
}

/** Payroll (Paylocity) handoff payload from the activation API. Preview only: nothing is sent. */
function PayrollHandoffPreview({ candidateCode }: { candidateCode: string }) {
  const [preview, setPreview] = useState<{ label: string; status: string; payload: unknown } | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    if (preview) return;
    const response = await fetch(`/api/recruiting-v2/activation/${encodeURIComponent(candidateCode)}`, { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as { paylocityHandoffPreview?: { label: string; status: string; payload: unknown }; error?: string };
    if (response.ok && body.paylocityHandoffPreview) setPreview(body.paylocityHandoffPreview);
    else setError(body.error ?? `Preview unavailable (${response.status})`);
  }
  return (
    <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs" data-testid="payroll-handoff-preview" onToggle={(event) => (event.currentTarget.open ? void load() : undefined)}>
      <summary className="cursor-pointer font-bold text-slate-200">Payroll handoff preview (Paylocity) · preview only, not sent</summary>
      {error ? <p className="mt-2 text-rose-300">{error}</p> : null}
      {preview ? (
        <>
          <p className="mt-2 font-bold uppercase tracking-wider text-amber-200">{preview.status}</p>
          <pre className="mt-2 max-h-[360px] overflow-auto rounded-lg border border-slate-800 p-3 text-slate-300">{JSON.stringify(preview.payload, null, 2)}</pre>
        </>
      ) : !error ? (
        <p className="mt-2 text-slate-500">Loading…</p>
      ) : null}
    </details>
  );
}

function ActivationPanelBody({ candidate, onActivate, busy, demo }: ActivationPanelProps) {
  const ready = candidate.activationReadiness;
  const activation = candidate.activation;
  if (activation) {
    const r = activation.readiness;
    return (
      <div className="mt-8 rounded-2xl border border-emerald-500/60 bg-emerald-950/40 p-6 text-emerald-100" data-testid="activation-result">
        <h3 className="text-xl font-black text-white">DRIVER ACTIVATED &amp; HANDED OFF TO OPERATIONS</h3>
        <p className="mt-2 text-xs leading-relaxed text-emerald-200">
          {activation.simulated
            ? "Demonstration: in the signed-in platform this step runs the Oct-17 activation and creates the records below. Nothing is written here."
            : "Activated with the Oct-17 driver activation service. These records now exist in the operating database:"}
        </p>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-emerald-50">
          {activation.records.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-800 bg-slate-950/60 p-3 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Qualification snapshot</span>
            <p className="mt-1 text-sm font-bold text-white">{activation.qualification?.status.replace(/_/g, " ") ?? "Not evaluated"}</p>
            <ul className="mt-1 list-disc pl-5 text-slate-300">
              {(activation.qualification?.reasons ?? []).slice(0, 6).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-800 bg-slate-950/60 p-3 text-xs" data-testid="assignment-readiness">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Assignment readiness</span>
            <p className="mt-1 text-sm font-bold text-white">
              {r ? `${r.status.replace(/_/g, " ")}${r.score !== null ? ` · score ${r.score}` : ""}` : "Not evaluated"}
            </p>
            <p className="mt-1 text-slate-300">{r?.dispatchEligible ? "Eligible for dispatch assignment." : "Not dispatch-eligible yet: the readiness gates below must clear first."}</p>
            <ul className="mt-1 list-disc pl-5 text-slate-300">
              {(r?.blockers ?? []).slice(0, 8).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {activation.driverHref ? (
            <Link href={activation.driverHref} className="inline-flex rounded-lg border border-emerald-400 bg-emerald-900/60 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800">
              VIEW DRIVER PROFILE IN BOF VAULT &rarr;
            </Link>
          ) : null}
          {activation.readinessHref ? (
            <Link href={activation.readinessHref} className="inline-flex rounded-lg border border-teal-400 bg-teal-900/60 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800">
              OPEN ASSIGNMENT READINESS &rarr;
            </Link>
          ) : null}
          <Link href={demo ? "/demo/dispatch" : "/dispatch"} className="inline-flex rounded-lg border border-teal-400 bg-teal-900/60 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800">
            {demo ? "SEE THE DISPATCH DEMONSTRATION" : "ASSIGN LOAD IN DISPATCH"} &rarr;
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-xs" data-testid="activation-gate">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={eyebrow}>Driver activation gate (Oct-17 activation)</p>
          <h3 className="mt-1 text-base font-black text-white">{ready.currentDecision}</h3>
        </div>
        <button type="button" disabled={busy || !ready.ready || candidate.disposition.status !== "ACTIVE"} onClick={onActivate} className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary disabled:opacity-50">
          ACTIVATE DRIVER FOR OPERATIONS &rarr;
        </button>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
        {[...ready.blockingItems, ...ready.pendingItems].map((issue) => (
          <li key={issue.problem}>
            <strong className="text-white">{issue.problem}:</strong> {issue.cause}
          </li>
        ))}
        {ready.ready ? <li>{ready.readinessReasons.join(" ")}</li> : null}
      </ul>
    </div>
  );
}

const REJECTION_REASONS = [
  "Does not meet requisition requirements",
  "MVR / safety history",
  "Failed drug test",
  "Interview: do not proceed",
  "Unable to verify employment history",
  "Candidate withdrew",
  "Position filled",
  "No response from candidate",
];

export function DispositionPanel({
  candidate,
  onDisposition,
  busy,
}: {
  candidate: WorkspaceCandidate;
  onDisposition: (body: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState(REJECTION_REASONS[0]);
  const [notes, setNotes] = useState("");
  const d = candidate.disposition;
  if (d.status !== "ACTIVE") {
    return (
      <div className="mt-4 rounded-xl border border-rose-800/70 bg-rose-950/30 p-4 text-xs text-rose-100" data-testid="disposition">
        <strong className="text-white">Candidate {d.status.toLowerCase()}</strong>: {d.reason}
        {d.notes ? ` (${d.notes})` : ""} · {d.at?.slice(0, 10)}. History is kept below.
        <button type="button" disabled={busy} onClick={() => onDisposition({ status: "ACTIVE" })} className={`ml-3 ${smallButton}`}>
          Reopen candidate
        </button>
      </div>
    );
  }
  if (candidate.activation) return null;
  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs" data-testid="disposition">
      <span className="font-bold uppercase text-slate-400">Candidate will not proceed</span>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-[11px] font-bold text-slate-300">
          Reason
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={`mt-1 ${input}`} name="dispositionReason">
            {REJECTION_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-bold text-slate-300">
          Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={`mt-1 ${input}`} name="dispositionNotes" />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDisposition({ status: reason === "Candidate withdrew" ? "WITHDRAWN" : "REJECTED", reason, notes })}
          className="rounded-lg border border-rose-700 bg-rose-950/60 px-3 py-1.5 text-xs font-bold text-rose-100 hover:bg-rose-900/60 disabled:opacity-50"
        >
          Reject candidate
        </button>
      </div>
    </div>
  );
}
