import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Driver Management | BackOfficeFleet",
  description: "Administrative back office support for driver onboarding, qualification, readiness, and performance follow-through in a growing private fleet.",
};

const responsibilities = [
  ["Onboarding and qualification", "The fleet owner may be chasing documents, qualification items, and follow-up across email, spreadsheets, and driver conversations while dispatch already has a route waiting. BOF keeps the progression from applicant to qualified driver organized and tied to assignment readiness.", "BOF maintains onboarding checklist, qualification evidence, missing items, assigned follow-up, and readiness status."],
  ["Driver records", "As the fleet grows, the owner often has to remember who holds which document, which renewal is due, and which driver is flagged for a follow-up. BOF keeps the driver record current and visible across training, qualification, and communication history.", "BOF maintains driver profile, document status, renewal dates, restrictions, and readiness history."],
  ["Training and communication", "Training, coaching, and performance communication become harder to track when the fleet is suddenly larger and more distributed. BOF keeps the operational follow-up tied to the correct driver and the right business purpose.", "BOF maintains training requirements, completion evidence, action owner, and communication trails."],
  ["Readiness and exception management", "When a document is missing, a qualification review is open, or a driver needs follow-up before dispatch, the owner should not have to rediscover the issue in multiple places. BOF makes that gap visible and assigned.", "BOF maintains exception type, severity, linked driver record, owner, and resolution status."],
] as const;

export default function DriverManagementPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Private Fleet Function</p>
          <h1>DRIVER MANAGEMENT</h1>
          <p>BOF can absorb the administrative burden behind driver onboarding, qualification, readiness, and follow-up while the fleet owner keeps dispatch and operational control in-house.</p>
        </header>

        <section className="bof-service-page__section">
          <h2>Operational responsibilities BOF can take over</h2>
          <div className="bof-service-page__items">
            {responsibilities.map(([title, work, records]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{work}</p>
                <p><strong>{records}</strong></p>
              </article>
            ))}
          </div>
        </section>

        <section className="bof-service-page__section">
          <h2>Actual fleet-owner pain</h2>
          <p>At 20–30+ trucks, the owner may be personally tracking who is on file, who is missing a renewal, who is due for training, and which driver can actually be assigned. The administrative work grows with every new driver, and the manual process starts to drain time from dispatch and operations.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Current administrative burden</h2>
          <p>Driver management can require collecting applications, verifying qualifications, chasing records, tracking renewals, managing onboarding, and coordinating with dispatch about readiness. Those tasks are often distributed across email, spreadsheets, shared drives, and person-to-person follow-up.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual coordination</h2>
          <p>Spreadsheets for hiring and credential status, email chains for missing items, shared drives for source documents, manual reminders for renewals, phone calls to confirm completions, and disconnected systems that do not tell dispatch whether a driver is assignment-ready.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF takes responsibility for the recruiting, onboarding, driver-record coordination, qualification follow-up, readiness tracking, and exception administration behind the fleet’s driver management process. The fleet owner remains responsible for dispatch and operational decisions.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains driver records, onboarding checklists, qualification evidence, credential status, training completion records, exception history, assigned actions, and readiness position tied to the driver record.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Exceptions BOF identifies</h2>
          <p>BOF flags missing credentials, overdue renewals, incomplete onboarding, unverified training, expired records, or readiness issues that keep a driver from being dispatch-ready. It shows the issue, owner, and required next action.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Next actions</h2>
          <p>BOF identifies the action needed to close the gap—request missing proof, review a qualification condition, reconcile a status, or confirm a driver is cleared for a given assignment. The fleet retains operational ownership; BOF makes the trackable follow-through visible.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Connection to the BOF operating record</h2>
          <p>This work connects directly to dispatch, driver readiness, safety, compliance, documents, and the broader fleet operating record. A driver cannot be truly assignment-ready if the record is missing, incomplete, or unresolved.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Staffing impact</h2>
          <p>BOF can absorb the recurring administrative work of hiring, onboarding, and driver follow-up without requiring the fleet owner to add a dedicated HR or driver administration function at every growth stage. It does not eliminate every employee; it reduces the need for a full internal back-office team as the fleet scales.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The fleet owner keeps dispatch and field control while BOF ensures driver onboarding and readiness do not become a constant administrative bottleneck. The result is cleaner driver continuity, better readiness visibility, and less back-office overhead.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=private-fleet" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Fleet Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
