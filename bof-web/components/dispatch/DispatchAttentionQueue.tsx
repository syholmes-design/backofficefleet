"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getDispatchAttentionItems } from "@/lib/dispatch/dispatch-attention-items";

type Props = {
  limit?: number;
  className?: string;
  variant?: "dark" | "light";
};

function severityClass(sev: "critical" | "high" | "medium", variant: Props["variant"]) {
  if (variant === "light") {
    if (sev === "critical") return "border-red-200 bg-red-50 text-red-900";
    if (sev === "high") return "border-amber-200 bg-amber-50 text-amber-950";
    return "border-slate-200 bg-slate-50 text-slate-800";
  }
  if (sev === "critical") return "border-red-900/60 bg-red-950/40 text-red-100";
  if (sev === "high") return "border-amber-900/50 bg-amber-950/25 text-amber-100";
  return "border-slate-800 bg-slate-950/50 text-slate-200";
}

export function DispatchAttentionQueue({
  limit = 8,
  className = "",
  variant = "dark",
}: Props) {
  const { data } = useBofDemoData();
  const rows = useMemo(() => getDispatchAttentionItems(data, limit), [data, limit]);

  if (rows.length === 0) return null;

  return (
    <section
      className={[
        "rounded-lg border p-3",
        variant === "dark"
          ? "border-slate-800 bg-slate-900/40"
          : "border-slate-200 bg-white",
        className,
      ].join(" ")}
      aria-label="What needs attention"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={variant === "dark" ? "h-4 w-4 text-teal-400" : "h-4 w-4 text-teal-600"}
            aria-hidden
          />
          <h2
            className={
              variant === "dark"
                ? "text-xs font-semibold uppercase tracking-wide text-slate-400"
                : "text-xs font-semibold uppercase tracking-wide text-slate-600"
            }
          >
            What needs attention
          </h2>
        </div>
        <Link
          href="/command-center"
          className={
            variant === "dark"
              ? "text-[11px] font-semibold text-teal-300 hover:text-teal-200"
              : "text-[11px] font-semibold text-teal-700 hover:text-teal-800"
          }
        >
          Full queue →
        </Link>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={row.href}
              className={[
                "block rounded border px-2 py-2 transition-colors hover:border-teal-600/50",
                severityClass(row.severity, variant),
              ].join(" ")}
            >
              <p
                className={
                  variant === "dark"
                    ? "text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                    : "text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                }
              >
                {row.bucket}
              </p>
              <p className="mt-0.5 text-sm font-medium leading-snug">{row.title}</p>
              <p className="mt-1 text-xs opacity-90">{row.detail}</p>
              <p
                className={
                  variant === "dark"
                    ? "mt-1 text-[11px] text-teal-200/90"
                    : "mt-1 text-[11px] text-teal-700"
                }
              >
                {row.nextAction}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
