import type { Metadata } from "next";
import { CustomerPortalShell } from "@/components/customer-portal/CustomerPortalShell";

export const metadata: Metadata = { title: "BOL Packet | Customer Portal" };

export default function CustomerPortalDocumentsPage() {
  return (
    <CustomerPortalShell
      railTitle="BOL packet"
      railValue="Shipment packet"
      railNote="Open each record to inspect fields, owners, and what still needs proof."
      railValueAttr="documentReadiness"
    >
      <p className="portal-honest-banner">
        <strong>Document records, not signed evidence</strong>
        Papers on this page are generated previews for the walkthrough shipment. They are not customer-signed BOLs, not live invoices, and not factoring submissions.
      </p>
      <header className="portal-topbar">
        <div>
          <span className="portal-kicker">BOL Packet</span>
          <h1>Inspect the BOL, rate confirmation, invoice preview, seal, cargo record, and POD-ready proof chain.</h1>
        </div>
        <div className="portal-topbar-actions">
          <a className="portal-link-button" href="/customer-portal/assignment">Assignment</a>
          <a className="portal-link-button" href="/customer-portal/tracking">Tracking</a>
          <a className="portal-link-button" href="/customer-portal/billing">Billing</a>
        </div>
      </header>
      <div className="portal-kind-grid">
        <article>
          <span>Document template</span>
          <p>The layout BOF uses to prepare paperwork. Not evidence by itself.</p>
        </article>
        <article>
          <span>Actual document</span>
          <p>A completed paper for this shipment, still a preview until signed or issued.</p>
        </article>
        <article>
          <span>Document record</span>
          <p>The packet entry attached to the shipment: owner, status, and next action.</p>
        </article>
        <article>
          <span>Proof / evidence</span>
          <p>Photos, seals, signatures, and receipts that close delivery and billing.</p>
        </article>
      </div>
      <span aria-hidden="true" id="bol" />
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <span className="portal-kicker">Document viewer</span>
            <h2 data-portal-text="documentTitle">Rate confirmation</h2>
          </div>
          <span className="portal-status review">Preview record</span>
        </div>
        <div className="packet-layout">
          <div className="document-tabs" role="tablist">
            <button className="is-active" data-doc-tab="rate" type="button">Rate confirmation</button>
            <button data-doc-tab="invoice" type="button">Invoice</button>
            <button data-doc-tab="bol" type="button">Bill of lading</button>
            <button data-doc-tab="seal" type="button">Seal &amp; cargo</button>
            <button data-doc-tab="pod" type="button">POD-ready proof</button>
            <button data-doc-tab="factoring" type="button">Factoring packet</button>
          </div>
          <article className="paper-document" data-portal-render="paperDocument" data-watermark="Rate" />
          <aside className="proof-registry">
            <h3>Proof registry</h3>
            <div data-portal-render="proofRegistry" />
          </aside>
        </div>
      </section>
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <span className="portal-kicker">Pre-trip shipment documentation</span>
            <h2 data-portal-text="documentReadiness">Pre-trip packet pending</h2>
          </div>
          <span className="portal-status review">Readiness</span>
        </div>
        <div className="portal-checklist document-readiness-list" data-portal-render="documentReadinessList" />
      </section>
    </CustomerPortalShell>
  );
}
