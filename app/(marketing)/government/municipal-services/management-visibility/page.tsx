import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Management Visibility | Municipal Services | BackOfficeFleet",
  description: "Administrative visibility for municipal services: affected assets, aging exceptions, unresolved conditions, ownership, and management action across departments.",
};

const burdenDrivers = [
  ["Fragmented status", "Leadership cannot rely on disconnected spreadsheets, service logs, departmental notes, and informal updates to know the true operational condition."],
  ["Unclear ownership", "When an exception, delayed record, or asset condition is not visibly assigned, the city has no clear next action and no single accountable owner."],
  ["Aging exceptions", "Issues that remain unresolved become more expensive and more disruptive as they age across people, assets, departments, and service windows."],
  ["Recurring work volume", "Municipal operations run at scale. Treated separately, recurring issues become a management problem rather than a visible operating pattern."],
  ["Limited context", "Leadership often knows that a service issue exists but not which people, assets, workflows, records, or departments are affected by it."],
] as const;

const administrativeModels = [
  ["Condition", "Operational reality is visible as a state of work, readiness, exceptions, or unresolved administrative need, not as a loose collection of notes."],
  ["Scope", "Management needs to know which people, departments, assets, work streams, and records are affected before the action is prioritized."],
  ["Ownership", "Every significant issue needs an accountable lead, a next step, and a visible path to resolution or decision."],
  ["Aging", "Visibility is not static. Risks become clearer when unresolved conditions remain open over time and accumulate operational consequence."],
  ["Action", "The purpose of visibility is not more reporting; it is management knowing what requires attention and what follows next."],
] as const;

const lifecycle = [
  ["Trigger", "A fleet issue, service gap, inspection failure, administrative exception, or asset readiness concern creates a management question."],
  ["Scope", "Determine which departments, people, assets, and service activities are affected by the condition."],
  ["Context", "Attach the relevant records, assignments, route information, maintenance details, and documentation associated with the issue."],
  ["Condition", "Describe what is complete, incomplete, delayed, constrained, or still awaiting action."],
  ["Ownership", "Assign the responsibility for review, correction, or decision to a leader or operating unit."],
  ["Aging", "Track how long the issue remains unresolved and whether it is increasing in operational or administrative consequence."],
  ["Action", "Define the next operational or administrative move to reduce risk, restore continuity, or resolve the condition."],
  ["Resolution", "Document the final disposition so leadership can distinguish closed work from unresolved work."],
  ["Continuity", "Retain the history so future reviews can understand what happened, what was resolved, and what remained outstanding."],
  ["Visibility", "Present the result as a coherent picture for management rather than as isolated departmental notes."],
] as const;

const workflows = [
  {
    title: "A service issue is reported but not yet understood",
    trigger: "A supervisor or manager sees an exception, access limitation, delayed action, or risk indicator but cannot tell the full operational scope immediately.",
    record: "The condition is correlated to the affected asset, department, people, work activity, documentation trail, and outstanding action owner.",
    risk: "Without a connected picture, the issue is reduced to a notification without enough context for a sound decision.",
    consequence: "The organization receives a decision-ready view instead of a fragmented note and can move immediately to the right next action.",
  },
  {
    title: "An aging exception starts to affect service continuity",
    trigger: "A delayed repair, incomplete record, unclear readiness condition, or unresolved exception remains open longer than expected.",
    record: "The issue is shown with age, ownership, affected scope, and the operational burden it creates across departments.",
    risk: "Aging issues become operational risk when leadership cannot see whether they are isolated, repeated, or growing in impact.",
    consequence: "Management can shift from reactive problem-solving to prioritized action based on current importance and consequence.",
  },
  {
    title: "Leadership needs a clear municipality-wide operating picture",
    trigger: "An executive or department leader is preparing a status review, budget conversation, readiness check, or service continuity decision.",
    record: "The status view combines conditions, affected scope, action owners, urgency, and resolution state in a single management context.",
    risk: "The city loses confidence in its operating picture when reports are built from separate notes and informal updates rather than a connected administrative model.",
    consequence: "Leadership gains a reliable view of what is at risk, what remains unresolved, and what action must follow next.",
  },
] as const;

const relatedDomains = [
  ["Fleet & equipment", "Leadership needs visibility into asset readiness, condition, maintenance status, service limitations, and unresolved work across the fleet."],
  ["Workforce administration", "People, certifications, assignments, and staffing gaps all affect how well a department can act on the service issue in front of them."],
  ["Maintenance & inspection administration", "Maintenance and inspection exceptions often become the clearest examples of aging conditions that require authoritative action and visibility."],
  ["Service documentation", "The best visibility depends on complete, connected documentation showing what was done, what evidence exists, and what remains open."],
  ["Safety, incidents & exceptions", "The management picture is shaped by safety events, incident coding, corrective actions, and unresolved exceptions that still need closure."],
] as const;

const levelThreeSubjects = [
  ["Executive exception aging", "The time-based view of unresolved conditions that require leadership attention as they age and accumulate impact."],
  ["Affected scope mapping", "A clear view of which people, assets, departments, assignments, and service streams are included in a single issue."],
  ["Readiness limitation tracking", "Visibility into conditions that limit asset readiness, crew capability, or service continuity before the next operation begins."],
  ["Ownership and escalation", "A formal record of who owns the follow-up, which decision path is required, and what escalates if the issue remains open."],
  ["Condition continuity reporting", "The explanation of what changed, what is still unresolved, and what now requires management action or review."],
  ["Resolution status review", "The distinction between truly closed work, aging work, and work still waiting for oversight or final disposition."],
] as const;

export default function ManagementVisibilityPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal management visibility and operational oversight" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Level 2 domain</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Management Visibility</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The decision-ready operating picture for municipal services: affected assets, aging exceptions, unresolved conditions, ownership, and the work that still needs attention.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Municipal Services</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="visibility-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="visibility-reality-heading" title="Leadership needs the operating picture, not another disconnected report" lead="Management Visibility is the domain that connects the city’s municipal work into an understandable operating picture for service continuity, risk, and accountability." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>In municipal operations, the challenge is not simply whether work exists. It is whether leadership can see which work is complete, which work remains open, which people and assets are affected, and which departments own the next action.</p>
            <p>When accountability and context are spread across route logs, service records, inspection update notes, maintenance statuses, and informal follow-up, the operational truth becomes hard to see. BOF does not replace municipal leadership or field judgment. It provides an administrative operating layer that consolidates the status of the work behind the operation.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="visibility-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="visibility-burden-heading" title="Why visibility becomes hard to maintain" lead="The burden is produced by volume, fragmentation, aging conditions, and the fact that municipal work crosses departments in real time." />
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

      <MarketingSection variant="white" ariaLabelledBy="visibility-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="visibility-models-heading" title="BOF visibility models for municipal leadership" lead="Visibility is valuable when it speaks to condition, scope, ownership, aging, and action — not when it only produces more reporting." />
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
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Ownership</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Action</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Visibility</span>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700">The chain shows that visibility is not a summary added after the work. It is the outcome of a connected operating context that preserves the people, assets, work, exceptions, action status, and accountability behind the municipal service picture.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="visibility-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="visibility-lifecycle-heading" title="The management visibility lifecycle" lead="The value of the domain appears in the movement from issue trigger to continuity and action — not in a static status list alone." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The cycle is deliberate: trigger → scope → context → condition → ownership → aging → action → resolution → continuity → visibility. The discipline is not to produce more reporting; it is to make the operating truth understandable before the next decision or service action occurs.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="visibility-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="visibility-workflows-heading" title="Three situations where visibility becomes essential" lead="The municipal management view is tested when conditions are unclear, unresolved work is aging, and a broad decision is being prepared." />
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
                  <p><strong className="text-slate-950">Condition and risk:</strong> {workflow.risk}</p>
                  <p><strong className="text-slate-950">ownership and consequence:</strong> {workflow.consequence}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="visibility-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Operating consequence</p>
            <h2 id="visibility-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">Without visibility, the city is managing by fragments</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Unclear ownership, missing context, and aging unresolved conditions can make a municipal operation look stable when it is actually carrying risk. BOF structures visibility around the real decision points leadership needs to see before operational or administrative drift worsens.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Condition: a service issue, readiness problem, or exception remains outside a connected operating view.</p>
            <p>Operational consequence: actions are delayed, ownership is unclear, and the city is forced to reconstruct the status from informal records.</p>
            <p>Management action: identify impact, assign accountability, track aging, and drive the next decision with clarity.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Visibility transforms temperature checks into an operational picture. The outcome is not cleaner dashboards alone. It is a clearer administrative understanding of what matters now.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="visibility-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="visibility-layer-heading" title="BOF connects management visibility to the municipal operating system" lead="People → assets → work → records → exceptions → ownership → action → visibility." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>The management picture is not a static scorecard. It is a connected understanding of the people, assets, work streams, exceptions, and decisions shaping the municipal operation. Each of those elements is visible in context, not in isolation, because the operating concern is a shared public service environment that crosses departments and responsibilities.</p>
            <p>That is the BOF operating-layer view for Management Visibility: a connected, explainable, and action-oriented view of what is affected, what remains unresolved, and where accountability now sits.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="visibility-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="visibility-related-heading" title="Where Management Visibility connects" lead="These relationships show how the domain sits inside the wider municipal service model. Dedicated pages exist for the other domains, and this one completes the set." />
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

      <MarketingSection variant="white" ariaLabelledBy="visibility-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="visibility-subjects-heading" title="Management Visibility — deeper Level 3 subjects" lead="These are the operational subjects BOF continues to distinguish at Level 3 without creating new routes here." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Relationship:</strong> This subject deepens the management perspective and preserves continuity from condition to accountability and action.</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">A Level 3 experience would not reduce this domain to a summary. It would follow the operating picture from trigger to impact, ownership, aging, escalation, and final resolution while remaining tied to the actual municipal work under review.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="visibility-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="visibility-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how municipal leadership can move from fragmented updates to a clear operating picture.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Take the Municipal Assessment to review cross-department conditions, unresolved work, ownership, and the management visibility needed for action.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
