"use client";

import Link from "next/link";
import { useState } from "react";

import { DispatchNav } from "@/components/dispatch/DispatchNav";
import { LoadRequirementsWizard } from "@/components/load-intake/LoadRequirementsWizard";
import { TripPacketWorkspace } from "@/components/trip-packet/TripPacketWorkspace";

export function DispatchIntakePageClient() {
  const [showFallbackWizard, setShowFallbackWizard] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100">
      <DispatchNav />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
        <header className="border-b border-slate-800 bg-slate-950 px-5 py-4">
          <nav className="text-xs text-slate-400" aria-label="Breadcrumb">
            <Link href="/dispatch" className="text-teal-400 hover:underline">
              Dispatch
            </Link>
            <span aria-hidden="true"> / </span>
            <span className="text-slate-200">Trip packet intake</span>
          </nav>
          <h1 className="mt-2 text-xl font-semibold text-white">Trip packet intake</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Primary workspace for dispatch packet assembly, parser intake, role-based document visibility,
            signatures, trip preparedness, customer proof, billing, settlement, and owner financial review.
          </p>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">
          <TripPacketWorkspace />

          <section className="mx-5 mb-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Legacy fallback</p>
                <h2 className="mt-1 text-lg font-black text-white">Old load-requirements wizard</h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-400">
                  Kept temporarily for manual fields and save-to-dispatch behavior while the new trip packet
                  workflow absorbs the remaining intake functions.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-teal-400 hover:bg-teal-500/10 hover:text-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
                onClick={() => setShowFallbackWizard((value) => !value)}
              >
                {showFallbackWizard ? "Hide legacy wizard" : "Open legacy wizard"}
              </button>
            </div>

            {showFallbackWizard && (
              <div className="mt-5 border-t border-slate-800 pt-5">
                <LoadRequirementsWizard />
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
