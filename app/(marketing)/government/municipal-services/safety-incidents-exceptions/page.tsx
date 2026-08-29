import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Safety, Incidents & Exceptions Administration | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal safety events, incident records, exception routing, ownership, corrective action, and final resolution.",
};

const burdenDrivers = [
  ["Volume", "Municipal work creates many incident, near-miss, inspection exception, and corrective-action events across crews, departments, assets, and service activities."],
  ["Fragmentation", "Safety issues, incident records, corrective action notes, and exception follow-up often sit across separate systems or informal channels, leaving the full view incomplete."],
  ["Recurrence", "Recurring operational risk, repeating inspection findings, and repeated short-cycle exceptions create constant administrative work even when the service team appears stable."],
  ["Handoffs", "An event may be logged by one team, corrected by another, and reviewed by management later without a shared administrative record of the complete path."],
  ["Limited visibility", "Leadership may not know which incidents remain open, which assets or people are affected, which follow-up remains incomplete, and which exceptions are aging unresolved."],
] as const;

const administrativeModels = [
  ["Burden", "Safety and exception burden grows from repeated event records, recurring inspection findings, and handoffs across departments and operational teams."],
  ["Continuity", "The event, the people and assets involved, the associated record, the corrective action, and the final closure must remain connected across time."],
  ["Accountability", "Every incident or exception needs an owner, an action path, and a record of the decision or corrective action that follows."],
  ["Visibility", "Management needs to see the affected scope, the open follow-up, the evidence trail, and the aging status of the exception without manual reconstruction."],
  ["Consequence", "If safety and exception records do not remain connected, operational risk, assignment uncertainty, and incomplete follow-through become harder to govern."],
] as const;

const lifecycle = [
  ["Trigger", "An event, near miss, failed inspection, service issue, or exception creates the need for administrative review."],
  ["Scope", "Identify the affected people, assets, locations, departments, and work context tied to the event."],
  ["Record", "Create the incident or exception record with the event narrative, supporting evidence, and relevant operational context."],
  ["Evaluation", "Determine the condition, impact, urgency, and what follow-up is required to preserve safety and continuity."],
  ["Ownership", "Assign the follow-up to the responsible party or department and preserve the administrative path for review."],
  ["Corrective action", "Document the action taken to stabilize the issue, reduce risk, or restore a correct operating condition."],
  ["Exception", "Track missing evidence, unresolved findings, repeated failures, or conditions that remain open after initial review."],
  ["Resolution", "Record the result of the corrective action so it is distinguishable from an aging or still-open issue."],
  ["Continuity", "Preserve the event, action, and outcome history to support later review, reporting, and management visibility."],
  ["History", "Retain the event story across repeated incidents, corrective actions, and the broader municipal operating environment."],
] as const;

const workflows = [
  {
    title: "An incident is reported and requires administrative follow-up",
    trigger: "A service event, safety concern, inspection finding, or repeated issue is logged and requires an accountable response.",
    record: "The incident connects the people, asset, work context, severity, evidence, and responsible follow-up path into one record.",
    risk: "If the event record is not connected to the affected scope, the organization may treat it as a single note rather than a broader operational issue.",
    consequence: "The responsible team can act and leadership can see the affected record, ownership, and status at the next review.",
  },
  {
    title: "An exception remains open because the corrective action is incomplete",
    trigger: "A safety concern, failed inspection, or service exception remains unresolved after the first review and requires additional action.",
    record: "The exception stays tied to the event, the owner, the corrective action notes, and the time-based aging of the open condition.",
    risk: "The issue may age silently, and the organization may lose the connection between the original event and the current operational risk.",
    consequence: "The city can see the unresolved scope, the corrective action path, and the reason the exception still affects operations.",
  },
  {
    title: "A corrective action ends with closure and continuity",
    trigger: "The event is resolved, the condition is corrected, or the issue is formally dispositioned after review.",
    record: "The closure record preserves the incident, affected people and assets, action taken, final disposition, and whether any ongoing conditions remain.",
    risk: "If closure is not accurately documented, an issue may be mistaken for a still-open event or the city may lose the rationale behind the final outcome.",
    consequence: "Management retains a clear event history and understands what was resolved, what remains monitored, and what accountability changed.",
  },
] as const;

const relatedDomains = [
  ["Fleet & equipment", "Inspection, maintenance, and asset conditions often create the incident or exception that later requires corrective action and accountable follow-through."],
  ["Workforce administration", "A safety event can involve people, assignment conditions, readiness concerns, and certification or training factors tied to the work context."],
  ["Maintenance & inspection", "Inspection findings and maintenance gaps often become the administrative entry point for an event or exception record."],
  ["Service documentation", "A completed service activity may later become a part of the incident story if evidence, context, or completion status becomes disputed or incomplete."],
  ["Management visibility", "Leadership must see which incidents are active, which exceptions remain open, and which corrective actions have or have not resolved the underlying issue."],
] as const;

const levelThreeSubjects = [
  ["Incident Documentation", "The formal record of the event, affected scope, evidence, conditions, and operational context behind the issue."],
  ["Corrective Action Documentation", "The administrative record of the fix, mitigation, change, or response implemented after the event or exception."],
  ["Exception Routing", "The process that moves an open issue to the correct owner, review cycle, or follow-up path."],
  ["Exception Aging", "The time-based view that identifies which incidents or exceptions remain open and which become higher risk over time."],
  ["Exception Closure", "The final record confirming the issue has been resolved or dispositioned and is no longer open as an operational concern."],
  ["Assignment Documentation", "The work context, role, department, and assignment conditions that help explain how the issue developed or what was affected."],
  ["Readiness Documentation", "The status information that shows whether the affected asset, work context, or crew remained fit to operate after the event."],
] as const;

export default function SafetyIncidentsExceptionsPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal safety, incidents, and exception administration" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Level 2 domain</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Safety, Incidents &amp; Exceptions Administration</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The administrative continuity behind municipal safety events, exceptions, corrective action, ownership, and final resolution across the service network.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Municipal Services</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="safety-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="safety-reality-heading" title="A safety event is never only a single report" lead="Safety, Incidents &amp; Exceptions Administration is where the city turns a risk signal, a service issue, or a failed condition into an accountable operating history." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Municipal operations create incident and exception records in many contexts: a failed inspection, an unsafe condition, a service disruption, a near miss, an asset deficiency, or a recurring pattern that does not yet have a clear owner. Each event travels through parts of the organization with different responsibilities, evidence sources, and follow-up needs.</p>
            <p>BOF does not replace safety leadership, the regulator, or operational decision-making. It preserves the administrative chain: who was affected, what the event was, what evidence exists, who owns follow-up, what corrective action was taken, and what remains unresolved in the record.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="safety-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="safety-burden-heading" title="Why incident administration becomes difficult" lead="The burden is created by recurring risk signals, fragmented records, and the need to keep the full event story connected during review and follow-up." />
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

      <MarketingSection variant="white" ariaLabelledBy="safety-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="safety-models-heading" title="BOF administrative models for incident and exception governance" lead="This domain depends on the same BOF administrative logic used throughout municipal service: burden, continuity, accountability, visibility, and consequence." />
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
            <p className="mt-4 text-base leading-7 text-slate-700">The event may involve a person, an asset, a work assignment, a service record, and an operational exception simultaneously. BOF keeps the people-to-visibility chain intact so the event remains governable.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="safety-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="safety-lifecycle-heading" title="The incident and exception lifecycle" lead="The lifecycle tracks the event from trigger to record to action to closure, while preserving the administrative history behind it." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The important administrative logic is not just that an event occurred. It is that the event was recorded, evaluated, assigned, corrected, and resolved in a way that preserves accountability and continuity.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="safety-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="safety-workflows-heading" title="Three workflows where risk becomes visible" lead="These are the moments when a safety or exception record must become accountable rather than merely archived." />
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

      <MarketingSection variant="ink" ariaLabelledBy="safety-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Exceptions, accountability, and consequence</p>
            <h2 id="safety-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">An open exception is an operational governance issue</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Whether the issue is a safety concern, inspection finding, or incident-driven exception, the organizational risk grows when the event remains disconnected from the asset, people, service context, and corrective action path.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: an incident or exception was recorded, but a corrective action remains open.</p>
            <p>Operational consequence: the affected asset, person, or work context may remain uncertain or risk-exposed.</p>
            <p>Management action: clarify the event, define the owner, confirm the corrective action, and preserve the final outcome in history.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Accountability means the organization knows who owns the follow-up, what is still unresolved, and what evidence or action finally closed the issue.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="safety-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="safety-layer-heading" title="BOF connects incident administration to the municipal operating model" lead="People → assets → work → records → exceptions → accountability → continuity → visibility." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Every incident or safety-related exception sits inside a larger municipal network. It can involve a person, an asset, a route or service activity, a department handoff, an inspection finding, and a later corrective-action path. The organization needs all of that context to understand the real administrative consequence.</p>
            <p>That is the BOF operating-layer view for Safety, Incidents &amp; Exceptions Administration: a connected administrative story that preserves risk context, actionability, and historical continuity without replacing operational authority or regulatory responsibility.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="safety-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="safety-related-heading" title="Where safety and exception administration connects" lead="These relationships show how the domain intersects with the other municipal service subjects. Dedicated pages for those domains have not been created yet." />
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

      <MarketingSection variant="white" ariaLabelledBy="safety-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="safety-subjects-heading" title="Safety, Incidents &amp; Exceptions Administration — deeper Level 3 subjects" lead="These are the operational subjects BOF will continue to distinguish at Level 3 without creating new routes yet." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Relationship:</strong> This subject deepens the event record, preserves accountability, and clarifies the administrative continuity required after a safety issue or exception.</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">A Level 3 page would not summarize this domain. It would follow the full event lifecycle from trigger to evidence, corrective action, and closure, while preserving the understanding of affected people, assets, and operational conditions.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="safety-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="safety-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how safety, incident, and exception records become governable.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Use the municipal assessment to evaluate the incident record, exception flow, corrective actions, ownership, and remaining administrative risk across the operating network.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
