import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "County Operations | BackOfficeFleet",
  description: "Administrative back office for county fleet operations coordinating readiness, maintenance, proof, and exception follow-through across multiple departments.",
};

const responsibilities = [
  ["Cross-department readiness", "County operations span road maintenance, public safety support, facilities, and service vehicles. BOF keeps those readiness records aligned so each department sees the same operational status instead of juggling separate reminders and shared lists.", "BOF maintains department-specific readiness status, open exceptions, and next-action owners."],
  ["Equipment and maintenance tracking", "Departments often share equipment and vehicles but operate with different record systems. BOF organizes maintenance follow-up so each asset is connected to the correct service record, inspection, and unresolved issue.", "BOF maintains asset history, inspection status, repair follow-up, and required documentation."],
  ["Compliance documentation", "County fleets must manage credentials, inspections, and document records across multiple operational areas. BOF keeps those items visible and connected to the relevant vehicle, driver, or department so nothing drifts after the fact.", "BOF maintains compliance items, document status, review state, and due date."],
  ["Exception management", "A repair, credential, or readiness gap becomes more expensive when it is buried in communication channels across departments. BOF identifies the issue, assigns the owner, and tracks closeout until resolution.", "BOF maintains exception type, severity, linked record, owner, and resolution history."],
] as const;

export default function CountyOperationsPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Government Sector</p>
          <h1>COUNTY OPERATIONS</h1>
          <p>BOF can provide the administrative back office behind county fleet operations while county leadership retains operational control, public accountability, and field responsibility.</p>
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
          <p>County operations often require coordination across departments, garages, public works, emergency response, facilities, and service vehicles. The work can become administratively fragmented when records and reminders are maintained separately across departments.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Where information normally gets lost</h2>
          <p>Records are often split between departmental email, shared drives, service notes, manual reminders, and phone calls between supervisors and support staff. That leaves the county without a clear single view of what is ready, what is missing, and what remains unresolved.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual tools usually involved</h2>
          <p>Spreadsheets by department, email update chains, paper records, shared drives, manual due-date reminders, and disconnected systems. BOF becomes the administrative thread tying those tools together.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF manages follow-through behind documentation, maintenance tracking, exception handling, and readiness administration across county fleet operations. The county keeps public authority and operational control; BOF keeps the administrative record running behind it.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains readiness records, asset and driver status, inspection and repair documentation, compliance items, exception history, and owner assignments tied to the department or asset involved.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies exceptions</h2>
          <p>BOF flags expired or missing documents, unresolved repairs, qualification gaps, and asset issues that may affect public service or safe operation. Exceptions are assigned severity and connected to the related record.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies the next action</h2>
          <p>BOF routes the issue to the accountable owner and shows what must happen next before the vehicle or assignment is considered ready. The county remains the decision-maker; BOF provides the administrative visibility behind the choice.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How the work connects to the BOF operating record</h2>
          <p>Driver status, vehicle condition, maintenance evidence, proof records, and open issues connect to a single operating record. That gives county leadership a clearer view of readiness and accountability without losing field command.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The county retains operational authority while BOF absorbs the back-office work that would otherwise create administrative drag across departments. The result is cleaner readiness discipline, easier exception follow-through, and better accountability behind fleet operations.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=government" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Agency Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
