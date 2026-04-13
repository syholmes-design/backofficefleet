import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Book Fleet Assessment | BackOfficeFleet",
  description: "Schedule a fleet assessment with the BackOfficeFleet team.",
};

export default function BookAssessmentPage() {
  return (
    <article className="bof-mkt-article">
      <div className="bof-mkt-container bof-mkt-article-inner bof-mkt-assessment">
        <h1 className="bof-mkt-page-title">Book a Fleet Assessment</h1>
        <p className="bof-mkt-page-sub">
          We&apos;ll walk through your dispatch, compliance, proof, and settlement
          workflows — and show how BOF enforces operations in the command center.
        </p>
        <p className="bof-mkt-assessment-note">
          This demo app does not send forms. To book, email your fleet details and
          preferred times:
        </p>
        <p className="bof-mkt-assessment-email">
          <a href="mailto:assessment@backofficefleet.demo?subject=Fleet%20Assessment%20Request">
            assessment@backofficefleet.demo
          </a>
        </p>
        <p className="bof-mkt-muted">
          Replace the address with your production contact when you go live.
        </p>
        <div className="bof-mkt-article-ctas">
          <Link href="/dashboard" className="bof-mkt-btn bof-mkt-btn-secondary">
            Open Demo while you wait
          </Link>
          <Link href="/" className="bof-mkt-btn bof-mkt-btn-ghost">
            Back to home
          </Link>
        </div>
      </div>
    </article>
  );
}
