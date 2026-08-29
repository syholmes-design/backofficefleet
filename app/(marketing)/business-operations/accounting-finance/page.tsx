import type { Metadata } from "next";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Accounting & Finance | Business Operations",
  description: "Recovered BOF accounting and finance operational view for payments, AR, and financial control.",
};

export default function AccountingFinancePage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations/accounting-finance" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Accounting &amp; Finance</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Keep the money story aligned with the operational record.</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            The recovered BOF finance view integrates payroll, accounting, collections, and receivables with the same execution context used by drivers, dispatch, and fleet operations.
          </p>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { title: "Payroll control", body: "Coordinate reconciliation, deductions, fresh approvals, and exceptions before compensation moves through the cycle." },
            { title: "Receivables & AR", body: "Give finance teams the operating truth needed to reduce friction, cash delays, and friction between service events and billing." },
            { title: "Financial governance", body: "Link the finance story to policy, company operations, and the evidence used to support operational decisions." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">Connected BOF surfaces</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Settlements and vault continuity</h2>
            <Link href="/settlements" className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Open settlements
            </Link>
          </div>
          <p className="mt-3 text-slate-700">
            This recovered page preserves the finance narrative while staying anchored to the current BOF product surfaces rather than creating a duplicate administrative system.
          </p>
        </div>
      </main>
    </>
  );
}
