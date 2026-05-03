"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveSafetyEvidencePublicUrl } from "@/lib/safety-evidence-url";
import { ProofGapReviewLinks } from "@/components/review/ReviewDeepLinks";

type Props = {
  /** Raw URL from demo data (may be legacy `.png`). */
  rawUrl: string;
  alt: string;
  /** Applied to the image when evidence resolves and loads. */
  className?: string;
  /** When preview fails, surface hub / vault / load review routes if known. */
  driverId?: string | null;
  loadId?: string | null;
};

function EvidenceUnavailableCard({
  rawUrl,
  driverId,
  loadId,
}: {
  rawUrl: string;
  driverId?: string | null;
  loadId?: string | null;
}) {
  return (
    <div
      className="mb-2 rounded border border-amber-900/40 bg-slate-900/80 px-2 py-3 text-center text-[11px] text-slate-300"
      role="status"
    >
      <p className="font-medium text-slate-200">Evidence unavailable / needs review</p>
      <p className="mt-1 text-[10px] leading-snug text-slate-500">
        The preview could not be loaded (file missing, blocked, or unsupported format).
      </p>
      <ProofGapReviewLinks
        driverId={driverId}
        loadId={loadId}
        className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1"
      />
      {rawUrl.trim().startsWith("/evidence/safety/") ? (
        <span className="mt-2 block break-all font-mono text-[9px] text-slate-600">{rawUrl}</span>
      ) : null}
    </div>
  );
}

export function SafetyEvidenceThumb({ rawUrl, alt, className, driverId, loadId }: Props) {
  const resolved = useMemo(() => resolveSafetyEvidencePublicUrl(rawUrl), [rawUrl]);
  const [decodeFailed, setDecodeFailed] = useState(false);

  useEffect(() => {
    setDecodeFailed(false);
  }, [resolved.url, resolved.ready]);

  if (!resolved.ready || !resolved.url || decodeFailed) {
    return <EvidenceUnavailableCard rawUrl={rawUrl} driverId={driverId} loadId={loadId} />;
  }

  const imgClass =
    className ??
    "mb-2 h-28 w-full rounded border border-slate-800 bg-slate-950 object-cover object-center";

  return (
    <div className="relative mb-2 min-h-[4.5rem] overflow-hidden rounded-lg rounded-t-xl border border-slate-800 bg-slate-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved.url}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${imgClass} mb-0 block max-h-28 w-full`}
        onError={() => setDecodeFailed(true)}
      />
    </div>
  );
}

/** Href for “Open evidence” when a committed public file exists. */
export function getSafetyEvidenceOpenHref(rawUrl: string): string | null {
  return resolveSafetyEvidencePublicUrl(rawUrl).url;
}
