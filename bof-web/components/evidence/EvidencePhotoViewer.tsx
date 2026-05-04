"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

/** Manifest-backed raster or SVG evidence (full-resolution URL, not a resized asset). */
export function isLoadEvidenceImageUrl(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  return /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url.trim());
}

function filenameFromUrl(url: string): string {
  try {
    const path = url.split("?")[0] ?? url;
    const seg = path.split("/").filter(Boolean);
    return seg[seg.length - 1] || "evidence";
  } catch {
    return "evidence";
  }
}

export type EvidencePhotoViewerProps = {
  /** Shown in table / card — evidence title (e.g. "Seal delivery photo"). */
  label: string;
  source: string;
  loadId: string;
  description?: string;
  /**
   * Image URL used for thumbnail and modal when no separate full URL is provided.
   * Must be the manifest / full-resolution asset (not a resized CDN thumb).
   */
  url: string;
  /** When the data model supplies a smaller preview URL, use this for the thumb only. */
  thumbnailUrl?: string;
  /** Full-resolution URL for modal, "Open in new tab", and "Download" (defaults to `url`). */
  fullImageUrl?: string;
  /** Stable evidence key / type (e.g. `seal_delivery_photo`, `pod`). */
  evidenceType?: string;
  /**
   * `inline` — compact row for tables (thumb + actions).
   * `stack` — thumb on top, actions below (narrow columns).
   */
  layout?: "inline" | "stack";
  /** Custom thumbnail control; receives `open` to wire the modal. */
  renderThumb?: (open: () => void) => ReactNode;
};

export function EvidencePhotoViewer({
  url,
  label,
  source,
  loadId,
  description,
  thumbnailUrl,
  fullImageUrl,
  evidenceType,
  layout = "inline",
  renderThumb,
}: EvidencePhotoViewerProps) {
  const imageSrc = (fullImageUrl ?? url).trim();
  const thumbSrc = (thumbnailUrl ?? imageSrc).trim();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [thumbBroken, setThumbBroken] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!isLoadEvidenceImageUrl(imageSrc)) {
    return (
      <a
        href={imageSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="bof-link-secondary text-xs font-semibold"
      >
        Open file
      </a>
    );
  }

  const downloadName = filenameFromUrl(imageSrc);

  const defaultThumb = (
    <button
      type="button"
      className="bof-evidence-thumb shrink-0 overflow-hidden rounded border border-slate-700 bg-slate-900/80 p-0 text-left shadow-sm ring-offset-2 ring-offset-slate-950 hover:ring-2 hover:ring-teal-500/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
      onClick={openModal}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? titleId : undefined}
    >
      {!thumbBroken ? (
        // eslint-disable-next-line @next/next/no-img-element -- manifest URLs; avoid Next remotePatterns churn
        <img
          src={thumbSrc}
          alt={label}
          className="bof-evidence-thumb__img h-full w-full object-contain"
          loading="lazy"
          onError={() => setThumbBroken(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-slate-500">
          Preview unavailable
        </span>
      )}
    </button>
  );

  const actions = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={openModal}
        className="text-xs font-semibold text-teal-300 hover:text-teal-200"
      >
        View photo
      </button>
      <a
        href={imageSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-medium text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
      >
        Open in new tab
      </a>
    </div>
  );

  const modalInner = (
    <div
      className="bof-evidence-modal__backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="bof-evidence-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="bof-evidence-modal__head">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="bof-evidence-modal__title truncate text-base font-semibold text-slate-100">
              {label}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              <span className="font-mono text-slate-400">{loadId}</span>
              {evidenceType ? (
                <>
                  {" "}
                  <span className="text-slate-600">·</span>{" "}
                  <span className="font-mono text-slate-500">{evidenceType}</span>
                </>
              ) : null}
            </p>
            {description ? (
              <p className="mt-1 text-xs text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="bof-evidence-modal__close"
            onClick={close}
            aria-label="Close preview"
          >
            ×
          </button>
        </header>
        <div className="bof-evidence-modal__toolbar">
          <span className="bof-evidence-modal__badge">{source}</span>
          <a
            href={imageSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-teal-300 hover:text-teal-200"
          >
            Open in new tab
          </a>
          <a
            href={imageSrc}
            download={downloadName}
            className="text-xs font-semibold text-slate-300 hover:text-white"
          >
            Download
          </a>
        </div>
        <div className="bof-evidence-modal__image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={label} className="bof-evidence-modal__image" />
        </div>
      </div>
    </div>
  );

  const modal = mounted && open ? createPortal(modalInner, document.body) : null;

  const thumbEl = renderThumb ? renderThumb(openModal) : defaultThumb;

  if (layout === "stack") {
    return (
      <>
        <div className="flex flex-col gap-2">
          {thumbEl}
          {actions}
        </div>
        {modal}
      </>
    );
  }

  return (
    <>
      <div className="flex max-w-[min(100%,420px)] flex-wrap items-center gap-2">
        {thumbEl}
        {actions}
      </div>
      {modal}
    </>
  );
}
