import type { Metadata } from "next";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Driver Onboarding | Business Operations",
  description: "Recovered BOF driver onboarding experience with assignment readiness and workforce intake structure.",
};

export default function DriverOnboardingPage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations/driver-onboarding" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Driver Onboarding</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Move drivers from applicant to assignment-ready without losing compliance control.</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            BOF’s recovered onboarding view organizes the people lifecycle around readiness: complete intake, verify identity and compliance, flag gaps early, and confirm the driver can move with confidence into the next assignment.
          </p>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            { title: "Applicant intake", body: "Capture the initial driver profile, application data, and readiness checklist in a structured flow." },
            { title: "Qualification review", body: "Track records, documents, and controls against the standards required to serve each assignment." },
            { title: "Assignment readiness", body: "Confirm the driver is operationally cleared before dispatch contracts and route commitments are made." },
            { title: "Queue ownership", body: "Keep blockers visible to the team owning the decision rather than leaving compliance activity hidden in email and spreadsheets." },
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
            <h2 className="text-2xl font-bold text-slate-900">Assignment Readiness</h2>
            <Link href="/business-operations/driver-onboarding/assignment-readiness" className="inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
              Open assignment readiness
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">Data boundary</p>
          <p className="mt-3 text-slate-700">
            This section preserves the recovered operating model and business-function structure. It does not claim that historical demo onboarding records are live customer data; it frames the experience as a current BOF capability narrative aligned to the durable operational surfaces already present in the product.
          </p>
        </div>
      </main>
    </>
  );
}
