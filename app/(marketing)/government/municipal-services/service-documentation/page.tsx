import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Service Documentation Administration | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal service documentation, route records, evidence, exceptions, ownership, and follow-through across departments.",
};

const burdenDrivers = [
  ["Volume", "A single municipal service day can produce route records, work activity notes, completion evidence, exception entries, and cross-department documentation volumes at once."],
  ["Fragmentation", "Documentation often sits in route logs, department files, separate work activity records, and informal follow-up, leaving the full service record disconnected."],
  ["Recurrence", "Recurring service work, seasonal maintenance windows, and repeated dispatch patterns create administrative documentation load even without a major event."],
  ["Handoffs", "One department may capture service context, another may reconcile completion, and a third may later review the exception or follow-up without a unified administrative trail."],
  ["Limited visibility", "Leadership must reconstruct what work occurred, what was supported, what remains incomplete, and which records are missing or untethered from the operational story."],
] as const;

const administrativeModels = [
  ["Burden", "Service documentation burden grows when the same work generates multiple record types across people, assets, assignments, and departments."],
  ["Continuity", "The service record must remain connected to the route, the work performed, the evidence, the exception, and the ultimate status of the activity."],
  ["Accountability", "Every documentation gap, unresolved service record, or missing completion note needs a responsible owner and a next administrative step."],
  ["Visibility", "Supervisors and leadership need to see what work happened, what is still incomplete, and which records remain unclosed or unsupported."],
  ["Consequence", "When service records disconnect, management loses confidence in what work actually occurred, what remains open, and where responsibility sits."],
] as const;

const lifecycle = [
  ["Service event", "A route, assignment, inspection, work order, or service activity creates a recordable municipal work event."],
  ["Context", "Capture the asset, department, crew, role, purpose, and operational conditions tied to the service work."],
  ["Documentation", "Create the administrative record for what happened, what was observed, and what evidence is attached to the work."],
  ["Completion", "Record the completion state, service output, evidence, or unresolved work that remains after the activity."],
  ["Exception", "Identify incomplete proof, missing route context, contradictory evidence, or unresolved service follow-up."],
  ["Ownership", "Assign the responsibility for the gap, review, correction, or follow-up action to the correct department or administrator."],
  ["Follow-up", "Document the corrective review or additional activity needed to complete the administrative record."],
  ["Resolution", "Record the final disposition so the service record can be distinguished from an aging or unresolved exception."],
  ["History", "Retain the service story as the route, the work, and the associated evidence move across teams and time."],
  ["Visibility", "Use the preserved record to explain the event, the condition, the work performed, and the accountability behind the administrative outcome."],
] as const;

const workflows = [
  {
    title: "A service activity creates incomplete route documentation",
    trigger: "A route, work order, or field activity becomes complete but one or more supporting records are missing, delayed, or inconsistent.",
    record: "The service event remains connected to the route, affected asset or people, contractor or department context, evidence, and operational timeline.",
    risk: "If the completion record is not connected to the underlying work, the city may later believe a task was completed when the evidence trail is incomplete.",
    consequence: "The owner can follow up, and leadership can see the work that was performed and the documentation gap that still requires attention.",
  },
  {
    title: "A service exception is discovered during review",
    trigger: "A supervisor, manager, or downstream reviewer identifies a mismatch, missing field note, missing completion evidence, or unclear service context.",
    record: "The exception is linked to the service activity, the department, the people or asset involved, and the follow-up owner responsible for correcting it.",
    risk: "Without the exception being tied to the service story, it can age silently and create uncertainty about whether the work was complete or valid.",
    consequence: "The administrative exception becomes visible and fixable before it changes the organization’s trust in the record.",
  },
  {
    title: "A completed service record must remain explainable later",
    trigger: "A route or service activity is resolved but will later be reviewed for continuity, compliance, history, or management visibility.",
    record: "The closure record preserves what was performed, what was evidenced, what exception was reviewed, and what the final status was.",
    risk: "A completion note alone can be inadequate if the city cannot explain the service context, supporting evidence, or exception disposition later.",
    consequence: "The organization retains a defensible service history rather than a fragmented set of unrelated records.",
  },
] as const;

const relatedDomains = [
  ["Fleet & equipment", "Service documentation depends on the asset used, assigned work, operating condition, and the evidence trail produced during service activity."],
  ["Workforce administration", "The service record must connect to the assigned people, supervisors, crew context, and any qualification or readiness requirements tied to the work."],
  ["Maintenance & inspection", "Inspection and maintenance conditions often produce service records that must be tracked across completion, exception, and evidence review."],
  ["Safety / incidents / exceptions", "A service exception or incident can alter what was recorded, who owns the follow-up, and what evidence remains open or incomplete."],
  ["Management visibility", "Leadership needs the full service context: what work was performed, what records are missing, what remains open, and what accountability is attached to the result."],
] as const;

const levelThreeSubjects = [
  ["Assignment Documentation", "The formal record of the service context, role, department, and assignment tied to the work that occurred."],
  ["Completion Documentation", "The evidence that shows what work was completed, what output exists, and what remains unresolved or open."],
  ["Readiness Documentation", "The status record that describes whether the work, asset, person, or assignment was ready to proceed or remained constrained."],
  ["Incident Documentation", "The exception or event record that explains a service disruption, unclear condition, or adversity in a task context."],
  ["Corrective Action Documentation", "The record of what was done to resolve an incomplete, contradictory, or missing service record."],
  ["Exception Routing", "The process of passing a service documentation issue to the owner responsible for fixing it or confirming the final disposition."],
  ["Exception Aging", "The time-based view showing which documentation gaps remain unresolved and become riskier as they age."],
  ["Exception Closure", "The final administrative acknowledgment that the service documentation issue has been reviewed, corrected, or formally resolved."],
] as const;

export default function ServiceDocumentationPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal service documentation and route continuity" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Level 2 domain</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Service Documentation Administration</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The administrative continuity of municipal work: the records, evidence, exceptions, ownership, and resolution behind every service event.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Municipal Services</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="service-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="service-reality-heading" title="Municipal service work is only as clear as the record behind it" lead="Service Documentation Administration is the domain where the city preserves the operational story: what was performed, what was evidenced, what was missing, and who is responsible for the result." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Municipal service activity is distributed across public works, sanitation, utilities, parks, facilities, route work, inspections, and recurring operational responsibilities. The work may be well intended, but that does not guarantee the record is complete. The city often has the task itself, yet not enough clarity about what was done, what evidence exists, or what remains outstanding.</p>
            <p>BOF does not replace field documentation or operational execution. It keeps the service record connected to the work: the route, the people, the asset or department context, the documentation created, the exceptions that appear, the owner who manages follow-up, and the historical continuity of the final disposition.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="service-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="service-burden-heading" title="Why documentation administration becomes difficult" lead="The burden is created by the operational reality itself: repeated service events, multiple departments, and many records around the same work." />
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

      <MarketingSection variant="white" ariaLabelledBy="service-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="service-models-heading" title="BOF administrative models for public service records" lead="Service documentation only becomes usable when burden is managed, continuity is preserved, accountability is visible, and consequences are visible to management." />
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
            <p className="mt-4 text-base leading-7 text-slate-700">The administrative chain shows why service work needs more than a note. It needs the work context, the evidence, the exception, and the accountability that explains how the record was completed and what remains open.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="service-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="service-lifecycle-heading" title="The service documentation lifecycle" lead="The lifecycle makes the service record legible from event through context, evidence, exception, ownership, and final continuity." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The cycle is straightforward but administratively essential: service event → context → documentation → evidence → exception → ownership → resolution → history. BOF keeps that chain intact without pretending the field record is the same as the city’s operational decision process.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="service-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="service-workflows-heading" title="Three workflows where service documentation gets tested" lead="The value of the domain appears when a service activity is recorded, when a gap is discovered, and when the activity must remain explainable later." />
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

      <MarketingSection variant="ink" ariaLabelledBy="service-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Exceptions, accountability, and consequence</p>
            <h2 id="service-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">A missing service record is not a harmless gap</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">A documentation exception can distort what the city believes happened, what was completed, what remains open, and who is responsible for corrective action. BOF captures the administrative path from the service event to the explanation, evidence, and final disposition.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: service activity was completed, but the evidence trail is incomplete.</p>
            <p>Operational consequence: the city lacks a defensible explanation of what actually occurred and what remains open.</p>
            <p>Management action: identify the work, the missing record, the ownership path, and the follow-up required to close the gap.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Accountability means the documentation issue is routed, known, tracked, and ultimately resolved with continuity preserved across time and review.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="service-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="service-layer-heading" title="BOF connects service documentation to the operating picture" lead="People → assets → work → records → exceptions → accountability → continuity → visibility." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>The service document is not a stand-alone artifact. It sits inside a larger municipal chain: the people performing the work, the asset or department context, the activity being performed, the evidence created, the exception that later appears, and the accountability needed to resolve the issue. It also serves leadership by making the difference between completed work and complete documentation visible.</p>
            <p>That is the BOF operating-layer view for Service Documentation Administration: a connected record set that makes municipal service accountability understandable without collapsing the operational complexity behind it.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="service-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="service-related-heading" title="Where Service Documentation Administration connects" lead="These relationships show how the domain intersects with the other municipal service subjects. Dedicated pages for those domains have not been created yet." />
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

      <MarketingSection variant="white" ariaLabelledBy="service-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="service-subjects-heading" title="Service Documentation Administration — deeper Level 3 subjects" lead="These are the operational subjects BOF will continue to distinguish at Level 3 without creating new routes yet." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Relationship:</strong> This subject deepens the service record and preserves continuity from work event through resolution and historical visibility.</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">A Level 3 page would not reduce this domain to a summary. It would follow the complete documentation workflow from service event to evidence, exception, corrective action, and final closure while preserving accountability and continuity across review.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="service-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="service-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how service records become accountable, explainable, and governable.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Take the Municipal Assessment to review route activity, completion evidence, exceptions, ownership, and follow-through across municipal service work.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
