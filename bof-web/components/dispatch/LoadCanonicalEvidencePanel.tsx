"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FileCheck, FileWarning, MinusCircle } from "lucide-react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  getCanonicalLoadEvidenceForLoad,
  type BofLoadEvidence,
} from "@/lib/canonical-load-evidence";

type Props = {
  loadId: string;
};

function sanitizeReason(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (/(?:\/|\\)(?:generated|evidence|actual_docs)(?:\/|\\)/i.test(raw)) {
    return "Artifact is not available in the published bundle yet.";
  }
  return raw;
}

function statusPresentation(ev: BofLoadEvidence): {
  chip: string;
  headline: string;
  sub?: string;
  tone: "ok" | "warn" | "muted" | "bad";
} {
  const title = ev.title;
  if (ev.status === "not_required") {
    return {
      chip: "Not required",
      headline: `${title}`,
      sub: sanitizeReason(ev.reason),
      tone: "muted",
    };
  }
  if (ev.status === "missing") {
    return {
      chip: "Missing",
      headline: `${title} not on file`,
      sub: sanitizeReason(ev.reason),
      tone: "bad",
    };
  }
  if (ev.status === "placeholder") {
    return {
      chip: "Pending review",
      headline: `${title} — placeholder document`,
      sub: "Replace with canonical scan or upload.",
      tone: "warn",
    };
  }

  switch (ev.evidenceType) {
    case "rate_confirmation":
      return {
        chip: "Verified",
        headline: "Rate confirmation on file",
        sub: "Carrier pricing packet available.",
        tone: "ok",
      };
    case "bol":
      return {
        chip: "Verified",
        headline: "BOL document on file",
        sub: "Bill of lading linked to this load.",
        tone: "ok",
      };
    case "pod":
      return {
        chip: "Verified",
        headline: "Proof of delivery on file",
        sub: "Signed POD linked for settlement review.",
        tone: "ok",
      };
    case "seal_pickup_photo":
      return {
        chip: "Photo evidence on file",
        headline: "Pickup seal photo verified",
        sub: "Timestamped seal capture available.",
        tone: "ok",
      };
    case "seal_delivery_photo":
      return {
        chip: "Photo evidence on file",
        headline: "Delivery seal photo verified",
        sub: "Receiver seal documentation available.",
        tone: "ok",
      };
    case "cargo_pickup_photo":
      return {
        chip: "Photo evidence on file",
        headline: "Cargo pickup photos on file",
        sub: "Condition documentation available.",
        tone: "ok",
      };
    case "cargo_delivery_photo":
      return {
        chip: "Photo evidence on file",
        headline: "Cargo / delivery photos on file",
        sub: "Unload condition capture available.",
        tone: "ok",
      };
    case "lumper_receipt":
      return {
        chip: "Verified",
        headline: "Lumper receipt on file",
        sub: "Unload payment documentation available.",
        tone: "ok",
      };
    case "rfid_geo_proof":
      return {
        chip: "RFID verified",
        headline: "RFID dock event confirmed",
        sub: "Dock scan / geo proof artifact linked.",
        tone: "ok",
      };
    case "claim_photo":
      return {
        chip: "Verified",
        headline: "Claim photo evidence on file",
        sub: "Damage / exception imagery available.",
        tone: "ok",
      };
    case "insurance_packet":
      return {
        chip: "Verified",
        headline: "Insurance notification on file",
        sub: "Carrier notification packet linked.",
        tone: "ok",
      };
    default:
      return {
        chip: "Verified",
        headline: `${title} on file`,
        tone: "ok",
      };
  }
}

function toneBorder(tone: ReturnType<typeof statusPresentation>["tone"]) {
  if (tone === "ok") return "border-emerald-900/40 bg-emerald-950/20";
  if (tone === "warn") return "border-amber-900/45 bg-amber-950/20";
  if (tone === "bad") return "border-red-900/45 bg-red-950/25";
  return "border-slate-800 bg-slate-950/30";
}

export function LoadCanonicalEvidencePanel({ loadId }: Props) {
  const { data } = useBofDemoData();
  const rows = useMemo(
    () => getCanonicalLoadEvidenceForLoad(data, loadId),
    [data, loadId]
  );

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500">No canonical evidence rows for this load.</p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((ev) => {
        const pres = statusPresentation(ev);
        const showLink = Boolean(ev.url?.trim()) && ev.status !== "missing";
        return (
          <div
            key={ev.evidenceType}
            className={[
              "rounded-lg border px-3 py-2",
              toneBorder(pres.tone),
            ].join(" ")}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {pres.chip}
                </span>
                <p className="mt-1 text-sm font-medium text-slate-100">{pres.headline}</p>
                {pres.sub ? (
                  <p className="mt-0.5 text-xs text-slate-400">{pres.sub}</p>
                ) : null}
              </div>
              <div className="shrink-0">
                {showLink ? (
                  <Link
                    href={ev.url!}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-teal-300 hover:text-teal-200"
                  >
                    Open
                  </Link>
                ) : pres.tone === "muted" ? (
                  <MinusCircle className="h-4 w-4 text-slate-600" aria-hidden />
                ) : pres.tone === "bad" || pres.tone === "warn" ? (
                  <FileWarning className="h-4 w-4 text-amber-400" aria-hidden />
                ) : (
                  <FileCheck className="h-4 w-4 text-emerald-400" aria-hidden />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
