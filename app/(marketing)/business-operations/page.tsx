import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Business Operations | BackOfficeFleet",
  description:
    "Recovered BOF Business Operations section covering onboarding, document control, operational reporting, customer billing, payroll administration, and finance workflows.",
};

const sections = [
  {
    href: "/business-operations/driver-onboarding",
    title: "Driver Onboarding",
    body: "Guide applicants, verify credentials, and move the workforce from intent to assignment readiness while preserving accountability.",
  },
  {
    href: "/business-operations/document-records-control",
    title: "Document & Records Control",
    body: "Keep the business record organized, versioned, and review-ready across driver files, policy documentation, and operational evidence.",
  },
  {
    href: "/business-operations/operational-reporting",
    title: "Operational Reporting",
    body: "Turn daily execution into leadership visibility with ownership, exception handling, and next-action clarity.",
  },
  {
    href: "/business-operations/customer-billing",
    title: "Customer Billing",
    body: "Support cleaner packet readiness, account follow-through, and invoice confidence with proof tied to the customer record.",
  },
  {
    href: "/business-operations/payroll-administration",
    title: "Payroll Administration",
    body: "Spot pay exceptions early, connect them to evidence, and keep the review discipline in view before the payment cycle closes.",
  },
  {
    href: "/business-operations/accounting-finance",
    title: "Accounting & Finance",
    body: "Align payroll, receivables, accounting controls, and reporting around the same executed operational truth.",
  },
] as const;

const proofItems = [
  "Administrative command center",
  "Workforce management",
  "Finance & accounting",
  "Payroll & compliance",
] as const;

export default function BusinessOperationsOverviewPage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations" />
      <main className="bg-slate-100 text-slate-900">
        <section className="relative isolate overflow-hidden border-b border-slate-800 bg-slate-950">
          <Image
            src="/assets/images/cinematic/business-operations-worktable-desktop-v2-png.webp"
            alt="Business Operations command center with finance, payroll, and workforce management views"
            fill
            priority
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/55" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">Back-office command</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Run the business behind the fleet with the same discipline as the road.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-slate-200">
                Business Operations is where onboarding, documents, payroll, billing, finance, and reporting become a disciplined operating layer instead of disconnected admin work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard" className="rounded-full bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300">
                  Open operational overview
                </Link>
                <Link href="/documents/company-operations-vault" className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Company operations vault
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-sm text-slate-200">
                {proofItems.map((item) => (
                  <span key={item} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Administrative command center", "The office closes the loop on readiness, proof, and next action."],
              ["Workforce management", "Driver onboarding and service readiness remain visible with clear ownership."],
              ["Finance & accounting", "Cash flow, billing, and receivables stay connected to operating proof."],
              ["Payroll & compliance", "Exception review, policy control, and reporting stay organized."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Recovered page family</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Business operations section hierarchy</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => (
              <Link key={section.href} href={section.href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Section</p>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">{section.title}</h3>
                <p className="mt-3 text-slate-600">{section.body}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-teal-700 group-hover:text-teal-800">Open section →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Data boundary</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Recovered narrative, current BOF product boundary</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Current durable</h3>
                <p className="mt-2 text-sm text-slate-600">/dashboard, /dispatch, /drivers, /documents, and related BOF operational surfaces remain the live product authority.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Recovered experience</h3>
                <p className="mt-2 text-sm text-slate-600">This section restores the historical BOF story, hierarchy, and business-function framing without treating demo pages as live customer data.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Current direction</h3>
                <p className="mt-2 text-sm text-slate-600">Keep public BOF storytelling clear and distinct from authenticated product screens, while preserving the recovered section architecture.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
