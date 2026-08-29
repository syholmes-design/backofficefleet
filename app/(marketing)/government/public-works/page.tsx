import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Public Works | BackOfficeFleet",
  description: "Administrative back office for public works fleets operating streets, infrastructure, and maintenance service under public accountability.",
};

const responsibilities = [
  ["Vehicle and crew readiness", "Public works operations move fast but surface area is broad: work orders, fleet assignments, service requests, and equipment deployment all depend on a driver and asset being genuinely ready to move. BOF keeps the readiness record connected to dispatch and maintenance follow-up so no one is cleared on memory.", "BOF maintains driver and equipment readiness status, missing credential or inspection items, and the next action required before work is assigned."],
  ["Inspection and repair record follow-through", "The agency may have inspections, repair records, work orders, and service logs spread across mechanics, supervisors, and shared folders. BOF organizes the administrative path from inspection to repair documentation and closeout without replacing public works supervision.", "BOF maintains service dates, work-order references, repair follow-up, required documents, and unresolved conditions."],
  ["Work-order support", "Street, sign, and asset maintenance work often depends on proof, scheduling, and follow-up that are tracked in separate places. BOF keeps the work order connected to the right vehicle, driver, asset, and document trail.", "BOF maintains work-order status, supporting evidence, assigned owner, and reminder history."],
  ["Exception identification", "A failed upload, missing inspection, expired qualification, or unresolved repair can appear as a minor record issue until the workday begins. BOF makes the exception visible before it becomes a public service or liability issue.", "BOF maintains exception type, severity, impact, owner, due date, and resolution trail."],
] as const;

export default function PublicWorksPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Government Sector</p>
          <h1>PUBLIC WORKS</h1>
          <p>BOF can provide the administrative back office behind a public works fleet while the agency maintains operational command, field supervision, and public responsibility.</p>
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
          <p>Public works fleets often coordinate trucks, crews, supervisors, maintenance work, inspections, driver qualifications, and service records across multiple tools. In many agencies, the field and the record both move at once, while the documentation is still assembled afterward. BOF can absorb the administrative coordination behind that rhythm.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Where information normally gets lost</h2>
          <p>Inspection records, repair notes, driver qualification items, and work order follow-up often sit in email chains, shared drives, supervisor notes, and maintenance files with no clear next action. A street crew may know the issue exists, but the record may not say who owns the follow-up or whether the unit is cleared to return to service.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual tools usually involved</h2>
          <p>Spreadsheets for vehicle status, email chains for repair updates, shared drives for work orders, manual reminders for expiration dates, phone calls between mechanics and supervisors, and disconnected systems that do not talk to one another. BOF organizes the operating truth behind those manual tools.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF maintains the administrative record behind readiness, maintenance follow-up, proof, documentation, and exception handling. The agency remains responsible for field command, service priorities, and public decision-making. BOF makes the work visible, tracked, and connected to the operational record.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains vehicle and driver readiness status, inspection history, repair and service evidence, exception records, assigned action owners, required documents, and the status of incomplete or overdue work. These records stay tied to the asset, driver, and operating activity.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies exceptions</h2>
          <p>BOF flags expired qualifications, missing documentation, unresolved repair conditions, incomplete inspection records, and work items that are waiting on review or closeout. Exceptions are surfaced with severity, owner, source record, and next action.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies the next action</h2>
          <p>Each exception is connected to the underlying driver, asset, or work order. BOF shows what is missing, who is responsible, and what must happen before the unit or crew is fully cleared to work again.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How the work connects to the BOF operating record</h2>
          <p>The record is not a folder. It is the operational trail: driver readiness, asset condition, maintenance evidence, service records, work orders, open exception, and responsible next step. That record supports the agency’s operational decisions without replacing public leadership or field authority.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The agency keeps field control while BOF absorbs the administrative work that otherwise creates drift between the garage, dispatch, and public service schedule. The result is clearer readiness, fewer missed follow-ups, and better evidence behind every public works decision.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=government" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Agency Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
