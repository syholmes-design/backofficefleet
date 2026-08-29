import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solid Waste | BackOfficeFleet",
  description: "Administrative back office for solid waste fleets handling route continuity, maintenance follow-up, and document control across daily operations.",
};

const responsibilities = [
  ["Route readiness and documentation", "Solid waste fleets run on schedule, volume, and repeatability. Small gaps in qualification, maintenance, or driver status can ripple across route performance. BOF keeps the operating record aligned to the route and the crew before the day begins.", "BOF maintains route assignment status, readiness records, open exceptions, and required documentation."],
  ["Equipment and maintenance coordination", "Public service runs depend on trucks being available, inspected, and not stalled by unresolved repair or maintenance issues. BOF tracks service and repair follow-up so downtime does not become a silent performance issue.", "BOF maintains asset condition, work orders, inspection status, and follow-up record."],
  ["Driver and compliance follow-through", "Drivers need current records and route assignment readiness. BOF keeps these records organized so the agency can see what is current, what is missing, and what requires action before a vehicle is assigned.", "BOF maintains driver documentation, qualification records, and exception history."],
  ["Exception escalation", "A late repair, expired document, or incomplete proof event can turn into a service disruption if no one is assigned to close it. BOF identifies the problem, owner, and due date so it does not sit unresolved in a spreadsheet.", "BOF maintains exception source, owner, impact, review status, and resolution path."],
] as const;

export default function SolidWastePage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Government Sector</p>
          <h1>SOLID WASTE</h1>
          <p>BOF can provide the administrative back office behind a solid waste fleet while the agency keeps dispatch responsibility, route decisions, and service accountability.</p>
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
          <p>Solid waste fleets manage route schedules, drivers, vehicles, maintenance work, inspections, and documentation under pressure to keep collection service on time. The admin burden often sits in spreadsheets, phone calls, route notes, and inboxes that do not clearly show which vehicles and crews are actually ready.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Where information normally gets lost</h2>
          <p>Repair updates, qualification changes, document requirements, and assignment readiness often live in siloed systems. A route may be assigned before the maintenance or credential issue is fully resolved because the information lives in too many places to trust at the moment of service.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual tools usually involved</h2>
          <p>Spreadsheets tracking vehicle status, email chains for repair updates, shared drives for service records, manual reminders for expirations, phone calls about route coverage, and disconnected maintenance or compliance records. BOF gives the agency one administrative layer to organize that process.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF maintains the administrative follow-through behind route readiness, maintenance status, documentation control, and exception management. Agency leadership keeps operational command and public service role; BOF keeps the record, owner, and next step visible and aligned.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains driver qualification records, route assignment context, vehicle and equipment status, maintenance and inspection evidence, open exceptions, required follow-up, and resolution status tied to the operating record.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies exceptions</h2>
          <p>BOF highlights missing documentation, unresolved repair items, readiness gaps, and assignment issues before they become route failures. The exception record includes source, owner, impact, required document, and next action.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How BOF identifies the next action</h2>
          <p>The next action is tied directly to the underlying record—driver, vehicle, repair, or route—and owned by the person or team responsible. BOF shows what must be completed before the vehicle is cleared or the route is considered workable.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>How the work connects to the BOF operating record</h2>
          <p>Driver and vehicle readiness, route assignment, maintenance status, and proof all live in the same operating record. That allows the agency to see whether operational confidence matches actual readiness before service is scheduled or extended.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The agency keeps service control while BOF manages the administrative work that otherwise creates gaps between route planning, maintenance, readiness, and documentation. The result is less operational drift and a cleaner trail of service accountability.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=government" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Agency Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
