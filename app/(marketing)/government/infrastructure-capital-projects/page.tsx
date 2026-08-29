import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Infrastructure & Capital Projects | BackOfficeFleet",
  description: "Administrative back office for infrastructure and capital project fleets managing readiness, documentation, and field support behind large public projects.",
};

const responsibilities = [
  ["Project fleet readiness", "Capital projects and infrastructure programs often depend on specialized vehicles, crews, and assigned equipment that must be ready when the work site requires it. BOF makes readiness visible and connected to the project rather than buried in manual tracking files.", "BOF maintains vehicle readiness status, crew status, missing items, and assignment impact."],
  ["Equipment and inspection follow-through", "A project fleet may involve dispatch coordination, inspection records, repair status, and equipment availability across a site or multiple workfronts. BOF keeps those records organized so they are defensible and actionable.", "BOF maintains inspection records, repair status, due items, and closeout notes."],
  ["Documentation behind project work", "Capital and infrastructure programs are sensitive to proof, maintenance records, compliance evidence, and documentation gaps. BOF keeps the record tied to the asset and project, instead of leaving it in fragmented email or shared folders.", "BOF maintains project-linked evidence, status, review state, and responsibility history."],
  ["Exception management", "An unresolved repair, missing document, expired credential, or incomplete proof item can threaten a project schedule or readiness posture. BOF surfaces the issue, owner, and required action before the gap becomes a service or accountability problem.", "BOF maintains exception severity, linked record, owner, due date, and resolution history."],
] as const;

export default function InfrastructureCapitalProjectsPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Government Sector</p>
          <h1>INFRASTRUCTURE &amp; CAPITAL PROJECTS</h1>
          <p>BOF can provide the administrative back office behind a project fleet while the agency retains operational command, field supervision, and public accountability.</p>
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
          <p>Infrastructure and capital project fleets must coordinate vehicles, crews, inspections, maintenance, document readiness, and service records at a moment when project timing and coordination are critical. Those responsibilities often become fragmented between site supervisors, maintenance teams, and administrative support.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Where information normally gets lost</h2>
          <p>Qualification records, repair follow-up, project documentation, and open exceptions often live in separate systems and shared folders. As a result, the project team may not know whether the correct equipment and drivers are actually ready for the next site assignment.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual tools usually involved</h2>
          <p>Spreadsheets for asset assignment and readiness, email chains for field updates, shared drives for project documentation, manual reminders for expiration dates, phone calls about equipment availability, and disconnected systems that do not track operational status together. BOF creates the administrative layer behind those tools.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF manages the underlying administrative work: documentation, readiness tracking, exception management, and next-action follow-through. The agency remains responsible for project command, field execution, public accountability, and decision-making.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains asset and crew readiness records, project-linked documentation, inspection and repair follow-up, exception history, and assigned action status for every relevant record.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies exceptions</h2>
          <p>BOF highlights missing credentials, incomplete proof, unresolved maintenance items, and documentation gaps that can affect the next assignment or project work. Exceptions are tied to severity, source record, and owner.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies the next action</h2>
          <p>Each oversight item is connected to the driver, asset, or project record and shows the specific next action required. BOF makes the follow-through visible before the project schedule or readiness posture is compromised.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How the work connects to the BOF operating record</h2>
          <p>Readiness, proof, maintenance, records, and exceptions all connect back to the same operating record. That gives the agency a trustworthy picture of what is ready, what is missing, and what must happen before the next project activity can proceed.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The agency retains command of the project and public accountability while BOF absorbs the administrative burden behind readiness, documentation, and exception follow-through. The result is stronger operational confidence, fewer missed follow-ups, and cleaner continuity behind infrastructure work.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=government" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Agency Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
