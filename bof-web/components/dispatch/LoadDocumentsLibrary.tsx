"use client";

import Image from "next/image";
import { CheckCircle2, FileText, ImageIcon } from "lucide-react";
import type { Load } from "@/types/dispatch";

type DocLinkItem = {
  key: string;
  label: string;
  url: string;
  kind: "pdf" | "image";
  showSignedBadge: boolean;
};

function isSignedDocUrl(url: string): boolean {
  return url.includes("/actual_docs/");
}

function pushIfUrl(
  items: DocLinkItem[],
  key: string,
  label: string,
  url: string | undefined,
  kind: "pdf" | "image"
) {
  if (!url?.trim()) return;
  items.push({
    key,
    label,
    url: url.trim(),
    kind,
    showSignedBadge: kind === "pdf" && isSignedDocUrl(url),
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

type Props = {
  load: Load;
};

export function LoadDocumentsLibrary({ load }: Props) {
  const core = coreShipmentDocs(load);
  const proof = proofAndMediaDocs(load);
  const showClaim = showExceptionClaimSection(load);

  const hasAny = core.length > 0 || proof.length > 0 || showClaim;

  if (!hasAny) {
    return (
      <p className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-500">
        No document URLs on this load.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <DocGroup title="Core shipment docs" items={core} emptyHint="No rate con, BOL, POD, or invoice links." />
      <DocGroup
        title="Proof &amp; media"
        items={proof}
        emptyHint="No photo or lumper links."
      />
      {showClaim && (
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
  kind: "pdf" | "image"
): DocLinkItem {
  return {
    key,
    label,
    url,
    kind,
    showSignedBadge: kind === "pdf" && isSignedDocUrl(url),
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
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 transition-colors hover:border-teal-700/60 hover:bg-slate-900/80"
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
          <span className="text-sm font-medium text-slate-100 group-hover:text-teal-100">
            {item.label}
          </span>
        </div>
        <p className="mt-1 truncate font-mono text-[10px] text-slate-500">
          {item.url}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-teal-500/90">
          Open in new tab
        </p>
      </div>
    </a>
  );
}
