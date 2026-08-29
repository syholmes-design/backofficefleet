import type { Metadata } from "next";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Owner Queue Reporting | Business Operations",
  description: "Recovered BOF owner queue reporting patterns for action-focused operational transparency.",
};

export default function OwnerQueueReportingPage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations/operational-reporting" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Owner Queue Reporting</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Turn queue volume into ownership, accountability, and clear next actions.</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            BOF’s reporting flow is not just a dashboard for review. It makes the queue legible, attaches it to an owner, and connects the issue to the operational teams that can resolve it.
          </p>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { title: "Queued work", body: "Surface what needs action, by what urgency, and in which business function the issue currently sits." },
            { title: "Ownership mapping", body: "Ensure each exception or opportunity is tied to a team or accountable operator rather than remaining ambiguous." },
            { title: "Operational closure", body: "Track the movement from exception detection to resolution so leadership sees the operating cadence, not just the backlog." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/business-operations/operational-reporting" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
            Back to operational reporting
          </Link>
          <Link href="/dashboard" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            View operational overview
          </Link>
        </div>
      </main>
    </>
  );
}
