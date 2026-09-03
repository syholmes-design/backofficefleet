"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type DocumentType = "CDL" | "MVR" | "MEDICAL" | "CLEARINGHOUSE" | "I9" | "W9" | "ROAD_TEST" | "EMPLOYMENT_VERIFICATION";
type DocumentStatus = "RECEIVED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
type GateState = "OPEN" | "BLOCKED" | "SATISFIED";
type ExpirationStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "NOT_PROVIDED";

type ArtifactSummary = {
  attached: boolean;
  storage: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | null;
  synthetic: boolean;
  viewUrl: string | null;
  downloadUrl: string | null;
};

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
  artifact?: ArtifactSummary;
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

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { timeZone: "UTC" }) : "Not provided";
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

function documentStatusLabel(status: DocumentStatus | "NOT_PROVIDED") {
  if (status === "NOT_PROVIDED") return "MISSING";
  if (status === "PENDING_REVIEW") return "UNDER REVIEW";
  return formatStatus(status);
}

function requirementStatus(gate: ApiGate) {
  if (!gate.latestDocument) return "DOCUMENT REQUIRED";
  return "REQUIRED";
}

function fileStatus(gate: ApiGate) {
  if (!gate.latestDocument) return "No file attached";
  if (gate.latestDocument.artifact?.attached) {
    return gate.latestDocument.artifact.synthetic ? "Actual document attached (synthetic demonstration file)" : "Actual document attached";
  }
  return "No file attached";
}

function nextActionLabel(gate: ApiGate) {
  if (!gate.latestDocument) return "Collect candidate document";
  if (gate.documentStatus === "VERIFIED" && gate.gateState === "SATISFIED") return "No document action required";
  if (gate.documentStatus === "REJECTED") return "Upload a corrected candidate document and re-verify";
  if (gate.documentStatus === "PENDING_REVIEW" || gate.documentStatus === "RECEIVED") return "Review and verify or reject";
  return gate.requiredAction;
}

export function RecruitingV2DocumentApiPanel({ candidateId }: Props) {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("CDL");
  const [uploadedBy, setUploadedBy] = useState("BOF Recruiting Coordinator (synthetic)");
  const [verifiedBy, setVerifiedBy] = useState("BOF Compliance Reviewer (synthetic)");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});

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
      const response = await fetch(`/api/recruiting-v2/documents/${encodeURIComponent(candidateId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          documentType,
          status: "RECEIVED",
          uploadedBy,
          metadata: { source: "recruiting-v2-candidate-upload" },
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

  async function uploadFile(documentCode: string) {
    const file = files[documentCode];
    if (!file) {
      setError("Select a PDF, JPG, JPEG, or PNG file before uploading.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("uploadedBy", uploadedBy);
      const response = await fetch(`/api/recruiting-v2/documents/${encodeURIComponent(candidateId)}/${encodeURIComponent(documentCode)}/file`, {
        method: "POST",
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to upload document");
      await loadDocuments();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to upload document");
    } finally {
      setBusy(false);
    }
  }

  async function reviewDocument(documentCode: string, action: "REVIEW" | "VERIFY" | "REJECT") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/recruiting-v2/documents/${encodeURIComponent(candidateId)}/${encodeURIComponent(documentCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action, verifiedBy, verificationNotes }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to update document review");
      await loadDocuments();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update document review");
    } finally {
      setBusy(false);
    }
  }

  const blockedGate = payload?.gates.find((gate) => gate.gateState === "BLOCKED");
  const openGate = payload?.gates.find((gate) => gate.gateState === "OPEN");
  const priorityGate = blockedGate ?? openGate ?? payload?.gates[0] ?? null;

  return (
    <section className="mt-5 min-w-0 overflow-x-hidden rounded-xl border border-teal-800/70 bg-slate-950 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">API-backed candidate document workflow</p>
          <h2 className="mt-1 text-xl font-black text-white">Document Workspace</h2>
          <p className="mt-1 break-words text-sm text-slate-300">Template ≠ required document ≠ candidate record ≠ actual file ≠ verification ≠ compliance gate.</p>
        </div>
      </div>

      {error ? <p className="mt-3 rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</p> : null}
      {!payload && !error ? <p className="mt-3 text-sm text-slate-400">Loading document gates...</p> : null}

      {payload ? (
        <div className="mt-4 min-w-0">
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Candidate</p>
              <p className="mt-1 break-words text-sm font-black text-white">{payload.candidate.fullName}</p>
              <p className="mt-1 break-words text-sm text-slate-300">{payload.candidate.candidateId} · {payload.candidate.homeLocation}</p>
            </div>
            <div className="min-w-0 rounded-lg border border-amber-800/70 bg-amber-950/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Current Decision</p>
              <p className="mt-1 text-sm font-black text-amber-50">{payload.summary.currentDecision}</p>
              <p className="mt-2 text-xs text-amber-100">{payload.summary.satisfied} satisfied · {payload.summary.open} open · {payload.summary.blocked} blocked</p>
            </div>
            <div className="min-w-0 rounded-lg border border-teal-800/70 bg-teal-950/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Next Required Action</p>
              <p className="mt-1 text-sm font-black text-teal-50">{payload.summary.nextRequiredAction}</p>
              <p className="mt-2 text-xs text-teal-100">Priority: {priorityGate ? priorityGate.label : "Document review"}</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Documents workflow</p>
            <div className="mt-3 grid min-w-[18rem] gap-2 text-xs font-bold uppercase tracking-wider text-slate-200 sm:grid-cols-2 lg:grid-cols-6">
              {["Requirement", "Candidate Record", "Actual Document", "Review", "Gate Result", "Qualification"].map((step) => (
                <span key={step} className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2">{step}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Register missing document record</p>
            <p className="mt-2 text-sm text-slate-300">Creates metadata only. Upload a file on the candidate document card after the record exists.</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold text-slate-300">Document Type<select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{documentTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">Registered By<input value={uploadedBy} onChange={(event) => setUploadedBy(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold text-slate-300">Verified By (synthetic reviewer identity)<input value={verifiedBy} onChange={(event) => setVerifiedBy(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">Verification Notes<input value={verificationNotes} onChange={(event) => setVerificationNotes(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            </div>
            <button type="button" onClick={() => void createDocumentRecord()} disabled={busy} className="mt-3 rounded-md border border-teal-600 bg-teal-950/50 px-3 py-2 text-xs font-black text-teal-100 hover:bg-teal-900/60 disabled:opacity-50">{busy ? "Working..." : "Create Document Record"}</button>
          </div>

          <div className="mt-4 grid gap-3">
            {payload.gates.map((gate) => {
              const record = gate.latestDocument;
              const candidateDocumentHref = record
                ? `/recruiting-v2/candidates/${payload.candidate.candidateId}/documents/${encodeURIComponent(record.documentCode)}`
                : null;
              return (
                <article key={gate.documentType} className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Document type</p>
                      <h3 className="mt-1 break-words text-lg font-black text-white">{gate.label}</h3>
                      <p className="mt-2 text-sm text-slate-200"><strong className="text-slate-500">Requirement status:</strong> {requirementStatus(gate)}</p>
                      <p className="mt-1 text-sm text-slate-200"><strong className="text-slate-500">Document status:</strong> {documentStatusLabel(gate.documentStatus)}</p>
                      <p className="mt-1 text-sm text-slate-200"><strong className="text-slate-500">Actual file status:</strong> {fileStatus(gate)}</p>
                      <p className="mt-1 text-sm text-slate-200"><strong className="text-slate-500">Expiration date:</strong> {formatDate(record?.expirationDate ?? null)}</p>
                      <p className="mt-1 text-sm text-slate-200"><strong className="text-slate-500">Expiration status:</strong> {formatStatus(gate.expirationStatus)}</p>
                      <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${gateClass(gate.gateState)}`}>Gate: {gate.gateState}</span>
                      <span className={`ml-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${expirationClass(gate.expirationStatus)}`}>{formatStatus(gate.expirationStatus)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Record / verification / next action</p>
                      {record ? (
                        <>
                          <p className="mt-1 break-all text-sm font-bold text-white">{record.documentCode}</p>
                          <p className="mt-1 text-sm text-slate-200"><strong className="text-slate-500">Verified by:</strong> {record.verifiedBy?.trim() || "Not yet provided"}</p>
                          <p className="mt-1 break-words text-sm text-slate-200"><strong className="text-slate-500">Verification notes:</strong> {record.verificationNotes?.trim() || "Not yet provided"}</p>
                          <p className="mt-1 text-sm text-slate-200"><strong className="text-slate-500">Next action:</strong> {nextActionLabel(gate)}</p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm font-black text-rose-100">DOCUMENT REQUIRED · MISSING</p>
                      )}
                      <p className="mt-2 break-words text-sm text-slate-300">{gate.reason}</p>
                      {gate.expirationWarning ? <p className="mt-1 text-sm text-amber-100">{gate.expirationWarning}</p> : null}
                    </div>
                  </div>

                  <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                    {gate.templateHref ? (
                      <Link href={gate.templateHref} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-slate-200 hover:bg-slate-800">View Template</Link>
                    ) : null}
                    {candidateDocumentHref ? (
                      <Link href={candidateDocumentHref} className="rounded-md border border-teal-700 px-3 py-2 text-xs font-black text-teal-100 hover:bg-teal-950">Open Candidate Document</Link>
                    ) : null}
                    {record?.artifact?.attached && record.artifact.viewUrl ? (
                      <>
                        <Link href={record.artifact.viewUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-emerald-700 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-950">View Document</Link>
                        <Link href={record.artifact.downloadUrl ?? record.artifact.viewUrl} className="rounded-md border border-emerald-700 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-950">Download Document</Link>
                      </>
                    ) : (
                      <span className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-300">No file attached</span>
                    )}
                  </div>

                  {record ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                      <label className="grid min-w-0 gap-1 text-xs font-bold text-slate-300">
                        Select file (PDF, JPG, JPEG, PNG · max 2 MB)
                        <input
                          type="file"
                          accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
                          onChange={(event) => setFiles((current) => ({ ...current, [record.documentCode]: event.target.files?.[0] ?? null }))}
                          className="min-w-0 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <button type="button" onClick={() => void uploadFile(record.documentCode)} disabled={busy} className="self-end rounded-md border border-teal-600 bg-teal-950/50 px-3 py-2 text-xs font-black text-teal-100 hover:bg-teal-900/60 disabled:opacity-50">Upload</button>
                    </div>
                  ) : null}

                  {record ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void reviewDocument(record.documentCode, "REVIEW")} disabled={busy} className="rounded-md border border-slate-600 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-800 disabled:opacity-50">Review</button>
                      <button type="button" onClick={() => void reviewDocument(record.documentCode, "VERIFY")} disabled={busy} className="rounded-md border border-emerald-600 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-950 disabled:opacity-50">Verify</button>
                      <button type="button" onClick={() => void reviewDocument(record.documentCode, "REJECT")} disabled={busy} className="rounded-md border border-rose-600 px-3 py-2 text-xs font-black text-rose-100 hover:bg-rose-950 disabled:opacity-50">Reject</button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
