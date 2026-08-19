import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Investors | BackOfficeFleet",
  description:
    "BackOfficeFleet investor narrative: execution-critical trucking operations wedge with disciplined expansion into broader operating infrastructure.",
};

export default function InvestorsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Investor brief</p>
      <h1 className="mt-3 text-4xl font-extrabold text-slate-950">BackOfficeFleet starts with the execution bottleneck fleets cannot ignore.</h1>
      <p className="mt-5 max-w-4xl text-lg text-slate-700">
        BOF addresses fragmented trucking operations where readiness, assignment, pre-trip, dispatch, evidence, and
        settlement controls break down between teams and systems.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Current execution wedge</h2>
          <p className="mt-2 text-slate-600">
            Intake → readiness/assignment → pre-trip → dispatch/enroute operations with enforced operating state and
            accountable ownership.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Expansion path</h2>
          <p className="mt-2 text-slate-600">
            Recurring infrastructure across safety, maintenance, settlements, HR/payroll, accounting, finance, and
            business operations without presenting roadmap modules as already deployed.
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-bold text-slate-900">Discipline</h2>
        <p className="mt-2 text-slate-700">
          This page intentionally avoids unsupported claims, fabricated customer counts, revenue, valuation, or market-share
          assertions. BOF positions around operational control and measurable workflow outcomes.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/assessment" className="inline-flex rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800">
          Request an operating assessment
        </Link>
        <Link href="/contact?topic=investor" className="inline-flex rounded-md border border-teal-700 px-5 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-50">
          Contact BOF for investor discussion
        </Link>
      </div>
    </main>
  );
}
