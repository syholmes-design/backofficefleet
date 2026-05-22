"use client";

import { useRouter } from "next/navigation";

type DemoBackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function DemoBackButton({
  fallbackHref = "/dashboard",
  label = "Back",
  className,
}: DemoBackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className={
        className ??
        "inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
      }
      aria-label={label}
    >
      <span aria-hidden>←</span>
      <span>{label}</span>
    </button>
  );
}

