import type { Metadata } from "next";
import Link from "next/link";
import { FreightCompliancePulse } from "@/components/marketing/FreightCompliancePulse";
import { getRegulatoryFeedItems } from "@/lib/regulatory-feed/live-feed";

export const revalidate = 21600;

const WORKFLOW_STEPS = [
  {
    title: "Driver files and expirations",
    body: "CDL, medical card, MVR, policy acknowledgment, and qualification-file gaps become visible before they block dispatch.",
  },
  {
    title: "Dispatch gating",
    body: "Compliance status is connected to release decisions so incomplete documents do not drift into active loads.",
  },
  {
    title: "Safety and CSA awareness",
    body: "Public-source safety updates are framed around corrective action, evidence, and operating-risk review.",
  },
  {
    title: "Maintenance and recall visibility",
    body: "Vehicle safety signals connect back to asset readiness, inspection review, and maintenance follow-up.",
  },
  {
    title: "Evidence and audit trail readiness",
    body: "Proof, source links, document controls, and owner actions stay tied to the operational workflow they affect.",
  },
] as const;

export const metadata: Metadata = {
  title: "BOF Compliance Command Center | BackOfficeFleet",
  description:
    "BackOfficeFleet connects driver documents, dispatch eligibility, safety workflows, public-source regulatory updates, and audit-ready evidence into one operational compliance layer.",
};

export default async function CompliancePage() {
  const feedItems = await getRegulatoryFeedItems();

  return (
    <main className="bg-slate-50 text-slate-950">
      <section className="bg-[#07111f] text-white">
        <div className="bof-mkt-container py-20 md:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-300">Compliance awareness</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">BOF Compliance Command Center</h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">
            BOF connects driver documents, dispatch eligibility, safety workflows, public-source regulatory updates,
            and audit-ready evidence into one operational compliance layer.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              See BOF Demo
            </Link>
            <Link href="/documents" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              View Compliance Workflows
            </Link>
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--white" aria-labelledby="bof-compliance-workflow-heading">
        <div className="bof-mkt-container">
          <div className="max-w-3xl">
            <p className="bof-home-eyebrow">BOF compliance workflow</p>
            <h2 id="bof-compliance-workflow-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Public-source awareness tied to the workflows carriers actually manage.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {WORKFLOW_STEPS.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-sm font-black text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-base font-black text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FreightCompliancePulse variant="full" items={feedItems} />
    </main>
  );
}
