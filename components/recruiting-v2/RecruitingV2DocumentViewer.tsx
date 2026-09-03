"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Props = { candidateId: string; documentCode: string };

type ArtifactSummary = {
  attached: boolean;
  fileName: string | null;
  mimeType: string | null;
  synthetic: boolean;
  viewUrl: string | null;
  downloadUrl: string | null;
};

type Payload = {
  candidate: { candidateId: string; fullName: string };
  documentRecord: {
    documentCode: string;
    documentType: string;
    status: string;
    expirationDate: string | null;
    uploadedBy: string | null;
    verifiedBy: string | null;
    verificationNotes: string | null;
    artifact?: ArtifactSummary;
  };
  gate: {
    label: string;
    templateHref: string | null;
    documentStatus: string;
    gateState: string;
    expirationStatus: string;
    reason: string;
    requiredAction: string;
  };
};

export function RecruitingV2DocumentViewer({ candidateId, documentCode }: Props) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/recruiting-v2/documents/${encodeURIComponent(candidateId)}/${encodeURIComponent(documentCode)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setError(body?.error ?? "Document record not found");
      setPayload(null);
      return;
    }
    setPayload(body as Payload);
  }, [candidateId, documentCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const artifact = payload?.documentRecord.artifact;
  const isPdf = artifact?.mimeType === "application/pdf" || artifact?.fileName?.toLowerCase().endsWith(".pdf");
  const isImage = artifact?.mimeType?.startsWith("image/");

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <nav className="mb-5 text-sm text-slate-300">
        <Link href="/recruiting-v2" className="text-teal-200">Recruiting V2</Link>
        <span> / </span>
        <Link href={`/recruiting-v2/candidates/${candidateId}`} className="text-teal-200">{payload?.candidate.fullName ?? candidateId}</Link>
        <span> / </span>
        <Link href={`/recruiting-v2/candidates/${candidateId}/documents`} className="text-teal-200">Documents</Link>
        <span> / </span>
        <span>{documentCode}</span>
      </nav>

      {error ? <p className="rounded-md border border-amber-700 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</p> : null}
      {!payload && !error ? <p className="text-sm text-slate-400">Loading candidate document...</p> : null}

      {payload ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">Candidate document record</p>
          <h1 className="mt-2 break-words text-3xl font-black text-white">{payload.gate.label}</h1>
          <p className="mt-2 break-all text-sm text-slate-300">{payload.candidate.fullName} · {payload.candidate.candidateId} · {payload.documentRecord.documentCode}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Document status</p><p className="mt-1 font-black">{payload.documentRecord.status.replace(/_/g, " ")}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Gate</p><p className="mt-1 font-black">{payload.gate.gateState}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Expiration</p><p className="mt-1 font-black">{payload.gate.expirationStatus.replace(/_/g, " ")}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Actual file</p><p className="mt-1 font-black">{artifact?.attached ? "Attached" : "No file attached"}</p></div>
          </div>
          <p className="mt-4 text-sm text-slate-200"><strong className="text-slate-500">Verified by:</strong> {payload.documentRecord.verifiedBy || "Not yet provided"}</p>
          <p className="mt-2 break-words text-sm text-slate-200"><strong className="text-slate-500">Verification notes:</strong> {payload.documentRecord.verificationNotes || "Not yet provided"}</p>
          <p className="mt-2 text-sm text-slate-300">{payload.gate.reason}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {payload.gate.templateHref ? <Link href={payload.gate.templateHref} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-slate-200">View Template</Link> : null}
            <Link href={`/recruiting-v2/candidates/${candidateId}/documents`} className="rounded-md border border-teal-700 px-3 py-2 text-xs font-black text-teal-100">Back to Documents</Link>
            {artifact?.attached && artifact.downloadUrl ? <Link href={artifact.downloadUrl} className="rounded-md border border-emerald-700 px-3 py-2 text-xs font-black text-emerald-100">Download Document</Link> : null}
          </div>

          <div className="mt-5 min-h-[24rem] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            {artifact?.attached && artifact.viewUrl && isPdf ? (
              <iframe title={`${payload.gate.label} actual document`} src={artifact.viewUrl} className="h-[70vh] w-full bg-white" />
            ) : artifact?.attached && artifact.viewUrl && isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artifact.viewUrl} alt={`${payload.gate.label} actual document`} className="mx-auto max-h-[70vh] max-w-full object-contain" />
            ) : artifact?.attached && artifact.viewUrl ? (
              <p className="p-4 text-sm text-slate-300">File is attached. Use Download Document to open it.</p>
            ) : (
              <p className="p-4 text-sm font-black text-slate-300">No file attached</p>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
