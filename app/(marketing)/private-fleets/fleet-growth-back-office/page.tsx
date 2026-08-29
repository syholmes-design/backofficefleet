import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fleet Growth & Back Office | BackOfficeFleet",
  description: "How a growing private fleet keeps dispatch in-house while BOF absorbs the expanding administrative workload behind operations.",
};

const responsibilities = [
  ["Growing administrative load", "The fleet is growing faster than the administrative structure behind it. Every new driver, new lane, new vendor, and new document layer adds work that was previously manageable by a small internal team. BOF gives the fleet back-office capacity without forcing the owner to add an equivalent department.", "BOF maintains workload visibility, action queues, and owned follow-through across the fleet operating record."],
  ["Staffing pressure", "A 20–30+ truck fleet can reach a point where it would otherwise need HR support, payroll coordination, safety/compliance administration, document management, settlement administration, finance support, maintenance admin, procurement, and administrative follow-up across more functions than the owner can handle personally.", "BOF maintains the operational record behind each function and keeps the next action visible."],
  ["Operational control remains in-house", "The fleet owner stays accountable for dispatch, customer relationships, drivers, and day-to-day operational decisions. BOF supports the operational infrastructure behind those decisions without taking away the operational command of the business.", "BOF maintains dispatch-linked operational records, exceptions, and readiness follow-through."],
  ["Administrative continuity", "When the fleet grows, the risk is not just more volume—it is more fragmentation. BOF provides a central administrative layer so records, next actions, and responsibility stay in sync as the fleet expands.", "BOF maintains evidence, status, action ownership, and resolution history across the business."],
] as const;

export default function FleetGrowthBackOfficePage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Private Fleet Function</p>
          <h1>FLEET GROWTH &amp; BACK OFFICE</h1>
          <p>BOF can absorb the expanding administrative workload that grows with a private fleet while the owner keeps dispatch, customers, drivers, and operational decisions in-house.</p>
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
          <p>The fleet starts to grow faster than its administrative structure. New lanes add paperwork, more drivers bring more records, and more vendors and schedules create visible operational drag. Without a stronger back office, the owner starts doing administrative work that should be handled behind the operation.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Current administrative burden</h2>
          <p>As the fleet grows, it may need to coordinate recruiting, onboarding, driver records, safety and compliance, document flow, settlement administration, finance follow-up, maintenance support, procurement, and administrative exceptions. That burden often becomes a patchwork of spreadsheets, inboxes, and manual reminders.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual coordination</h2>
          <p>Spreadsheets by function, email chains across departments, shared drives for documents, reminders for due dates, phone calls between teams, and disconnected systems across safety, maintenance, finance, and dispatch. BOF creates a single administrative operating layer behind that fragmentation.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF supports the administrative infrastructure behind a growing fleet: driver records, safety and compliance administration, document management, maintenance support, settlement follow-up, finance coordination, procurement coordination, and recurring next-action management. The fleet owner remains responsible for dispatch, customers, drivers, and operational decisions.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains the operating record across drivers, safety, compliance, documents, maintenance, settlements, finance, and administrative exceptions. It keeps the status, owner, due date, and resolution path visible for each piece of work.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Exceptions BOF identifies</h2>
          <p>BOF identifies missing documentation, employee or driver follow-up gaps, unresolved safety items, incomplete settlement information, finance questions, maintenance readiness issues, vendor issues, or admin drift that needs an action before it delays dispatch or operations. The issue is shown with impact, owner, and next step.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Next actions</h2>
          <p>BOF assigns the next action to the right record and team so the fleet can grow without losing operational clarity. It does not replace the fleet owner’s judgment; it organizes the administrative work so those judgments can be made with better information.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Connection to the BOF operating record</h2>
          <p>Dispatch connects to drivers, documents, proof, maintenance, settlements, finance, and risk. BOF keeps these relationships visible so the fleet can scale without creating a separate administrative department for every operational lane.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Staffing impact</h2>
          <p>BOF provides back-office capacity without requiring the fleet to hire a full internal staff for HR, payroll, safety/compliance, document administration, settlement administration, finance administration, maintenance administration, procurement, and follow-up. It does not eliminate every internal employee, but it allows the fleet to grow without building an equivalent administrative function at full scale.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The fleet owner keeps local operational control while BOF absorbs the administrative complexity that otherwise grows into a new internal department. The result is sustainable growth, fewer manual back-office bottlenecks, and clearer visibility into the work behind the fleet.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=private-fleet" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Fleet Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
