import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Workforce Administration | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal workforce readiness across assignments, qualification evidence, training, certifications, exceptions, and follow-through.",
};

const burdenDrivers = [
  ["Volume", "Every shift can create multiple assignment, qualification, readiness, training, certification, and exception records across overlapping departments."],
  ["Fragmentation", "Qualification evidence, training records, and assignment history often live in separate systems or informal files, making the full workforce picture difficult to reconstruct."],
  ["Recurrence", "Recurring renewals, seasonal staffing, cross-trained coverage, and reassignment create ongoing administrative work even when operations look stable."],
  ["Handoffs", "A person may move between work groups, supervisors, departments, and service contexts without the same administrative trail moving with them."],
  ["Limited visibility", "Leadership must infer who is qualified, who is overdue, who is assigned, and who remains at risk from a collection of scattered status signals."],
] as const;

const administrativeModels = [
  ["Burden", "Workforce administration grows from recurring qualification, training, assignment, and exception workflows across the entire public service network."],
  ["Continuity", "Work records, qualification evidence, assignment context, and service history must remain connected as the person moves across teams and work."],
  ["Accountability", "A qualification gap, training miss, or assignment mismatch needs an owner, an action path, and a record of resolution."],
  ["Visibility", "Supervisors and leaders need to see current readiness, gaps, owners, and aging exceptions without reconstructing them manually."],
  ["Consequence", "When workforce records do not connect, assignment decisions, service coverage, and readiness confidence become uncertain."],
] as const;

const lifecycle = [
  ["Assignment", "Capture the department, crew, role, work context, and operational expectation tied to the person."],
  ["Qualification", "Connect the person to the required evidence, credential, license, training, or status criteria they must satisfy."],
  ["Readiness", "Compare assignment needs to qualification and status signals to understand whether the person is operationally fit."],
  ["Training", "Relate scheduled, completed, missed, or overdue training to the person and the work that depends on it."],
  ["Certification", "Preserve credential status, expiration dates, documentation, and follow-up in the administrative history that matters to the assignment."],
  ["Documentation", "Keep assignment, qualification, training, and certification records linked to the same workforce identity and service context."],
  ["Exception", "Track missing evidence, lapsed qualification, incomplete training, or assignment mismatch before it becomes operational risk."],
  ["Ownership", "Route the follow-up to the responsible supervisor, administrator, or compliance function with a clear administrative next step."],
  ["Resolution", "Record the follow-up action, proof, or disposition so the issue is distinguishable from an open condition."],
  ["History", "Retain the workforce record as it moves through assignments, training cycles, qualification events, and exceptions."],
] as const;

const workflows = [
  {
    title: "Assignment is assigned to a person",
    trigger: "A department requests a driver, operator, technician, inspector, or seasonal employee for a role or shift.",
    record: "The assignment connects the person to the department, role, work plan, and the qualification or certification requirements that must be satisfied.",
    risk: "If the assignment record is not tied to readiness evidence, the person may be scheduled for work with an unresolved qualification, missing credential, or training gap.",
    consequence: "The supervisor can see whether the work is fully covered and the management team can understand where readiness risk enters the operation.",
  },
  {
    title: "Qualification or training is missing",
    trigger: "A qualification check, training deadline, or compliance review identifies a gap in the person’s required status.",
    record: "The issue is linked to the person, the role, the requirement, the evidence, and the follow-up owner.",
    risk: "The gap may remain hidden in a separate file until the asset or work plan is already underway.",
    consequence: "The responsible team can act on the exception while the organization preserves the record of what was missing and how it was handled.",
  },
  {
    title: "A certification expires or a record is incomplete",
    trigger: "A credential, medical requirement, training cycle, or recurring compliance item reaches an expiry or incomplete status.",
    record: "The event remains connected to the person, the affected assignment, the evidence trail, and the corrective action needed.",
    risk: "An incomplete record can allow a person to appear ready while the organization has not yet completed the required follow-up or evidence review.",
    consequence: "Leadership sees the active exposure, the ownership of the fix, and the history of the administrative action taken.",
  },
] as const;

const relatedDomains = [
  ["Fleet & equipment", "The person’s assignment and readiness depends on the asset being available, safe, assigned appropriately, and maintained in the right condition."],
  ["Maintenance & inspection", "A qualification gap or certification issue can affect how a person is assigned to maintenance, inspection, safety, or operational work."],
  ["Service documentation", "The person’s work record must connect to the service activity, exceptions, and documentation that show what was performed and what remains unresolved."],
  ["Safety / incidents / exceptions", "An incident, compliance exception, or supervisory finding can alter readiness, ownership, and the need for corrective action."],
  ["Management visibility", "Leadership requires a connected view of workforce readiness, open exceptions, assigned work, supporting records, and aging administrative issues."],
] as const;

const levelThreeSubjects = [
  ["Qualification Evidence", "The proof and official record that a person meets the role, safety, or compliance criteria required to perform work.", "/government/municipal-services/workforce-administration/qualification-evidence"],
  ["Training Documentation", "The activity, completion status, due date, and follow-up record tied to a training requirement.", "/government/municipal-services/workforce-administration/training-documentation"],
  ["Certification Tracking", "Credential status, renewal dates, expiration windows, and evidence flow across assignment and service activity.", "/government/municipal-services/workforce-administration/certification-tracking"],
  ["Assignment Documentation", "The work context, department, role, and operational expectation associated with the person’s assignment.", "/government/municipal-services/workforce-administration/assignment-documentation"],
  ["Incident Documentation", "The event record showing how a workforce issue or work-related condition affected assignment, readiness, or follow-up."],
  ["Corrective Action Documentation", "The record of what changed after a qualification, assignment, or compliance issue was identified."],
  ["Exception Routing", "The mechanism for passing an open workforce issue to the owner responsible for action and follow-through."],
  ["Exception Aging", "The administrative time dimension that shows which workforce issues remain unresolved and what risk they create."],
  ["Exception Closure", "The documentation that resolves the administrative issue and preserves the continuity of the workforce record."],
] as const;

export default function WorkforceAdministrationPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal workforce and operations administration" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Level 2 domain</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Workforce Administration</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The administrative record for municipal people as assignments, qualification requirements, training, certifications, exceptions, and accountability move across departments and service work.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Municipal Services</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="workforce-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="workforce-reality-heading" title="A workforce issue is rarely a single record" lead="Workforce Administration is the domain where a person’s assignment, readiness, training, qualification, and exception history meet the operational demands of municipal service." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Public service depends on people who move between departments, shifts, specialized assignments, seasonal work, and recurring service demands. That movement is expected. The administrative problem is that the records behind the movement are often fragmented, aging, and disconnected from the operational decisions they support.</p>
            <p>BOF does not replace the city’s field management or HR function. It keeps the relevant workforce story connected: the person, the role, the assignment, the evidence, the requirement, the exceptions, the owner, the follow-up, and the historical continuity of the work.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="workforce-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="workforce-burden-heading" title="Why workforce administration becomes difficult" lead="The burden is not caused by a lack of diligence. It is created by recurring municipal work that crosses people, roles, service units, and evidence sources." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {burdenDrivers.map(([title, body], index) => (
              <article key={title} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="workforce-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="workforce-models-heading" title="BOF administrative models for municipal people" lead="The workforce model is a control framework, not a slogan. It explains how the city keeps readiness, ownership, and continuity visible as work changes hands." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {administrativeModels.map(([title, body], index) => (
              <article key={title} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{body}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Relationship chain</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-slate-900">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">People</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Assets</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Work</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Records</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Exceptions</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Accountability</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Continuity</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Visibility</span>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700">A workforce issue does not begin with a person alone; it begins with a work request, a role requirement, a record, a status condition, and the administrative trail that explains whether the person can safely and correctly carry the task.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="workforce-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="workforce-lifecycle-heading" title="The workforce administration lifecycle" lead="The full operational lifecycle shows how a person moves from assignment to evidence to readiness to follow-up and eventually resolution, while the workforce record remains intact." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The administrative sequence is not abstract: trigger → record → requirement → owner → follow-up → resolution → history. BOF preserves that chain so that workforce readiness is not reduced to a status label without context.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="workforce-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="workforce-workflows-heading" title="Three workflows where workforce condition becomes visible" lead="The value of the workforce domain appears when a person is assigned, when a qualification is missing, or when a certification or record becomes incomplete." />
          <div className="mt-10 space-y-7">
            {workflows.map((workflow, index) => (
              <article key={workflow.title} className="grid gap-6 border-t-2 border-slate-300 pt-6 lg:grid-cols-[18rem_1fr] lg:gap-12">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">Workflow 0{index + 1}</p>
                  <h3 className="mt-3 text-3xl font-black text-slate-950">{workflow.title}</h3>
                </div>
                <div className="grid gap-5 text-lg leading-8 text-slate-700 md:grid-cols-2">
                  <p><strong className="text-slate-950">Trigger:</strong> {workflow.trigger}</p>
                  <p><strong className="text-slate-950">Administrative record:</strong> {workflow.record}</p>
                  <p><strong className="text-slate-950">Condition and handoff:</strong> {workflow.risk}</p>
                  <p><strong className="text-slate-950">Ownership and consequence:</strong> {workflow.consequence}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="workforce-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Exceptions, accountability, and consequence</p>
            <h2 id="workforce-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">A workforce exception is not merely a personnel note</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">A missing qualification, expired certification, or assignment mismatch can change who is available, what work can safely proceed, what records remain open, and which decisions require additional follow-up. BOF preserves the administrative path to the correct responsible owner without replacing the city’s operational or regulatory authority.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: role assignment is proceeding without current qualification evidence.</p>
            <p>Operational consequence: service coverage and risk posture are uncertain.</p>
            <p>Management action: identify the person, the requirement, the evidence gap, the owner, and the required follow-up.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Accountability means more than a reminder. It requires the city to know the requirement, the owner, the follow-up path, the evidence trail, and the outcome.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="workforce-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="workforce-layer-heading" title="BOF connects workforce readiness to the rest of municipal operations" lead="People → assets → work → records → exceptions → accountability → continuity → visibility." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>The workforce domain cannot be understood in isolation. A driver, operator, technician, or seasonal worker may be assigned to a shared asset, a route, a service activity, a maintenance task, or a safety event. The workforce record is meaningful only when connected to the operational condition, the related asset or work, and the corrective action that follows.</p>
            <p>That is the BOF operating-layer view for Workforce Administration: one administrative story around a person’s ability to serve, the evidence supporting that ability, and the conditions under which the city must act.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="workforce-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="workforce-related-heading" title="Where Workforce Administration connects" lead="These relationships show how the domain intersects with the other municipal service subjects. Dedicated pages for those domains have not been created yet." />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {relatedDomains.map(([title, body]) => (
              <article key={title} className="border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{body}</p>
                <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-slate-500">Level 2 relationship</p>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="workforce-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="workforce-subjects-heading" title="Workforce Administration — deeper Level 3 subjects" lead="These are the operational subjects BOF will continue to separate into Level 3 workflows without creating new routes yet." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description, href], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                {href ? (
                  <Link href={href} className="mt-3 inline-block text-2xl font-black text-slate-950 underline decoration-teal-700 underline-offset-4 hover:text-teal-800">{title}</Link>
                ) : (
                  <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                )}
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Relationship:</strong> This subject deepens the workforce record and preserves continuity across the assignment and follow-up lifecycle.</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">A Level 3 page would not summarize this domain. It would fully walk the workforce lifecycle from requirement and evidence to exception administration, corrective action, and closure, with the record remaining connected to both the people and the work they were assigned to perform.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="workforce-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="workforce-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how workforce readiness and assignment decisions are administratively governed.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Take the existing municipal assessment to examine qualification evidence, assignment coverage, readiness risk, exceptions, ownership, and history across municipal work.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
