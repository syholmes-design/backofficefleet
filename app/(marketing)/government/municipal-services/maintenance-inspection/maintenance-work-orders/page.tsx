import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Maintenance Work Orders | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal maintenance work orders: requirements, ownership, scheduling, evidence, exceptions, aging, and closure.",
};

const burdenDrivers = [
  ["Unclear intake", "Repair requests, inspection findings, and recurring maintenance needs can enter through different channels without a consistent administrative starting point."],
  ["Ownership drift", "A work order can move between departments, vendors, supervisors, and technicians while the accountable owner remains unclear."],
  ["Status ambiguity", "Open, scheduled, in progress, deferred, and complete statuses lose meaning when the supporting condition and next action are not connected."],
  ["Evidence gaps", "Completion notes, parts references, inspection results, and photos may be stored separately from the work requirement they are meant to prove."],
  ["Aging risk", "An old work order may represent a minor backlog item, a service restriction, or an unresolved readiness risk without clear prioritization context."],
] as const;

const administrativeModels = [
  ["Requirement", "Every work order should explain the condition, inspection finding, recurring requirement, or service need that caused it to exist."],
  ["Ownership", "The responsible department, supervisor, technician, or vendor must be visible throughout the work order lifecycle."],
  ["Continuity", "The work order remains connected to the asset, finding, service context, evidence, and final disposition as work changes hands."],
  ["Accountability", "Status, due dates, dependencies, and follow-up make the outstanding action reviewable rather than dependent on informal memory."],
  ["Visibility", "Leadership needs to understand open volume, aging, blocked work, completion evidence, and operational impact without reconstructing the queue."],
] as const;

const lifecycle = [
  ["Intake", "Create the work requirement from a condition, inspection, PM cycle, service issue, or approved maintenance need."],
  ["Scope", "Describe the asset, issue, requested action, priority, operational impact, and supporting context."],
  ["Triage", "Classify urgency, readiness effect, safety relevance, dependencies, and the team best positioned to act."],
  ["Assignment", "Route the work order to a named owner with the department, responsibility, and expected response visible."],
  ["Scheduling", "Set the planned timing, parts or vendor dependency, service window, and any temporary operating restriction."],
  ["Execution", "Track work progress, changes in scope, findings discovered during work, and the current operational status."],
  ["Evidence", "Attach completion notes, photos, inspection results, parts or service references, and other proof of the work performed."],
  ["Review", "Confirm that the evidence supports the requested action and that the original condition or requirement was addressed."],
  ["Disposition", "Record whether the work was completed, deferred, rejected, cancelled, or left open with an active exception."],
  ["History", "Preserve the work order timeline for future readiness, maintenance planning, service continuity, and management review."],
] as const;

const workflows = [
  {
    title: "An inspection finding becomes a work requirement",
    trigger: "An inspection, PM review, or service event identifies a repair, replacement, adjustment, or corrective action.",
    record: "The work order keeps the original finding, asset, evidence, priority, owner, and operational impact connected from intake through action.",
    risk: "Without that relationship, the repair queue can lose the reason the work matters and may prioritize or close it without the right context.",
    consequence: "The maintenance team can act on a defined requirement while supervisors retain a defensible explanation of why it was opened.",
  },
  {
    title: "A work order is delayed or blocked",
    trigger: "Parts, staffing, vendor availability, approvals, weather, or service demands prevent the assigned work from being completed on schedule.",
    record: "The delay, dependency, revised owner, expected action, and effect on asset readiness or service use remain part of the active work order.",
    risk: "A delayed order without aging and consequence context can appear harmless while the underlying condition continues to affect operations.",
    consequence: "The organization can distinguish ordinary backlog from an aging condition that requires escalation, restriction, or management action.",
  },
  {
    title: "Completed work requires evidence-based closure",
    trigger: "The technician, department, or vendor reports that the requested maintenance action is complete.",
    record: "Completion evidence is reviewed against the original requirement before the order receives a final disposition and updates the asset history.",
    risk: "Closing on a status update alone can leave the condition unresolved, the evidence incomplete, or the asset’s readiness state unclear.",
    consequence: "The city can explain what was done, when it was done, who completed it, and why the related condition is now resolved or still active.",
  },
] as const;

const relatedDomains = [
  ["Fleet & equipment", "A work order is anchored to the asset, its condition, service history, and the operational effect of leaving the work open or closing it."],
  ["Workforce administration", "Assignment, qualification, certification, and technician ownership affect who can perform, review, and close maintenance work."],
  ["Inspection documentation", "Inspection findings provide the evidence-backed reason a work order exists and the condition it must address."],
  ["Readiness documentation", "Open, deferred, or completed work can change whether an asset is suitable for assignment or requires an active restriction."],
  ["Management visibility", "Leadership needs work-order volume, aging, ownership, blockers, evidence quality, and operational consequence in one reviewable picture."],
] as const;

const levelThreeSubjects = [
  ["Work requirement intake", "The administrative entry point that preserves why the work is needed and what condition or recurring obligation created it."],
  ["Priority and triage", "The decision record that connects urgency, operational consequence, safety relevance, readiness effect, and available response capacity."],
  ["Assignment and ownership", "The accountable handoff showing who owns the next action, which team is responsible, and when review is expected."],
  ["Schedule and dependency tracking", "The timing, parts, vendor, approval, and service-window context that explains why work is planned, blocked, or delayed."],
  ["Completion evidence", "The notes, photos, inspection output, service references, and other proof required to support a completed status."],
  ["Work-order disposition", "The final record distinguishing completed, deferred, rejected, cancelled, and still-open work with its operational implications."],
] as const;

export default function MaintenanceWorkOrdersPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal maintenance work order administration" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Maintenance &amp; Inspection / Level 3 subject</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Maintenance Work Orders</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The accountable administrative record that carries a maintenance requirement from intake through ownership, scheduling, evidence, disposition, and historical closure.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services/maintenance-inspection" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Maintenance &amp; Inspection</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="work-orders-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="work-orders-reality-heading" title="A work order is more than a task in a queue" lead="Maintenance Work Orders preserve the requirement, owner, timing, evidence, and operational consequence behind every open or completed maintenance action." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>A work order only has administrative value when the city can understand why it exists, what asset or condition it concerns, who owns the next action, and what evidence will support closure. A queue of titles and statuses is not enough to govern the condition behind the work.</p>
            <p>BOF connects the work requirement to inspection findings, asset condition, service context, readiness implications, completion evidence, and final disposition. That continuity lets teams act while giving supervisors and leadership a clear view of what remains unresolved.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="work-orders-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="work-orders-burden-heading" title="Why work-order administration becomes difficult" lead="The burden grows when requests enter through different channels, ownership changes, and completion is reported without enough context or evidence." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {burdenDrivers.map(([title, body], index) => (
              <article key={title} className="bg-white p-5"><p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p><h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3><p className="mt-3 text-base leading-7 text-slate-700">{body}</p></article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="work-orders-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="work-orders-models-heading" title="BOF models for work-order accountability" lead="The work order becomes governable when its requirement, owner, continuity, accountability, and visibility stay together." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {administrativeModels.map(([title, body], index) => (
              <article key={title} className="bg-white p-5"><p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p><h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3><p className="mt-3 text-base leading-7 text-slate-700">{body}</p></article>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Work-order chain</p><div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-slate-900"><span className="rounded-full border border-slate-200 bg-white px-3 py-2">Requirement</span><span className="text-slate-400">-&gt;</span><span className="rounded-full border border-slate-200 bg-white px-3 py-2">Owner</span><span className="text-slate-400">-&gt;</span><span className="rounded-full border border-slate-200 bg-white px-3 py-2">Schedule</span><span className="text-slate-400">-&gt;</span><span className="rounded-full border border-slate-200 bg-white px-3 py-2">Work</span><span className="text-slate-400">-&gt;</span><span className="rounded-full border border-slate-200 bg-white px-3 py-2">Evidence</span><span className="text-slate-400">-&gt;</span><span className="rounded-full border border-slate-200 bg-white px-3 py-2">Disposition</span></div><p className="mt-4 text-base leading-7 text-slate-700">The order is complete only when the work performed and its evidence can be evaluated against the original requirement and its operational consequence.</p></div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="work-orders-lifecycle-heading">
        <div className="bof-mkt-container"><MarketingSectionHeader titleId="work-orders-lifecycle-heading" title="The maintenance work-order lifecycle" lead="The lifecycle carries a requirement through triage, ownership, planned work, evidence review, final disposition, and history." /><div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">{lifecycle.map(([stage, description], index) => (<article key={stage} className="bg-white p-5"><p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p><h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3><p className="mt-3 text-base leading-7 text-slate-700">{description}</p></article>))}</div><p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The sequence matters: intake -&gt; scope -&gt; triage -&gt; assignment -&gt; scheduling -&gt; execution -&gt; evidence -&gt; review -&gt; disposition -&gt; history. BOF keeps the order connected to the condition and decision it is meant to govern.</p></div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="work-orders-workflows-heading">
        <div className="bof-mkt-container"><MarketingSectionHeader titleId="work-orders-workflows-heading" title="Three workflows where work orders matter" lead="The value appears when a requirement is opened, when work is delayed, and when completion must be proven before closure." /><div className="mt-10 space-y-7">{workflows.map((workflow, index) => (<article key={workflow.title} className="grid gap-6 border-t-2 border-slate-300 pt-6 lg:grid-cols-[18rem_1fr] lg:gap-12"><div><p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">Workflow 0{index + 1}</p><h3 className="mt-3 text-3xl font-black text-slate-950">{workflow.title}</h3></div><div className="grid gap-5 text-lg leading-8 text-slate-700 md:grid-cols-2"><p><strong className="text-slate-950">Trigger:</strong> {workflow.trigger}</p><p><strong className="text-slate-950">Administrative record:</strong> {workflow.record}</p><p><strong className="text-slate-950">Condition and handoff:</strong> {workflow.risk}</p><p><strong className="text-slate-950">Ownership and consequence:</strong> {workflow.consequence}</p></div></article>))}</div></div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="work-orders-consequence-heading"><div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Operating consequence</p><h2 id="work-orders-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">An open work order can be a service decision waiting to happen</h2><p className="mt-5 text-lg leading-8 text-slate-300">The order may represent a manageable queue item, a blocked repair, a readiness restriction, or a safety-sensitive condition. The status alone cannot tell leadership which one it is.</p></div><div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white"><p>Administrative condition: work remains open, delayed, or marked complete without enough evidence to explain the current asset condition.</p><p>Operational consequence: the city may assign, restrict, or prioritize the asset without a reliable understanding of the unresolved work.</p><p>Management action: preserve the requirement, owner, aging context, evidence, and final disposition in the same work-order chain.</p><p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Work-order accountability gives the organization a clear answer to: what needs to happen, who owns it, what is blocking it, and what proves it is done.</p></div></div></MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="work-orders-layer-heading"><div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><MarketingSectionHeader titleId="work-orders-layer-heading" title="BOF connects work orders to the municipal operating picture" lead="Condition -&gt; requirement -&gt; owner -&gt; work -&gt; evidence -&gt; readiness -&gt; visibility." /><div className="space-y-5 text-lg leading-8 text-slate-700"><p>Work orders sit between condition discovery and operational decision-making. Their value comes from keeping the maintenance requirement attached to the asset, the people responsible for action, the service impact, and the evidence needed to establish closure.</p><p>That is the BOF operating-layer view for Maintenance Work Orders: a connected administrative record that makes backlog, blockers, completion, and consequence understandable across future service and readiness decisions.</p></div></div></MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="work-orders-related-heading"><div className="bof-mkt-container"><MarketingSectionHeader titleId="work-orders-related-heading" title="Where Maintenance Work Orders connect" lead="Work orders are the action layer connecting findings, assets, people, evidence, readiness, and management review." /><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{relatedDomains.map(([title, body]) => (<article key={title} className="border border-slate-200 bg-white p-6"><h3 className="text-xl font-black text-slate-950">{title}</h3><p className="mt-3 text-base leading-7 text-slate-700">{body}</p><p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-slate-500">Level 3 relationship</p></article>))}</div></div></MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="work-orders-subjects-heading"><div className="bof-mkt-container"><MarketingSectionHeader titleId="work-orders-subjects-heading" title="Maintenance Work Orders - deeper subject matter" lead="These subjects turn a maintenance request into an accountable and reviewable work record." /><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{levelThreeSubjects.map(([title, description], index) => (<article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6"><p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p><h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3><p className="mt-3 text-base leading-7 text-slate-700">{description}</p></article>))}</div><p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">Every deeper subject reinforces the same principle: the maintenance requirement must remain connected to its owner, operational consequence, evidence, and final disposition.</p></div></MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="work-orders-cta-heading"><div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p><h2 id="work-orders-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">Make maintenance work visible from requirement to resolution.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Take the municipal assessment to review work-order intake, ownership, aging, evidence quality, readiness effect, and closure discipline.</p></div><Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link></div></MarketingSection>
    </main>
  );
}
