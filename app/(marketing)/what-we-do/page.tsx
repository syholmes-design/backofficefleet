import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What We Do | BackOfficeFleet",
  description:
    "Substantive, enterprise-grade explanation of BackOfficeFleet's outsourced back-office operating model, connecting operations, compliance, payroll, accounting, and financial administration for growing trucking fleets.",
};

const PILLARS = [
  {
    title: "Operations & Compliance",
    href: "/what-we-do/operations-compliance",
    description:
      "Maintain driver qualification files (DQF), credential expiration dates, safety event tracking, out-of-service maintenance follow-up, and audit-ready compliance records connected directly to dispatch readiness.",
    capabilities: [
      "Driver Qualification Files (DQF)",
      "Credential & Permit Expiration Tracking",
      "Safety Incident & Coaching Administration",
      "Maintenance & Asset Condition Records",
      "Audit Readiness & Regulatory Compliance",
      "Operational Exception Management",
    ],
  },
  {
    title: "Finance & Accounting",
    href: "/what-we-do/finance",
    description:
      "Connect load execution directly to driver settlements, payroll administration, deductions, customer invoicing, factoring proof packets, accounts receivable, and financial reporting.",
    capabilities: [
      "Driver Settlements & Compensation",
      "Payroll Administration & Deductions",
      "Customer Invoicing & POD/BOL Proof",
      "Factoring & Receivables Administration",
      "Fuel & Expense Reimbursements",
      "Real-Time Load & Customer Profitability",
    ],
  },
  {
    title: "People & HR",
    href: "/what-we-do/people-hr",
    description:
      "Administer the complete driver lifecycle from candidate recruiting handoffs and onboarding document collection through performance coaching, training compliance, and benefits coordination.",
    capabilities: [
      "Driver Recruiting Handoffs & Tracking",
      "Onboarding Document Collection & I-9s",
      "Driver Career Records & BOF Vault",
      "Performance Management & Coaching",
      "Training Requirements & Renewal Tracking",
      "Benefits Administration Workflow",
    ],
  },
  {
    title: "Procurement & Savings",
    href: "/what-we-do/procurement-savings",
    description:
      "Organize procurement infrastructure across fuel purchasing programs, supply chain requests, vendor relationship management, equipment orders, and operating cost controls.",
    capabilities: [
      "Fuel Purchasing & Discount Programs",
      "Vendor Relationship & Agreement Records",
      "Supply Chain & Equipment Ordering",
      "Price Comparison & Terms Review",
      "Purchasing Approvals & Invoice Matching",
      "Operating Cost Administration",
    ],
  },
] as const;

export default function WhatWeDoPage() {
  return (
    <main className="bof-service-page bof-what-we-do-page">
      <div className="bof-mkt-container">
        {/* HERO SECTION */}
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">BackOfficeFleet Operating Model</p>
          <h1>WHAT WE DO</h1>
          <p>
            BOF is an outsourced back-office operating capability for growing transportation companies. Keep
            dispatch and fleet management in-house while BOF performs, coordinates, automates, and administers
            the back-office operations behind your fleet.
          </p>
        </header>

        {/* SECTION 1: CORE PROPOSITION */}
        <section className="bof-service-page__section">
          <h2>An Outsourced Operating Capability — Not Just Software</h2>
          <p>
            Traditional software platforms require fleet owners to purchase licenses and then hire, train, and maintain
            internal administrative personnel to operate those tools. BOF fundamentally changes that equation. BOF combines
            integrated technology, automated workflows, artificial intelligence, and specialized administrative execution
            to perform substantial portions of the back-office workload on behalf of the fleet.
          </p>
          <p>
            The fleet owner and operating team retain complete management authority, strategic control, dispatch decisions,
            hiring authority, equipment acquisition, and customer relationships. BOF assumes responsibility for the
            underlying administrative execution: monitoring compliance, calculating driver settlements, coordinating payroll,
            matching delivery proof to customer invoices, managing factoring receivables, tracking maintenance records, and
            resolving operational exceptions.
          </p>
        </section>

        {/* SECTION 2: LARGE-COMPANY ADVANTAGE */}
        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>The Large-Company Advantage for Growing Fleets</h2>
          <p>
            Large carriers maintaining hundreds or thousands of trucks can afford specialized internal departments: dedicated
            accounting teams, payroll specialists, HR administrators, safety officers, compliance directors, dispatch
            coordinators, maintenance managers, and IT systems analysts. These departments utilize custom software integrations
            and internal controls to keep information connected across the business.
          </p>
          <p>
            A 15-to-50 truck fleet faces the exact same operational and regulatory complexity, but cannot economically justify
            building and staffing that extensive internal organizational structure. In a growing fleet, administrative work
            inevitably piles onto the owner, dispatchers, or a small office staff who must reconcile spreadsheets, paper files,
            and disconnected software.
          </p>
          <p>
            BOF bridges this gap by making an enterprise-grade integrated administrative operating capability available to
            smaller and mid-sized fleets through an outsourced model. The fleet accesses a complete administrative infrastructure
            without incurring the fixed overhead of building equivalent internal departments.
          </p>
        </section>

        {/* SECTION 3: CONNECTED BUSINESS SYSTEM */}
        <section className="bof-service-page__section">
          <h2>Finance and Operations as One Business System</h2>
          <p>
            In a traditional fleet, operations and finance exist in separate silos. Operations knows what was dispatched,
            which driver moved the load, and what delivery issues occurred. Finance knows what was billed, what driver settlements
            were paid, and what cash arrived. Connecting the two requires constant manual data entry, phone calls, and end-of-month
            reconciliations.
          </p>
          <p>
            BOF treats every operational event as both an operating fact and a financial transaction. Information generated
            during dispatch and delivery flows continuously into financial and administrative processes without manual re-entry:
          </p>
          <div className="my-6 rounded-lg border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-inner">
            <p className="font-semibold text-sky-400">The Connected Operating Lifecycle:</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Load Created &rarr; Customer Terms &rarr; Driver &amp; Equipment Assigned &rarr; Compliance &amp; Readiness Verified
              &rarr; Dispatch Released &rarr; Proof &amp; POD Captured &rarr; Driver Settlement &amp; Payroll Calculated &rarr;
              Deductions &amp; Reimbursements Applied &rarr; Customer Invoiced &rarr; Factoring Packet Submitted &rarr; Accounts
              Receivable Tracked &rarr; Accounting Ledger Updated &rarr; Real-Time Cash &amp; Margin Visibility.
            </p>
          </div>
          <p>
            This continuous flow of business data eliminates duplicate data entry, lost proof documents, billing delays, and
            uncalculated expenses. Fleet owners receive real-time, load-by-load margin visibility and customer profitability
            insights, replacing end-of-month guesswork with precise operational data.
          </p>
        </section>

        {/* SECTION 4: FOUR PILLARS */}
        <section className="bof-service-page__section">
          <h2>The Four Administrative Pillars of BOF</h2>
          <div className="bof-service-page__items">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="flex flex-col justify-between">
                <div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {pillar.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2">
                        <span className="text-sky-500">&check;</span> {cap}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <Link href={pillar.href} className="text-sm font-semibold text-sky-600 hover:underline">
                    Explore {pillar.title} Workflow &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 5: AI AS AN EFFICIENCY MULTIPLIER */}
        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>AI as an Efficiency Multiplier — Technology + Data + Human Oversight</h2>
          <p>
            BOF is not an &quot;AI gimmick&quot; or an unmonitored automated black box. BOF utilizes artificial intelligence and workflow
            automation as an efficiency multiplier across connected business records. AI assists by classifying uploaded
            documents, extracting rate-con and BOL details, monitoring credential expiration dates, matching delivery proof
            against customer billing rules, detecting expense anomalies, and routing exceptions for resolution.
          </p>
          <p>
            Because AI in BOF operates against a fully connected business record rather than isolated text files, its accuracy
            and operational utility are dramatically higher. Crucially, BOF maintains qualified human personnel and administrative
            oversight for regulated decisions, approvals, exceptions, and relationship management. The result is maximum
            administrative efficiency combined with absolute operational accountability.
          </p>
        </section>

        {/* SECTION 6: THREE-LEVEL DEPTH SUMMARY */}
        <section className="bof-service-page__section">
          <h2>Three Levels of Value for Fleet Owners</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Level 1 — What</span>
              <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">Substantive Work Absorbed</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                BOF performs, coordinates, and administers DQF compliance, safety tracking, settlements, payroll inputs,
                customer invoicing, factoring, maintenance logs, HR records, and vendor purchasing.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Level 2 — How</span>
              <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">Connected Operating Record</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Through unified business records, automated workflow routing, AI document intelligence, and administrative
                oversight, operational events automatically feed financial and compliance records without manual handoffs.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Level 3 — Why It Matters</span>
              <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">Economic &amp; Strategic Freedom</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Fleets scale from 15 to 100+ trucks without adding administrative overhead. Owners keep strategic control
                and dispatch in-house while eliminating repetitive back-office burden.
              </p>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="bof-service-page__section text-center">
          <h2>Ready to see how BOF operates behind your fleet?</h2>
          <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-300">
            Keep control of your drivers, equipment, and dispatch while BOF becomes the administrative back office powering
            your growth.
          </p>
          <div className="bof-service-page__actions justify-center">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              SEE BOF IN ACTION
            </Link>
            <Link href="/book-assessment?source=what-we-do" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              FLEET ASSESSMENT
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
