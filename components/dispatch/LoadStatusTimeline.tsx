"use client";

import type { LoadStatus } from "@/types/dispatch";
import { Check } from "lucide-react";

const STEPS: LoadStatus[] = [
  "Planned",
  "Assigned",
  "Dispatched",
  "In Transit",
  "Delivered",
];

type Props = {
  status: LoadStatus;
};

export function LoadStatusTimeline({ status }: Props) {
  const isException = status === "Exception";

  if (isException) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status timeline
        </h3>
        <ol className="flex flex-wrap items-center gap-1">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center">
              {i > 0 && (
                <span
                  className="mx-1 h-px w-6 shrink-0 bg-slate-600"
                  aria-hidden
                />
              )}
              <div className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs font-medium text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] text-slate-200">
                  {i + 1}
                </span>
                {step}
              </div>
            </li>
          ))}
          <span className="mx-1 h-px w-6 shrink-0 bg-red-700/70" aria-hidden />
          <div className="flex items-center gap-1.5 rounded-md border border-red-700/60 bg-red-950/50 px-2 py-1 text-xs font-medium text-red-100">
            Exception
          </div>
        </ol>
      </div>
    );
  }

  const activeIdx = Math.max(0, STEPS.indexOf(status));

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Status timeline
      </h3>
      <ol className="flex flex-wrap items-center gap-1">
        {STEPS.map((step, i) => {
          const done = i < activeIdx;
          const current = i === activeIdx;
          return (
            <li key={step} className="flex items-center">
              {i > 0 && (
                <span
                  className={[
                    "mx-1 h-px w-6 shrink-0",
                    i <= activeIdx ? "bg-teal-600" : "bg-slate-700",
                  ].join(" ")}
                  aria-hidden
                />
              )}
              <div
                className={[
                  "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
                  current
                    ? "border-teal-500 bg-teal-950/60 text-teal-100"
                    : done
                      ? "border-slate-600 bg-slate-800 text-slate-200"
                      : "border-slate-800 bg-slate-950 text-slate-500",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                    done
                      ? "bg-teal-700 text-white"
                      : current
                        ? "bg-teal-500 text-slate-950"
                        : "bg-slate-800 text-slate-500",
                  ].join(" ")}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {step}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
