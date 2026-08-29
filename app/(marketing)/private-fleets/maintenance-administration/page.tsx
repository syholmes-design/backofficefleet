import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Maintenance Administration | BackOfficeFleet",
  description: "Administrative back office support for private fleet maintenance scheduling, inspection follow-through, and equipment readiness coordination.",
};

const responsibilities = [
  ["Preventive maintenance administration", "Maintenance schedules and inspections are easy to lose when a fleet is growing and people are juggling dispatch and repairs across multiple vendors and vehicles. BOF keeps the preventive work schedule, status, and follow-through connected to each asset.", "BOF maintains PM schedule, inspection status, due dates, and assigned action logs."],
  ["Repair documentation", "Every repair creates a record that must stay connected to the asset and the work order. BOF keeps that record intact so the owner can review what was done, what remains open, and whether the unit is ready for service.", "BOF maintains work orders, repair notes, vendor records, and completion status."],
  ["Vendor coordination", "A growing private fleet may depend on multiple repair shops, tire suppliers, vendors, and maintenance contacts. BOF keeps vendor activity, service records, and follow-up in one place rather than across fragmented personal files.", "BOF maintains vendor details, service records, and next action status."],
  ["Equipment readiness", "The real operational question is not only whether a repair was completed—it is whether the unit is ready and documented to move again. BOF makes that status visible before dispatch assigns the asset.", "BOF maintains equipment readiness, approvals, pending items, and service exceptions."],
] as const;

export default function MaintenanceAdministrationPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Private Fleet Function</p>
          <h1>MAINTENANCE ADMINISTRATION</h1>
          <p>BOF can absorb the administrative process behind maintenance scheduling, inspections, repair documentation, and equipment readiness while the fleet owner retains dispatch authority and operational control.</p>
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
          <p>As the fleet grows, the owner is forced to manage more maintenance dates, vendor follow-up, inspection items, and work-order records without adding a maintenance administrative function. The administrative handoff starts to compete with actual dispatch and customer work.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Current administrative burden</h2>
          <p>Maintenance administration often involves preventive schedules, work orders, vendor communication, repair documentation, inspection records, and readiness confirmations—usually handled by a mix of email, spreadsheets, shared drives, and calls between drivers, mechanics, and owners.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual coordination</h2>
          <p>Spreadsheets for maintenance status, email chains for repair updates, shared drives for inspection documents, manual reminders for PM schedules, phone calls to vendors, and disconnected records across service and dispatch. BOF centralizes the process behind the operation.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF takes responsibility for maintenance administration: PM scheduling, inspection follow-up, repair documentation, work-order coordination, vendor recordkeeping, and readiness status. It does not perform repairs, but it does keep the administrative record under control.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains preventive maintenance schedules, inspection records, work-order status, repair evidence, vendor records, required follow-up items, and asset readiness conditions tied to the operating record.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Exceptions BOF identifies</h2>
          <p>BOF flags overdue PM work, repair items waiting on vendor or approval, incomplete inspection records, unresolved service conditions, or equipment not yet ready for assignment. The issue is tied to the asset, repair status, and required next action.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Next actions</h2>
          <p>BOF identifies the right next step—schedule the PM, request missing repair detail, confirm vendor completion, or flag an asset as not ready for dispatch—so the owner knows what requires attention before the unit is assigned again.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Connection to the BOF operating record</h2>
          <p>Maintenance administration connects to dispatch, equipment readiness, proof, safety, finance, and the broader operating record. A unit cannot be misread as ready if the maintenance evidence and service status are incomplete.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Staffing impact</h2>
          <p>BOF can absorb the recurring administrative burden behind maintenance follow-through without requiring the fleet owner to add a dedicated maintenance admin function immediately as the fleet expands. It reduces administrative overhead while the operating team keeps control of its own decisions.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The fleet owner keeps dispatch authority while BOF handles the maintenance administration that would otherwise consume internal time and create readiness drift. The result is more reliable equipment status and cleaner continuity between maintenance, dispatch, and operating records.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=private-fleet" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Fleet Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
