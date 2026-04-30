"use client";

import Image from "next/image";
import { CheckCircle2, FileText, ImageIcon, AlertCircle } from "lucide-react";
import type { Load } from "@/types/dispatch";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getLoadDocumentPacket } from "@/lib/load-proof";

type DocLinkItem = {
  key: string;
  label: string;
  url?: string;
  kind: "pdf" | "image";
  showSignedBadge: boolean;
  status: "ready" | "missing";
  required?: boolean;
};

function isSignedDocUrl(url: string): boolean {
  return url.includes("/actual_docs/");
}

function showExceptionClaimSection(load: Load): boolean {
  return Boolean(
    load.exception_flag ||
      load.insurance_claim_needed ||
      load.claim_form_url ||
      load.damage_photo_url ||
      load.supporting_attachment_url
  );
}

function packetDocsByLabels(
  packet: ReturnType<typeof getLoadDocumentPacket>,
  labels: string[]
): DocLinkItem[] {
  const byLabel = new Map((packet?.documents ?? []).map((d) => [d.label, d]));
  return labels.map((label) => {
    const row = byLabel.get(label);
    const ready = row?.status === "ready" && Boolean(row.url);
    return {
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label,
      url: row?.url,
      kind: "image",
      showSignedBadge: false,
      status: ready ? "ready" : "missing",
      required: Boolean(row?.requiredForSettlementRelease),
    };
  });
}

function proofAndMediaDocs(load: Load, packet: ReturnType<typeof getLoadDocumentPacket>): DocLinkItem[] {
  const labels = [
    "Cargo photo",
    "Seal photo",
    "Equipment photo",
    "Pickup photo",
    "Seal pickup photo",
    "Seal delivery photo",
    "Lumper receipt",
    "Damage / claim photo",
    "Safety violation photo",
  ];
  return packetDocsByLabels(packet, labels);
}

type Props = {
  load: Load;
};

export function LoadDocumentsLibraryEnhanced({ load }: Props) {
  const { data } = useBofDemoData();
  const packet = getLoadDocumentPacket(data, load.load_id);
  const byLabel = new Map((packet?.documents ?? []).map((d) => [d.label, d]));

  const coreDocs: DocLinkItem[] = [
    ["rate-con", "Rate Confirmation"],
    ["bol", "BOL"],
    ["pod", "POD"],
    ["invoice", "Invoice"],
  ].map(([key, label]) => {
    const row = byLabel.get(label);
    const ready = row?.status === "ready" && Boolean(row.url);
    return {
      key,
      label,
      url: row?.url,
      kind: "pdf",
      showSignedBadge: Boolean(row?.url && isSignedDocUrl(row.url)),
      status: ready ? "ready" : "missing",
      required: true,
    };
  });

  const proofDocs = proofAndMediaDocs(load, packet);
  const exceptionDocs = packetDocsByLabels(packet, [
    "Claim packet",
    "Damage / claim photo",
    "Safety violation photo",
  ]);
  const allDocs = [...coreDocs, ...proofDocs];
  const hasAny = allDocs.length > 0;

  const docStatus = {
    available: allDocs.filter((d) => d.status === "ready").length,
    missing: allDocs.filter((d) => d.status === "missing").length,
    required: allDocs.filter((d) => d.required).length,
  };

  if (!hasAny) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FileText className="h-3.5 w-3.5 text-teal-500" />
            Load Documents
          </h3>
          <p className="text-sm text-slate-300">No documents are currently available for this load.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <FileText className="h-3.5 w-3.5 text-teal-500" />
          Document Status
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className={`text-2xl font-bold ${docStatus.available > 0 ? "text-emerald-400" : "text-slate-600"}`}>
              {docStatus.available}
            </div>
            <div className="text-xs text-slate-400">Available</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${docStatus.missing > 0 ? "text-red-400" : "text-slate-600"}`}>
              {docStatus.missing}
            </div>
            <div className="text-xs text-slate-400">Missing</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${docStatus.required > 0 ? "text-teal-400" : "text-slate-600"}`}>
              {docStatus.required}
            </div>
            <div className="text-xs text-slate-400">Required</div>
          </div>
        </div>
        {docStatus.missing > 0 && (
          <div className="mt-3 rounded border border-amber-900/40 bg-amber-950/20 p-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="text-xs text-amber-100">
                <strong>Readiness blockers:</strong> required docs without generated URLs remain Missing.
              </div>
            </div>
          </div>
        )}
      </div>

      <DocGroup title="Core Documents" items={coreDocs} emptyHint="No rate con, BOL, POD, or invoice documents available." />
      <DocGroup title="Proof & Evidence" items={proofDocs} emptyHint="No photo, seal, or media documents available." />
      <DocGroup title="Exceptions / Claims" items={exceptionDocs} emptyHint="No claim or exception evidence available." />

      {showExceptionClaimSection(load) && (
        <div>
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Exceptions / Claims Notes
          </h4>
          <div className="space-y-2">
            {load.exception_reason && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Exception notes</p>
                <p className="mt-1 text-sm text-slate-200">{load.exception_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DocGroup({
  title,
  items,
  emptyHint,
}: {
  title: string;
  items: DocLinkItem[];
  emptyHint: string;
}) {
  return (
    <div>
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-slate-600">{emptyHint}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <DocCard key={item.key} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocCard({ item }: { item: DocLinkItem }) {
  const statusColors = {
    ready: "border-emerald-700/60 bg-emerald-950/40",
    missing: "border-red-700/60 bg-red-950/40",
  };
  return (
    <a
      href={item.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!item.url || item.status !== "ready") e.preventDefault();
      }}
      className={`group flex gap-3 rounded-lg border p-3 transition-colors ${statusColors[item.status]} hover:border-teal-700/60`}
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded border border-slate-800 bg-slate-900">
        {item.kind === "image" && item.url ? (
          <Image src={item.url} alt="" fill sizes="80px" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-slate-500">
            <FileText className="h-6 w-6 text-teal-500/90" aria-hidden />
            <span className="text-[9px] font-medium uppercase tracking-wide">PDF</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          {item.kind === "image" && <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />}
          {item.showSignedBadge && <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Signed document attached" />}
          {item.status === "missing" && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
          <span className="text-sm font-medium text-slate-100 group-hover:text-teal-100">{item.label}</span>
          <span className={`ml-2 inline-flex rounded px-2 py-0.5 text-xs font-medium ${item.status === "missing" ? "bg-red-950 text-red-100" : "bg-emerald-950 text-emerald-100"}`}>
            {item.status.toUpperCase()}
          </span>
          {item.required && <span className="ml-2 inline-flex rounded px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-100">REQUIRED</span>}
        </div>
        <p className="mt-1 truncate font-mono text-[10px] text-slate-500">{item.url || "No generated URL"}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-teal-500/90">
          {item.url && item.status === "ready" ? "Open in new tab" : "Missing / Needs review"}
        </p>
      </div>
    </a>
  );
}
