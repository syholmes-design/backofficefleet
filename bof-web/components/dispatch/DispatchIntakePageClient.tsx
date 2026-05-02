"use client";

import Link from "next/link";
import { DispatchNav } from "@/components/dispatch/DispatchNav";
import { LoadRequirementsWizard } from "@/components/load-intake/LoadRequirementsWizard";

/**
 * Canonical BOF load intake under the Dispatch module (`/dispatch/intake`).
 * Renders the same `LoadRequirementsWizard` as the legacy load-intake route (now redirects here).
 */
export function DispatchIntakePageClient() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100">
      <DispatchNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
        <header className="border-b border-slate-800 px-5 py-4">
          <nav className="text-xs text-slate-400" aria-label="Breadcrumb">
            <Link href="/dispatch" className="text-teal-400 hover:underline">
              Dispatch
            </Link>
            <span aria-hidden> / </span>
            <span className="text-slate-200">Load intake</span>
          </nav>
          <h1 className="mt-2 text-lg font-semibold text-white">Load intake</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            First operational step before a load appears on the dispatch board — same wizard as the
            canonical BOF pipeline (manual entry, upload/parser when configured, client request import,
            normalize/review/save, dispatch sync, proof bundle).
          </p>
        </header>
        <div className="min-h-0 flex-1">
          <LoadRequirementsWizard />
        </div>
      </div>
    </div>
  );
}
