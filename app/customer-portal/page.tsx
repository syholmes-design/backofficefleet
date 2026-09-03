import type { Metadata } from "next";
import { CustomerPortalShell } from "@/components/customer-portal/CustomerPortalShell";

export const metadata: Metadata = {
  title: "Customer Portal",
};

export default function CustomerPortalHomePage() {
  return (
    <CustomerPortalShell
      railTitle="Current shipment"
      railValue="SHP-86240-DAL-MEM"
      railNote="Quote, assignment, documents, proof, settlement, and factoring stay on one shipment record."
      railValueAttr="shipmentId"
      railNoteAttr="nextAction"
    >
      <p className="portal-honest-banner">
        <strong>Customer workspace</strong>
        This is the customer-facing BOF portal at /customer-portal. Quote totals, assignment selectors, and tracking stages in this workspace are simulated walkthroughs stored in this browser. They do not submit a live commercial quote, GPS ping, payment, or factoring file.
      </p>
      <header className="portal-topbar">
        <div>
          <span className="portal-kicker">Customer Portal</span>
          <h1>Request a shipment, review the quote, follow assignment, and inspect documents and billing.</h1>
        </div>
        <div className="portal-topbar-actions">
          <a className="portal-link-button" href="/customer-portal/load-intake">Start load intake</a>
          <a className="portal-link-button" href="/customer-portal/shipments">Active shipments</a>
        </div>
      </header>
      <section className="portal-panel portal-hub-hero">
        <div>
          <span className="portal-kicker">Shipment workspace</span>
          <h2>One path from intake through billing and factoring review.</h2>
          <p>
            Tell BOF what needs to move, review the simulated quote, see assignment and the BOL packet, then follow tracking and billing status on the same shipment record.
          </p>
        </div>
        <div className="portal-summary-card">
          <span>Portal status</span>
          <strong>Walkthrough record</strong>
          <p>Prairie View Foods / BOF-LD-86240 is a synthetic demo shipment, not a live customer file.</p>
        </div>
      </section>
      <section aria-label="Primary Customer Portal actions" className="portal-card-grid">
        <a className="portal-action-card" href="/customer-portal/load-intake">
          <span>01</span>
          <h2>Load Intake</h2>
          <p>Enter company, lane, commodity, equipment, appointments, accessorials, and sample cargo photo so BOF can prepare a shipment record.</p>
          <strong>Open intake</strong>
        </a>
        <a className="portal-action-card" href="/customer-portal/quotes">
          <span>02</span>
          <h2>Quote</h2>
          <p>Review mileage, rate lines, fuel, accessorials, and assumptions. This quote is a configurable demonstration, not a production rate confirmation.</p>
          <strong>Open quote</strong>
        </a>
        <a className="portal-action-card" href="/customer-portal/shipments">
          <span>03</span>
          <h2>Active Shipments</h2>
          <p>See status, quote state, assignment, documents, and the next action on the same shipment.</p>
          <strong>Open shipments</strong>
        </a>
        <a className="portal-action-card" href="/customer-portal/assignment">
          <span>04</span>
          <h2>Assignment</h2>
          <p>See the driver, tractor, and trailer attached to the shipment. Selectors here are simulated visibility, not a live dispatch assign action.</p>
          <strong>Open assignment</strong>
        </a>
        <a className="portal-action-card" href="/customer-portal/documents">
          <span>05</span>
          <h2>BOL Packet</h2>
          <p>Inspect rate confirmation, BOL, invoice preview, seal/cargo, POD-ready proof, and factoring packet as document records — not as signed evidence.</p>
          <strong>Open packet</strong>
        </a>
        <a className="portal-action-card" href="/customer-portal/tracking">
          <span>06</span>
          <h2>Tracking</h2>
          <p>Follow simulated shipment stages from request through settlement. This is not live GPS or telematics.</p>
          <strong>Open tracking</strong>
        </a>
        <a className="portal-action-card" href="/customer-portal/billing">
          <span>07</span>
          <h2>Billing / Factoring</h2>
          <p>Keep invoice, payment, settlement, and factoring review distinct. No payment is collected here.</p>
          <strong>Open billing</strong>
        </a>
      </section>
      <section className="portal-dashboard-grid">
        <article className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">Simulated quote</span>
              <h2 data-portal-text="quoteTotal">Calculating</h2>
            </div>
            <span className="portal-status review">Demo estimate</span>
          </div>
          <div className="quote-lines" data-portal-render="quoteLines" />
          <a className="portal-inline-link" href="/customer-portal/quotes">Review quote details</a>
        </article>
        <article className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">Active shipment</span>
              <h2 data-portal-text="loadId">BOF-LD-86240</h2>
            </div>
            <span className="portal-status review">Pending dispatch review</span>
          </div>
          <dl className="summary-dl">
            <div>
              <dt>Lane</dt>
              <dd data-portal-text="lane">Dallas, TX to Memphis, TN</dd>
            </div>
            <div>
              <dt>Driver / equipment</dt>
              <dd>John Carter - TR-4812 / RF-2207</dd>
            </div>
            <div>
              <dt>Next action</dt>
              <dd>Clear assignment, compliance, equipment, and pre-trip packet gates before pickup.</dd>
            </div>
          </dl>
          <a className="portal-inline-link" href="/customer-portal/shipments">Open active shipments</a>
        </article>
        <article className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">BOL packet</span>
              <h2>Document records</h2>
            </div>
            <span className="portal-status review">Preview</span>
          </div>
          <div className="portal-mini-list">
            <span>Rate confirmation prepared as a document record</span>
            <span>BOL prepared as a document record</span>
            <span>Seal and cargo sample attached</span>
            <span>POD and empty trailer proof required after delivery</span>
          </div>
          <a className="portal-inline-link" href="/customer-portal/documents">Inspect BOL packet</a>
        </article>
        <article className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">Billing status</span>
              <h2>Invoice preview</h2>
            </div>
            <span className="portal-status watch">Waits on POD</span>
          </div>
          <p className="portal-note">Invoice, payment, settlement, and factoring are separate. Billing review waits on signed BOL, POD, dock photo, and lumper receipt when used.</p>
          <a className="portal-inline-link" href="/customer-portal/billing">Open billing / factoring</a>
        </article>
      </section>
    </CustomerPortalShell>
  );
}
