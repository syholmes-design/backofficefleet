import type { Metadata } from "next";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Assignment Readiness | Business Operations",
  description: "Recovered BOF assignment readiness experience for driver qualification and readiness tracking.",
};

export default function AssignmentReadinessPage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations/driver-onboarding" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Assignment Readiness</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Readiness is the decision gate that keeps every assignment honest.</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            The recovered BOF view treats readiness as an operating control: every assignment should be supported by verified documentation, aligned staffing, and a clear owner for exceptions.
          </p>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { title: "Credential status", body: "Check the payer, driver, and compliance status before every posting, assignment, or dispatch decision." },
            { title: "Exception queue", body: "Open the blockers that need action from payroll, safety, or fleet operations before work moves forward." },
            { title: "Assignment clearance", body: "Only approve readiness when proof, review, and ownership lines are all in place." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/business-operations/driver-onboarding" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
            Back to Driver Onboarding
          </Link>
          <Link href="/dashboard" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            See current operations
          </Link>
        </div>
      </main>
    </>
  );
}
