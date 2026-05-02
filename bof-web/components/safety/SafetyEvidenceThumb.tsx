"use client";

import { useMemo, useState } from "react";
import { resolveSafetyEvidencePublicUrl } from "@/lib/safety-evidence-url";

type Props = {
  /** Raw URL from demo data (may be legacy `.png`). */
  rawUrl: string;
  alt: string;
  /** Applied to the image when evidence resolves and loads. */
  className?: string;
};

export function SafetyEvidenceThumb({ rawUrl, alt, className }: Props) {
  const resolved = useMemo(() => resolveSafetyEvidencePublicUrl(rawUrl), [rawUrl]);
  const [broken, setBroken] = useState(false);

  if (!resolved.ready || !resolved.url || broken) {
    return (
      <div className="mb-2 rounded border border-slate-700 bg-slate-900 px-2 py-2 text-[10px] text-slate-400">
        Missing / Needs review
        {rawUrl.trim().startsWith("/evidence/safety/") ? (
          <span className="mt-1 block break-all font-mono text-[9px] text-slate-600">{rawUrl}</span>
        ) : null}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved.url}
      alt={alt}
      className={
        className ??
        "mb-2 h-28 w-full rounded border border-slate-800 bg-slate-950 object-contain object-center"
      }
      onError={() => setBroken(true)}
    />
  );
}

/** Href for “Open evidence” when a committed public file exists. */
export function getSafetyEvidenceOpenHref(rawUrl: string): string | null {
  return resolveSafetyEvidencePublicUrl(rawUrl).url;
}
