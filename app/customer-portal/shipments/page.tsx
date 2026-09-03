import type { Metadata } from "next";
import { CustomerPortalShell } from "@/components/customer-portal/CustomerPortalShell";

export const metadata: Metadata = { title: "Active Shipments | Customer Portal" };

export default function CustomerPortalShipmentsPage() {
  return (
    <CustomerPortalShell
      railTitle="Dispatch queue"
      railValue="Customer load examples"
      railNote="Select a row to see assignment, document state, proof requirements, and next action."
    >
      <p className="portal-honest-banner">
        <strong>Same shipment record</strong>
        Rows in this workspace are the recovered portal walkthrough (Prairie View Foods / BOF-LD-86240) plus related examples. They are not mixed with internal demo loads such as L001.
      </p>
      <header className="portal-topbar">
        <div>
          <span className="portal-kicker">Active Shipments</span>
          <h1>See load requests, statuses, quote state, assignment, documents, and next action.</h1>
        </div>
        <div className="portal-topbar-actions">
          <a className="portal-link-button" href="/customer-portal/load-intake">Load intake</a>
          <a className="portal-link-button" href="/customer-portal/assignment">Assignment</a>
          <a className="portal-link-button" href="/customer-portal/tracking">Tracking</a>
        </div>
      </header>
      <div className="portal-grid">
        <section className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">Shipment queue</span>
              <h2>Customer shipment rows</h2>
            </div>
            <span className="portal-status ready">Selectable</span>
          </div>
          <div className="dispatch-card-grid" data-portal-render="shipmentCards" />
          <div className="table-wrap dispatch-table-fallback">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Load</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Lane</th>
                  <th>Quote</th>
                  <th>Driver / equipment</th>
                </tr>
              </thead>
              <tbody data-portal-render="shipmentRows" />
            </table>
          </div>
        </section>
        <aside className="portal-review-column">
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Selected shipment</span>
                <h2 data-portal-text="selectedShipmentTitle">BOF-LD-86240</h2>
              </div>
              <span className="portal-status review" data-portal-text="selectedShipmentStatus">Pending Dispatch Review</span>
            </div>
            <div data-portal-render="shipmentDetail" />
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Assignment</span>
                <h2>Driver and assets</h2>
              </div>
              <span className="portal-status review" data-portal-text="dispatchGateStatus">Dispatch-ready blocked</span>
            </div>
            <div data-portal-render="assignmentSummary" />
            <a className="portal-inline-link" href="/customer-portal/assignment">Open assignment</a>
            <a className="portal-inline-link" href="/customer-portal/documents">Open BOL packet</a>
            <a className="portal-inline-link" href="/customer-portal/billing">Open billing / factoring</a>
          </section>
        </aside>
      </div>
    </CustomerPortalShell>
  );
}
