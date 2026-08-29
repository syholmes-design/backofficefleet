import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Qualification Evidence | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal qualification evidence: proof, status, credential linkage, follow-through, exception handling, and workforce readiness accountability.",
};

const burdenDrivers = [
  ["Scattered proof", "Qualification evidence is often stored in disparate files, training logs, credential portals, and departmental notes without a connected administrative trail."],
  ["Status drift", "A person may appear qualified in one system while the credential, medical status, or continuing requirement is expired or incomplete somewhere else."],
  ["Role mismatch", "The same evidence may not clearly explain whether the person is qualified for the role, the department, the equipment, or the operating context they are assigned to."],
  ["Recurring renewals", "Annual renewals, requalification cycles, seasonal staffing changes, and mandatory updates create repeated evidence-check work that can be hard to manage without continuity."],
  ["Limited ownership", "When no one clearly owns evidence review and follow-up, expired, missing, or inconsistent records stay open longer than they should."],
] as const;

const administrativeModels = [
  ["Evidence", "Qualification is only defensible when the proof, requirement, and status record all remain clearly connected to the person and the role they are expected to perform."],
  ["Continuity", "Qualification evidence must remain connected across shifts, departments, certifications, training cycles, and operational assignments."],
  ["Accountability", "Evidence gaps need a visible owner, a clear review path, and a record of the follow-up action taken."],
  ["Verification", "The city can only determine readiness when the qualification record is checked against the role, the assignment, and the current operational context."],
  ["Visibility", "Leadership needs current qualification health, exception status, and obvious gaps before a staffing decision is made or a service role is approved."],
] as const;

const lifecycle = [
  ["Role requirement", "A work assignment makes clear the qualification, certification, medical, safety, or compliance requirement tied to the role."],
  ["Evidence collection", "The person provides or updates the proof, credential, training confirmation, or proof record expected for that role."],
  ["Verification", "The administrative record checks whether the evidence is current, complete, valid, and tied to the correct role and assignment context."],
  ["Status match", "Determine whether the person is fully qualified, partly qualified, or not qualified for the assignment or operational context."],
  ["Exception", "If a qualification is missing, expired, inconsistent, or incomplete, route it into the proper exception or follow-up path."],
  ["Ownership", "Assign the review and corrective action to the responsible supervisor, admin function, or compliance owner."],
  ["Follow-up", "Track the corrective action, proof update, or waiver condition until the qualification story is complete."],
  ["Resolution", "Document the final evidence result so the city can distinguish a valid qualification from an unresolved or conditional one."],
  ["History", "Retain the evidence chain so the decision can later be reviewed and explained in a precise operational context."],
  ["Visibility", "Report the current status in a format usable by supervisors, managers, and the departments that rely on the role being staffed correctly."],
] as const;

const workflows = [
  {
    title: "A role requires proof before assignment approval",
    trigger: "A department requests staffing for a role that depends on training, certification, safety status, or a documented compliance requirement.",
    record: "The administrative record connects the role, the person, the requirement, the evidence, and the approval condition in one review trail.",
    risk: "If the role requirement is not tied to specific evidence, the city can approve a staffing decision without proving the person is qualified for the work.",
    consequence: "The staff decision stays verifiable and explainable instead of relying on informal memory or disconnected records.",
  },
  {
    title: "A qualification expires or becomes incomplete",
    trigger: "An expired credential, missing renewal, or incomplete status review creates a qualification gap for an active assignment.",
    record: "The evidence issue is attached to the person, the role, the responsible owner, and the administrative path for corrective action.",
    risk: "A credential issue can sit in a separate file and remain invisible until the assignment is already underway or the person is operating without proper proof.",
    consequence: "The organization can escalate the issue, identify the owner, and preserve the evidence path needed to protect operational continuity and compliance.",
  },
  {
    title: "A follow-up proves the issue is resolved",
    trigger: "The person completes the required training, refresh, or documentation update and the evidence must be revalidated.",
    record: "The qualification record is updated with the final proof, the date, the reviewer, and any exceptions or conditions still attached to the status.",
    risk: "Without proper closure, the city cannot tell whether the person was truly requalified, conditionally approved, or still open to an unresolved evidence gap.",
    consequence: "The workforce picture remains accurate and role-level readiness can be reassessed with confidence.",
  },
] as const;

const relatedDomains = [
  ["Workforce administration", "Qualification evidence is central to workforce readiness, role alignment, and the person’s ability to serve across municipal work streams."],
  ["Maintenance & inspection", "Inspection, maintenance, and equipment handling roles often depend on specific evidence and certifications that must remain current to keep work compliant."],
  ["Service documentation", "Service records and completion evidence must remain connected to the qualification record when the work depends on certified or trained staff."],
  ["Safety / incidents / exceptions", "Exceptions, safety findings, and corrective actions often surface qualification or evidence gaps that must be resolved before assignment continues."],
  ["Management visibility", "Leadership needs a clear and current view of who is qualified, who is missing proof, who is owner-assigned, and what remains open."],
] as const;

const levelThreeSubjects = [
  ["Credential verification", "The review step that confirms the proof on file matches the active requirement for the assigned role or service context."],
  ["Training completion evidence", "The proof that the person completed the learning, safety, or operational requirement required for the work they are expected to perform."],
  ["Medical / compliance proof", "The status and supporting documentation required for a role that depends on regulatory or safety readiness."],
  ["Exception escalation", "The mechanism for routing missing, stale, or conflicting qualification proof to the owner responsible for action."],
  ["Qualification aging", "The time-based view showing which records are close to renewal, overdue, or still unresolved."],
  ["Qualification closure", "The final administrative record confirming the required proof was satisfied or the issue was dispositioned with a valid condition or exception."],
] as const;

export default function QualificationEvidencePage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal qualification evidence and credential readiness" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Workforce Administration / Level 3 subject</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Qualification Evidence</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The proof record that tells the city whether a person is actually qualified for the role, the assignment, and the work context they are expected to perform.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services/workforce-administration" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Workforce Administration</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="qualification-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="qualification-reality-heading" title="The proof behind the assignment matters" lead="Qualification Evidence is the administrative record that shows the city has proof, not just a belief, that a person meets the requirements for a role or assignment." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Public service organizations rely on people to carry technical, compliance, safety, and operational responsibility. But proof is not always obvious when a person is assigned, reassigned, or scheduled to cover a critical work area. Documents, training records, certifications, medical status, and operational history can all be valid, but disconnected.</p>
            <p>BOF keeps the administrative trail connected so it is clear whether the person is truly qualified for the work, whether the proof is current, whether a gap remains open, and who is accountable for resolving it. The goal is not simply to list certifications; it is to connect those records to the assignment and role they actually support.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="qualification-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="qualification-burden-heading" title="Why qualification evidence becomes difficult" lead="The burden is created by recurring renewals, role complexity, and operational records that often live in separate systems or paper trails." />
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

      <MarketingSection variant="white" ariaLabelledBy="qualification-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="qualification-models-heading" title="BOF models for qualification accountability" lead="Qualification is strongest when it is tied to evidence, continuity, verification, ownership, and visible operational status." />
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
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Requirement</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Evidence</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Verification</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Status</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Accountability</span>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700">Without that chain, the organization may treat an overdue or incomplete qualification as if it were still valid because the person is still assigned to work.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="qualification-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="qualification-lifecycle-heading" title="The qualification evidence lifecycle" lead="The lifecycle begins with the role requirement and ends with a final administrative status that is usable by operations, compliance, and management." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The sequence matters because qualification is not simply a yes/no state. It is an evidence chain from role requirement to proof to verification to status and then to corrective action if the record is incomplete or expired.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="qualification-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="qualification-workflows-heading" title="Three workflows where qualification evidence matters" lead="The value appears when a role is staffed, when a qualification expires, and when proof needs to be revalidated after follow-up." />
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

      <MarketingSection variant="ink" ariaLabelledBy="qualification-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Operating consequence</p>
            <h2 id="qualification-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">A qualification without proof is not a verified workforce record</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">If the evidence trail is incomplete, expired, or disconnected, the city can mistake a person’s intended readiness for actual qualification. The problem becomes more serious when the assignment is operationally critical or the role carries safety consequence.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: the person may be assigned to work, but the supporting proof is not current, complete, or connected to the operational requirement.</p>
            <p>Operational consequence: the team has a staffing decision but not a defensible qualification record behind it.</p>
            <p>Management action: verify the requirement, confirm the proof, assign ownership, and retain the final status in a way the city can review later.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Qualification Evidence gives the organization a clear answer to the question: what proof exists, what is missing, and who is accountable for resolving the gap.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="qualification-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="qualification-layer-heading" title="BOF connects qualification to the broader municipal workforce model" lead="Role → requirement → evidence → verification → status → accountability." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Qualification is not a standalone HR attribute. It sits inside a larger operational story involving the person, the role, the assignment, the evidence source, the current status, and the follow-up required to return the record to a defensible state. The more critical the role, the more important this proof chain becomes.</p>
            <p>That is the BOF operating-layer view for Qualification Evidence: a connected, reviewable, and accountable record showing whether the person is able to carry the work they are expected to perform.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="qualification-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="qualification-related-heading" title="Where Qualification Evidence connects" lead="This subject sits at the heart of workforce readiness and links directly to the operational records and exceptions that determine safe, compliant assignment coverage." />
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

      <MarketingSection variant="white" ariaLabelledBy="qualification-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="qualification-subjects-heading" title="Qualification Evidence — deeper subject matter" lead="These are the administrative subtopics that make the evidence chain operationally useful and reviewable." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The deeper concerns all reinforce the same conclusion: qualification is not a static credential list, it is a connected proof chain that determines whether a person can remain assigned, operate safely, and be defended in an operational review.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="qualification-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="qualification-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how the evidence chain becomes role-ready, accountable, and operationally reviewable.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Take the municipal assessment to review role requirements, qualification proof, assignment fit, and the follow-up actions needed to keep service coverage compliant and defensible.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
