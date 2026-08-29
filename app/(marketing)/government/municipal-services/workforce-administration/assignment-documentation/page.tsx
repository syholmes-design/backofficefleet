import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Assignment Documentation | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal assignment documentation: work context, department ownership, role alignment, readiness evidence, and exception follow-through.",
};

const burdenDrivers = [
  ["Role ambiguity", "A person may be assigned to a role without the documentation clearly showing the departmental context, work expectation, coverage need, or owner."],
  ["Fragmented records", "Assignment records often sit across schedules, department files, operational notes, and readiness evidence, leaving the actual work context disconnected."],
  ["Recurring reassignment", "People move across departments and shifts frequently, which creates constant administrative drift unless assignment history remains tied to the work context."],
  ["Evidence gaps", "When a role assignment is not connected to qualification evidence or supporting records, the document trail cannot explain why the assignment was approved."],
  ["Limited follow-through", "Leadership can see the assignment but not the conditions, exceptions, or unresolved documentation behind the assignment decision."],
] as const;

const administrativeModels = [
  ["Context", "A correct assignment record must preserve the department, role, work expectation, staffing purpose, and operational context tied to the person."],
  ["Continuity", "The same assignment story should remain connected as the person changes crews, departments, shifts, or service responsibilities."],
  ["Accountability", "Every assignment decision requires a visible owner and a path for review if the documentation or readiness condition is incomplete."],
  ["Verification", "Assignment documentation is stronger when it connects the role to the evidence, readiness signals, and support record that validate the assignment."],
  ["Visibility", "Supervisors and leaders can manage the work better when they see the assignment context, not just the assignment label."],
] as const;

const lifecycle = [
  ["Assignment request", "A department identifies the need for a person, role, shift, or service coverage based on operational demand."],
  ["Role definition", "Determine the role, department, schedule, work expectation, and assignment conditions tied to the needed coverage."],
  ["Person match", "Identify the person or eligible pool whose qualifications, status, and operational readiness fit the assignment."],
  ["Documentation", "Capture the assignment context in a way that retains the department, role, work expectation, and supporting requirements."],
  ["Evidence connection", "Attach or reference the qualification, certification, training, or status record needed to support the assignment."],
  ["Readiness check", "Compare the assignment expectation to the person’s actual readiness and note any unresolved issue or blocker."],
  ["Exception", "If a record is missing, incomplete, or inconsistent, route the issue to the right owner and make the condition visible."],
  ["Approval", "The assignment becomes operationally valid only when the documentation and readiness conditions align with the required work."],
  ["Follow-up", "Any exception, correction, or documentation change remains connected to the original work context and the assignment record."],
  ["History", "Preserve the assignment narrative so leadership can review how the role was staffed, what evidence supported it, and what changed later."],
] as const;

const workflows = [
  {
    title: "A role is posted without a clear assignment record",
    trigger: "A supervisor requests staffing for a route, shift, equipment assignment, or service need but the work context is not fully documented.",
    record: "The assignment record is linked to the department, role, service expectation, relevant evidence, and any unresolved condition that affects readiness.",
    risk: "Without clear assignment documentation, the city can approve work without preserving the operational reason or the evidence behind the decision.",
    consequence: "The assignment becomes explainable, reviewable, and accountable instead of being a vague staffing note.",
  },
  {
    title: "A person moves between departments or activity areas",
    trigger: "The same person shifts from one service unit to another, or a team reassigns coverage across routes, responsibilities, or departments.",
    record: "The assignment record preserves the person’s new context while retaining the previous assignment history, evidence, and any follow-up still outstanding.",
    risk: "When the assignment record is not connected to the earlier work or readiness conditions, the city loses continuity and may misread the person’s operational status.",
    consequence: "The organization keeps a complete assignment story for the person, the work, and the accountability attached to the staffing decision.",
  },
  {
    title: "A qualification or evidence issue appears after assignment",
    trigger: "A review reveals that a person assigned to a role does not have current documentation, status proof, or assignment support for the work they are expected to do.",
    record: "The issue stays attached to the assignment context, the role, the record owner, and the administrative follow-up that must happen next.",
    risk: "If the issue is not connected to the assignment record, the gap can drift into informal ownership and become difficult to resolve before it affects service continuity.",
    consequence: "Ownership becomes visible and the city can take corrective action without losing the assignment history or the underlying reason for the decision.",
  },
] as const;

const relatedDomains = [
  ["Workforce administration", "Assignment documentation sits at the center of workforce readiness, staffing coverage, and the person’s fit for the role they are expected to perform."],
  ["Fleet & equipment", "A person’s assignment can only be properly documented when it connects to the asset, route, equipment, or service context they are expected to support."],
  ["Service documentation", "The assignment record is only complete when it remains connected to the service event, work performed, evidence, and resolution status behind the job."],
  ["Safety / incidents / exceptions", "A safety issue or exception can change the appropriateness of an assignment and must remain tied to the original assignment context and follow-up."],
  ["Management visibility", "Leadership needs to see assignment context, role coverage, and unresolved documentation before it becomes a service continuity issue."],
] as const;

const levelThreeSubjects = [
  ["Role Coverage Documentation", "The formal record showing the job, department, responsibility, and staffing expectation tied to an assignment."],
  ["Readiness Evidence Review", "The process of confirming that the person’s qualifications, status, and supporting records are sufficient for the assignment."],
  ["Assignment Exception Routing", "The pass-through of incomplete, conflicting, or missing assignment documentation to the owner who must resolve it."],
  ["Assignment History Continuity", "The record of how a person moved between roles, departments, service units, and operational responsibilities over time."],
  ["Assignment Closure", "The administrative record confirming that the assignment context, supporting evidence, and any follow-up status were fully resolved."],
] as const;

export default function AssignmentDocumentationPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal assignment documentation and workforce context" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Workforce Administration / Level 3 subject</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Assignment Documentation</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The record that explains who was assigned, why, under what conditions, and what evidence or exceptions remain tied to that decision.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services/workforce-administration" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Workforce Administration</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="assignment-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="assignment-reality-heading" title="An assignment is more than a staffing note" lead="Assignment Documentation is the administrative layer that explains the work context, operating expectation, department relationship, and evidence behind the staffing decision." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Municipal work depends on people being assigned to roles in the right place, at the right time, with the right qualifications and the right administrative support. That assignment is not just a roster entry. It is a decision with context, responsibility, and operational consequence.</p>
            <p>When assignment documentation is weak, incomplete, or disconnected from readiness evidence, the organization cannot explain who was assigned, why they were assigned, what conditions they needed to satisfy, or what exception remained open. BOF keeps that story connected so the assignment is understandable and governable.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="assignment-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="assignment-burden-heading" title="Why assignment documentation becomes difficult" lead="The burden is created by recurring service work, staffing movement, and the fact that the same person may carry multiple assignments across a public operating system." />
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

      <MarketingSection variant="white" ariaLabelledBy="assignment-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="assignment-models-heading" title="BOF models for assignment accountability" lead="Assignment documentation is strongest when it carries context, continuity, verification, and visibility across the person and the work they are expected to perform." />
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
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Role</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Department</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Readiness</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Evidence</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Response</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Accountability</span>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700">The assignment record is not a static label. It is the connection between the role, the people, the readiness evidence, and the accountability behind the staffing decision.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="assignment-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="assignment-lifecycle-heading" title="The assignment documentation lifecycle" lead="The administrative lifecycle starts with staffing need and ends with a resolved, explainable assignment story that is still reviewable later." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The lifecycle is decisive: request → role definition → person match → documentation → evidence → readiness → exception → approval → follow-up → history. BOF keeps this chain intact so the assignment remains explainable when operational conditions change.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="assignment-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="assignment-workflows-heading" title="Three workflows where assignment documentation matters" lead="The value of the domain becomes clear when staffing is posted, when people move across work, and when a readiness issue appears after assignment." />
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

      <MarketingSection variant="ink" ariaLabelledBy="assignment-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Operational consequence</p>
            <h2 id="assignment-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">A weak assignment record leaves the city guessing</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">When assignment documentation is weak, fragmented, or disconnected from readiness evidence, the city cannot reliably explain the staffing decision, the timeline, or whether the work was administratively supported at the moment it was approved.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: a role was staffed, but the record does not fully explain the assignment context or evidence behind the decision.</p>
            <p>Operational consequence: staff coverage is less defensible, exceptions are harder to resolve, and service continuity becomes harder to explain.</p>
            <p>Management action: document the role, align it to evidence, attach owner and follow-up, and keep the assignment story connected as conditions change.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">That is the governance value of Assignment Documentation: it transforms an operational staffing act into a reviewable administrative decision.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="assignment-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="assignment-layer-heading" title="BOF connects assignment documentation to the municipal operating picture" lead="Role → department → readiness → evidence → action → accountability." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Every assignment decision sits inside a municipal system: the person, the department, the operational expectation, the support record, and the next action if a gap emerges. Assignment documentation is the governance record that connects those components so the organization can explain why the decision was made and what next steps or exceptions remain.</p>
            <p>That is the BOF operating-layer view for Assignment Documentation: a connected, accountable, and reviewable record from staffing request through evidence, approval, and follow-through.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="assignment-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="assignment-related-heading" title="Where Assignment Documentation connects" lead="This subject sits inside the broader workforce and municipal service model and informs the related operating domains." />
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

      <MarketingSection variant="white" ariaLabelledBy="assignment-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="assignment-subjects-heading" title="Assignment Documentation — deeper operational subjects" lead="These are the adjacent subject areas that make the assignment record operationally complete and reviewable." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The deeper subject matter sits under the same architecture: assignment context, readiness evidence, exception routing, continuity, and closure. This page makes those concerns visible without collapsing them into a generic staffing summary.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="assignment-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="assignment-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how assignment context becomes accountable, reviewable, and operationally clear.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Take the municipal assessment to review role fit, readiness evidence, assignment exceptions, and accountability across operational work.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
