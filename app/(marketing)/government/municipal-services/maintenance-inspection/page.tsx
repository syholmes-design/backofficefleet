import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Maintenance & Inspection Administration | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal maintenance and inspection requirements, condition tracking, evidence, follow-up, and historical resolution.",
};

const burdenDrivers = [
  ["Volume", "Preventive, corrective, seasonal, and emergency work creates repeated administrative requirements across assets, departments, and service cycles."],
  ["Fragmentation", "Inspection evidence, work orders, completion notes, and condition records often sit in different silos, leaving the next owner without a complete picture."],
  ["Recurrence", "Routine inspections and scheduled maintenance produce repeating work even when daily operations appear stable."],
  ["Handoffs", "Condition findings, work orders, and defect follow-up move across maintenance staff, supervisors, departments, and service teams without a common administrative trail."],
  ["Limited visibility", "Leadership may not know which conditions are open, which evidence is missing, which work remains aging, and which actions have not been resolved."],
] as const;

const administrativeModels = [
  ["Burden", "Maintenance and inspection work creates recurring administrative volume whenever preventive work, corrective action, and readiness checks are repeated over time."],
  ["Continuity", "The condition, evidence, work requirement, owner, and completion status must remain connected as the work moves from inspection to action to resolution."],
  ["Accountability", "Every open defect, failed inspection, or maintenance exception needs an owner and a follow-up path tied to the associated asset and record."],
  ["Visibility", "Supervisors and leadership need to see current conditions, aging follow-up, resolution status, and the supporting record trail without reconstructing it manually."],
  ["Consequence", "When maintenance and inspection records are disconnected, the city may unknowingly carry readiness risk, unresolved asset condition, and service uncertainty."],
] as const;

const lifecycle = [
  ["Requirement", "Identify the need for preventive maintenance, corrective intervention, seasonal readiness review, inspection, or issue response."],
  ["Condition", "Capture the asset state, defect, deficiency, or exception in a manner that preserves the evidence and operational context."],
  ["Inspection", "Record the inspection activity, findings, supporting evidence, and impact on operational status or readiness."],
  ["Work order", "Connect the required action to the responsible team, owner, asset, timeline, and supporting record trail."],
  ["Evidence", "Attach completion notes, inspection output, repair history, or supporting records to the same maintenance record."],
  ["Follow-up", "Track whether the condition was corrected, deferred, reassigned, or still awaiting action."],
  ["Exception", "Identify missing evidence, open defect, overdue work, incomplete status, or unresolved condition that needs ownership."],
  ["Ownership", "Route the next action to the correct department, supervisor, technician, or administrator with a defined response path."],
  ["Resolution", "Document the result so the closed state is distinguishable from an aging or unresolved condition."],
  ["History", "Preserve the condition and action record across cycles, reassignments, follow-ups, and future readiness decisions."],
] as const;

const workflows = [
  {
    title: "A preventive or recurring inspection identifies a condition",
    trigger: "An inspection, PM cycle, seasonal review, or recurring safety check surfaces a failed or incomplete operational condition.",
    record: "The condition is linked to the asset, the inspection activity, the department, the supporting evidence, and the work requirement that follows.",
    risk: "If the finding is not connected to a responsible owner and follow-up record, it can become an undocumented operational risk.",
    consequence: "Maintenance teams can act on the specific condition and leadership can see the affected asset, open requirement, and status history.",
  },
  {
    title: "Corrective work is initiated but not completed",
    trigger: "A maintenance task is opened for a repair, replacement, or service action that has not yet been closed.",
    record: "The work order remains associated with the asset, the condition, owner, completion evidence, and any unresolved operational implications.",
    risk: "The asset may remain administratively ambiguous when a work order exists but the completion evidence, follow-up, or closure record is incomplete.",
    consequence: "The organization can see what is open, which department owns it, and what evidence remains missing before the asset is reassigned or used again.",
  },
  {
    title: "A closed repair still requires continuity context",
    trigger: "A defect is repaired or a condition is resolved, but the organization must maintain readiness and service history for future assignments.",
    record: "The repair is documented with completion evidence, scope, date, owner, and the asset’s updated administrative status.",
    risk: "A repair without an accurate closure record can be mistaken for a still-open issue or can obscure the reason an asset became ready again.",
    consequence: "The city retains the continuity story for the asset, while leadership sees the condition, action, and final status without ambiguity.",
  },
] as const;

const relatedDomains = [
  ["Fleet & equipment", "The maintenance condition is attached to the asset and can affect readiness, assignment, service use, and operational continuity across departments."],
  ["Workforce administration", "Maintenance work depends on people, certifications, training, task assignment, ownership, and follow-up within the staff who perform inspections and repairs."],
  ["Service documentation", "Service records and route documentation can explain what work was performed, what evidence exists, and what remains unresolved after the maintenance activity."],
  ["Safety / incidents / exceptions", "Inspection findings, defects, and corrective actions are often connected to safety risk, incident follow-up, and exception routing."],
  ["Management visibility", "Leadership needs a clear view of open maintenance conditions, aging follow-up, evidence quality, and ownership across the operating service network."],
] as const;

const levelThreeSubjects = [
  ["Inspection Documentation", "The record of condition findings, evidence, inspection activity, and any condition that requires follow-up or repair.", "/government/municipal-services/maintenance-inspection/inspection-documentation"],
  ["Maintenance Work Orders", "The operational requirement, asset, owner, timeline, and progression from condition to completion or deferral.", "/government/municipal-services/maintenance-inspection/maintenance-work-orders"],
  ["Completion Documentation", "The evidence that confirms what was repaired, deferred, rejected, or left open after maintenance activity.", "/government/municipal-services/maintenance-inspection/completion-documentation"],
  ["Operational Records", "The records that preserve maintenance activity, condition history, status changes, and supporting operational context.", "/government/municipal-services/maintenance-inspection/operational-records"],
  ["Readiness Documentation", "The status record showing whether an asset or work context remains suitable for assignment or service after maintenance events.", "/government/municipal-services/maintenance-inspection/readiness-documentation"],
  ["Exception Routing", "The process that makes an unresolved inspection or asset condition visible and assigns it to the responsible owner.", "/government/municipal-services/maintenance-inspection/exception-documentation"],
  ["Exception Aging", "The time-based view that shows which maintenance conditions remain open and which are becoming operationally risky."],
  ["Exception Closure", "The approved administrative record that confirms the condition was resolved, corrected, or otherwise dispositioned.", "/government/municipal-services/maintenance-inspection/accountability-documentation"],
  ["Continuity Documentation", "The record that preserves maintenance condition, action, ownership, and disposition across service cycles and future decisions.", "/government/municipal-services/maintenance-inspection/continuity-documentation"],
  ["Visibility Documentation", "The administrative view that makes maintenance status, aging, ownership, evidence, and consequence reviewable by leadership.", "/government/municipal-services/maintenance-inspection/visibility-documentation"],
] as const;

export default function MaintenanceInspectionPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Maintenance and inspection work across municipal operations" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Level 2 domain</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Maintenance &amp; Inspection Administration</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The administrative record for municipal condition management: preventive work, corrective action, inspections, exceptions, readiness implications, and final continuity.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Municipal Services</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="maintenance-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="maintenance-reality-heading" title="Maintenance and inspection are an administrative continuity problem" lead="This domain is where the city turns operational condition into an accountable administrative record that can be followed, reviewed, and resolved." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Municipal operations do not run on one clean maintenance cycle. Preventive work, emergency repairs, recurring inspections, seasonal readiness checks, and corrective action all overlap with daily assignments. Each one creates a condition, a record, and a follow-up obligation that must remain understandable as the asset continues to move through service.</p>
            <p>BOF does not perform inspection or repair work. It connects the administrative logic: the requirement, the condition, the evidence, the owner, the action, the status, and the historical continuity of what happened next. That makes the record usable for supervisors, administrators, and leadership without flattening the operational reality.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="maintenance-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="maintenance-burden-heading" title="Why maintenance administration becomes difficult" lead="The burden is created by repeated operational work that must be tracked, evidentiary, and accountable across departments and service cycles." />
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

      <MarketingSection variant="white" ariaLabelledBy="maintenance-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="maintenance-models-heading" title="BOF administrative models for condition and follow-through" lead="The maintenance domain depends on the same BOF operating logic used across municipal service: maintain burden in view, preserve continuity, assign accountability, and make consequence visible." />
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
            <p className="mt-4 text-base leading-7 text-slate-700">A maintenance issue begins with an operational condition, but it is only properly governed when the related people, work, asset, evidence, exception, owner, and follow-up history remain connected.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="maintenance-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="maintenance-lifecycle-heading" title="The maintenance and inspection lifecycle" lead="The lifecycle makes the administrative logic visible: a requirement is recorded, condition is evaluated, work is assigned, evidence is captured, and closure or follow-up is preserved in history." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The administrative sequence matters: requirement → condition → evidence → owner → follow-up → resolution → history. BOF keeps that chain intact without collapsing the underlying city operations into a single narrative summary.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="maintenance-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="maintenance-workflows-heading" title="Three workflows where maintenance conditions become visible" lead="The operational value appears when a condition is found, when corrective work is opened, and when a repair is closed with historical continuity." />
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

      <MarketingSection variant="ink" ariaLabelledBy="maintenance-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Exceptions, accountability, and consequence</p>
            <h2 id="maintenance-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">An open maintenance condition is not a minor paperwork gap</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">A failed inspection, deferred repair, or incomplete work order can affect readiness, service reliability, public safety, and management confidence. BOF preserves the administrative trail that explains what is open, who owns it, what evidence exists, and what remains incomplete.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: inspection found a defect and the work order remains open.</p>
            <p>Operational consequence: the asset may still be in service or may be restricted next time it is assigned.</p>
            <p>Management action: identify the asset, the defect, the action owner, the evidence, and the remaining follow-up.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Accountability means the city has a clear administrative path from the defect to the completion evidence, not just the fact that a condition was reported.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="maintenance-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="maintenance-layer-heading" title="BOF connects maintenance and inspection to the municipal service model" lead="People → assets → work → records → exceptions → accountability → continuity → visibility." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Maintenance and inspection are never isolated. The work depends on the person doing the review, the asset being assessed, the operational demand affecting use, the records created by the condition, and the decisions that follow. A condition may affect readiness, route planning, incident response, and service continuity across several departments at once.</p>
            <p>That is the BOF operating-layer view for Maintenance &amp; Inspection Administration: an administrative chain that preserves the evidence and accountability behind the city’s condition management without replacing the operational or technical work itself.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="maintenance-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="maintenance-related-heading" title="Where Maintenance &amp; Inspection Administration connects" lead="These relationships show how the domain intersects with the other municipal service subjects. Dedicated pages for those domains have not been created yet." />
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

      <MarketingSection variant="white" ariaLabelledBy="maintenance-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="maintenance-subjects-heading" title="Maintenance &amp; Inspection Administration — deeper Level 3 subjects" lead="These are the operational subjects BOF will continue to distinguish at Level 3 without creating additional routes yet." />
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
                <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Relationship:</strong> This subject deepens the maintenance and inspection record and preserves continuity through the work, condition, and closure lifecycle.</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">A Level 3 page would not collapse this domain into a summary. It would walk the full condition workflow from inspection evidence to requirement, work order, completion record, readiness documentation, and final closure while preserving accountability and continuity.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="maintenance-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="maintenance-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">Assess how maintenance and inspection conditions travel through your city.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Use the Municipal Assessment to evaluate inspection coverage, maintenance work, evidence quality, open conditions, ownership, and required follow-up.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
