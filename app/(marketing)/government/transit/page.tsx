import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Transit | BackOfficeFleet",
  description: "Administrative back office for transit agencies managing readiness, service continuity, and document follow-through across bus and rail support operations.",
};

const responsibilities = [
  ["Driver and operator readiness", "Transit agencies must reconcile driver qualifications, certifications, renewals, and service assignments without missing the operational impact of a single expired record. BOF turns that cycle into a tracked process rather than a status buried in inboxes and sign-off emails.", "BOF maintains qualification status, missing documents, review state, and the impact on assignment readiness."],
  ["Vehicle and garage coordination", "Garage managers, dispatchers, and supervisors often rely on separate systems and handwritten notes to understand which units are ready, which repairs are pending, and which vehicles cannot safely be assigned. BOF keeps the evidence and administrative path aligned with the fleet record.", "BOF maintains unit status, inspection records, open repair items, and required closeout actions."],
  ["Service continuity documentation", "Transit service depends on proof that operators and assets are actually cleared for the route or assignment. BOF keeps records connected to the shift, the vehicle, and the operator so readiness can be reviewed before dispatch.", "BOF maintains service assignment context, readiness status, required documents, and unresolved issues."],
  ["Compliance and exception follow-through", "A missing certification, failed document upload, incomplete repair package, or unresolved service issue should not wait until after a complaint or audit. BOF surfaces the exception and keeps it visible until the agency resolves it.", "BOF maintains exception type, owner, severity, due date, and resolution record."],
] as const;

export default function TransitPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Government Sector</p>
          <h1>TRANSIT</h1>
          <p>BOF can provide the administrative back office behind a transit fleet while the agency keeps operational command, dispatch decisions, and public service responsibility.</p>
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
          <p>Transit agencies must coordinate vehicles, drivers, operator qualifications, maintenance activity, inspections, dispatch assignments, proof records, and service-readiness issues across departments and shifts. The manual administrative burden is often spread across garages, supervisors, safety leads, and shared files.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Where information normally gets lost</h2>
          <p>Qualification data, maintenance records, work-order statuses, and unresolved service issues often live in separate inboxes and spreadsheets. When garage staff, operations staff, and maintenance teams are all tracking status differently, the system cannot tell whether a vehicle or operator is actually ready to run the next route.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual tools usually involved</h2>
          <p>Spreadsheets for schedule and roster status, email chains for repair and qualification updates, shared drives for documents, manual reminders for expirations, phone calls between ops and maintenance, and disconnected systems across departments. BOF becomes the organized administrative layer behind those processes.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF tracks readiness, documentation, exceptions, and follow-through so the agency can stay focused on field operations and public service. BOF does not replace transit leadership, dispatch authority, or public responsibility; it maintains the administrative operating record behind the decision.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains qualification records, document status, vehicle readiness status, maintenance evidence, exception logs, assigned owners, due dates, and closeout notes tied to the specific driver, vehicle, or route assignment.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies exceptions</h2>
          <p>BOF reviews the operating record for expired credentials, missing inspections, unresolved repairs, provider or document gaps, and readiness issues that could interrupt scheduled service. Exceptions are surfaced in the same administrative record used to manage fleet operations.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies the next action</h2>
          <p>Once the issue is identified, BOF links it to the responsible record, owner, and action due date so the next step is visible before the route is affected. The agency keeps the decision and field execution; BOF makes the follow-through visible and traceable.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How the work connects to the BOF operating record</h2>
          <p>Readiness connects to dispatch. Dispatch connects to vehicle status. Vehicle status connects to maintenance history and proof. The record shows what is delayed, what is missing, and who owns the next step. That creates a defensible operational narrative behind transit service decisions.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The transit agency keeps public service control while BOF absorbs the administrative volume that would otherwise pull leaders, supervisors, and staff into repetitive follow-up. The result is stronger readiness discipline and a clearer trail of service accountability.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=government" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Agency Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
