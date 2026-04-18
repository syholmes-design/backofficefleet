"use client";

import Image from "next/image";
import { FileText, ImageIcon } from "lucide-react";
import type { Load } from "@/types/dispatch";

type DocItem = {
  key: string;
  label: string;
  url: string;
  kind: "pdf" | "image";
};

function collectDocItems(load: Load): DocItem[] {
  const raw: { label: string; url?: string; kind: "pdf" | "image" }[] = [
    { label: "Rate confirmation", url: load.rate_con_url, kind: "pdf" },
    { label: "BOL", url: load.bol_url, kind: "pdf" },
    { label: "Invoice", url: load.invoice_url, kind: "pdf" },
    {
      label: "Equipment photo",
      url: load.equipment_photo_url,
      kind: "image",
    },
    { label: "Cargo photo", url: load.cargo_photo_url, kind: "image" },
    { label: "Seal photo", url: load.seal_photo_url, kind: "image" },
  ];
  return raw
    .filter((r): r is { label: string; url: string; kind: "pdf" | "image" } =>
      Boolean(r.url)
    )
    .map((r, i) => ({
      key: `${r.label}-${i}`,
      label: r.label,
      url: r.url,
      kind: r.kind,
    }));
}

type Props = {
  load: Load;
};

export function LoadDocumentsLibrary({ load }: Props) {
  const items = collectDocItems(load);

  if (items.length === 0) {
    return (
      <p className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-500">
        No document URLs on this load.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <a
          key={item.key}
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
      ))}
    </div>
  );
}
