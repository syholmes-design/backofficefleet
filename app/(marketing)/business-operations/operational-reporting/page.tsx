import type { Metadata } from "next";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Operational Reporting | Business Operations",
  description: "Recovered BOF operational reporting framework with leadership visibility and queue accountability.",
};

export default function OperationalReportingPage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations/operational-reporting" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Operational Reporting</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Give the business a clear operating picture—without losing actionability.</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            The recovered BOF reporting section frames operational data as leadership decision support: track the queue, know who owns the issue, and turn performance into action instead of static review.
          </p>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { title: "Leader-ready views", body: "Summarize activity in operational language that executives, managers, and support teams can act on quickly." },
            { title: "Owner queue", body: "Route attention to the teams and individuals responsible for clearing the blocker before it compounds." },
            { title: "Signal-to-action", body: "Move from data observation to daily operating control rather than passive reporting on stale metrics." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <div className="mt-10 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Recovered subsection</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Owner Queue Reporting</h2>
            <Link href="/business-operations/operational-reporting/owner-queue-reporting" className="inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
              Open owner queue reporting
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
