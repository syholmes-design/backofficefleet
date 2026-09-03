import type { Metadata } from "next";
import { CustomerPortalShell } from "@/components/customer-portal/CustomerPortalShell";

export const metadata: Metadata = { title: "Load Intake | Customer Portal" };

export default function CustomerPortalLoadIntakePage() {
  return (
    <CustomerPortalShell
      railTitle="Intake"
      railValue="Shipment details"
      railNote="BOF needs lane, freight, appointments, and proof requirements before quote review."
    >
      <p className="portal-honest-banner">
        <strong>What happens after submit</strong>
        Completing this form prepares a shipment record in this browser and a simulated quote. It does not create a second load in dispatch and does not send a live tender. Use sample media only.
      </p>
      <header className="portal-topbar">
        <div>
          <span className="portal-kicker">Customer Load Intake</span>
          <h1>Enter the shipment details BOF needs before quote review and assignment.</h1>
        </div>
        <div className="portal-topbar-actions">
          <a className="portal-link-button" href="/customer-portal/quotes">Quote review</a>
          <button data-portal-action="load-sample" type="button">Load sample</button>
          <button data-portal-action="reset-request" type="button">Reset</button>
        </div>
      </header>
      <div className="portal-grid">
        <form className="portal-form" data-load-form="">
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Load intake</span>
                <h2>Customer, lane, freight, proof, and terms</h2>
              </div>
              <span className="portal-status review" data-portal-text="requestStatus">Required review open</span>
            </div>
            <div className="form-section">
              <h3>Customer contact</h3>
              <p className="portal-note">Why we ask: billing contact, reference number, and terms stay on the same shipment record.</p>
              <div className="field-grid three">
                <label><span>Company</span><input name="companyName" required defaultValue="Prairie View Foods" /></label>
                <label><span>Contact</span><input name="contactName" required defaultValue="Elena Brooks" /></label>
                <label><span>Work email</span><input name="contactEmail" required type="email" defaultValue="ops@pvfoods.example" /></label>
                <label><span>Phone or role line</span><input name="contactPhone" required defaultValue="214-555-0124" /></label>
                <label><span>Customer reference / PO</span><input name="poNumber" defaultValue="PVF-86240" /></label>
                <label>
                  <span>Billing terms</span>
                  <select name="paymentTerms">
                    <option>Net 30</option>
                    <option>Net 15</option>
                    <option>Prepaid review</option>
                    <option>Carrier review</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="form-section">
              <h3>Origin and destination</h3>
              <p className="portal-note">Why we ask: pickup and delivery windows control appointment and detention review.</p>
              <div className="field-grid two">
                <label><span>Origin facility</span><input name="pickupFacility" required defaultValue="Prairie View Cold Dock" /></label>
                <label><span>Destination facility</span><input name="deliveryFacility" required defaultValue="Riverbend Grocery DC" /></label>
                <label><span>Origin</span><input name="pickupAddress" required defaultValue="1420 Commerce Loop, Dallas, TX 75212" /></label>
                <label><span>Destination</span><input name="deliveryAddress" required defaultValue="3100 Distribution Way, Memphis, TN 38118" /></label>
                <label><span>Pickup date / window</span><input name="pickupWindow" required defaultValue="Jun 19, 2026 08:00-10:00 CT" /></label>
                <label><span>Delivery date / window</span><input name="deliveryWindow" required defaultValue="Jun 20, 2026 13:00-15:00 CT" /></label>
                <label className="field-wide"><span>Pickup instructions</span><textarea name="pickupNotes" defaultValue="Dock 3, appointment required, check in with shipping office" /></label>
                <label className="field-wide"><span>Delivery instructions</span><textarea name="deliveryNotes" defaultValue="Receiver requires seal match, signed BOL, and dock photo" /></label>
              </div>
            </div>
            <div className="form-section">
              <h3>Commodity and equipment</h3>
              <p className="portal-note">Why we ask: equipment, temperature, and handling flags determine quote assumptions and release checks.</p>
              <div className="field-grid four">
                <label>
                  <span>Load type</span>
                  <select name="loadType">
                    <option>Refrigerated food</option>
                    <option>Dry van palletized</option>
                    <option>Flatbed machinery</option>
                    <option>High-value retail</option>
                    <option>Hazmat review</option>
                  </select>
                </label>
                <label><span>Commodity</span><textarea name="commodity" required defaultValue="Packaged refrigerated grocery freight" /></label>
                <label><span>Weight</span><input max={45000} min={1} name="weight" required type="number" defaultValue={34200} /></label>
                <label>
                  <span>Equipment</span>
                  <select name="equipmentType">
                    <option>53 ft reefer</option>
                    <option>53 ft dry van</option>
                    <option>48 ft flatbed</option>
                    <option>26 ft box truck</option>
                    <option>Step deck</option>
                    <option>Power-only review</option>
                  </select>
                </label>
                <label><span>Pallets</span><input min={1} name="palletCount" type="number" defaultValue={22} /></label>
                <label><span>Pieces / cases</span><input min={1} name="pieceCount" type="number" defaultValue={1840} /></label>
                <label><span>Dimensions / details</span><textarea name="dimensions" defaultValue="Standard 48x40 pallets" /></label>
                <label><span>Temperature</span><input name="temperature" defaultValue="34-38 F continuous" /></label>
                <label><span>Number of stops</span><input min={2} name="stopCount" type="number" defaultValue={2} /></label>
                <label>
                  <span>Lumper expected</span>
                  <select name="lumper">
                    <option>Possible receiver lumper, receipt required</option>
                    <option>No lumper expected</option>
                    <option>Yes, lumper receipt required</option>
                    <option>Unknown - BOF to confirm</option>
                  </select>
                </label>
                <label className="field-wide"><span>Cargo handling notes</span><textarea name="accessorials" defaultValue="Detention, reefer pre-cool, seal record, cargo photos" /></label>
              </div>
              <div className="toggle-row">
                <label><input defaultChecked name="sealRequired" type="checkbox" /> Seal required</label>
                <label><input defaultChecked name="cargoPhotoRequired" type="checkbox" /> Cargo photo required</label>
                <label><input name="highValue" type="checkbox" /> High-value review</label>
                <label><input name="fragile" type="checkbox" /> Fragile freight</label>
                <label><input name="hazmat" type="checkbox" /> Hazmat review</label>
                <label><input defaultChecked name="insuranceRequired" type="checkbox" /> Cargo insurance review</label>
              </div>
            </div>
            <div className="form-section">
              <h3>Quote assumptions and accessorials</h3>
              <div className="field-grid three">
                <label><span>Lane miles</span><input min={1} name="laneMiles" type="number" defaultValue={452} /></label>
                <label><span>Cargo value / insurance minimum</span><input name="insuranceMinimum" defaultValue="$100,000 cargo" /></label>
                <label><span>Detention threshold</span><input name="detention" defaultValue="2 hours free, billable after" /></label>
                <label><span>Layover / TONU note</span><input name="layoverTonu" defaultValue="Reviewed if appointment cancels after dispatch commitment" /></label>
                <label className="field-wide"><span>Special instructions</span><textarea name="specialInstructions" defaultValue="Call shipping office 30 minutes before arrival; keep reefer set point on paperwork." /></label>
                <label><span>Fuel surcharge note</span><input name="fuelSurcharge" defaultValue="Current BOF review fuel line" /></label>
              </div>
            </div>
            <div className="form-section">
              <h3>Cargo photo</h3>
              <div className="cargo-photo-grid">
                <div className="photo-drop">
                  <input accept="image/*" data-cargo-photo="" id="cargoPhoto" name="cargoPhoto" type="file" />
                  <label htmlFor="cargoPhoto">
                    <strong>Select sample cargo photo</strong>
                    <span data-portal-text="photoStatus">Using a BOF sample image until another sample image is selected.</span>
                  </label>
                </div>
                <p className="portal-sensitive-data-warning" role="note">
                  <strong>Use sample media only.</strong> This preview stays in your browser and does not upload. Do not select a real cargo, customer, driver, medical, payment, credential, or claim file.
                </p>
                <figure>
                  {/* Runtime swaps this preview src in-browser; Next Image cannot receive that. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Sample cargo loaded in trailer" data-portal-image="photoPreview" src="/assets/images/documents/load-proof/pretrip-10482-loaded-cargo.webp" />
                  <figcaption data-portal-text="photoCaption">Sample cargo image attached to the intake packet preview.</figcaption>
                </figure>
              </div>
            </div>
            <div className="portal-actions">
              <button className="primary" data-portal-action="calculate-quote" type="button">Calculate simulated quote</button>
              <button data-portal-action="prepare-packet" type="button">Prepare shipment packet</button>
              <a className="portal-link-button" href="/customer-portal/quotes">Continue to quote review</a>
            </div>
          </section>
        </form>
        <aside className="portal-review-column">
          <section className="portal-panel quote-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Simulated quote</span>
                <h2 data-portal-text="quoteTotal">Calculating</h2>
              </div>
              <span className="portal-status review" data-portal-text="quoteStatus">Review estimate</span>
            </div>
            <div className="quote-lines" data-portal-render="quoteLines" />
            <p className="portal-note">Configurable demo pricing, not a production commercial quote. BOF still reviews lane, equipment, appointment, cargo, and proof before release.</p>
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
            <p className="portal-note">This list is a customer-visible preview of remaining checks. It does not change BOF dispatch readiness engines.</p>
          </section>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">Shipment record</span>
                <h2>Generated IDs</h2>
              </div>
              <span className="portal-status ready">Prepared</span>
            </div>
            <dl className="summary-dl" data-portal-render="idSummary" />
          </section>
        </aside>
      </div>
    </CustomerPortalShell>
  );
}
