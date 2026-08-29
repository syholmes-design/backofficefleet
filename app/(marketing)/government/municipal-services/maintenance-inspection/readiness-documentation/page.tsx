import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Readiness Documentation | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal readiness documentation: condition, suitability, asset status, assignment fit, exception follow-through, and management visibility.",
};

const burdenDrivers = [
  ["Condition ambiguity", "An asset or work context may appear ready on paper while the operational condition, maintenance history, or unresolved exception makes it unsuitable for assignment."],
  ["Fragmented status", "Readiness signals often sit in inspection notes, work orders, service records, and exception logs without a common continuity trail."],
  ["Recurring cycles", "Routine PM, seasonal checks, inspections, and reassignment cycles create repeated readiness decisions that can drift if they are not consistently documented."],
  ["Handoffs", "One crew may clear a unit for service while the next department reassigns it without the same readiness context or final status explanation."],
  ["Limited visibility", "Leadership may not know whether the issue is a temporary condition, unresolved maintenance work, or a broader service restriction affecting assignments."],
] as const;

const administrativeModels = [
  ["Condition", "Readiness is not a single status label; it is the current condition of the asset, the work context, the evidence around it, and what remains unresolved."],
  ["Continuity", "The readiness story must stay connected to the asset, assignment, maintenance event, service record, and follow-up path across time."],
  ["Accountability", "Any readiness restriction or service limitation needs an owner, an explanation, and a visible next action to resolve the condition."],
  ["Evidence", "A readiness decision only becomes defensible when the supporting condition, inspection, maintenance, and exception records are connected to it."],
  ["Visibility", "Supervisors and leadership need the current readiness state, the reason for it, and the outstanding action required before the next operational decision."],
] as const;

const lifecycle = [
  ["Trigger", "A service need, inspection finding, maintenance requirement, or exception highlights a readiness question for an asset or work context."],
  ["Condition", "Capture the current state of the asset, workstream, or operating context and note any relevant limitation or unresolved issue."],
  ["Evidence", "Connect the condition to inspection evidence, maintenance records, service documentation, and exceptions that explain the operational status."],
  ["Assessment", "Determine whether the asset, crew, assignment, or work context is suitable to proceed in its current state or remains constrained."],
  ["Restriction", "Document the specific limitation and related operational implications for reassignment, use, or follow-up."],
  ["Ownership", "Assign the follow-up action to the responsible department, supervisor, technician, or administrator with a clear next step."],
  ["Follow-up", "Track the resolution path, supporting action, and any additional evidence needed to improve readiness confidence."],
  ["Resolution", "Record the result so the city can distinguish a truly cleared state from an unresolved condition or temporary constraint."],
  ["History", "Retain the readiness narrative so future decisions can understand why a unit, crew, or assignment was restricted or released."],
  ["Visibility", "Present the current state and status reason in a management-ready form rather than as isolated condition notes."],
] as const;

const workflows = [
  {
    title: "A unit is flagged for readiness review",
    trigger: "A recurring inspection, PM cycle, equipment review, or service need indicates that the asset or work context may no longer be suitable for assignment.",
    record: "The readiness review is connected to the asset, condition, supporting evidence, current use context, and any owner assigned to resolve the issue.",
    risk: "If readiness is not documented as a condition with a clear reason, the city may continue to treat a constrained asset as operationally available.",
    consequence: "The organization can explain the limitation, act on it, and keep the readiness decision connected to the operative story behind it.",
  },
  {
    title: "A maintenance event changes the readiness state",
    trigger: "A correction, repair, or maintenance activity modifies the asset’s condition and may alter its ability to support future service work.",
    record: "The readiness documentation remains tied to the maintenance activity, supporting completion records, owner, and final status disposition.",
    risk: "A maintenance event without clear readiness documentation can leave everyone unsure whether the asset is fully ready, temporarily constrained, or awaiting additional evidence.",
    consequence: "The city preserves a clear before-and-after story so reassignment decisions remain grounded in the actual condition instead of memory or informal notes.",
  },
  {
    title: "A previously resolved condition must remain explainable later",
    trigger: "The asset or work context has been cleared but must later be reviewed by leadership, another team, or a future assignment cycle.",
    record: "The final readiness status is preserved with the condition, evidence, action, and closure context that explain why clearance was granted.",
    risk: "Without clear readiness documentation, the city may struggle to distinguish a cleared state from a condition that was simply not reviewed deeply enough.",
    consequence: "The archived status remains useful and tractable for future staffing, service, and management conversations without re-creating the operational story from scratch.",
  },
] as const;

const relatedDomains = [
  ["Fleet & equipment", "Readiness documentation is directly tied to the asset’s condition, assignment suitability, and the service activity it can support."],
  ["Workforce administration", "People and crew readiness combinations matter when a work assignment or service task depends on staffing, qualification, and assignment fit."],
  ["Service documentation", "A readiness decision must remain connected to the service record and any evidence produced during the work or review."],
  ["Safety / incidents / exceptions", "Resolved or unresolved safety conditions often directly affect the asset’s or work context’s readiness status."],
  ["Management visibility", "Leadership needs to see what is operationally ready, what is restricted, and what remains unresolved before approving the next assignment or action."],
] as const;

const levelThreeSubjects = [
  ["Condition readiness review", "A structured evaluation that shows whether the current asset or work context is suitable to proceed or remains restricted."],
  ["Maintenance-to-readiness linkage", "The connection between a repair, corrective action, inspection finding, and the current operational suitability of the asset."],
  ["Assignment suitability status", "The status record showing whether the asset or work context is fit for the role, route, or service plan under consideration."],
  ["Restriction documentation", "The record of any limiting condition, operational constraint, or temporary disposition affecting future use."],
  ["Readiness exception routing", "The process of assigning an open readiness issue to the owner who can correct the condition or confirm the final status."],
  ["Readiness closure", "The final administrative disposition showing whether the condition was resolved, allowed, or left with an active operational restriction."],
] as const;

export default function ReadinessDocumentationPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal readiness documentation and operational suitability" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Maintenance & Inspection / Level 3 subject</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Readiness Documentation</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The administrative condition that explains whether a municipal asset, crew context, or work stream is suitable to proceed or remains constrained.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services/maintenance-inspection" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Maintenance & Inspection</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="readiness-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="readiness-reality-heading" title="Readiness is a condition, not a mood" lead="Readiness Documentation is the administrative record that shows whether an asset, service context, or work setup is actually suitable for the next assignment or operational use." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Municipal operations depend on a stable understanding of what is fit for service and what is not. Yet readiness is rarely visible from one record alone. It is a combination of the asset condition, inspection result, maintenance activity, assignment context, evidence trail, unresolved exception, and ownership behind the current state.</p>
            <p>BOF does not replace field judgment or regulatory authority. It keeps the administrative story connected so the city can say clearly why an asset or work context was approved, restricted, or still requires action before the next assignment or operating decision.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="readiness-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="readiness-burden-heading" title="Why readiness documentation becomes difficult" lead="The burden grows from repeated operational cycles where condition, evidence, and assignment context must stay aligned across departments and service teams." />
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

      <MarketingSection variant="white" ariaLabelledBy="readiness-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="readiness-models-heading" title="BOF models for readiness accountability" lead="Readiness is governance when it shows condition, continuity, ownership, evidence, and management visibility in the same administrative view." />
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
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Condition</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Evidence</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Assessment</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Restriction</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Ownership</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Resolution</span>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700">Readiness is strongest when it depends on condition, evidence, and ownership rather than a simple pass/fail indicator without context.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="readiness-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="readiness-lifecycle-heading" title="The readiness documentation lifecycle" lead="The lifecycle traces a condition from recognition to evidence, assessment, restriction, follow-up, and final resolution." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The sequence matters: trigger → condition → evidence → assessment → restriction → ownership → follow-up → resolution → history → visibility. BOF keeps it connected so readiness can be discussed as an actual operational state rather than a vague label.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="readiness-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="readiness-workflows-heading" title="Three workflows where readiness documentation matters" lead="The value appears when a service need triggers review, when maintenance changes suitability, and when historical status must remain explainable." />
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

      <MarketingSection variant="ink" ariaLabelledBy="readiness-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Operating consequence</p>
            <h2 id="readiness-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">An unclear readiness record can hide an operational restriction</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">A unit can appear available on paper while the underlying condition, follow-up action, or service limitation still requires attention. BOF preserves the status reason and the evidence trail so the city can distinguish certainty from assumption.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: the readiness state is uncertain because the evidence, maintenance status, or restriction is not clearly documented.</p>
            <p>Operational consequence: a future assignment or service plan may proceed without full awareness of the asset or work context’s current suitability.</p>
            <p>Management action: identify the condition, connect the evidence, assign the owner, and record the final status before the next decision.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Readiness Documentation gives the organization a clear answer to: what is fit, what is restricted, why, and what action remains before the next work assignment.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="readiness-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="readiness-layer-heading" title="BOF connects readiness to the broader service model" lead="Condition → evidence → assessment → restriction → ownership → resolution → visibility." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Readiness is never a standalone status. It sits inside a municipal chain of asset condition, maintenance action, assignment context, service obligations, unresolved exceptions, and management review. The clarity of the administrative decision depends on how well these factors remain connected at the moment of assignment or reassignment.</p>
            <p>That is the BOF operating-layer view for Readiness Documentation: a connected record explaining whether the asset or work context is suitable to proceed, restricted, or still awaiting the corrective action necessary to restore confidence.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="readiness-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="readiness-related-heading" title="Where Readiness Documentation connects" lead="This subject sits inside broader municipal service operations and links directly to the conditions, records, and exceptions that define the current operating state." />
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

      <MarketingSection variant="white" ariaLabelledBy="readiness-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="readiness-subjects-heading" title="Readiness Documentation — deeper subject matter" lead="These are the adjacent operational points that make readiness documentation actionable and reviewable." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The deeper concerns reinforce the same governance principle: readiness is not a work-order label, it is the documented condition that explains whether the asset or work context is fit to move forward and what action remains if it is not.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="readiness-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="readiness-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how readiness state becomes explainable, reviewable, and service-ready.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Take the municipal assessment to review asset condition, restrictions, maintenance evidence, and assignment suitability before the next operational decision.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
