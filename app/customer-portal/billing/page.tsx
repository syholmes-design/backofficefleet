import type { Metadata } from "next";
import { CustomerPortalShell } from "@/components/customer-portal/CustomerPortalShell";

export const metadata: Metadata = { title: "Billing / Factoring | Customer Portal" };

export default function CustomerPortalBillingPage() {
  return (
    <CustomerPortalShell
      railTitle="Billing"
      railValue="INV-86240-PVF"
      railNote="Invoice and factoring packet wait on POD and post-trip proof before settlement closeout."
      railValueAttr="invoiceId"
    >
      <p className="portal-honest-banner">
        <strong>No payment collected</strong>
        This page previews invoice, payment, settlement, and factoring as separate statuses. It does not process cards, ACH, or factoring submission.
      </p>
      <header className="portal-topbar">
        <div>
          <span className="portal-kicker">Billing / Factoring</span>
          <h1>Review invoice preview, payment terms, shipment proof, and settlement dependencies.</h1>
        </div>
        <div className="portal-topbar-actions">
          <a className="portal-link-button" href="/customer-portal/documents">BOL packet</a>
          <a className="portal-link-button" href="/customer-portal/tracking">Tracking</a>
        </div>
      </header>
      <div className="portal-status-split">
        <article>
          <h3>Invoice</h3>
          <p>Preview of charges tied to the shipment. Not issued until proof clears.</p>
        </article>
        <article>
          <h3>Payment</h3>
          <p>Customer payment is not collected in this portal. Terms remain Net 30 unless BOF issues otherwise.</p>
        </article>
        <article>
          <h3>Settlement</h3>
          <p>Driver/carrier closeout waits on delivery proof and claim clearance. Separate from the customer invoice.</p>
        </article>
        <article>
          <h3>Factoring</h3>
          <p>Packet preview only. No factoring file is submitted from this page.</p>
        </article>
      </div>
      <div className="portal-grid">
        <section className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">Invoice preview</span>
              <h2 data-portal-text="invoiceId">INV-86240-PVF</h2>
            </div>
            <span className="portal-status watch">Waits on POD</span>
          </div>
          <div className="quote-lines" data-portal-render="billingLines" />
          <p className="portal-note">No payment is collected here. Billing review stays tied to POD quality review, signed BOL, lumper receipt when used, claim clearance, and settlement release.</p>
        </section>
        <aside className="portal-review-column">
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Required support</span>
                <h2>Billing / factoring packet</h2>
              </div>
              <span className="portal-status review">Proof needed</span>
            </div>
            <div className="portal-mini-list">
              <span>Invoice preview</span>
              <span>Rate confirmation</span>
              <span>Signed BOL and POD quality review</span>
              <span>Lumper receipt if used</span>
              <span>Dock and empty trailer proof</span>
              <span>Settlement and claim clearance</span>
              <span>Next-load readiness note</span>
            </div>
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Factoring</span>
                <h2>Built after POD</h2>
              </div>
              <span className="portal-status watch">Waits on proof</span>
            </div>
            <p className="portal-note">BOF keeps the rate confirmation, invoice, signed BOL/POD, lumper support, proof photos, claim clearance, and settlement notes together so billing and factoring review do not become a separate chase.</p>
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Settlement</span>
                <h2>Closeout first</h2>
              </div>
              <span className="portal-status ready">On file</span>
            </div>
            <p className="portal-note">Driver and equipment should not be treated as available again until delivery proof, defect review, claim review, settlement, billing, and archive are complete.</p>
          </section>
        </aside>
      </div>
    </CustomerPortalShell>
  );
}
