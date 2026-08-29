import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Training Documentation | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal training documentation: role requirements, completion proof, due dates, completion evidence, exception handling, and operational accountability.",
};

const burdenDrivers = [
  ["Training drift", "Employees can complete training in one department, then move to another role without the same training history remaining visible to the new operational context."],
  ["Fragmented records", "Training records often sit across LMS files, supervisor notes, onboarding packets, and safety records without a connected administrative trail."],
  ["Recurring requirements", "Mandatory refreshers, annual recertification, seasonal preparation, and safety updates create repeated work that is easy to miss if not clearly tracked."],
  ["Role mismatch", "Personnel may have completed the right training for an older assignment but not the version required for a new role, route, equipment class, or service area."],
  ["Limited ownership", "Without clear action ownership, missing or overdue training remains a quiet operational risk instead of a visible corrective issue."],
] as const;

const administrativeModels = [
  ["Requirement", "Training documentation begins with the operational requirement tied to the role, service area, equipment class, or compliance expectation."],
  ["Evidence", "The training record must preserve the completion proof, timeline, learner, instructor or source, and the actual requirement it satisfied."],
  ["Continuity", "The same training story must remain connected as the person moves through departments, duties, assignments, and recurring compliance cycles."],
  ["Accountability", "Every overdue, incomplete, or expired training item needs an owner and a clear corrective action path."],
  ["Visibility", "Leadership needs to see who is current, who is overdue, and what remains unresolved in a form that supports staffing and operational judgment."],
] as const;

const lifecycle = [
  ["Role need", "A work role or operational requirement makes clear which training must be completed before the person can safely and correctly perform the work."],
  ["Assignment", "The person is assigned to the role or service context that depends on the training requirement."],
  ["Enrollment", "The training is scheduled, assigned, or tracked according to the requirement and relevant approval path."],
  ["Completion", "The person completes the training and the proof is captured in a usable record."],
  ["Verification", "The training record is checked against the actual requirement, assignment context, and any compliance conditions attached to the role."],
  ["Status", "The person is marked current, pending, expired, or under exception depending on the record and any follow-up needed."],
  ["Exception", "If the record is missing, incomplete, expired, or inconsistent, the issue is routed to the responsible owner for corrective action."],
  ["Follow-up", "The team records the corrective action, refresh training, proof update, or acceptable exception path until the issue is resolved."],
  ["Resolution", "The final training status is documented so operations can distinguish active compliance from completed readiness."],
  ["History", "The record remains available for review, staffing decisions, audit context, and future assignment needs."],
] as const;

const workflows = [
  {
    title: "A role is assigned before training is current",
    trigger: "A department needs staffing coverage for a job that depends on safety, equipment handling, compliance, or role-specific training.",
    record: "The training record is attached to the person, role, assignment context, and status so it can be reviewed before the work begins.",
    risk: "If training is not visibly connected to the assignment, the organization may schedule a person for operational work without proof that they are current for that role.",
    consequence: "Supervisors can see whether the assignment is fully supported by the person’s training record and take action before risk moves into service delivery.",
  },
  {
    title: "A training requirement must be refreshed",
    trigger: "A refresher, recurring safety update, or renewed compliance course is due for a person who remains assigned to the role.",
    record: "The training reminder remains attached to the person, due date, operating context, and owner responsible for follow-through.",
    risk: "An overdue course can hide inside a disconnected reminder system until it becomes a staffing, safety, or compliance problem.",
    consequence: "The city can address the gap before it directly affects operational continuity or compliance posture.",
  },
  {
    title: "A completed course must be revalidated",
    trigger: "A completed training item needs to be checked against the current requirement, role, or assignment context after a structural change or policy update.",
    record: "The final proof and status remain linked to the person, requirement, assignment history, and any exception or revalidation steps still required.",
    risk: "Training can appear complete on paper while not actually matching the role or the current operational requirement.",
    consequence: "The organization preserves a clear proof trail and can confidently say whether the person remains current or needs additional action.",
  },
] as const;

const relatedDomains = [
  ["Workforce administration", "Training documentation sits at the center of workforce readiness and role fitness across municipal operations, staffing, and service delivery."],
  ["Qualification evidence", "The training record must align with the person’s qualification proof and the current role requirement before the work can be considered fully supported."],
  ["Certification tracking", "Completed courses and recurring requalification cycles feed into credential status, expirations, and the broader compliance story."],
  ["Safety / incidents / exceptions", "A missed training requirement or overdue safety course often becomes a visible exception tied to safety risk or operational follow-up."],
  ["Management visibility", "Leadership needs to see who is current, who is overdue, and what actions are pending before staffing or service decisions are made."],
] as const;

const levelThreeSubjects = [
  ["Course completion proof", "The administrative proof that a person completed the required instruction or training segment tied to the role or work context."],
  ["Renewal tracking", "The due-date structure showing when training must be refreshed, repeated, or reassessed for continued operational readiness."],
  ["Role-specific training coverage", "The linkage between a person’s completed learning and the operational responsibilities or equipment context they are assigned to perform."],
  ["Training exceptions", "The record of overdue, missed, or incomplete training that has not yet been resolved or accepted under an exception path."],
  ["Training follow-up", "The corrective action, retraining, or revalidation path needed to bring the person back to an acceptable compliance or readiness status."],
  ["Training closure", "The final documentation showing whether the requirement was satisfied, renewed, or found to require a continued condition or exception."],
] as const;

export default function TrainingDocumentationPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal training documentation and workforce readiness" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Workforce Administration / Level 3 subject</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Training Documentation</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The documented proof that a person has completed the required learning, safety, and operational instruction needed for their role and assignment context.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services/workforce-administration" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Workforce Administration</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="training-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="training-reality-heading" title="Training is not just a completed course" lead="Training Documentation is the administrative record that shows a person completed the correct learning, remains current, and is still fit for the role or assignment they are expected to perform." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Municipal work depends on people who know how to perform safely and correctly in their assigned role. But a completed course doesn’t automatically mean the person is still ready for the operational assignment, the equipment class, or the service context they are now working in.</p>
            <p>BOF preserves the administrative continuity needed to distinguish a completed course from a current, role-appropriate readiness posture. It keeps the requirement, completion proof, assignment match, exception history, and owner in one connected operational story instead of a paper trail scattered across systems.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="training-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="training-burden-heading" title="Why training documentation becomes difficult" lead="The burden comes from recurring role requirements, changing assignments, and the fact that many records are not tied to the same operational context." />
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

      <MarketingSection variant="white" ariaLabelledBy="training-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="training-models-heading" title="BOF models for training accountability" lead="Training documentation is strongest when it preserves requirement, proof, continuity, ownership, and current visibility together." />
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
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Schedule</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Proof</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Status</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Follow-up</span>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700">The key is not whether training was attended. It is whether the record is current, tied to the right requirement, and still aligned with the person’s job and operating context.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="training-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="training-lifecycle-heading" title="The training documentation lifecycle" lead="The lifecycle starts with a role requirement and ends with a final status that explains whether the training is current, overdue, or under corrective follow-through." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The sequence matters: role need → assignment → enrollment → completion → verification → status → exception → follow-up → resolution → history. BOF preserves that continuity so the city can say with clarity whether training is still valid in the current operating context.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="training-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="training-workflows-heading" title="Three workflows where training documentation matters" lead="The value appears when a role is assigned, when a course is renewed, and when a completed record must still be validated against the current role requirement." />
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

      <MarketingSection variant="ink" ariaLabelledBy="training-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Operating consequence</p>
            <h2 id="training-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">An outdated training record can hide a staffing or safety risk</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">If a person is still assigned to a critical or safety-sensitive role but the training record is incomplete, expired, or not tied to the current operational context, the city may be evaluating readiness incorrectly. BOF reduces that risk by preserving the proof, the exception, and the status behind the decision.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: the person appears assigned and operationally present, but the current training status is incomplete or no longer aligned with the role.</p>
            <p>Operational consequence: staffing coverage and risk posture are less defensible than the record suggests.</p>
            <p>Management action: verify the requirement, confirm the proof, assign the follow-up owner, and retain the corrective path for review.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Training Documentation gives the organization a usable answer to: what was required, what was completed, what remains current, and what still needs action.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="training-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="training-layer-heading" title="BOF connects training to the broader workforce operating picture" lead="Role → requirement → completion → verification → status → follow-up → visibility." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Training exists inside a larger workforce system: the role, the assignment, the operational context, the required proof, and the corrective action when the record is late, incomplete, or no longer current. That operational environment makes training a governance issue as much as a compliance issue.</p>
            <p>That is the BOF operating-layer view for Training Documentation: a connected record showing whether a person is appropriately prepared for the work they are assigned to perform and whether the city still has evidence to defend that readiness.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="training-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="training-related-heading" title="Where Training Documentation connects" lead="This subject sits inside the workforce model and links directly to the adjacent domains that determine readiness, compliance, and accountabilities." />
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

      <MarketingSection variant="white" ariaLabelledBy="training-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="training-subjects-heading" title="Training Documentation — deeper subject matter" lead="These are the adjacent administrative topics that make the training record useful and reviewable in actual operations." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The deeper concerns all reinforce the same BOF principle: training is not a checkbox; it is a connected readiness record that must remain current, role-appropriate, and visible enough to support staffing and service decisions.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="training-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="training-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how training proof becomes current, reviewable, and operationally defensible.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Take the municipal assessment to review role requirements, training status, qualification proof, and the follow-up actions needed for effective staffing decisions.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
