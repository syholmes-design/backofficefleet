import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Emergency Services | BackOfficeFleet",
  description: "Administrative back office for emergency service fleets where readiness, documentation, and follow-through must be disciplined without compromising emergency command.",
};

const responsibilities = [
  ["Readiness before deployment", "Emergency-response vehicles and operators cannot be left to manual memory when qualifications, inspections, and readiness data are changing in real time. BOF keeps the record current, visible, and tied to actual operational status before a response is launched.", "BOF maintains responder readiness, document status, and action due dates for each assigned vehicle or crew."],
  ["Equipment and maintenance readiness", "Emergency equipment requires inspection, repair, and documentation discipline to remain deployable. BOF keeps the work order, status, and follow-up connected to the asset so an agency can see whether a unit is truly ready to respond.", "BOF maintains inspection records, repair status, assigned action, and closeout evidence."],
  ["Credential and document control", "Emergency service fleets work with critical qualifications and time-sensitive records. BOF ensures a credential, certification, inspection, or document gap is visible early enough to fix before the unit is needed in the field.", "BOF maintains expired or missing items, review trails, and due dates."],
  ["Exception management", "A readiness issue cannot be buried in email or a separate notes file when the emergency mission depends on a clear answer. BOF flags exceptions, owners, and next action so they are visible to the proper command structure.", "BOF maintains exception severity, impact, owner, evidence, and resolution status."],
] as const;

export default function EmergencyServicesPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Government Sector</p>
          <h1>EMERGENCY SERVICES</h1>
          <p>BOF can provide the administrative back office behind emergency service fleets while the agency retains emergency command, field authority, and public responsibility.</p>
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
          <p>Emergency services must coordinate crews, equipment, driver readiness, inspections, certifications, proof, and asset availability under a public responsibility that does not tolerate administrative drift. The work often stretches across varied systems, departments, and schedules.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Where information normally gets lost</h2>
          <p>Critical readiness issues are often tracked in inboxes, calls, paper records, or shared files. That can leave field command uncertain about whether a unit or crew is actually ready to deploy or whether a record issue is simply waiting for a follow-up.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual tools usually involved</h2>
          <p>Spreadsheets for response coverage, email chains for update and approval traffic, shared drives for documentation, paper records for field events, manual reminders for certifications, and disconnected systems for maintenance and compliance. BOF provides the administrative layer behind that system.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF manages the readiness, documentation, exception, and next-action workflow behind emergency service operations without replacing emergency command or field authority. BOF keeps the record accurate and actionable for agency leadership.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains readiness status, driver and crew qualification records, equipment inspection and repair evidence, open exceptions, required follow-up, and the record of who owns each next action.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies exceptions</h2>
          <p>BOF flags expired or missing credentials, incomplete inspections, unresolved repair items, and record gaps that could compromise deployability. The exception is visible with clear severity, owner, and impact on mission readiness.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies the next action</h2>
          <p>It connects the issue to the responsible person or team and the required action needed to clear the unit or responder. BOF makes the follow-up explicit so the agency does not rely on memory when mission readiness is on the line.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How the work connects to the BOF operating record</h2>
          <p>Driver readiness, asset condition, proof, maintenance status, and operational exceptions are tied to the same record. That makes response readiness visible and defensible before a call arises.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The agency maintains command and field authority while BOF absorbs the administrative work behind readiness, documentation, and exception follow-through. The result is stronger preparedness and cleaner accountability behind emergency operations.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=government" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Agency Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
