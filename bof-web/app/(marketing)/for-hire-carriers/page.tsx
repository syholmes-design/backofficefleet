import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For-Hire Carriers | BackOfficeFleet",
  description: "For-hire carrier operations entry page for BOF assessment and demo funnel.",
};

export default function ForHireCarriersPage() {
  return (
    <div className="bof-mkt-funnel-page">
      <div className="bof-mkt-funnel-shell">
        <section className="bof-mkt-funnel-panel">
          <p className="bof-mkt-hero-premium-eyebrow">For-hire / for-profit carriers</p>
          <h1 className="bof-mkt-funnel-h1">Carrier Operations Assessment Entry</h1>
          <p className="bof-mkt-funnel-lead">
            Start the for-hire carrier assessment path for dispatch volume, compliance readiness, proof process,
            settlements, claims exposure, and revenue leakage controls.
          </p>
          <div className="bof-mkt-funnel-actions bof-mkt-funnel-actions--stack">
            <Link href="/book-assessment?sector=for-hire" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Take The Assessment
            </Link>
            <Link href="/fleet-savings" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              Open savings calculator
            </Link>
            <Link href="/apply" className="bof-mkt-funnel-entry-text">
              Continue to qualification →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

