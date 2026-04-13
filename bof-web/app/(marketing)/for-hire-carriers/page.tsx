import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For-Hire Carriers | BackOfficeFleet",
  description:
    "From dispatch to delivery — enforce compliance and protect every load.",
};

export default function ForHireCarriersPage() {
  return (
    <article className="bof-mkt-article">
      <div className="bof-mkt-container bof-mkt-article-inner">
        <p className="bof-mkt-eyebrow">Primary wedge</p>
        <h1 className="bof-mkt-page-title">Built for Carriers Who Can&apos;t Afford Mistakes</h1>
        <p className="bof-mkt-page-sub">
          From dispatch to delivery, enforce compliance and protect every load.
        </p>

        <section className="bof-mkt-article-section">
          <h2>Control Every Load</h2>
          <ul className="bof-mkt-article-list">
            <li>Assign drivers with readiness checks — not just names on a board.</li>
            <li>Track status with proof and exception context, not dots on a map alone.</li>
            <li>Prevent unqualified dispatch before the load leaves the yard.</li>
          </ul>
        </section>

        <section className="bof-mkt-article-section">
          <h2>Never Miss Compliance Again</h2>
          <ul className="bof-mkt-article-list">
            <li>CDL, Med Card, MVR — tracked against real dispatch decisions.</li>
            <li>Automatic enforcement when credentials lapse or go missing.</li>
            <li>Less manual chasing; more operational discipline.</li>
          </ul>
        </section>

        <section className="bof-mkt-article-section">
          <h2>Proof That Gets You Paid</h2>
          <ul className="bof-mkt-article-list">
            <li>POD verification tied to settlement and money-at-risk views.</li>
            <li>Photos and seal checks structured for disputes, not lost threads.</li>
            <li>GPS and checkpoint-style validation where your lanes require it.</li>
          </ul>
        </section>

        <section className="bof-mkt-article-section">
          <h2>Protect Your Revenue</h2>
          <ul className="bof-mkt-article-list">
            <li>Settlement tracking with holds, reasons, and proof linkage.</li>
            <li>Exception flags surfaced in the command center, not in side email.</li>
            <li>Audit-friendly logs for how decisions were enforced.</li>
          </ul>
        </section>

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
