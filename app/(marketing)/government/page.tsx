/**
 * BOF Route Owner:
 * URL: /government
 * Type: MARKETING
 * Primary component: GovernmentPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingGovernmentHero,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Government Fleets | BackOfficeFleet",
  description:
    "Administrative back office support for government fleets, public works, transit, utilities, and agency operations.",
};

const SECTOR_LINKS = [
  {
    title: "Public Works",
    description: "Street, fleet, and asset operations that need a defensible record behind every repair, inspection, and work order.",
    href: "/government/public-works",
  },
  {
    title: "Transit",
    description: "Service continuity, driver readiness, and document follow-through across transit fleets, garages, and dispatch teams.",
    href: "/government/transit",
  },
  {
    title: "Utilities",
    description: "Utility fleet operations balancing field service, inspections, readiness checks, and exception management under public scrutiny.",
    href: "/government/utilities",
  },
  {
    title: "Solid Waste",
    description: "Route compliance, maintenance follow-up, and document continuity for fleets running daily service under tight schedules.",
    href: "/government/solid-waste",
  },
  {
    title: "Emergency Services",
    description: "Readiness, credential control, and operational evidence for emergency fleets that must respond without administrative drift.",
    href: "/government/emergency-services",
  },
  {
    title: "Municipal Services",
    description: "Municipal operations that need a single back-office layer for compliance, records, and operational follow-through.",
    href: "/government/municipal-services",
  },
  {
    title: "County Operations",
    description: "County fleets managing drivers, assets, contractors, and documentation across multiple departments and service functions.",
    href: "/government/county-operations",
  },
  {
    title: "State DOT",
    description: "DOT operations where safety, inspections, documentation, and exception handling are tied to public accountability and funding oversight.",
    href: "/government/state-dot",
  },
  {
    title: "Infrastructure & Capital Projects",
    description: "Construction and capital project fleets that need readiness records, compliance follow-up, and evidence behind site operations.",
    href: "/government/infrastructure-capital-projects",
  },
] as const;

export default function GovernmentPage() {
  return (
    <>
      <MarketingGovernmentHero
        layout="imageFirst"
        titleId="bof-mkt-gov-hero-heading"
        sectionAriaLabelledBy="bof-mkt-gov-hero-heading"
        eyebrow="Government & regulated fleets · administrative back office"
        title={<>BOF becomes the back office behind the fleet</>}
        belowHeroHeadline="The agency keeps operational command. BOF keeps the administrative layer organized."
        subtitle="BOF can provide the administrative operating layer behind a government fleet or agency while the agency retains operational command, field responsibility, public accountability, and day-to-day decision-making."
        support="The agency runs the mission. BOF handles the readiness, documentation, exceptions, and follow-through behind it."
        trustItems={[
          "Agency-owned operations",
          "Document and exception follow-through",
          "Readiness aligned to dispatch",
          "Public accountability without admin drift",
        ]}
        trustAriaLabel="Government back-office highlights"
        imageSrc="/assets/images/government-hero2.png"
        imageAlt="Government and regulated fleet field and command operations at a glance"
        ctas={
          <>
            <Link
              href="/book-assessment?sector=government"
              className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary"
            >
              Agency Assessment
            </Link>
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              See BOF in Action
            </Link>
          </>
        }
      />

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-gov-model-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-model-heading"
            title="The government fleet operating model is a records problem as much as a service problem"
            lead="Public fleets do not fail because they lack operational intent. They fail when the agency cannot prove readiness, maintain accountability, or connect service work to the record that leadership will defend."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Service assignments", "Public operations depend on assigning the right asset, driver, and documentation to the right mission without informal handoff drift."],
              ["Readiness & inspection control", "Vehicle, driver, and equipment readiness are tied to public accountability, safety, and a defensible maintenance record."],
              ["Evidence retention", "Government streams have no appetite for record fragmentation. BOF helps connect maintenance, inspections, and proof to a single accountable chain."],
              ["Leadership visibility", "Executives need a clear picture of operational risk, service disruptions, and open actions without chasing inboxes or department spreadsheets."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Public control</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-gov-roles-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-roles-heading"
            title="Who owns the chain of accountability"
            lead="Municipal and government operations are multi-stakeholder by design. The administrative layer has to protect the agency from drift without replacing its authority or field decision-making."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Fleet manager", "Controls fleet readiness and service continuity across departments, drivers, and assets."],
              ["Supervisors", "Own day-to-day decisions, service assignments, and the follow-through required to keep the fleet moving."],
              ["Procurement & admin", "Needs documentation and storage that can support purchasing, maintenance, and public accountability requirements."],
              ["Compliance", "Protects the agency from audit exposure, missing records, or procedural drift in inspections and maintenance."],
              ["Leadership", "Needs a simple view of service risk, exception severity, and required action without reconstructing records after the fact."],
            ].map(([role, body]) => (
              <div key={role} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-950">{role}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-gov-hub-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-hub-heading"
            title="Government fleet operating hubs"
            lead="Each operating model below represents a specific agency environment where BOF can absorb the administrative work behind readiness, documentation, follow-through, and exception management."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {SECTOR_LINKS.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Government sector</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{item.description}</p>
                <span className="mt-5 inline-flex items-center text-sm font-semibold text-slate-900">
                  View sector page
                  <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="bof-mkt-gov-decision-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-decision-heading"
            title="The value is administrative control without operational loss of authority"
            lead="BOF is not replacing field command or public accountability. It is giving the agency one disciplined layer for records, action ownership, readiness, and exception follow-through."
          />
          <div className="mt-8 rounded-3xl border border-white/15 bg-slate-900/60 p-8 text-slate-100">
            <p className="text-sm uppercase tracking-[0.18em] text-teal-300">Operational outcome</p>
            <p className="mt-4 max-w-3xl text-2xl font-semibold leading-8">
              The agency keeps command. BOF keeps the administrative trail honest, escalated, and ready for action when service continuity or public scrutiny demands it.
            </p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-gov-hub-summary-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-hub-summary-heading"
            title="The administrative layer behind public operations"
            lead="BOF is not a replacement for public authority, leadership, or field command. It is the operating layer behind records, proof, exceptions, action tracking, and administration that allows the agency to stay ready while leaders focus on service delivery and public responsibility."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-950">Operations stay in-house</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">Dispatch, field supervision, public service decisions, and emergency command remain with the agency.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-950">BOF handles the admin engine</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">Readiness, document control, exception escalation, and next-action follow-through are organized inside one operating record.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-950">Leadership sees the truth</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">When a credential, repair, proof item, or action falls out of sequence, BOF identifies it before it becomes a service or accountability problem.</p>
            </div>
          </div>
        </div>
      </MarketingSection>
    </>
  );
}
