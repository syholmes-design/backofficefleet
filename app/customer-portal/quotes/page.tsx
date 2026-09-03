import type { Metadata } from "next";
import { CustomerPortalShell } from "@/components/customer-portal/CustomerPortalShell";

export const metadata: Metadata = { title: "Quote | Customer Portal" };

export default function CustomerPortalQuotesPage() {
  return (
    <CustomerPortalShell
      railTitle="Quote"
      railValue="Calculating"
      railNote="Simulated quote prepared in this browser. It is not a live commercial rate."
      railValueAttr="quoteTotal"
      railNoteAttr="quoteMessage"
    >
      <p className="portal-honest-banner">
        <strong>Simulated quote — not a production commercial quote</strong>
        Mileage, fuel, accessorials, and totals are configurable demonstration math. Approving here only updates this browser walkthrough. It does not confirm a customer rate or create a TMS tender.
      </p>
      <header className="portal-topbar">
        <div>
          <span className="portal-kicker">Quote Review</span>
          <h1>Review mileage, estimated cost, fuel surcharge, accessorials, and proof assumptions.</h1>
        </div>
        <div className="portal-topbar-actions">
          <a className="portal-link-button" href="/customer-portal/load-intake">Edit request</a>
          <a className="portal-link-button" href="/customer-portal/shipments">Active shipments</a>
        </div>
      </header>
      <div className="portal-grid">
        <section className="portal-panel quote-panel">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">Simulated quote</span>
              <h2 data-portal-text="quoteTotal">Calculating</h2>
            </div>
            <span className="portal-status review" data-portal-text="quoteDecision">Customer review</span>
          </div>
          <div className="quote-lines" data-portal-render="quoteLines" />
          <div className="portal-actions">
            <button className="primary" data-portal-action="approve-quote" type="button">Simulate quote approval</button>
            <button data-portal-action="request-quote-change" type="button">Simulate review request</button>
            <button data-portal-action="hold-quote" type="button">Save demo draft</button>
          </div>
          <p className="portal-note" data-portal-text="quoteMessage">This is configurable demo pricing. Final rate confirmation depends on lane, equipment, appointment, cargo, proof, and dispatch review.</p>
        </section>
        <aside className="portal-review-column">
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Quote assumptions</span>
                <h2>What BOF reviews</h2>
              </div>
              <span className="portal-status watch">Assumptions</span>
            </div>
            <div className="portal-mini-list" data-portal-render="quoteAssumptions" />
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Next action</span>
                <h2>Approval path</h2>
              </div>
              <span className="portal-status ready">Simulated</span>
            </div>
            <p className="portal-note">Simulate approval to keep the walkthrough coherent. The example path still shows driver, tractor, trailer, compliance, equipment, and pre-trip packet checks before pickup.</p>
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Release checks</span>
                <h2 data-portal-text="dispatchGateStatus">Dispatch-ready blocked</h2>
              </div>
              <span className="portal-status review">Gated</span>
            </div>
            <div className="portal-checklist" data-portal-render="dispatchGateList" />
          </section>
        </aside>
      </div>
    </CustomerPortalShell>
  );
}
