import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BOF Vault | BackOfficeFleet",
  description:
    "Drivers upload once. Fleets verify instantly. Compliance stays current.",
};

export default function BofVaultPage() {
  return (
    <article className="bof-mkt-article">
      <div className="bof-mkt-container bof-mkt-article-inner">
        <h1 className="bof-mkt-page-title">
          Have Your Documents Ready When Opportunity Knocks
        </h1>
        <p className="bof-mkt-page-sub">
          Drivers upload once. Fleets verify instantly. Compliance stays current.
        </p>

        <section className="bof-mkt-vault-block">
          <p>
            <strong>BOF Vault</strong> is the ecosystem layer for credential and
            proof storage — designed to feed dispatch, settlements, and audit
            workflows without duplicate data entry. It supports the command
            center; it isn&apos;t a replacement for operational enforcement.
          </p>
          <ul className="bof-mkt-article-list">
            <li>Centralized driver file with versioning and status.</li>
            <li>Fleet-side verification against dispatch and compliance rules.</li>
            <li>Hooks into proof-of-delivery and settlement intelligence.</li>
          </ul>
        </section>

        <div className="bof-mkt-article-ctas">
          <Link href="/drivers" className="bof-mkt-btn bof-mkt-btn-secondary">
            See driver readiness in demo
          </Link>
          <Link href="/book-assessment" className="bof-mkt-btn bof-mkt-btn-primary">
            Book Fleet Assessment
          </Link>
        </div>
      </div>
    </article>
  );
}
