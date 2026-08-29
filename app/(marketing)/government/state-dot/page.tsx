import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "State DOT | BackOfficeFleet",
  description: "Administrative back office for state DOT fleets managing readiness, compliance, public accountability, and exception follow-through across transportation operations.",
};

const responsibilities = [
  ["Readiness and compliance oversight", "DOT fleets operate under constant scrutiny for credentials, inspections, maintenance, and assignment readiness. BOF creates a disciplined administrative record that can be reviewed without reconstructing information from email or manual follow-up.", "BOF maintains readiness status, credential tracking, compliance records, and assigned action owners."],
  ["Inspection and maintenance follow-through", "DOT operations rely on clean inspection and repair records tied to the actual asset in use. BOF keeps maintenance status connected to assignment readiness and required evidence so the issue is not lost in a shared drive.", "BOF maintains inspection records, repair status, open conditions, and closeout history."],
  ["Documentation and public accountability", "State agencies must maintain a defensible chain of records behind decisions and actions. BOF supports that administrative burden by organizing evidence, exceptions, and review steps in a traceable format.", "BOF maintains evidence packets, owner records, review status, and resolution trail."],
  ["Exception management", "An expired credential, missing document, unresolved maintenance condition, or open compliance item should not wait until after a review or incident. BOF identifies it early and keeps it visible until it is resolved.", "BOF maintains exception type, owner, severity, due date, and corrective action history."],
] as const;

export default function StateDotPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Government Sector</p>
          <h1>STATE DOT</h1>
          <p>BOF can provide the administrative back office behind state DOT fleet operations while the agency retains public authority, operational command, and decision-making.</p>
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
          <p>State DOT fleets need to coordinate drivers, qualifications, inspections, assets, maintenance, and proof while preserving a defensible record behind public accountability. That work frequently spans multiple systems and people with different day-to-day responsibilities.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Where information normally gets lost</h2>
          <p>Credential updates, repair follow-up, document requests, and exception status often sit in spreadsheets, inbox chains, or patchwork shared files. Without a single operational record, the agency can struggle to determine whether the vehicle and driver are actually ready and documented for the next assignment.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual tools usually involved</h2>
          <p>Spreadsheets for readiness and inspections, email chains for field and maintenance updates, shared drives for documentation, manual reminders for expirations, phone calls across departments, and disconnected operational systems. BOF gives the agency a structured administrative back office behind those manual tools.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF manages the record, follow-through, and exception administration behind DOT operations while the agency maintains legal authority, field command, and public accountability. BOF is the administrative operating layer behind readiness and documentation, not the source of public authority.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains readiness status, qualification and compliance evidence, maintenance and inspection records, exception history, owner and due-date tracking, and the status of items waiting for resolution.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies exceptions</h2>
          <p>BOF identifies missing or expired documents, unresolved maintenance issues, incomplete compliance records, corrective actions, and other gaps that can affect operational readiness or public accountability. Each issue is linked to the asset, driver, or program involved.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies the next action</h2>
          <p>Once an exception is raised, BOF shows the next action required, the owner responsible, and the status of the item until it is resolved. That gives DOT leadership a reliable path from issue to closure.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How the work connects to the BOF operating record</h2>
          <p>Driver readiness, compliance, asset status, maintenance evidence, proof, and actions are linked within one operating record. This supports better oversight without replacing the state agency’s authority or operational judgment.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The agency keeps operational control and public responsibility while BOF handles the administrative layer behind readiness, record maintenance, and exception follow-through. The result is stronger transparency and less administrative drift in state transportation operations.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=government" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Agency Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
