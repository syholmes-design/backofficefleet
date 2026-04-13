import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Government | BackOfficeFleet",
  description:
    "Audit-ready fleet operations with enforced compliance and documentation.",
};

export default function GovernmentPage() {
  return (
    <article className="bof-mkt-article">
      <div className="bof-mkt-container bof-mkt-article-inner">
        <h1 className="bof-mkt-page-title">
          Audit-Ready Fleet Operations With Enforced Compliance
        </h1>
        <p className="bof-mkt-page-sub">
          When public accountability matters, BOF aligns day-to-day fleet
          operations with documentation, oversight, and risk mitigation — without
          replacing your existing procurement or telematics choices.
        </p>

        <div className="bof-mkt-pillar-grid">
          <section className="bof-mkt-pillar">
            <h2>Audit logs</h2>
            <p>
              A defensible trail of who was cleared to run, what proof was on
              file, and which exceptions were escalated.
            </p>
          </section>
          <section className="bof-mkt-pillar">
            <h2>Documentation</h2>
            <p>
              Structured credential and load-proof records — not attachments
              lost across shared drives.
            </p>
          </section>
          <section className="bof-mkt-pillar">
            <h2>Oversight</h2>
            <p>
              Command-center visibility into compliance incidents, holds, and
              revenue risk in one narrative.
            </p>
          </section>
          <section className="bof-mkt-pillar">
            <h2>Risk mitigation</h2>
            <p>
              Enforcement before movement reduces exposure from unqualified
              dispatch and incomplete proof packages.
            </p>
          </section>
        </div>

        <div className="bof-mkt-article-ctas">
          <Link href="/book-assessment" className="bof-mkt-btn bof-mkt-btn-primary">
            Book Fleet Assessment
          </Link>
          <Link href="/dashboard" className="bof-mkt-btn bof-mkt-btn-secondary">
            Open Demo
          </Link>
        </div>
      </div>
    </article>
  );
}
