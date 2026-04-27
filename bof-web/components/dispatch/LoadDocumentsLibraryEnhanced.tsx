"use client";

import Image from "next/image";
import { CheckCircle2, FileText, ImageIcon, FilePlus, AlertCircle } from "lucide-react";
import type { Load } from "@/types/dispatch";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { BOF_TEMPLATE_PACKS } from "@/lib/bof-template-system";

type DocLinkItem = {
  key: string;
  label: string;
  url: string;
  kind: "pdf" | "image";
  showSignedBadge: boolean;
  status?: "ready" | "draft" | "missing";
  action?: "view" | "generate";
  required?: boolean;
};

function isSignedDocUrl(url: string): boolean {
  return url.includes("/actual_docs/");
}

function pushIfUrl(
  items: DocLinkItem[],
  key: string,
  label: string,
  url: string | undefined,
  kind: "pdf" | "image",
  status?: "ready" | "draft" | "missing",
  action?: "view" | "generate",
  required?: boolean
) {
  if (!url?.trim()) return;
  items.push({
    key,
    label,
    url: url.trim(),
    kind,
    showSignedBadge: kind === "pdf" && isSignedDocUrl(url),
    status,
    action,
    required,
  });
}

function coreShipmentDocs(load: Load): DocLinkItem[] {
  const items: DocLinkItem[] = [];
  pushIfUrl(items, "rate-con", "Rate Confirmation", load.rate_con_url, "pdf");
  pushIfUrl(items, "bol", "Bill of Lading", load.bol_url, "pdf");
  pushIfUrl(items, "pod", "POD", load.pod_url, "pdf");
  pushIfUrl(items, "invoice", "Invoice", load.invoice_url, "pdf");
  return items;
}

function proofAndMediaDocs(load: Load): DocLinkItem[] {
  const items: DocLinkItem[] = [];
  pushIfUrl(items, "cargo", "Cargo photo", load.cargo_photo_url, "image");
  pushIfUrl(items, "seal", "Seal photo", load.seal_photo_url, "image");
  pushIfUrl(
    items,
    "equipment",
    "Equipment photo",
    load.equipment_photo_url,
    "image"
  );
  pushIfUrl(
    items,
    "pickup",
    "Pickup photo",
    load.pickup_photo_url,
    "image"
  );
  pushIfUrl(
    items,
    "delivery",
    "Delivery photo",
    load.delivery_photo_url,
    "image"
  );
  pushIfUrl(
    items,
    "lumper",
    "Lumper receipt",
    load.lumper_photo_url,
    "image"
  );
  return items;
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

function getDispatchTemplatesForLoad(loadId: string): DocLinkItem[] {
  const templates: DocLinkItem[] = [];
  
  // Find templates that appear in dispatch
  const dispatchTemplates = BOF_TEMPLATE_PACKS
    .flatMap(pack => pack.templates)
    .filter(template => template.appearsInDispatch || template.appearsInFieldOps);
  
  for (const template of dispatchTemplates) {
    if (template.requiredEntityKeys.includes("loadId")) {
      const url = `/generated/loads/${loadId}/${template.templateId}.html`;
      pushIfUrl(
        templates,
        template.templateId,
        template.templateName,
        url,
        "pdf",
        template.documentStatus === "ready" ? "ready" : "draft",
        "view",
        template.requiredBeforeRelease
      );
    }
  }
  
  return templates;
}

function getLoadOwnedDocuments(load: Load): DocLinkItem[] {
  const items: DocLinkItem[] = [];
  
  // Core shipment docs from load object
  const core = coreShipmentDocs(load);
  
  // Proof & media docs from load object  
  const proof = proofAndMediaDocs(load);
  
  // Template-generated docs
  const templates = getDispatchTemplatesForLoad(load.load_id);
  
  return [...core, ...proof, ...templates];
}

type Props = {
  load: Load;
};

export function LoadDocumentsLibraryEnhanced({ load }: Props) {
  const { data } = useBofDemoData();
  
  const allDocs = getLoadOwnedDocuments(load);
  const hasAny = allDocs.length > 0;
  
  // Document status analysis
  const docStatus = {
    available: allDocs.filter(doc => doc.status === "ready" || doc.url).length,
    missing: allDocs.filter(doc => doc.status === "missing").length,
    draft: allDocs.filter(doc => doc.status === "draft").length,
    required: allDocs.filter(doc => doc.required).length,
  };

  if (!hasAny) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FilePlus className="h-3.5 w-3.5 text-teal-500" />
            Load Documents
          </h3>
          <p className="text-sm text-slate-300">
            No documents are currently available for this load. Generate required documents below.
          </p>
          <div className="mt-4 space-y-2">
            {getDispatchTemplatesForLoad(load.load_id).map((template) => (
              <div key={template.key} className="flex items-center justify-between p-3 rounded border border-slate-700 bg-slate-950/50">
                <div>
                  <span className="text-sm font-medium text-slate-100">{template.label}</span>
                  <span className="text-xs text-slate-400">Template</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(`/generated/loads/${load.load_id}/${template.key}.html`, '_blank')}
                  className="rounded border border-teal-600 bg-teal-950/30 px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900/50"
                >
                  Generate
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Status Summary */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <FileText className="h-3.5 w-3.5 text-teal-500" />
          Document Status
        </h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
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
            <div className={`text-2xl font-bold ${docStatus.draft > 0 ? "text-amber-400" : "text-slate-600"}`}>
              {docStatus.draft}
            </div>
            <div className="text-xs text-slate-400">Draft</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${docStatus.required > 0 ? "text-teal-400" : "text-slate-600"}`}>
              {docStatus.required}
            </div>
            <div className="text-xs text-slate-400">Required</div>
          </div>
        </div>
        {(docStatus.missing > 0 || docStatus.required > 0) && (
          <div className="mt-3 rounded border border-amber-900/40 bg-amber-950/20 p-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="text-xs text-amber-100">
                <strong>Readiness blockers:</strong> {docStatus.missing + docStatus.required} required documents need to be generated or uploaded before this load can be released for settlement.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Core Shipment Documents */}
      <DocGroup 
        title="Core shipment docs" 
        items={allDocs.filter(doc => 
          ["rate-con", "bol", "pod", "invoice"].includes(doc.key)
        )} 
        emptyHint="No rate con, BOL, POD, or invoice documents available." 
      />

      {/* Proof & Media */}
      <DocGroup
        title="Proof & media"
        items={allDocs.filter(doc => 
          ["cargo", "seal", "equipment", "pickup", "delivery", "lumper"].includes(doc.key)
        )}
        emptyHint="No photo, seal, or media documents available."
      />

      {/* Template-Generated Documents */}
      <DocGroup
        title="Template-generated documents"
        items={allDocs.filter(doc => 
          !["rate-con", "bol", "pod", "invoice", "cargo", "seal", "equipment", "pickup", "delivery", "lumper"].includes(doc.key)
        )}
        emptyHint="No template-generated documents available."
      />

      {/* Exception / Claim Support */}
      {showExceptionClaimSection(load) && (
        <div>
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Exception / claim support
          </h4>
          <div className="space-y-2">
            {load.exception_reason && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Exception notes
                </p>
                <p className="mt-1 text-sm text-slate-200">{load.exception_reason}</p>
              </div>
            )}
            {load.claim_form_url && (
              <DocCard item={docItemFrom("claim-form", "Claim form", load.claim_form_url, "pdf")} />
            )}
            {load.damage_photo_url && (
              <DocCard
                item={docItemFrom(
                  "damage",
                  "Damage photos",
                  load.damage_photo_url,
                  "image"
                )}
              />
            )}
            {load.supporting_attachment_url && (
              <DocCard
                item={docItemFrom(
                  "support",
                  "Supporting attachment",
                  load.supporting_attachment_url,
                  "pdf"
                )}
              />
            )}
            {!load.exception_reason &&
              !load.claim_form_url &&
              !load.damage_photo_url &&
              !load.supporting_attachment_url && (
                <p className="text-xs text-slate-500">
                  No exception narrative or claim artifacts linked yet.
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

function docItemFrom(
  key: string,
  label: string,
  url: string,
  kind: "pdf" | "image",
  status?: "ready" | "draft" | "missing",
  action?: "view" | "generate",
  required?: boolean
): DocLinkItem {
  return {
    key,
    label,
    url,
    kind,
    showSignedBadge: kind === "pdf" && isSignedDocUrl(url),
    status,
    action,
    required,
  };
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
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
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
    draft: "border-amber-700/60 bg-amber-950/40", 
    missing: "border-red-700/60 bg-red-950/40",
  };

  const actionColors = {
    view: "border-teal-600 bg-teal-950/30 hover:bg-teal-900/50",
    generate: "border-teal-600 bg-teal-900/30 hover:bg-teal-900/50",
  };

  const statusIcon = {
    missing: <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />,
    draft: <FilePlus className="h-3.5 w-3.5 shrink-0 text-amber-400" />,
    ready: null,
  };

  return (
    <a
      href={item.action === "generate" ? "#" : item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={item.action === "generate" ? (e) => {
        e.preventDefault();
        window.open(`/generated/loads/${item.url.split('/')[3]}/${item.key}.html`, '_blank');
      } : undefined}
      className={`group flex gap-3 rounded-lg border p-3 transition-colors ${
        item.action === "generate" 
          ? actionColors.generate 
          : statusColors[item.status || "ready"]
      } hover:border-teal-700/60`}
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded border border-slate-800 bg-slate-900">
        {item.kind === "image" ? (
          <Image
            src={item.url}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-slate-500">
            <FileText className="h-6 w-6 text-teal-500/90" aria-hidden />
            <span className="text-[9px] font-medium uppercase tracking-wide">
              PDF
            </span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          {item.kind === "image" && (
            <ImageIcon
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500"
              aria-hidden
            />
          )}
          {item.showSignedBadge && (
            <CheckCircle2
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500"
              aria-label="Signed document attached"
            />
          )}
          {statusIcon[item.status || "ready"]}
          <span className="text-sm font-medium text-slate-100 group-hover:text-teal-100">
            {item.label}
          </span>
          {item.status && (
            <span className={`ml-2 inline-flex rounded px-2 py-0.5 text-xs font-medium ${
              item.status === "missing" ? "bg-red-950 text-red-100" :
              item.status === "draft" ? "bg-amber-950 text-amber-100" :
              "bg-emerald-950 text-emerald-100"
            }`}>
              {item.status.toUpperCase()}
            </span>
          )}
          {item.required && (
            <span className="ml-2 inline-flex rounded px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-100">
              REQUIRED
            </span>
          )}
          {item.action === "generate" && (
            <span className="ml-2 text-xs text-teal-400">
              Click to generate
            </span>
          )}
        </div>
        <p className="mt-1 truncate font-mono text-[10px] text-slate-500">
          {item.url}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-teal-500/90">
          {item.action === "generate" ? "Generate" : "Open in new tab"}
        </p>
      </div>
    </a>
  );
}
