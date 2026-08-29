import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Inspection Documentation | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal inspection documentation: findings, evidence, condition tracking, ownership, exception routing, and final operational disposition.",
};

const burdenDrivers = [
  ["Finding drift", "Inspection findings may be recorded in one system while the work order, follow-up owner, and asset condition are managed elsewhere."],
  ["Evidence gaps", "Without linked evidence, the city cannot prove what was observed, what was recommended, or whether the recommended action was completed."],
  ["Recurring cycles", "Routine PM, seasonal checks, recurring inspections, and scheduled condition reviews create repeated documentation work even when operations look stable."],
  ["Ownership blur", "A condition can be found by one department but needing follow-up by another without a visible administrative owner."],
  ["Limited visibility", "Leadership may not know which findings remain open, which evidence is missing, or which inspections have not resulted in a clear disposition."],
] as const;

const administrativeModels = [
  ["Condition", "Inspection documentation must preserve the actual operational condition, not just the fact that an inspection took place."],
  ["Evidence", "The record needs to connect the finding to photographs, notes, repair references, timestamps, and supporting operational context."],
  ["Continuity", "The same inspection narrative must remain connected as the asset, the department, and the follow-up owner change over time."],
  ["Accountability", "Each finding requires a visible owner, action path, and review point before it can be considered resolved."],
  ["Visibility", "Supervisors and leadership need a current picture of findings, aging items, and unresolved conditions without reconstructing history manually."],
] as const;

const lifecycle = [
  ["Inspection trigger", "A scheduled PM, recurring check, seasonal review, incident follow-up, or service need creates the inspection requirement."],
  ["Observation", "Capture the condition, defect, note, evidence, and any immediate risk or service limitation associated with the asset or work context."],
  ["Classification", "Map the finding into the relevant category: repair, inspection deficiency, deferred condition, readiness question, or safety relevance."],
  ["Evidence linkage", "Attach notes, photos, supporting documents, references, and related work or service records to the same inspection record."],
  ["Ownership", "Assign the action to the appropriate department, supervisor, technician, or follow-up owner with a clear next step."],
  ["Follow-up", "Track scheduled repair, corrective action, deferred work, or ongoing condition management tied to the original finding."],
  ["Disposition", "Document whether the issue was corrected, deferred, escalated, or remains open with an active condition or exception."],
  ["Closure", "Record the final status, supporting evidence, and the reason the condition is considered resolved or retained under an active restriction."],
  ["History", "Preserve the inspection timeline so the city can explain the finding, the follow-up, and the final condition later."],
  ["Visibility", "Surface the current state to leadership, supervisors, and adjacent operational owners in a reviewable format."],
] as const;

const workflows = [
  {
    title: "A planned or recurring inspection surfaces a condition",
    trigger: "A preventive maintenance cycle, seasonal check, recurring review, or inspection event reveals a defect or operational concern.",
    record: "The record keeps the inspection activity, finding, evidence, owner, and related work requirement connected to the same asset context.",
    risk: "If the finding is not preserved with evidence and ownership, the condition may be rediscovered later with no clear explanation of what was already known.",
    consequence: "The organization can act on the current condition and preserve a defensible administrative trail for follow-up and readiness decisions.",
  },
  {
    title: "A finding requires corrective or deferred action",
    trigger: "The inspection reveals a repair need, a service limitation, or a defect that cannot be resolved immediately in the same work cycle.",
    record: "The finding remains linked to the asset, requested work action, owner, evidence, and the governing condition or exception status.",
    risk: "A deferred or corrective action without clear documentation can create confusion about whether the asset remains operationally fit or is still under review.",
    consequence: "The next owner has a clear record of what was found, what remains unresolved, and what action is still pending.",
  },
  {
    title: "A final inspection closes the loop",
    trigger: "The repair, follow-up action, or condition disposition is completed and the asset or work context must be revalidated.",
    record: "The final status is maintained with the original finding, supporting evidence, completed follow-up, and the current disposition of the asset.",
    risk: "Without a clear final record, the city may not know whether the issue was actually corrected or only temporarily deferred.",
    consequence: "The asset’s service condition is distinguishable from the earlier finding and can be considered ready, restricted, or still in active review with evidence.",
  },
] as const;

const relatedDomains = [
  ["Fleet & equipment", "Inspection documentation is attached to the asset condition, readiness, service fit, and the operational implications of continued use."],
  ["Workforce administration", "Inspections require trained personnel, ownership, certifications, and follow-up accountability to ensure the action is completed and documented correctly."],
  ["Service documentation", "Inspection findings are often connected to the service event, completion evidence, and final asset disposition after the work is done."],
  ["Safety / incidents / exceptions", "Inspection findings frequently become safety issues, incident follow-up, or exception routing when the condition is unresolved or requires action."],
  ["Management visibility", "Leadership needs the open finding list, aging conditions, evidence status, and final disposition before making assignment and readiness decisions."],
] as const;

const levelThreeSubjects = [
  ["Condition finding capture", "The operating record that preserves what was observed, why it mattered, and under what condition it was recorded."],
  ["Evidence attachment", "The photos, notes, timestamps, repair references, and records that support the inspection finding and follow-up decision."],
  ["Defect classification", "The categorization of a finding based on its operational relevance, repair urgency, readiness implication, or safety sensitivity."],
  ["Repair follow-up", "The work action that resolves or mitigates the condition after the inspection establishes the operational need."],
  ["Disposition tracking", "The status view showing whether the asset or work context remains active, restricted, or cleared after intervention."],
  ["Inspection closure", "The final evidence-based record confirming the issue has been resolved, accepted, or retained under an active exception status."],
] as const;

export default function InspectionDocumentationPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal inspection documentation and condition tracking" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Maintenance &amp; Inspection / Level 3 subject</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Inspection Documentation</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The evidence-backed institutional record showing what was observed, why it mattered, what action was required, and what final disposition applied.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services/maintenance-inspection" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Maintenance &amp; Inspection</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="inspection-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="inspection-reality-heading" title="An inspection is only useful if the finding stays connected" lead="Inspection Documentation is the administrative layer that tells the city what was observed, what evidence existed, what work was required, and what final disposition followed." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Municipal inspections produce condition information, not just a status note. A defect, deficiency, or operational concern has to remain attached to the asset, the service context, the evidence, and the follow-up decision so the city can understand what happened and what action happened next.</p>
            <p>Without that continuity, an inspection finding can become a note with little operational value. BOF preserves the chain from observation to evidence to owner to disposition so the next maintenance decision is grounded in why the condition existed and what action resolved it.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="inspection-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="inspection-burden-heading" title="Why inspection documentation becomes difficult" lead="The burden grows from repeated inspections, scattered evidence, and the fact that findings often cross multiple operating teams before they are resolved." />
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

      <MarketingSection variant="white" ariaLabelledBy="inspection-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="inspection-models-heading" title="BOF models for inspection accountability" lead="Inspection documentation is strongest when the condition, the evidence, the ownership, and the final disposition remain connected and reviewable." />
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
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Observation</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Evidence</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Classification</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Ownership</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Disposition</span>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700">The inspection record is not complete until the finding, evidence, and follow-up path are tied to a clear operational meaning that can be reviewed later.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="inspection-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="inspection-lifecycle-heading" title="The inspection documentation lifecycle" lead="The lifecycle preserves the condition from trigger to observation, evidence, follow-up, and final closure or continuation under an active condition." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The sequence matters: trigger → observation → evidence → ownership → follow-up → disposition → closure → history → visibility. BOF keeps the full chain available so a later decision can understand not only what was found, but why and with what evidence it was resolved.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="inspection-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="inspection-workflows-heading" title="Three workflows where inspection documentation matters" lead="The value appears when a condition is discovered, when action is required, and when the finding reaches closure with evidence to support the disposition." />
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

      <MarketingSection variant="ink" ariaLabelledBy="inspection-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Operating consequence</p>
            <h2 id="inspection-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">A finding without a connected record is just a note with no administrative force</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">When an inspection finding is not connected to evidence, owner, and final disposition, the organization cannot reliably say whether a condition was corrected, remains active, or requires a restriction before the next assignment or service cycle.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: an inspection created a finding but the work and closure record are not clearly associated with it.</p>
            <p>Operational consequence: the city may not know whether the asset is ready, still restricted, or simply not yet effectively reviewed.</p>
            <p>Management action: preserve the evidence, assign the follow-up owner, and record the final disposition before the next service or readiness decision.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Inspection Documentation gives the organization a clear answer to: what was found, what evidence supports it, what action is required, and what decision ultimately closed the condition.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="inspection-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="inspection-layer-heading" title="BOF connects inspection findings to the municipal operating picture" lead="Observation → evidence → classification → ownership → disposition → visibility." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Inspection documentation sits inside a wider operational chain involving the condition, the asset, the service requirement, the evidence trail, and the final disposition. The value of an inspection is not just the note that something was wrong; it is the evidence and accountability that keeps the condition from becoming a silent operating risk.</p>
            <p>That is the BOF operating-layer view for Inspection Documentation: a connected, reviewable, and evidence-backed record of what the city saw, what it decided, and how the issue was finally resolved or retained under an active condition.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="inspection-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="inspection-related-heading" title="Where Inspection Documentation connects" lead="This subject sits at the heart of condition management and connects to the work, evidence, and accountability domains surrounding maintenance action." />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {relatedDomains.map(([title, body]) => (
              <article key={title} className="border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{body}</p>
                <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-slate-500">Level 3 relationship</p>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="inspection-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="inspection-subjects-heading" title="Inspection Documentation — deeper subject matter" lead="These are the subject areas that transform a condition note into a complete, governable inspection record." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The deeper concerns all reinforce the same principle: an inspection record must retain the finding, evidence, ownership, and final disposition so the city can accurately govern condition, readiness, and action across future assignments.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="inspection-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="inspection-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how inspection findings become action-ready, evidence-backed, and operationally clear.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Take the municipal assessment to review condition findings, repair readiness, evidence quality, and the disposition path required before the next service decision.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
