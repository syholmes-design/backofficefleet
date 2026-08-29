import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Certification Tracking | Municipal Services | BackOfficeFleet",
  description: "Administrative continuity for municipal certification tracking: credential status, renewal windows, expiration monitoring, proof review, and exception follow-through.",
};

const burdenDrivers = [
  ["Expiration drift", "Credentials can expire without a clear review trail, leaving a person operationally active while the current status is no longer valid."],
  ["Scattered credential proof", "Certificates and renewals often sit in HR files, external portals, or departmental records without a single connected municipal view."],
  ["Recurring renewal cycles", "Annual, seasonal, or role-based renewal windows create constant revalidation work that is easy to miss if status is not actively tracked."],
  ["Role changes", "A person may move between duties or departments where the required certification set changes, but the record does not fully update with the new assignment context."],
  ["Limited ownership", "Without a visible owner and escalation path, certification gaps can remain in a silent state until an operational or compliance issue emerges."],
] as const;

const administrativeModels = [
  ["Status", "Certification tracking depends on a precise, current determination of whether the person is valid, pending, expired, or restricted for a specific role."],
  ["Verification", "A credential only has value when the proof on file is checked against the active requirement and assignment context tied to the role."],
  ["Continuity", "The same credential record must remain connected as the person moves across departments, shifts, assignments, and recurring compliance cycles."],
  ["Accountability", "Every certification gap or renewal miss requires an owner, a review path, and evidence of follow-through before the person remains in service."],
  ["Visibility", "Leadership and supervisors need to see which credentials are current, expiring, overdue, or under exception before the next staffing decision."],
] as const;

const lifecycle = [
  ["Role requirement", "A position or service context defines which certifications or credential thresholds are required for safe and compliant work."],
  ["Issuance", "The person obtains or receives the credential, license, safety qualification, or compliance proof required for the role."],
  ["Record capture", "The certification is stored with its type, issue date, expiration date, owner, proof reference, and associated role context."],
  ["Verification", "The current status is checked against assignment constraints, legal or regulatory requirements, and any operational follow-up conditions."],
  ["Monitoring", "The city tracks due dates, renewal windows, near-term expiration, and any exception conditions that can affect the person’s current assignment."],
  ["Exception", "If a credential is missing, expired, or inconsistent with the current role, the status is routed to the appropriate corrective action owner."],
  ["Follow-up", "The person completes the renewal, revalidation, or corrective action, and the record is updated with the final evidence."],
  ["Resolution", "The certification status is formally aligned with the person, the role, and the operational context in which they are expected to work."],
  ["History", "The certification timeline remains available for accountability, review, and future staffing decisions."],
  ["Visibility", "Current validity, pending renewals, and open exceptions are surfaced for management and operations in a usable format."],
] as const;

const workflows = [
  {
    title: "A credential is required before a role is approved",
    trigger: "A position, department, or service assignment requires a specific credential, license, or compliance proof before work can be authorized.",
    record: "The certificate record is connected to the person, the role, the date of validity, and the proof or source used to confirm it.",
    risk: "If the certification is not clearly tied to the assignment and requirement, the city may authorize work without proof that the activity is still within the person’s valid credential status.",
    consequence: "The staffing decision stays grounded in current proof and can be reviewed by the responsible supervisors or managers.",
  },
  {
    title: "A credential is nearing expiration",
    trigger: "A renewal window or review milestone indicates the credential will expire soon, before the next operational cycle or assignment period.",
    record: "The record remains tied to the person, assignment context, due date, and action owner responsible for renewal or revalidation.",
    risk: "A near-term expiration can be overlooked until after the person is already expected to perform the role without valid proof.",
    consequence: "The city can act before the assignment becomes non-compliant or operationally unsupported.",
  },
  {
    title: "A missing or expired credential requires follow-through",
    trigger: "The review uncovers a credential gap, expired status, or incomplete renewal record that affects the person’s active role.",
    record: "The issue is connected to the person, the assignment, the required credential, and the corrective path required to restore valid status.",
    risk: "Without clear tracking, the gap becomes buried in separate administrative files and remains unresolved longer than the organization can defend.",
    consequence: "Ownership becomes visible and the city can resolve the issue with the appropriate corrective action and evidence trail.",
  },
] as const;

const relatedDomains = [
  ["Workforce administration", "Certification tracking sits at the center of workforce capability, assignment fit, and the operational readiness story for people in municipal roles."],
  ["Qualification evidence", "The certification record must align with the broader proof basis for the person’s role, especially where licensing, safety, or compliance requirements are involved."],
  ["Training documentation", "Completed training and recurring refreshers often feed directly into credential renewal, periodic recertification, and role-specific compliance checks."],
  ["Safety / incidents / exceptions", "A certification issue may become a safety or compliance exception if the person's active status does not match the role or required work conditions."],
  ["Management visibility", "Leadership must see which credentials are valid, expiring, overdue, or under exception before approving staffing or service continuity decisions."],
] as const;

const levelThreeSubjects = [
  ["Credential status review", "The operational check showing whether the credential is valid, expired, pending, or restricted for the current role."],
  ["Renewal window management", "The time-based tracking structure for due dates, upcoming expirations, and required revalidation before the next assignment period."],
  ["Role-to-credential matching", "The alignment of the person’s certification set to the actual role, equipment class, operational setting, or compliance requirement."],
  ["Certification exceptions", "The unresolved credential issue that remains open because proof is missing, the renewal is overdue, or the current assignment exceeds the person’s valid status."],
  ["Certification follow-up", "The corrective action, assessment, renewal, or revalidation path needed to restore valid credential status."],
  ["Credential closure", "The administrative outcome confirming that the certificate is reinstated, remains valid, or is formally discharged with an accepted condition or exception."],
] as const;

export default function CertificationTrackingPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/hero-government-fleets.png" alt="Municipal certification tracking and credential management" width={1920} height={960} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-slate-950/80" />
        <div className="bof-mkt-container relative flex min-h-[25rem] items-end py-14 md:min-h-[31rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Municipal Services / Workforce Administration / Level 3 subject</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">Certification Tracking</h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-100 md:text-2xl">The operational record that shows whether a person’s licenses, credentials, and required certifications are valid, expiring, overdue, or under corrective follow-up.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
              <Link href="/government/municipal-services/workforce-administration" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to Workforce Administration</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="certification-reality-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId="certification-reality-heading" title="A credential is not valid just because it exists" lead="Certification Tracking is the administrative record that confirms a person’s current credential status matched to the role they are expected to perform." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Municipal work depends on people who hold the licenses, certifications, and credential proof needed to operate within regulatory and safety bounds. But the real value is not in storing a certificate; it is in showing the credential is current, correctly assigned to the applicable role, and still valid at the time the work is performed.</p>
            <p>BOF keeps the credential record connected to the person, the relevant role, the expiration timeline, the proof source, and any exception or renewal action that is still open. That makes certification status a defensible operational fact instead of a static sheet or a dated attachment buried in another system.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="certification-burden-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="certification-burden-heading" title="Why certification tracking becomes difficult" lead="The burden grows from recurring renewals, role drift, and the spread of proof across departmental and external records." />
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

      <MarketingSection variant="white" ariaLabelledBy="certification-models-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="certification-models-heading" title="BOF models for certification accountability" lead="A valid certification record must show current status, proof, continuity, ownership, and visibility together." />
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
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Credential</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Proof</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Status</span>
              <span className="text-slate-400">→</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Action</span>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700">A certificate is only operationally useful when it is connected to a valid role requirement, an active assignment, and a current proof trail that can be defended during review.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="certification-lifecycle-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="certification-lifecycle-heading" title="The certification tracking lifecycle" lead="The lifecycle begins with the credential requirement and ends with a final administrative status that is current, expired, or under a valid exception path." />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map(([stage, description], index) => (
              <article key={stage} className="bg-white p-5">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The lifecycle is decisive: requirement → issuance → record capture → verification → monitoring → exception → follow-up → resolution → history → visibility. BOF keeps this chain intact so the city can defend the current status of each credential in the operational context where it matters.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="certification-workflows-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="certification-workflows-heading" title="Three workflows where certification tracking matters" lead="The value appears at role approval, at renewal windows, and when a credential issue becomes an active exception requiring corrective action." />
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

      <MarketingSection variant="ink" ariaLabelledBy="certification-consequence-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Operating consequence</p>
            <h2 id="certification-consequence-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">An out-of-date credential can create an operational blind spot</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">If credential status is not tracked and validated against the actual role, the city may keep a person in service while their current certificate is expired, restricted, or no longer valid in the assignment they are performing.</p>
          </div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg font-bold leading-8 text-white">
            <p>Administrative condition: the person remains active in the organizational system, but the credential evidence is no longer current or aligned with the role.</p>
            <p>Operational consequence: staffing coverage and safety posture are less defensible than the record suggests.</p>
            <p>Management action: verify the credential, confirm the renewal timeline, assign the corrective owner, and preserve the resolution record.</p>
            <p className="border-t border-white/15 pt-5 text-base font-normal leading-7 text-slate-300">Certification Tracking gives the organization a usable answer to: which credentials are valid, which are expiring, which are overdue, and which require active follow-through.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="certification-layer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId="certification-layer-heading" title="BOF connects certification status to the broader workforce operating picture" lead="Role → requirement → credential → proof → status → action → visibility." />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            <p>Certification status is not an isolated HR detail. It sits inside a larger operating model where the person, the role, the assignment, the proof source, and the corrective action all matter. A credential that is valid in one context may be invalid in the next assignment, and BOF keeps that distinction transparent.</p>
            <p>That is the BOF operating-layer view for Certification Tracking: a clear, evidence-based, reviewable record of whether a person’s credentials support the role they are expected to perform and the work the city is asking them to carry.</p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="certification-related-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="certification-related-heading" title="Where Certification Tracking connects" lead="This subject is central to the workforce proof model and links directly to the adjacent domains that define role readiness and governance." />
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

      <MarketingSection variant="white" ariaLabelledBy="certification-subjects-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="certification-subjects-heading" title="Certification Tracking — deeper subject matter" lead="These are the adjacent concerns that make the certification status operationally complete and reviewable." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levelThreeSubjects.map(([title, description], index) => (
              <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6">
                <p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-700">The deeper concerns reinforce the same rule: certification status is a live operational record, not a static credential list. It must be accurate, current, and visible enough to support the city’s staffing and safety decisions.</p>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="certification-cta-heading">
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Next step</p>
            <h2 id="certification-cta-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">See how current credential status becomes operationally reviewable and defensible.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Take the municipal assessment to review role requirements, current credential status, renewal timing, and the follow-up actions needed to keep people aligned with their assignment responsibilities.</p>
          </div>
          <Link href="/assessment/government-fleets" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the municipal assessment</Link>
        </div>
      </MarketingSection>
    </main>
  );
}
