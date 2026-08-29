import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settlements & Payroll | BackOfficeFleet",
  description: "Administrative support for private fleet settlements, payroll inputs, deductions, and payment follow-through as the fleet grows.",
};

const responsibilities = [
  ["Driver settlements and payroll inputs", "The fleet owner may be collecting proof, payroll data, deductions, and settlement inputs from a growing number of drivers and support systems. BOF organizes the operational detail that feeds payroll and settlements to reduce manual reconciliation pain.", "BOF maintains payroll inputs, deduction context, driver settlement data, and unresolved items."],
  ["Lumper and POD support", "Load proof and lumper activity often create late or incomplete information that drives payment issues. BOF keeps the supporting record attached to the settlement workflow instead of relying on emails and spreadsheets.", "BOF maintains POD status, lumper records, required supporting proof, and action status."],
  ["Exception management", "A settlement can stall when someone is missing a deduction detail, proof item, or approval note. BOF tracks those issues and identifies the owner responsible for the next action before payment is delayed.", "BOF maintains exception type, owner, due date, and resolution record."],
  ["Payment administration", "As the fleet grows, owners and office staff can spend too much time reconciling settlement inputs and payroll information. BOF hews the process to a structured record so the payment trail is clear and reviewable.", "BOF maintains payment status, review notes, and reconciliation history."],
] as const;

export default function SettlementsPayrollPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Private Fleet Function</p>
          <h1>SETTLEMENTS &amp; PAYROLL</h1>
          <p>BOF can handle the administrative support behind driver settlements, payroll inputs, deductions, reimbursements, and payment follow-through while the fleet keeps dispatch and operational decisions in-house.</p>
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
          <p>A growing fleet can reach the point where settlement accuracy and payroll inputs require the same level of coordination as operations themselves. The owner or office often becomes the final reconciler between proof, deductions, pay runs, and driver communication.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Current administrative burden</h2>
          <p>Settlement administration usually pulls in driver proof, load records, lumper documentation, payroll inputs, deductions, expense support, and exception review. That information often sits in spreadsheets, email, and shared folders, making payment follow-through harder than it needs to be.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual coordination</h2>
          <p>Spreadsheets by driver, email chains for missing proof, shared drives for POD and lumper documents, manual reminders for approvals, and disconnected systems across dispatch, payroll, and finance. BOF creates the back-office layer behind that process.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF takes responsibility for settlement and payroll administration: documentation, exception identification, deduction context, proof coordination, payment follow-through, and driver communication support. The fleet owner keeps dispatch, customers, and operational decisions in-house.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains settlement inputs, proof status, deductions, payroll context, lumper and POD documentation, exceptions, owner assignments, and payment status tied to the operating record.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Exceptions BOF identifies</h2>
          <p>BOF highlights missing proof, unresolved deductions, pending approvals, reimbursement issues, and payment holds that require action before payment is released or payroll closes. The exception is connected to the right driver, load, or payment cycle.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Next actions</h2>
          <p>BOF shows what must happen next: request POD, verify lumper support, review a deduction, confirm payment status, or mark the settlement ready for payroll. The fleet retains operational control; BOF keeps the administrative trail visible.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Connection to the BOF operating record</h2>
          <p>Settlements and payroll connect directly to dispatch, drivers, proof, finance, documents, and the broader operating record. A settlement issue is rarely a standalone problem—it is often a consequence of missing proof, missing documents, or a follow-up that never got assigned.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Staffing impact</h2>
          <p>BOF absorbs the administrative coordination and follow-through behind settlements and payroll without requiring the fleet to build an internal payroll or settlement administration department as quickly as the operation grows. It does not eliminate every role; it reduces manual back-office burden.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The fleet keeps operational control while BOF reduces the administrative burden of settlements and payroll. The result is fewer missed proof items, less payment friction, and cleaner financial continuity across the operating record.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=private-fleet" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Fleet Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
