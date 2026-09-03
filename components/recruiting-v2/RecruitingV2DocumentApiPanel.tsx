"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type DocumentType = "CDL" | "MVR" | "MEDICAL" | "CLEARINGHOUSE" | "I9" | "W9" | "ROAD_TEST" | "EMPLOYMENT_VERIFICATION";
type DocumentStatus = "RECEIVED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
type GateState = "OPEN" | "BLOCKED" | "SATISFIED";
type ExpirationStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "NOT_PROVIDED";

type ApiDocumentRecord = {
  id: string;
  documentCode: string;
  documentType: DocumentType;
  status: DocumentStatus;
  expirationDate: string | null;
  uploadedBy: string | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

type ApiGate = {
  documentType: DocumentType;
  label: string;
  templateLabel: string;
  templateHref: string | null;
  collectionInstruction: string;
  documentStatus: DocumentStatus | "NOT_PROVIDED";
  gateState: GateState;
  reason: string;
  requiredAction: string;
  expirationStatus: ExpirationStatus;
  expirationWarning: string | null;
  latestDocument: ApiDocumentRecord | null;
};

type ApiPayload = {
  candidate: { candidateId: string; fullName: string; homeLocation: string; activationStage: string };
  documentRecords: ApiDocumentRecord[];
  gates: ApiGate[];
  summary: { totalDocumentTypes: number; satisfied: number; open: number; blocked: number; currentDecision: string; nextRequiredAction: string };
};

type Props = { candidateId: string };

const documentTypes: Array<{ value: DocumentType; label: string }> = [
  { value: "CDL", label: "CDL" },
  { value: "MVR", label: "MVR" },
  { value: "MEDICAL", label: "Medical" },
  { value: "CLEARINGHOUSE", label: "Clearinghouse" },
  { value: "I9", label: "I-9" },
  { value: "W9", label: "W-9" },
  { value: "ROAD_TEST", label: "Road Test" },
  { value: "EMPLOYMENT_VERIFICATION", label: "Employment Verification" },
];

const documentStatuses: DocumentStatus[] = ["RECEIVED", "PENDING_REVIEW", "VERIFIED", "REJECTED"];

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { timeZone: "UTC" }) : "Not yet provided";
}

function gateClass(state: GateState) {
  if (state === "SATISFIED") return "border-emerald-500/60 bg-emerald-950/35 text-emerald-100";
  if (state === "OPEN") return "border-amber-500/60 bg-amber-950/30 text-amber-100";
  return "border-rose-500/60 bg-rose-950/35 text-rose-100";
}

function expirationClass(status: ExpirationStatus) {
  if (status === "VALID") return "border-emerald-500/50 bg-emerald-950/30 text-emerald-100";
  if (status === "EXPIRING_SOON") return "border-amber-500/50 bg-amber-950/30 text-amber-100";
  if (status === "EXPIRED") return "border-rose-500/50 bg-rose-950/35 text-rose-100";
  return "border-slate-700 bg-slate-950 text-slate-300";
}

function safeText(value: string | null | undefined) {
  return value && value.trim() ? value : "Not yet provided";
}

export function RecruitingV2DocumentApiPanel({ candidateId }: Props) {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("CDL");
  const [status, setStatus] = useState<DocumentStatus>("RECEIVED");
  const [expirationDate, setExpirationDate] = useState("");
  const [uploadedBy, setUploadedBy] = useState("BOF Recruiting V2 Demo User");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [metadata, setMetadata] = useState('{"demoRecord":true,"source":"Recruiting V2 metadata registration"}');

  const loadDocuments = useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/recruiting-v2/documents/${encodeURIComponent(candidateId)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setPayload(null);
      setError(body?.error ?? "Unable to load document records");
      return;
    }
    setPayload(body as ApiPayload);
  }, [candidateId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function createDocumentRecord() {
    setBusy(true);
    setError(null);
    try {
      let parsedMetadata: unknown = null;
      if (metadata.trim()) parsedMetadata = JSON.parse(metadata);
      const response = await fetch(`/api/recruiting-v2/documents/${encodeURIComponent(candidateId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          documentType,
          status,
          expirationDate: expirationDate || null,
          uploadedBy,
          verifiedBy,
          verificationNotes,
          metadata: parsedMetadata,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to create document record");
      await loadDocuments();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create document record");
    } finally {
      setBusy(false);
    }
  }

  const blockedGate = payload?.gates.find((gate) => gate.gateState === "BLOCKED");
  const openGate = payload?.gates.find((gate) => gate.gateState === "OPEN");
  const priorityGate = blockedGate ?? openGate ?? payload?.gates[0] ?? null;

  return (
    <section className="mt-5 rounded-xl border border-teal-800/70 bg-slate-950 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">API-backed candidate document workflow</p>
          <h2 className="mt-1 text-xl font-black text-white">Document Workspace</h2>
          <p className="mt-1 text-sm text-slate-300">Candidate-specific metadata records. Templates are labeled separately and are not candidate documents.</p>
        </div>
        <span className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200">No binary upload API</span>
      </div>

      {error ? <p className="mt-3 rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</p> : null}
      {!payload && !error ? <p className="mt-3 text-sm text-slate-400">Loading document gates...</p> : null}

      {payload ? (
        <div className="mt-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Candidate</p>
              <p className="mt-1 text-sm font-black text-white">{payload.candidate.fullName}</p>
              <p className="mt-1 text-sm text-slate-300">{payload.candidate.candidateId} · {payload.candidate.homeLocation}</p>
            </div>
            <div className="rounded-lg border border-amber-800/70 bg-amber-950/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Current Decision</p>
              <p className="mt-1 text-sm font-black text-amber-50">{payload.summary.currentDecision}</p>
              <p className="mt-2 text-xs text-amber-100">{payload.summary.satisfied} satisfied · {payload.summary.open} open · {payload.summary.blocked} blocked</p>
            </div>
            <div className="rounded-lg border border-teal-800/70 bg-teal-950/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Next Required Action</p>
              <p className="mt-1 text-sm font-black text-teal-50">{payload.summary.nextRequiredAction}</p>
              <p className="mt-2 text-xs text-teal-100">Priority: {priorityGate ? priorityGate.label : "Document review"}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Workflow</p>
            <div className="mt-3 grid gap-2 text-xs font-bold uppercase tracking-wider text-slate-200 sm:grid-cols-2 lg:grid-cols-7">
              {["Required Document", "Template / Instruction", "Candidate Record", "Review", "Verification", "Compliance Gate", "Next Action"].map((step) => (
                <span key={step} className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2">{step}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Create Document Record</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-4">
              <label className="grid gap-1 text-xs font-bold text-slate-300">Document Type<select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{documentTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">Status<select value={status} onChange={(event) => setStatus(event.target.value as DocumentStatus)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{documentStatuses.map((item) => <option key={item} value={item}>{formatStatus(item)}</option>)}</select></label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">Expiration Date<input value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} type="date" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">Uploaded / Registered By<input value={uploadedBy} onChange={(event) => setUploadedBy(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <label className="grid gap-1 text-xs font-bold text-slate-300">Verified By<input value={verifiedBy} onChange={(event) => setVerifiedBy(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
              <label className="grid gap-1 text-xs font-bold text-slate-300 lg:col-span-2">Verification Notes<input value={verificationNotes} onChange={(event) => setVerificationNotes(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            </div>
            <label className="mt-3 grid gap-1 text-xs font-bold text-slate-300">Metadata JSON<textarea value={metadata} onChange={(event) => setMetadata(event.target.value)} rows={3} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void createDocumentRecord()} disabled={busy} className="rounded-md border border-teal-600 bg-teal-950/50 px-3 py-2 text-xs font-black text-teal-100 hover:bg-teal-900/60 disabled:opacity-50">{busy ? "Creating..." : "Create Document Record"}</button>
              <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Replace File not implemented by API</span>
              <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Download not implemented by API</span>
              <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Approve / Reject not implemented by API</span>
              <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">Delete not implemented by API</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {payload.gates.map((gate) => (
              <article key={gate.documentType} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="grid gap-4 xl:grid-cols-[0.9fr_1fr_1fr_1fr]">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Required document</p>
                    <h3 className="mt-1 text-lg font-black text-white">{gate.label}</h3>
                    <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${gateClass(gate.gateState)}`}>Gate: {gate.gateState}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Template / collection instruction</p>
                    <p className="mt-1 text-sm font-bold text-white">{gate.templateLabel}</p>
                    <p className="mt-1 text-sm text-slate-300">{gate.collectionInstruction}</p>
                    {gate.templateHref ? <Link href={gate.templateHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">Open Template <span className="ml-2 text-slate-500">TEMPLATE</span></Link> : <span className="mt-2 inline-flex rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-xs font-black text-amber-100">Template not configured</span>}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Candidate document record</p>
                    {gate.latestDocument ? (
                      <div className="mt-1 text-sm text-slate-200">
                        <p className="font-bold text-white">{gate.latestDocument.documentCode}</p>
                        <p>Latest Status: {formatStatus(gate.documentStatus)}</p>
                        <p>Expiration: {formatDate(gate.latestDocument.expirationDate)}</p>
                        <p>Owner: {safeText(gate.latestDocument.uploadedBy)}</p>
                        <Link href={`/api/recruiting-v2/documents/${payload.candidate.candidateId}/${gate.latestDocument.documentCode}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-black text-teal-200">GET single document</Link>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm font-black text-rose-100">NOT PROVIDED</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Review / verification / gate</p>
                    <p className="mt-1 text-sm text-slate-200">Verification: {safeText(gate.latestDocument?.verifiedBy)}</p>
                    <p className="mt-1 text-sm text-slate-200">Notes: {safeText(gate.latestDocument?.verificationNotes)}</p>
                    <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${expirationClass(gate.expirationStatus)}`}>{formatStatus(gate.expirationStatus)}</span>
                    <p className="mt-2 text-sm text-slate-300"><strong className="text-slate-500">Problem:</strong> {gate.reason}</p>
                    <p className="mt-1 text-sm text-slate-300"><strong className="text-slate-500">Required Action:</strong> {gate.requiredAction}</p>
                    {gate.expirationWarning ? <p className="mt-1 text-sm text-amber-100">{gate.expirationWarning}</p> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Qualification connection</p>
            <p className="mt-2 text-sm text-slate-300">This document gate result is the document-level source for future Qualification V2 consumption. It does not create Driver records, Driver Vault records, or a second document repository.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}