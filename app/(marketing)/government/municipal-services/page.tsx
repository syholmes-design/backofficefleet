import type { Metadata } from "next";
import Link from "next/link";
import { MarketingGovernmentHero, MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Municipal Services | BackOfficeFleet",
  description: "Administrative back office for municipal services fleets handling readiness, compliance, and follow-through across city operations.",
};

const municipalChain = ["Departments", "People", "Shared assets", "Service work", "Records", "Cross-department exceptions", "Accountability", "Management visibility"];

const workflows = [
  ["A shared asset is assigned", "Assignment context, responsible unit, and supporting records are organized for the people who need to act.", "Supervisors can see the condition and ownership behind the service assignment."],
  ["A service or inspection record is incomplete", "The missing information is connected to the asset, work activity, owner, and follow-up path.", "The issue is visible as administrative work rather than a forgotten note."],
  ["A maintenance or incident condition remains open", "The condition, action owner, supporting records, and resolution state stay connected.", "Leadership can see what remains unresolved across departments."],
] as const;

const managementQuestions = [
  "Which assets are affected?",
  "Which department owns the next action?",
  "Which service workflows remain incomplete?",
  "What has been resolved and what remains open?",
] as const;

const municipalDomains = [
  {
    id: "fleet-equipment",
    number: "01",
    title: "Fleet & equipment",
    description: "Municipal fleets are not single-department assets. Vehicles, tools, specialty equipment, seasonal attachments, and facilities equipment move between operating units, supervisors, and crews. The administrative challenge is continuity as the asset crosses boundaries: assignment records, inspection evidence, condition documentation, maintenance activity, readiness limitations, unresolved conditions, assignment history, ownership, and next action must remain understandable.",
    workflow: "Assignment → inspection → condition → maintenance activity → readiness → history → next action",
    burden: "Shared assets create recurring ambiguity when an inspection fails or maintenance follow-up is incomplete and the next action is unclear.",
  },
  {
    id: "workforce-administration",
    number: "02",
    title: "Workforce administration",
    description: "Operators, drivers, technicians, inspectors, supervisors, seasonal staff, and cross-department personnel each contribute qualification evidence, training documentation, certification records, medical documentation, assignment history, incident documentation, exception ownership, and recurring requirements to the service record. BOF organizes how a person's administrative status relates to the work they are assigned.",
    workflow: "Qualification → assignment → service work → documentation → exception → follow-up → visibility",
    burden: "People generate recurring administrative load across departments, and volume makes informal reminders an unreliable handoff.",
  },
  {
    id: "maintenance-inspection",
    number: "03",
    title: "Maintenance & inspection administration",
    description: "Preventive, corrective, and emergency maintenance sit alongside equipment, facility, and seasonal readiness inspections. Requirements create activities; activities create records; records show conditions that need follow-up, resolution, and historical continuity. BOF organizes that administrative chain and does not perform inspections or physical repairs.",
    workflow: "Requirement → activity → record → condition → action → resolution → history",
    burden: "Recurring maintenance becomes administrative risk when completion evidence and unresolved conditions are not connected to the same record.",
  },
  {
    id: "service-documentation",
    number: "04",
    title: "Service documentation",
    description: "Route-based work, project work, service activity, materials usage, completion evidence, incidents, and exceptions create records that may be reviewed by supervisors, department leaders, administrators, and the public institution. A connected administrative record helps the city understand what the work required, what was documented, and what remains incomplete after a cross-department handoff.",
    workflow: "Service activity → documentation → exception → follow-up → visibility → management action",
    burden: "A single service day can produce multiple record types that must be reconciled later across departments.",
  },
  {
    id: "safety-incidents-exceptions",
    number: "05",
    title: "Safety, incidents & exceptions",
    description: "Incidents, missing records, failed inspections, and unresolved conditions can affect people, assets, assignments, and service continuity across more than one operating unit. BOF provides an administrative structure for identifying the affected scope, routing it to an owner, supporting corrective action, following up, and preserving what was resolved without acting as a regulator or enforcement authority.",
    workflow: "Incident or exception → affected people/assets → owner → corrective action → resolution → history",
    burden: "Cross-department issues can age silently when ownership, evidence, and next action are not visible.",
  },
  {
    id: "management-visibility",
    number: "06",
    title: "Management visibility",
    description: "Leadership needs the condition of the operation, not another isolated report: affected people, affected assets, incomplete workflows, aging exceptions, departmental responsibility, supporting records, readiness limitations, unresolved conditions, and cross-department impact. Visibility turns dispersed administrative work into a management conversation.",
    workflow: "Condition → affected scope → responsibility → aging → management action → continuity",
    burden: "Limited visibility forces leadership to reconstruct operational truth from fragmented records and informal follow-up.",
  },
] as const;

const levelThreeSubjects = [
  ["Qualification evidence", "Training documentation", "Certification tracking", "Assignment documentation"],
  ["Inspection documentation", "Maintenance work orders", "Completion documentation", "Readiness documentation"],
  ["Incident documentation", "Corrective action documentation", "Exception routing", "Exception aging", "Exception closure"],
] as const;

const continuityStages = [
  ["Event", "A service activity, assignment, inspection, maintenance need, or incident creates administrative work."],
  ["Record", "The work is documented with the people, asset, department, and context needed for follow-through."],
  ["Condition", "The record shows what is complete, incomplete, affected, or awaiting attention."],
  ["Exception", "A missing or unresolved condition is visible rather than remaining a private handoff."],
  ["Action", "An accountable owner and next step are identified for follow-up."],
  ["Resolution", "The result is recorded so management can distinguish closed work from aging work."],
  ["History", "The administrative story remains connected across the lifecycle of the work."],
] as const;

export default function MunicipalServicesPage() {
  return (
    <div className="municipal-services-page">
      <style>{`
        .municipal-services-page .bof-mkt-government-hero.bof-image-first-hero .bof-mkt-government-hero__copy--below-hero {
          align-items: flex-start;
          max-width: 72rem;
          text-align: left;
        }

        .municipal-services-page .bof-mkt-government-hero.bof-image-first-hero .bof-mkt-government-hero__title--below-hero {
          max-width: 48rem;
          margin-inline: 0;
          font-size: clamp(2rem, 4vw, 4rem);
          line-height: 1.08;
          text-align: left;
        }

        .municipal-services-page .bof-mkt-government-hero.bof-image-first-hero .bof-mkt-government-hero__sub,
        .municipal-services-page .bof-mkt-government-hero.bof-image-first-hero .bof-mkt-government-hero__support {
          max-width: 58rem;
          margin-inline: 0;
          font-size: clamp(1.05rem, 1.4vw, 1.3rem);
          line-height: 1.65;
          text-align: left;
        }

        .municipal-services-page .bof-mkt-government-hero.bof-image-first-hero .bof-mkt-government-hero__ctas {
          justify-content: flex-start;
        }

        .municipal-services-page .bof-mkt-government-hero.bof-image-first-hero .bof-mkt-government-hero__trust {
          margin-inline: 0;
          text-align: left;
        }

        .municipal-services-page .bof-mkt-container p {
          font-size: 1rem;
          line-height: 1.75;
        }

        .municipal-services-page .bof-mkt-container .text-xs {
          font-size: 0.8rem;
          line-height: 1.4;
        }
      `}</style>
      <MarketingGovernmentHero
        layout="imageFirst"
        titleId="bof-mkt-municipal-hero-heading"
        sectionAriaLabelledBy="bof-mkt-municipal-hero-heading"
        eyebrow="Municipal services · shared public operations"
        title="A clearer administrative layer for work that crosses departments"
        subtitle="Public works, sanitation, utilities, parks, facilities, and fleet services share people and assets. BOF helps management see the administrative condition behind that shared operation."
        support="The city retains operational command and field responsibility. BOF organizes the records, follow-up, and visibility around the work."
        trustItems={["Shared assets across departments", "Service work stays connected to records", "Exceptions have visible ownership", "Leadership sees unresolved work"]}
        trustAriaLabel="Municipal services operating model"
        imageSrc="/assets/images/government-hero2.png"
        imageAlt="Municipal fleet and public works operations"
        imageCaption="Shared assets, rotating crews, seasonal work, and department handoffs create a record-keeping challenge behind every service day."
        ctas={<><Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link><Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">See BOF in action</Link></>}
      />

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-municipal-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-2 lg:items-center">
          <MarketingSectionHeader titleId="bof-mkt-municipal-reality-heading" title="One city operation, many operating units" lead="Municipal work is distributed by department and service function, but the administrative work is connected. A vehicle may move between crews, a supervisor may own several workstreams, and an incomplete inspection or maintenance follow-up can affect service continuity elsewhere." />
          <div className="border-l-2 border-teal-700 pl-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Administrative burden</p><p className="mt-4 text-2xl font-bold leading-9 text-slate-900">Shared resources create recurring handoffs across assignments, inspections, maintenance follow-up, service documentation, incidents, and exceptions.</p><p className="mt-4 text-sm leading-7 text-slate-600">The pressure is structural: volume, fragmentation, recurrence, handoffs, and limited visibility create work around the operation.</p></div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-municipal-chain-heading">
        <div className="bof-mkt-container"><MarketingSectionHeader titleId="bof-mkt-municipal-chain-heading" title="The municipal record crosses department lines" lead="BOF is the administrative operating layer behind the operation. The chain below shows the context management needs to see shared work clearly." /><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{municipalChain.map((item, index) => <div key={item} className="relative border-t-2 border-slate-300 pt-4"><span className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">0{index + 1}</span><p className="mt-2 text-xl font-black text-slate-950">{item}</p>{index < municipalChain.length - 1 ? <span className="absolute right-2 top-[-0.7rem] hidden text-2xl text-slate-400 xl:block" aria-hidden>→</span> : null}</div>)}</div><p className="mt-10 max-w-4xl border-l-2 border-amber-500 pl-5 text-sm leading-7 text-slate-600">This is a Level 1 operating model. Deeper qualification, maintenance, documentation, exception, and readiness subjects are future domain experiences, not claims that every capability is fully implemented today.</p></div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-municipal-domains-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="bof-mkt-municipal-domains-heading" title="The domains behind a municipal service day" lead="These are not isolated product silos. They are connected administrative domains through which people, assets, work, records, exceptions, and management action move." />
          <div className="mt-12 space-y-6">
            {municipalDomains.map((domain) => {
              const href = `/government/municipal-services/${domain.id}`;
              return (
                <article id={`municipal-domain-${domain.id}`} key={domain.title} className="grid gap-6 border-t-2 border-slate-300 pt-6 lg:grid-cols-[5rem_1fr_1fr] lg:gap-10">
                  <p className="text-sm font-black tracking-[0.18em] text-teal-700">{domain.number}</p>
                  <div>
                    <h3 className="text-2xl font-black text-slate-950"><Link href={href} className="no-underline hover:underline">{domain.title}</Link></h3>
                    <p className="mt-3 text-base leading-7 text-slate-600">{domain.description}</p>
                  </div>
                  <div className="border-l-2 border-amber-400 pl-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Representative workflow</p>
                    <p className="mt-3 text-base font-bold leading-7 text-slate-950">{domain.workflow}</p>
                    <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Administrative pressure:</strong> {domain.burden}</p>
                    <Link href={href} className="mt-4 inline-flex text-sm font-black text-teal-800 underline underline-offset-4">Explore domain</Link>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-10 max-w-4xl border-l-2 border-teal-700 pl-5 text-sm leading-7 text-slate-600">This page exposes the approved Level 2 and Level 3 architecture without creating those future routes. Current BOF surfaces and demonstrations show the administrative operating model; the full municipal domain treatment remains deeper architecture.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-municipal-level-three-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="bof-mkt-municipal-level-three-heading" title="The deeper workflows inside the domains" lead="Level 3 subjects make the administrative depth visible: a requirement or event creates a record, a condition creates follow-up, and resolution creates continuity. These are architectural pathways shown here for orientation; no new Level 3 routes are created by this page." />
          <div className="grid gap-6 md:grid-cols-3">
            {levelThreeSubjects.map((group, index) => <div key={index} className="border-l-2 border-teal-700 pl-5"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Workflow family 0{index + 1}</p><ul className="mt-4 space-y-3 text-base font-bold leading-6 text-slate-950">{group.map((subject) => <li key={subject}>{subject}</li>)}</ul></div>)}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-municipal-workflows-heading">
        <div className="bof-mkt-container"><MarketingSectionHeader titleId="bof-mkt-municipal-workflows-heading" title="Make cross-department follow-through visible" lead="BOF does not perform the physical field activity. It organizes the administrative work around the trigger, record, condition, owner, follow-up, resolution, and management view." /><div className="mt-10 grid gap-5 lg:grid-cols-3">{workflows.map(([title, work, result], index) => <article key={title} className="border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Workflow 0{index + 1}</p><h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3><p className="mt-4 text-sm leading-7 text-slate-600"><strong className="text-slate-900">Administrative work:</strong> {work}</p><p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-600"><strong className="text-slate-900">Result:</strong> {result}</p></article>)}</div></div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="bof-mkt-municipal-continuity-heading">
        <div className="bof-mkt-container">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300">Administrative continuity</p><h2 id="bof-mkt-municipal-continuity-heading" className="mt-3 text-3xl font-black text-white">The record follows the work</h2><p className="mt-5 text-sm leading-7 text-slate-300">The administrative record can move with the asset, person, assignment, service activity, issue, and resolution instead of being reconstructed from department-specific files.</p></div>
            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
              {continuityStages.map(([stage, description], index) => <div key={stage} className="bg-slate-950 p-5"><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">0{index + 1}</p><h3 className="mt-3 text-lg font-black text-white">{stage}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>)}
            </div>
          </div>
          <div className="mt-12 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300">Accountability</p><h2 className="mt-3 text-2xl font-black text-white">Ownership is visible</h2><p className="mt-4 text-sm leading-7 text-slate-300">BOF organizes ownership and follow-up so fleet managers, supervisors, administrators, and leadership can see which unit or asset requires the next action.</p></div><div><p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300">Administrative consequence</p><h2 className="mt-3 text-2xl font-black text-white">Conditions lead to action</h2><p className="mt-4 text-sm leading-7 text-slate-300">An incomplete inspection or unresolved asset condition can limit readiness for service. BOF makes that condition and the management action visible without replacing field judgment.</p></div><div><p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300">Cross-functional relationship</p><h2 className="mt-3 text-2xl font-black text-white">One condition can affect many teams</h2><p className="mt-4 text-sm leading-7 text-slate-300">A record may involve a person, shared asset, department, assignment, service activity, and exception at once. The operating layer keeps those relationships in view for the people responsible for resolution.</p></div></div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-municipal-visibility-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><MarketingSectionHeader titleId="bof-mkt-municipal-visibility-heading" title="From fragmented activity to a connected operating picture" lead="Management does not need another module list. It needs to see what requires attention, who and what is affected, what remains unresolved, and what action comes next." /><div className="grid gap-3 sm:grid-cols-2">{managementQuestions.map((question) => <div key={question} className="border border-slate-200 bg-slate-50 p-5"><p className="text-base font-black text-slate-950">{question}</p></div>)}</div></div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-municipal-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-teal-700">BOF operating layer</p><h2 id="bof-mkt-municipal-layer-heading" className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">The city runs the mission. BOF connects the administrative work around it.</h2><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">People, shared assets, service work, records, exceptions, history, and management visibility become a connected administrative story for the teams responsible for public service.</p></div><div className="border border-teal-900/10 bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">What management gains</p><p className="mt-4 text-2xl font-bold leading-9 text-slate-950">A clearer view of what requires attention and who owns the next action.</p><p className="mt-4 text-sm leading-7 text-slate-600">Current BOF surfaces and demonstrations illustrate this operating model; deeper municipal domain capabilities remain future architecture.</p></div></div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="bof-mkt-municipal-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Next step</p><h2 id="bof-mkt-municipal-cta-heading" className="mt-3 text-4xl font-black text-white md:text-5xl">Start with the administrative work your departments already carry.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Assess shared assets, service records, maintenance follow-up, exceptions, and management visibility in the existing Municipal Assessment experience.</p></div><Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link></div>
      </MarketingSection>
    </div>
  );
}
