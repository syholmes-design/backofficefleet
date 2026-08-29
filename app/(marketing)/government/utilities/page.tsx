import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Utilities | BackOfficeFleet",
  description: "Administrative back office for utility fleets coordinating field service, inspections, readiness, and document follow-through under public service pressure.",
};

const responsibilities = [
  ["Field service readiness", "Utility fleets often operate across service territories with crews, contractors, and assets that have to be ready before the next work order lands. BOF keeps readiness tied to the job, the vehicle, and the driver instead of leaving it to manual notes and ad hoc reminders.", "BOF maintains readiness status, driver and asset status, missing items, and service assignment impact."],
  ["Inspection and asset follow-up", "Line work, utility service fleets, and contractor operations require clean inspection records and repair statuses to keep crews moving. BOF organizes this work as an operational record rather than a set of disconnected maintenance files.", "BOF maintains inspection records, repair references, open conditions, and closeout status."],
  ["Contractor and subcontractor support", "Utility operations may use internal crews and contractor support with different documentation habits. BOF provides a common administrative layer for record follow-through, exception visibility, and readiness transparency.", "BOF maintains contractor status, document chain, assigned action, and review state."],
  ["Exception management", "A missing credential, expired inspection, unresolved repair, or incomplete proof item can look minor until it affects service continuity. BOF makes the issue visible before it impacts public service or accountability.", "BOF maintains exception source, severity, owner, due date, and resolution history."],
] as const;

export default function UtilitiesPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Government Sector</p>
          <h1>UTILITIES</h1>
          <p>BOF can be the administrative back office behind a utility fleet while the agency retains field command, service priorities, and public accountability.</p>
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
          <h2>What the agency currently has to coordinate</h2>
          <p>Utility fleets have to coordinate crews, service vehicles, inspections, asset condition, contractor support, and readiness records while serving a public utility mission that cannot afford operational drift. That responsibility often spreads across maintenance, safety, dispatch, and supervisory teams.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Where information normally gets lost</h2>
          <p>A missing document, expired qualification, or repair item is often buried in email, shared drives, or a person’s memory until a service event or audit requires it. Without a connected operating record, utility leaders cannot easily see whether work is safe, documented, and assignment-ready.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual tools usually involved</h2>
          <p>Spreadsheets for work status, email chains for approvals and updates, shared drives for inspection packets, manual reminders for renewals, phone calls to confirm vehicle readiness, and disconnected systems that do not share the same service narrative. BOF creates a single administrative layer behind that complexity.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF manages the documentation, readiness tracking, exception visibility, and next-action follow-through behind utility fleet operations. The agency retains operational command and public service responsibility; BOF keeps the administrative work organized and defensible.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains driver, crew, and asset readiness status, inspection and repair documentation, service records, compliance follow-up, exception history, and assigned actions tied to the specific utility service work.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies exceptions</h2>
          <p>BOF highlights missing credentials, unresolved repair items, incomplete proof, aging documentation, and service readiness issues before they interrupt utility operations. Exceptions are assigned priority and linked to the work, asset, or driver involved.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies the next action</h2>
          <p>Once BOF identifies the exception, it connects the issue to the record owner, required document, required sign-off, or repair next step so the agency knows precisely what needs to happen before the unit or crew is cleared again.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How the work connects to the BOF operating record</h2>
          <p>Utility service depends on a chain of readiness, proof, maintenance, and documentation. BOF links those pieces to the operating record so the agency can see whether the crew, asset, and documentation are aligned before work is dispatched.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The agency keeps field authority and service responsibility while BOF handles the administrative follow-through that otherwise slows down repair cycles, inspection review, and service continuity. The result is stronger readiness control and clearer evidence behind public utility operations.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=government" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Agency Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
