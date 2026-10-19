/**
 * BOF Route Owner:
 * URL: /recruiting-onboarding
 * Type: PUBLIC
 * Purpose: public introduction to the connected Recruiting & Onboarding workflow, arranged the way a
 *          recruiter works a requisition: one stage at a time, each stage opening the demonstration there.
 * Related: /demo/recruiting/workspace (?stage=…), /demo/recruiting (public demonstration), /assessment
 */
import type { Metadata } from "next";
import Link from "next/link";

import { RecruitingStageNav } from "@/components/marketing/RecruitingStageNav";
import { REQUISITION_FORM_SECTIONS } from "@/lib/recruiting/requisition-fields";
import { recruitingPipelineState, requisitionPipelineCounts, type PipelineCandidateFacts } from "@/lib/recruiting/requisition-pipeline";
import "./recruiting-onboarding.css";

export const metadata: Metadata = {
  title: "Recruiting & Onboarding | BackOfficeFleet",
  description:
    "BOF manages the full workforce lifecycle from carrier staffing need through driver assignment readiness: requisition, five approvals, screening, structured interview, offer, onboarding, qualification and driver activation.",
};

const DEMO = "/demo/recruiting/workspace";
const DEMO_REQUISITION = "/demo/recruiting/requisitions/demo-req-001";

type Stage = {
  id: string;
  number: string;
  title: string;
  purpose: string;
  steps: Array<{ id: string; title: string; body: string }>;
  recruiter: string[];
  enforced: string[];
  stops: string[];
  tryIt: { href: string; label: string; note: string };
};

const STAGES: Stage[] = [
  {
    id: "requisition",
    number: "01",
    title: "Requisition & approval",
    purpose: "No one recruits until the opening is defined and signed off. The requisition is the job: every later check reads from it.",
    steps: [
      { id: "staffing-need", title: "Carrier staffing need", body: "Lane, equipment, home time, start date and headcount." },
      { id: "requisition-created", title: "Requisition created", body: "Written into the 11-section BOF requisition (BOF-HR-DRV-NNN)." },
      { id: "five-approvals", title: "Five approvals", body: "Requesting manager, fleet safety director, fleet owner / GM, BOF account manager, BOF HR review." },
      { id: "ready-for-recruiting", title: "Ready for recruiting", body: "Approval sets the requisition to READY_FOR_RECRUITING." },
    ],
    recruiter: ["Confirms pay, lane and home time with the fleet before posting", "Agrees the knock-out criteria: CDL class, experience, MVR standard"],
    enforced: ["Approval is blocked until every required approver has signed", "One recruiting position per requisition, always traceable to it"],
    stops: ["A missing approval", "A requisition on hold or cancelled"],
    tryIt: { href: DEMO_REQUISITION, label: "Open the approved requisition", note: "All 11 sections and the five recorded approvals." },
  },
  {
    id: "screening",
    number: "02",
    title: "Source & screen",
    purpose: "Candidates are attached to the requisition they applied for and screened against that requisition's own requirements, not a generic checklist.",
    steps: [
      { id: "position-opened", title: "Recruiting position opened", body: "One position per requisition, showing the requisition it came from." },
      { id: "candidates-attached", title: "Candidates attached", body: "Each candidate belongs to one requisition; its counts update as they move." },
      { id: "screening", title: "Screening", body: "Knock-out facts first, then the qualification documents." },
    ],
    recruiter: ["Screens the application against the requisition", "Collects CDL, MVR, medical card, Clearinghouse and employment verification", "Confirms PSP and drug test from the source reports"],
    enforced: ["CDL class, endorsements and years of experience compared with the requisition", "A requirement is met only when its document is verified", "A missing document holds the candidate; a failed one stops them"],
    stops: ["Wrong CDL class or too little experience", "A rejected or expired qualification document"],
    tryIt: { href: `${DEMO}?stage=screen`, label: "Screen Michael Anderson", note: "Michael Anderson, CAND-001, on BOF-HR-DRV-001." },
  },
  {
    id: "interview",
    number: "03",
    title: "Interview & select",
    purpose: "Every finalist gets the same structured interview, so the decision is consistent and the reason is on record.",
    steps: [
      { id: "interview", title: "Structured interview", body: "Questions by category, with responses, notes and an evaluation for each." },
      { id: "selection", title: "Selection or rejection", body: "Proceed, proceed with conditions, hold, or do not proceed. Rejections keep their reason." },
    ],
    recruiter: ["Runs the interview from one question set", "Records conditions, such as a ride-along before solo dispatch", "Rejects with a stated reason"],
    enforced: ["Each category must be evaluated before a recommendation is recorded", "Conditions are required for a conditional proceed", "Rejected candidates stay in history and leave the requisition's counts"],
    stops: ["A recommendation of hold or do not proceed", "A recorded rejection"],
    tryIt: { href: `${DEMO}?stage=interview`, label: "Interview Michael Anderson", note: "Screening and documents already complete." },
  },
  {
    id: "offer-onboarding",
    number: "04",
    title: "Offer & onboard",
    purpose: "The offer follows the requisition's pay and start date, and onboarding is tracked item by item until the driver can start.",
    steps: [
      { id: "offer", title: "Offer", body: "Prepared, sent, then accepted or declined." },
      { id: "onboarding", title: "Onboarding", body: "Orientation, training, equipment and onboarding documents." },
    ],
    recruiter: ["Sends the offer with start and orientation dates", "Schedules orientation and records training and equipment"],
    enforced: ["No offer to a candidate who failed the requisition screen", "Onboarding cannot complete until its checklist is complete"],
    stops: ["A declined offer", "An open onboarding item"],
    tryIt: { href: `${DEMO}?stage=offer`, label: "Make Michael an offer", note: "Interview recorded: proceed." },
  },
  {
    id: "activation",
    number: "05",
    title: "Activate & hand off",
    purpose: "The hire becomes a BOF driver record, and BOF says plainly whether that driver can be dispatched yet, and what is in the way.",
    steps: [
      { id: "qualification", title: "Qualification", body: "Activation opens the driver's intake and qualification review from the verified documents." },
      { id: "driver-activation", title: "Driver activation", body: "The same driver record used by safety, documents, dispatch and settlements." },
      { id: "assignment-readiness", title: "Assignment readiness", body: "Readiness is computed, with the actual blockers listed." },
      { id: "dispatch-ready", title: "Dispatch-ready driver", body: "Once the blockers clear, the driver can be assigned a load." },
    ],
    recruiter: ["Activates the driver once onboarding is complete", "Works the readiness blockers with safety"],
    enforced: ["Activation requires a complete onboarding record", "A driver is never shown as ready while a blocker remains", "The requisition moves to partially filled, then filled, as hires activate"],
    stops: ["An incomplete driver qualification file", "Any open readiness blocker"],
    tryIt: { href: `${DEMO}?stage=activation`, label: "Activate Michael Anderson", note: "Onboarding complete; activation in the demonstration is simulated." },
  },
];

/** The sample requisition a recruiter would look at first (fictional; counts computed with BOF's own rules). */
const SAMPLE_FACTS: PipelineCandidateFacts[] = [
  { dispositionStatus: "ACTIVE", applicationStatus: "COMPLETE", interviewCompleted: true, offerStatus: "ACCEPTED", activationStatus: "ACTIVE" },
  { dispositionStatus: "ACTIVE", applicationStatus: "COMPLETE", interviewCompleted: true, offerStatus: "NOT_PROVIDED", activationStatus: "NOT_STARTED" },
  { dispositionStatus: "ACTIVE", applicationStatus: "COMPLETE", interviewCompleted: false, offerStatus: "NOT_PROVIDED", activationStatus: "NOT_STARTED" },
  { dispositionStatus: "REJECTED", applicationStatus: "PENDING", interviewCompleted: false, offerStatus: "NOT_PROVIDED", activationStatus: "NOT_STARTED" },
];
const SAMPLE = requisitionPipelineCounts(2, SAMPLE_FACTS);
const SAMPLE_STATE = recruitingPipelineState(true, SAMPLE);

const FILL_STATES = ["READY_FOR_RECRUITING", "RECRUITING", "PARTIALLY_FILLED", "FILLED"] as const;

let stepCounter = 0;
const NUMBERED = STAGES.map((stage) => ({
  ...stage,
  steps: stage.steps.map((step) => ({ ...step, n: String(++stepCounter).padStart(2, "0") })),
}));

export default function RecruitingOnboardingPage() {
  return (
    <main className="bof-service-page bof-ro">
      <div className="bof-mkt-container">
        <header className="bof-ro-hero">
          <div>
            <p className="bof-home-eyebrow">Recruiting &amp; Onboarding</p>
            <h1>From staffing need to dispatch-ready driver</h1>
            <p className="bof-ro-hero__lead">BOF manages the full workforce lifecycle from carrier staffing need through driver assignment readiness.</p>
            <p className="bof-ro-hero__body">
              Each opening starts as an approved requisition. Candidates are screened against it, interviewed the same way, onboarded item
              by item, and activated as the driver record dispatch relies on.
            </p>
            <div className="bof-ro-hero__actions">
              <Link className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary" href={DEMO} data-testid="enter-recruiting-demo">
                Open the demonstration
              </Link>
              <Link className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary" href="/assessment">
                Take the Assessment
              </Link>
            </div>
            <p className="bof-ro-hero__fine">Fictional carrier and candidates. No sign-in. Nothing you do there leaves your browser.</p>
          </div>

          <aside className="bof-ro-glance" aria-label="Sample requisition at a glance">
            <p className="bof-ro-glance__label">Requisition at a glance · sample</p>
            <div className="bof-ro-glance__head">
              <span className="bof-ro-glance__number">BOF-HR-DRV-001</span>
              <span className="bof-ro-chip">{SAMPLE_STATE.replaceAll("_", " ")}</span>
            </div>
            <p className="bof-ro-glance__title">CDL-A Regional Reefer Driver</p>
            <p className="bof-ro-glance__meta">Lakeshore Regional Carriers (fictional) · Cleveland, OH · 5 of 5 approvals</p>
            <div className="bof-ro-fill" aria-label={`${SAMPLE.activated} of ${SAMPLE.requested} positions filled`}>
              <div className="bof-ro-fill__bar">
                <span style={{ width: `${(SAMPLE.activated / SAMPLE.requested) * 100}%` }} />
              </div>
              <span>
                {SAMPLE.activated} of {SAMPLE.requested} filled · {SAMPLE.remaining} remaining
              </span>
            </div>
            <ol className="bof-ro-funnel" aria-label="Candidate funnel">
              {(
                [
                  ["Candidates", SAMPLE.candidates],
                  ["Screened", SAMPLE.screened],
                  ["Interviewed", SAMPLE.interviewed],
                  ["Offered", SAMPLE.offered],
                  ["Accepted", SAMPLE.accepted],
                  ["Activated", SAMPLE.activated],
                ] as const
              ).map(([label, value]) => (
                <li key={label}>
                  <span className="bof-ro-funnel__label">{label}</span>
                  <span className="bof-ro-funnel__bar">
                    <span style={{ width: `${SAMPLE.candidates ? (value / SAMPLE.candidates) * 100 : 0}%` }} />
                  </span>
                  <span className="bof-ro-funnel__value">{value}</span>
                </li>
              ))}
            </ol>
            <p className="bof-ro-glance__meta">
              {SAMPLE.inProcess} in process · {SAMPLE.rejected} rejected with a recorded reason
            </p>
            <ol className="bof-ro-states" aria-label="Requisition fill states">
              {FILL_STATES.map((state) => (
                <li key={state} data-current={state === SAMPLE_STATE || undefined}>
                  {state.replaceAll("_", " ").toLowerCase()}
                </li>
              ))}
            </ol>
          </aside>
        </header>

        <RecruitingStageNav stages={NUMBERED.map((s) => ({ id: s.id, number: s.number, title: s.title, steps: `Steps ${s.steps[0].n}–${s.steps[s.steps.length - 1].n}` }))} />

        {NUMBERED.map((stage) => (
          <section key={stage.id} id={stage.id} className="bof-ro-stage" aria-labelledby={`${stage.id}-heading`}>
            <div className="bof-ro-stage__intro">
              <p className="bof-ro-stage__number">Stage {stage.number}</p>
              <h2 id={`${stage.id}-heading`}>{stage.title}</h2>
              <p>{stage.purpose}</p>
              <ol className="bof-ro-steps">
                {stage.steps.map((step) => (
                  <li key={step.id} id={step.id}>
                    <a href={`#${step.id}`} className="bof-ro-steps__n">
                      {step.n}
                    </a>
                    <div>
                      <strong>{step.title}</strong>
                      <span>{step.body}</span>
                    </div>
                  </li>
                ))}
              </ol>
              {stage.id === "requisition" ? (
                <details className="bof-ro-sections">
                  <summary>The 11 requisition sections</summary>
                  <ol>
                    {REQUISITION_FORM_SECTIONS.map((section) => (
                      <li key={section.id}>{section.title}</li>
                    ))}
                  </ol>
                </details>
              ) : null}
            </div>

            <div className="bof-ro-stage__detail">
              <div className="bof-ro-panel">
                <h3>The recruiter</h3>
                <ul>
                  {stage.recruiter.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="bof-ro-panel">
                <h3>BOF enforces</h3>
                <ul>
                  {stage.enforced.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="bof-ro-panel bof-ro-panel--stop">
                <h3>Stops the candidate</h3>
                <ul>
                  {stage.stops.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <Link href={stage.tryIt.href} className="bof-ro-try" data-testid={`try-${stage.id}`}>
                <span className="bof-ro-try__label">Try it: {stage.tryIt.label} →</span>
                <span className="bof-ro-try__note">{stage.tryIt.note}</span>
              </Link>
            </div>
          </section>
        ))}

        <section className="bof-ro-close" aria-labelledby="close-heading">
          <h2 id="close-heading">Walk one driver all the way through</h2>
          <p>
            Two fictional candidates are waiting: Michael Anderson (CAND-001) has cleared every gate and is ready to activate, and Sarah
            Mitchell (CAND-002) is blocked until her qualification documents are collected. Take either one forward, or start Michael at
            any stage above.
          </p>
          <div className="bof-ro-hero__actions">
            <Link className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary" href={DEMO}>
              Open the demonstration
            </Link>
            <Link className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary" href="/how-bof-works">
              How BOF works end to end
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
