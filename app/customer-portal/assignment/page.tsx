import type { Metadata } from "next";
import { CustomerPortalShell } from "@/components/customer-portal/CustomerPortalShell";

export const metadata: Metadata = { title: "Assignment | Customer Portal" };

export default function CustomerPortalAssignmentPage() {
  return (
    <CustomerPortalShell
      railTitle="Assignment"
      railValue="Driver, tractor, trailer"
      railNote="Customer-visible assignment. Selectors update this browser walkthrough only."
    >
      <p className="portal-honest-banner">
        <strong>Simulated assignment visibility</strong>
        Customers can see who is assigned and what still needs review. Changing the dropdowns does not call BOF dispatch assignment or rewrite readiness engines.
      </p>
      <header className="portal-topbar">
        <div>
          <span className="portal-kicker">Assignment</span>
          <h1>See the driver, tractor, and trailer attached to this shipment before pickup.</h1>
        </div>
        <div className="portal-topbar-actions">
          <a className="portal-link-button" href="/customer-portal/shipments">Back to shipments</a>
          <a className="portal-link-button" href="/customer-portal/documents">Open BOL packet</a>
          <a className="portal-link-button" href="/customer-portal/tracking">Tracking</a>
        </div>
      </header>
      <div className="portal-grid">
        <section className="portal-panel">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">Assigned resources</span>
              <h2>Driver, tractor, trailer</h2>
            </div>
            <span className="portal-status review" data-portal-text="dispatchGateStatus">Dispatch-ready blocked</span>
          </div>
          <div className="assignment-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Assigned driver John Carter" src="/assets/images/profiles/drivers/driver-ref-001-natural.jpg" />
            <div>
              <span>Driver</span>
              <strong>John Carter - DRV-001</strong>
              <p>CDL, medical, MVR, DQF, and dispatch eligibility are shown as current for this simulated assignment.</p>
            </div>
          </div>
          <div className="field-grid three assignment-selectors">
            <label>
              <span>Driver</span>
              <select data-dispatch-select="driver">
                <option>John Carter - DRV-001</option>
                <option>Maria Alvarez - DRV-006</option>
                <option value="">Assignment needed</option>
              </select>
            </label>
            <label>
              <span>Tractor</span>
              <select data-dispatch-select="tractor">
                <option>TR-4812</option>
                <option>TR-7741</option>
                <option value="">Assignment needed</option>
              </select>
            </label>
            <label>
              <span>Trailer</span>
              <select data-dispatch-select="trailer">
                <option>RF-2207</option>
                <option>DV-6104</option>
                <option value="">Assignment needed</option>
              </select>
            </label>
          </div>
          <dl className="summary-dl">
            <div>
              <dt>Approved quote</dt>
              <dd data-portal-text="quoteTotal">Calculating</dd>
            </div>
            <div>
              <dt>Tractor</dt>
              <dd>TR-4812 - reefer telemetry ready</dd>
            </div>
            <div>
              <dt>Trailer</dt>
              <dd>RF-2207 - pre-cool and seal record required</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>S. Turner, dispatch review</dd>
            </div>
          </dl>
        </section>
        <aside className="portal-review-column">
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Readiness checks</span>
                <h2>Compliance and equipment</h2>
              </div>
              <span className="portal-status ready">Simulated checks</span>
            </div>
            <div className="portal-checklist">
              <span>CDL/DQF ready</span>
              <span>Medical card current</span>
              <span>Equipment match confirmed</span>
              <span>Reefer pre-cool required</span>
              <span>Seal and cargo proof required</span>
              <span>HOS readiness available for pickup window</span>
            </div>
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Release checks</span>
                <h2 data-portal-text="dispatchGateStatus">Dispatch-ready blocked</h2>
              </div>
              <span className="portal-status review">Required gates</span>
            </div>
            <div className="portal-checklist" data-portal-render="dispatchGateList" />
            <p className="portal-note">This is a customer-visible checklist. BOF dispatch release still runs in the fleet workspace, not from these dropdowns.</p>
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Before pickup</span>
                <h2>Packet dependency</h2>
              </div>
              <span className="portal-status watch">Watch</span>
            </div>
            <p className="portal-note">Rate confirmation, BOL, loaded cargo photo, seal record, and equipment inspection stay attached to this shipment before it moves from assigned to picked up.</p>
          </section>
        </aside>
      </div>
    </CustomerPortalShell>
  );
}
