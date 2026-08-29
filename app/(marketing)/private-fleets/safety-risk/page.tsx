import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Safety & Risk | BackOfficeFleet",
  description: "Administrative back office support for private fleet safety events, driver risk, and corrective action follow-through.",
};

const responsibilities = [
  ["Safety events and documentation", "A single safety event can create an information trail across the driver, equipment, dispatch, and documentation record. BOF keeps the event and the supporting evidence together so the next step is visible instead of buried in a shared drive.", "BOF maintains safety incident detail, evidence status, action owners, and review timeline."],
  ["Corrective actions", "When coaching, corrective action, or remediation is required, the fleet still has to track the resolution and follow-up. BOF organizes the review, required action, and completion record so it does not disappear into an inbox.", "BOF maintains action plans, due dates, evidence, and follow-up status."],
  ["Compliance and training conditions", "Safety conditions and compliance requirements can be tied to training, documents, or driver readiness. BOF connects those elements to the right record so the fleet does not rebuild the history later.", "BOF maintains training conditions, compliance exceptions, and action history."],
  ["Exception visibility", "Safety and risk issues only help if the owner can act on them. BOF surfaces unresolved exceptions and escalations with severity so the fleet knows what requires attention before it becomes a bigger operational problem.", "BOF maintains exception severity, owner, associated driver or asset, and resolution status."],
] as const;

export default function SafetyRiskPage() {
  return (
    <main className="bof-service-page">
      <div className="bof-mkt-container">
        <header className="bof-service-page__hero">
          <p className="bof-home-eyebrow">Private Fleet Function</p>
          <h1>SAFETY &amp; RISK</h1>
          <p>BOF can organize the safety and risk administration behind a growing private fleet while the fleet owner keeps dispatch, driver management, and operational judgments in-house.</p>
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
          <p>A growing fleet can accumulate safety events, corrective actions, training follow-up, and document requests faster than the internal team can track them. The owner still has to know what happened, who owns the next step, and whether the issue is fully closed.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Current administrative burden</h2>
          <p>Safety administration often gets spread across managers, payroll, dispatch, driver communication, and ad hoc review records. Without a disciplined record, teams end up rebuilding the story from email and scattered attachments each time a concern surfaces.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Manual coordination</h2>
          <p>Spreadsheets for safety events, email chains for coaching notes, shared drives for evidence, manual reminders for corrective actions, phone calls for follow-up, and disconnected systems holding driver, maintenance, or document records. BOF reduces that administrative drag.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>What BOF takes responsibility for</h2>
          <p>BOF takes responsibility for the administrative engine behind safety and risk: event documentation, compliance conditions, training follow-up, corrective action records, and exception tracking. The fleet owner remains responsible for operational decisions and safety judgment.</p>
        </section>

        <section className="bof-service-page__section bof-service-page__section--dark">
          <h2>Records BOF maintains</h2>
          <p>BOF maintains concerns, evidence, review notes, action status, coaching or corrective-action history, risk posture, and associated driver or asset records tied to the operating record.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Exceptions BOF identifies</h2>
          <p>BOF surfaces missing evidence, overdue corrective actions, unresolved compliance conditions, recurring safety issues, and other open risks that need visibility. It shows the issue, severity, owner, and date due.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Next actions</h2>
          <p>BOF identifies the next operational or administrative step: review the evidence, assign coaching, confirm training completion, or track a corrective action to closure. The fleet keeps safety judgment in-house while BOF keeps the follow-through visible.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Connection to the BOF operating record</h2>
          <p>Safety and risk connect directly to drivers, compliance, documents, training, dispatch, and broader fleet operations. A risk issue can affect driver readiness, assignment decisions, and payment or customer confidence if it is not tracked properly.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Staffing impact</h2>
          <p>BOF can absorb the ongoing administrative burden of safety follow-up without requiring the owner to build a full safety/compliance administrative function as the fleet expands. It is a back-office support layer, not a replacement for operational safety responsibility.</p>
        </section>

        <section className="bof-service-page__section">
          <h2>Operational outcome</h2>
          <p>The fleet keeps safety judgment and operating control while BOF gives the owner a disciplined, visible, and manageable safety record. The result is faster follow-through, cleaner documentation, and less risk of an issue drifting out of sight.</p>
          <div className="bof-service-page__actions">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
            <Link href="/book-assessment?sector=private-fleet" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Fleet Assessment</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
