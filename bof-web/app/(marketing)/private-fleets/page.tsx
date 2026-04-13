import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Private Fleets | BackOfficeFleet",
  description:
    "Enterprise-level control, visibility, and operational discipline for internal fleets.",
};

export default function PrivateFleetsPage() {
  return (
    <article className="bof-mkt-article">
      <div className="bof-mkt-container bof-mkt-article-inner">
        <h1 className="bof-mkt-page-title">
          Bring Enterprise-Level Control to Your Internal Fleet
        </h1>
        <p className="bof-mkt-page-sub">
          Standardize how your private fleet enforces compliance, captures proof,
          and reports operational risk — without turning operations into ad hoc
          spreadsheets.
        </p>

        <div className="bof-mkt-pillar-grid">
          <section className="bof-mkt-pillar">
            <h2>Visibility</h2>
            <p>
              One command-center view across drivers, assets, loads, and
              settlement pressure — so leadership sees what the field already
              knows.
            </p>
          </section>
          <section className="bof-mkt-pillar">
            <h2>Standardization</h2>
            <p>
              Same proof stack, same compliance rules, same escalation paths —
              from yard to back office.
            </p>
          </section>
          <section className="bof-mkt-pillar">
            <h2>Risk reduction</h2>
            <p>
              Catch credential and proof gaps before they become customer issues
              or internal audit findings.
            </p>
          </section>
          <section className="bof-mkt-pillar">
            <h2>Operational discipline</h2>
            <p>
              Enforcement by design — not another passive dashboard that nobody
              owns.
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
