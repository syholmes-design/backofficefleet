import type { Metadata } from "next";
import { CustomerPortalShell } from "@/components/customer-portal/CustomerPortalShell";

export const metadata: Metadata = { title: "Tracking | Customer Portal" };

export default function CustomerPortalTrackingPage() {
  return (
    <CustomerPortalShell
      railTitle="Tracking"
      railValue="In Transit"
      railNote="Simulated stages. Delivery proof still controls settlement release."
      railValueAttr="trackingCurrent"
      railNoteAttr="trackingNext"
    >
      <p className="portal-honest-banner">
        <strong>Simulated tracking — not live GPS</strong>
        Stages are a record view for this walkthrough. BOF does not show live telematics, weather, or traffic on this page.
      </p>
      <header className="portal-topbar">
        <div>
          <span className="portal-kicker">Tracking</span>
          <h1>Follow the shipment from submitted request through settlement complete.</h1>
        </div>
        <div className="portal-topbar-actions">
          <a className="portal-link-button" href="/customer-portal/shipments">Active shipments</a>
          <a className="portal-link-button" href="/customer-portal/documents">BOL packet</a>
          <a className="portal-link-button" href="/customer-portal/billing">Billing</a>
        </div>
      </header>
      <div className="portal-grid">
        <section className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">Shipment timeline</span>
              <h2>Request to settlement</h2>
            </div>
            <span className="portal-status ready">Simulated record view</span>
          </div>
          <div className="tracking-timeline" data-portal-render="trackingTimeline" />
        </section>
        <aside className="portal-review-column">
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Stage detail</span>
                <h2 data-portal-text="trackingStageTitle">In Transit</h2>
              </div>
              <span className="portal-status watch" data-portal-text="trackingStageStatus">Watch</span>
            </div>
            <div data-portal-render="trackingDetail" />
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Approved quote</span>
                <h2 data-portal-text="quoteTotal">Calculating</h2>
              </div>
              <span className="portal-status ready">Carried forward</span>
            </div>
            <p className="portal-note">The same quote follows the shipment through assignment, documents, tracking, billing, and factoring review.</p>
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Proof dependency</span>
                <h2>Delivery closeout</h2>
              </div>
              <span className="portal-status review">Pending</span>
            </div>
            <p className="portal-note">Signed BOL, POD, receiver detail, dock photo, empty cargo proof, and lumper receipt when used control billing and settlement closeout.</p>
          </section>
        </aside>
      </div>
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <span className="portal-kicker">Connected workflow</span>
            <h2>Assignment, proof, settlement, and factoring stay on one record</h2>
          </div>
          <span className="portal-status ready">Workflow map</span>
        </div>
        <div className="lifecycle-grid" data-portal-render="lifecycleGrid" />
      </section>
    </CustomerPortalShell>
  );
}
