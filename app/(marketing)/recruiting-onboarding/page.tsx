/**
 * BOF Route Owner:
 * URL: /recruiting-onboarding
 * Type: PUBLIC
 * Purpose: public introduction to the connected Recruiting & Onboarding architecture
 *          (requisition → recruiting position → candidates → activation → assignment readiness).
 * Related: /demo/recruiting/workspace, /demo/recruiting (public demonstration), /assessment
 */
import type { Metadata } from "next";
import Link from "next/link";

import { REQUISITION_FORM_SECTIONS } from "@/lib/recruiting/requisition-fields";

export const metadata: Metadata = {
  title: "Recruiting & Onboarding | BackOfficeFleet",
  description:
    "BOF manages the full workforce lifecycle from carrier staffing need through driver assignment readiness: requisition, five approvals, recruiting, screening, structured interview, offer, onboarding, qualification and driver activation.",
};

const LIFECYCLE: Array<{ phase: string; steps: Array<[string, string]> }> = [
  {
    phase: "Authorize the opening",
    steps: [
      ["Carrier staffing need", "The fleet identifies a driver opening: lane, equipment, home time, start date and headcount."],
      ["Requisition created", "The need is written into an 11-section BOF requisition (BOF-HR-DRV-NNN) that defines the job and its requirements once."],
      ["Five approvals", "Requesting manager, fleet safety director, fleet owner / GM, BOF account manager and BOF HR review each sign off. Missing approvals block approval."],
      ["Ready for recruiting", "Approval sets the requisition's pipeline to READY_FOR_RECRUITING."],
    ],
  },
  {
    phase: "Recruit against the requisition",
    steps: [
      ["Recruiting position opened", "Approval opens exactly one recruiting position linked to the originating requisition. The workspace always shows which requisition a position came from."],
      ["Candidates attached", "Every candidate belongs to a requisition. Counts — requested, in process, screened, interviewed, offered, accepted, activated, remaining — are computed from the candidates' recorded facts."],
      ["Screening", "Candidates are screened against the requisition's own CDL class, endorsements, experience and safety requirements, and against the Recruiting V2 document gates (CDL, MVR, medical, Clearinghouse, employment verification)."],
      ["Interview", "A structured interview records responses and notes by category and ends in a recommendation: proceed, proceed with conditions, hold, or do not proceed."],
      ["Selection or rejection", "A rejected candidate keeps a recorded reason and full history; the requisition's counts update."],
      ["Offer", "Offers move draft → sent → accepted or declined, and cannot be issued to a candidate who failed the requisition screen."],
    ],
  },
  {
    phase: "Make the driver dispatch-ready",
    steps: [
      ["Onboarding", "Orientation, training, equipment and onboarding documents are tracked to completion."],
      ["Qualification", "Activation creates the driver's intake and qualification review from the verified recruiting documents."],
      ["Driver activation", "The candidate becomes a BOF Driver record — the same driver that safety, documents, dispatch and settlements use."],
      ["Assignment readiness", "BOF computes the driver's readiness and shows the actual blockers that remain, instead of assuming the driver is ready."],
      ["Dispatch-ready driver", "When the blockers clear, the driver is eligible for load assignment in dispatch. The requisition moves to PARTIALLY_FILLED and then FILLED as accepted drivers activate."],
    ],
  },
];

const PIPELINE_STATES: Array<[string, string]> = [
  ["READY_FOR_RECRUITING", "Approved; the recruiting position is open and no candidate is in process yet."],
  ["RECRUITING", "Candidates are attached and moving through screening, interview and offer."],
  ["PARTIALLY_FILLED", "Some, but not all, of the requested positions have an activated driver."],
  ["FILLED", "Every requested position has an activated driver."],
  ["CLOSED", "The requisition is filled or cancelled and no longer accepts candidates."],
];

export default function RecruitingOnboardingPage() {
  let stepNumber = 0;
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero text-left">
          <p className="bof-home-eyebrow">Recruiting &amp; Onboarding</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
            From carrier staffing need to dispatch-ready driver
          </h1>
          <p className="mt-4 max-w-3xl text-xl font-medium text-slate-700 dark:text-slate-200">
            BOF manages the full workforce lifecycle from carrier staffing need through driver assignment readiness.
          </p>
          <p className="mt-3 max-w-3xl text-base text-slate-600 dark:text-slate-300">
            One approved requisition defines the job. Recruiting works against that requisition, candidates are screened against its
            requirements, and the hired candidate becomes the same driver record that qualification, readiness and dispatch rely on.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary" href="/demo/recruiting/workspace" data-testid="enter-recruiting-demo">
              Enter the interactive demonstration
            </Link>
            <Link className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary" href="/demo/recruiting">
              Start from a requisition
            </Link>
            <Link className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary" href="/assessment">
              Take the Assessment
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            The demonstration uses a fictional carrier and fictional candidates, needs no sign-in, and runs entirely in your browser.
          </p>
        </header>

        <section className="bof-service-page__section" aria-labelledby="lifecycle-heading">
          <h2 id="lifecycle-heading" className="text-2xl font-bold md:text-3xl">
            The workforce lifecycle
          </h2>
          {LIFECYCLE.map((group) => (
            <div key={group.phase} className="mt-6">
              <h3 className="text-lg font-semibold">{group.phase}</h3>
              <ol className="mt-2 list-none space-y-3 pl-0">
                {group.steps.map(([title, body]) => {
                  stepNumber += 1;
                  return (
                    <li key={title} className="border-l-2 border-teal-500 pl-4">
                      <strong className="block">
                        {String(stepNumber).padStart(2, "0")} · {title}
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300">{body}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </section>

        <section className="bof-service-page__section" aria-labelledby="requisition-heading">
          <h2 id="requisition-heading" className="text-2xl font-bold md:text-3xl">
            The requisition is the front door
          </h2>
          <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
            Recruiting does not begin from a free-standing job post. It begins from a requisition with eleven sections, so that the
            requirements candidates are screened against are the ones the carrier and BOF approved.
          </p>
          <ol className="mt-4 grid list-none gap-x-8 gap-y-1 pl-0 sm:grid-cols-2">
            {REQUISITION_FORM_SECTIONS.map((section) => (
              <li key={section.id}>
                {section.id}. {section.title}
              </li>
            ))}
          </ol>
        </section>

        <section className="bof-service-page__section" aria-labelledby="states-heading">
          <h2 id="states-heading" className="text-2xl font-bold md:text-3xl">
            Requisition recruiting states
          </h2>
          <dl className="mt-4 space-y-2">
            {PIPELINE_STATES.map(([state, body]) => (
              <div key={state}>
                <dt className="font-mono text-sm font-semibold">{state}</dt>
                <dd className="text-slate-600 dark:text-slate-300">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bof-service-page__section" aria-labelledby="demo-heading">
          <h2 id="demo-heading" className="text-2xl font-bold md:text-3xl">
            Walk through it
          </h2>
          <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
            The demonstration opens on an approved requisition, BOF-HR-DRV-001, for a fictional carrier. Attach the fictional candidate
            Michael Anderson, screen him against the requisition, record his documents and structured interview, extend and accept an
            offer, complete onboarding, and activate him to see the readiness blockers BOF reports. You can also create and approve a
            new requisition of your own.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary" href="/demo/recruiting/workspace">
              Open the Recruiting &amp; Onboarding workspace
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
