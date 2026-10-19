import Link from "next/link";

/**
 * The BOF service model in one place: what BOF personnel perform, what customers see and do in their
 * portals, and why one centralized back office works better than each carrier staffing its own.
 * Shared by the homepage and /business-operations so both say the same thing.
 */

const BOF_PERFORMS: Array<[string, string]> = [
  ["Recruiting administration", "/recruiting-onboarding"],
  ["Driver onboarding and qualification files", "/recruiting-onboarding#activation"],
  ["Compliance coordination and document control", "/services/documents"],
  ["Dispatch administration and shipment support", "/services/dispatch"],
  ["Operational monitoring and exception follow-up", "/services/drivers"],
  ["Settlement administration and financial support", "/services/settlements"],
];

const PORTAL_PROVIDES: Array<[string, string]> = [
  ["Raise and approve driver requisitions", "Carrier managers"],
  ["Submit loads, track shipments, retrieve documents and invoices", "Customers (customer portal)"],
  ["See readiness, open exceptions and the status of BOF's work", "Fleet managers (manager portal)"],
  ["See their own documents, readiness and qualification status", "Drivers (driver portal)"],
];

const ADVANTAGES: Array<[string, string]> = [
  ["Centralized service delivery", "One trained team runs recruiting through settlements for every carrier in the network."],
  ["Consistent process enforcement", "The same approvals, qualification gates and settlement holds apply to every carrier."],
  ["Less duplicated administration", "Carriers stop staffing the same recruiting, compliance and billing desks separately."],
  ["Operational visibility", "Aggregators and carriers see the status of the work instead of chasing it by email."],
  ["Coordinated recruiting and qualification", "A hire moves from requisition to a qualified, dispatch-ready driver in one record."],
  ["Document and compliance management", "Missing, expired or rejected documents block the work they affect, automatically."],
  ["Dispatch and shipment support", "Assignments use the driver, equipment and qualification facts BOF already maintains."],
  ["Financial administration and settlements", "Delivery evidence and exceptions decide settlement eligibility before money moves."],
  ["Economies of scale", "Shared staff and tooling spread back-office cost across the whole network."],
];

export function MarketingServiceModel({ headingId = "service-model-heading" }: { headingId?: string }) {
  return (
    <section id="service-model" className="bof-home-section" aria-labelledby={headingId}>
      <div className="bof-mkt-container">
        <div className="bof-home-section-head">
          <p className="bof-home-eyebrow bof-home-eyebrow--ink">How the service works</p>
          <h2 id={headingId}>BOF personnel do the back-office work. Your portal shows it.</h2>
          <p>
            BackOfficeFleet is an outsourced back-office operator for transportation aggregators and their affiliated carriers. BOF staff
            perform the work on BOF&apos;s own technology; customers, carriers and drivers use portals to request work, approve it and see
            where it stands. Each carrier&apos;s drivers, documents and finances stay separate.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-950">Performed by BOF personnel</h3>
            <ul className="mt-4 grid gap-2 text-slate-700">
              {BOF_PERFORMS.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="font-semibold text-teal-800 hover:underline">
                    {label} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-950">Available to you in your portal</h3>
            <ul className="mt-4 grid gap-3 text-slate-700">
              {PORTAL_PROVIDES.map(([what, who]) => (
                <li key={what}>
                  <span className="block font-semibold text-slate-900">{what}</span>
                  <span className="text-sm text-slate-600">{who}</span>
                </li>
              ))}
            </ul>
            <Link href="/portals" className="mt-4 inline-block text-sm font-semibold text-teal-800 hover:underline">
              See the portals <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <h3 className="mt-10 text-lg font-bold text-slate-950">Why one back office across the network</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map(([title, body]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="font-semibold text-slate-950">{title}</dt>
              <dd className="ml-0 mt-1 text-sm text-slate-600">{body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
