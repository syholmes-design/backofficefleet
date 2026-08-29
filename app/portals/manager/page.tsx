import { Metadata } from 'next';
import { getBofData } from '@/lib/load-bof-data';
import { getManagerInsights } from '@/lib/demo-portals';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fleet Owner / Manager Portal',
  description: 'The command layer for fleet operations, compliance, documents, settlements, finance, and risk.',
};

export default function ManagerPortalPage() {
  const data = getBofData();
  const insights = getManagerInsights(data);
  const activeLoads = data.loads.filter((load) => load.status !== 'Delivered');
  const deliveredLoads = data.loads.filter((load) => load.status === 'Delivered');
  const proofCompleteLoads = data.loads.filter((load) => /verified|complete/i.test(String(load.podStatus ?? '')));
  const openSafetyIssues = data.complianceIncidents.filter((incident) => !/closed|resolved/i.test(String(incident.status ?? ''))).length;
  const activeDrivers = data.drivers.length;
  const ownerAttention = [
    ...data.loads
      .filter((load) => load.dispatchExceptionFlag || load.sealStatus === 'Mismatch')
      .slice(0, 4)
      .map((load) => ({ severity: 'High', title: `Load ${load.id} needs proof review`, detail: `${load.origin} → ${load.destination}`, href: `/loads/${load.id}`, label: 'Review load' })),
    ...data.documents
      .filter((document) => /expired|expiring|missing/i.test(String(document.status ?? '')))
      .slice(0, 3)
      .map((document) => ({ severity: 'Medium', title: `${document.type} needs review`, detail: document.driverId ?? 'Driver document', href: document.driverId ? `/drivers/${document.driverId}/vault` : '/documents', label: 'Open record' })),
    ...data.settlements
      .filter((settlement) => /pending review|disputed|hold/i.test(String(settlement.status ?? '')))
      .slice(0, 3)
      .map((settlement) => ({ severity: 'Medium', title: `Settlement ${settlement.settlementId} needs review`, detail: settlement.driverId ?? 'Driver settlement', href: settlement.driverId ? `/drivers/${settlement.driverId}/settlements` : '/settlements', label: 'Review settlement' })),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Fleet Owner / Manager Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The command layer for fleet operations, compliance, documents, settlements, finance, and risk.
          </p>
        </div>

        {/* Owner Attention Section */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-red-900 mb-4">
            Owner Attention Required
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{insights.criticalAlerts}</div>
              <div className="text-sm text-gray-600">Critical Alerts</div>
            </div>
            <div className="bg-white rounded p-4 border border-red-200">
              <div className="text-2xl font-bold text-orange-600">{insights.blockedDispatchItems}</div>
              <div className="text-sm text-gray-600">Blocked Dispatch Items</div>
            </div>
            <div className="bg-white rounded p-4 border border-red-200">
              <div className="text-2xl font-bold text-yellow-600">{insights.expiringDocuments}</div>
              <div className="text-sm text-gray-600">Expiring Documents</div>
            </div>
            <div className="bg-white rounded p-4 border border-red-200">
              <div className="text-2xl font-bold text-blue-600">{insights.settlementReviewItems}</div>
              <div className="text-sm text-gray-600">Settlement Review Items</div>
            </div>
            <div className="bg-white rounded p-4 border border-red-200">
              <div className="text-2xl font-bold text-purple-600">{insights.openClaims}</div>
              <div className="text-sm text-gray-600">Open Claims/Exceptions</div>
            </div>
            <div className="bg-white rounded p-4 border border-red-200">
              <div className="text-2xl font-bold text-gray-600">{insights.documentsNeedingAcknowledgment}</div>
              <div className="text-sm text-gray-600">Documents Needing Acknowledgment</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 mb-8">
          <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm" aria-labelledby="fleet-health-heading">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Fleet Health</p>
                <h2 id="fleet-health-heading" className="text-2xl font-bold text-gray-900">The operating record at a glance</h2>
              </div>
              <Link href="/dashboard" className="text-sm font-semibold text-teal-700 hover:text-teal-900">Open dashboard →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ['Active loads', activeLoads.length, '/dispatch'],
                ['Delivered loads', deliveredLoads.length, '/loads'],
                ['Proof complete', proofCompleteLoads.length, '/dispatch'],
                ['Open safety issues', openSafetyIssues, '/safety'],
                ['Active drivers', activeDrivers, '/drivers'],
                ['Maintenance exposure', data.moneyAtRisk.filter((row) => /maintenance|repair|tire|asset/i.test(`${row.category} ${row.rootCause}`)).length, '/maintenance'],
              ].map(([label, value, href]) => (
                <Link key={String(label)} href={String(href)} className="rounded border border-slate-200 bg-slate-50 p-4 hover:border-teal-400">
                  <div className="text-2xl font-bold text-slate-900">{value}</div>
                  <div className="mt-1 text-sm text-slate-600">{label}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 rounded-lg p-6 text-white" aria-labelledby="owner-queue-heading">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Owner Attention</p>
                <h2 id="owner-queue-heading" className="text-2xl font-bold">What needs a decision</h2>
              </div>
              <span className="text-sm text-slate-400">{ownerAttention.length} items</span>
            </div>
            <div className="space-y-3">
              {ownerAttention.length === 0 ? <p className="text-sm text-slate-400">No canonical attention items are currently surfaced.</p> : null}
              {ownerAttention.slice(0, 6).map((item) => (
                <Link key={`${item.severity}-${item.title}`} href={item.href} className="block rounded border border-slate-800 bg-slate-900 p-3 hover:border-cyan-500">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-xs font-bold uppercase ${item.severity === 'High' ? 'text-rose-300' : 'text-amber-300'}`}>{item.severity}</span>
                    <span className="text-xs font-semibold text-cyan-300">{item.label} →</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Cash Flow and Audit Readiness Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-blue-900 mb-4">
            Cash Flow & Audit Readiness
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded p-4 border border-blue-200">
              <div className="text-2xl font-bold text-red-600">{insights.billingBlockers || 3}</div>
              <div className="text-sm text-gray-600">Cash Flow Blockers</div>
              <p className="text-xs text-gray-500 mt-2">Delivered loads with missing proof, invoice holds, or factoring review items may delay cash collection.</p>
              <Link
                href="/fleet-financials"
                className="inline-flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium mt-2"
              >
                Open Fleet Financials →
              </Link>
            </div>
            <div className="bg-white rounded p-4 border border-blue-200">
              <div className="text-2xl font-bold text-green-600">
                {insights.auditReadinessScore == null ? "Not available" : `${insights.auditReadinessScore}%`}
              </div>
              <div className="text-sm text-gray-600">Audit Readiness Score</div>
              <p className="text-xs text-gray-500 mt-2">Fuel, mileage, proof, invoice, settlement, and asset records are monitored for period-close and audit support.</p>
              <div className="mt-3 p-2 bg-purple-50 rounded border border-purple-200">
                <p className="text-xs text-purple-800">
                  <strong>Owner-Operator Settlements:</strong> May be modeled by mileage rate, percentage of linehaul, flat trip rate, or hybrid settlement terms.
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Link
                  href="/fleet-financials"
                  className="inline-flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  Fleet Financials →
                </Link>
                <Link
                  href="/documents/company-operations-vault"
                  className="inline-flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  Company Vault →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Portal Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Command Center */}
          <Link
            href="/dashboard"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0M12 15V7m0 0a3 3 0 00-6h3a3 3 0 006 0v8a3 3 0 00-6zm0 0a9 9 0 11-18 0 9 9 0 0118 0" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Operational Overview</h3>
            <p className="text-gray-600">Canonical operating dashboard for dispatch, financial, and fleet visibility</p>
          </Link>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l4-2m4 2l2-2m-2 2l-2-2m14 8V5a2 2 0 00-2-2h-1a2 2 0 00-2 2v1a2 2 0 002 2h1a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Dashboard</h3>
            <p className="text-gray-600">Fleet overview and key performance metrics</p>
          </Link>

          {/* Drivers */}
          <Link
            href="/drivers"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 114.292 0 5.708 0 4 4 0 00-4 4 4 4 00-4-4 4 4 00-4-4zm0 10A6 6 0 1118 0 6 6 0 0118 0zm0 0a9 9 0 11-18 0 9 9 0 0118 0" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Drivers</h3>
            <p className="text-gray-600">Driver profiles, compliance, and worker classification</p>
          </Link>

          {/* Dispatch/Loads */}
          <Link
            href="/dispatch"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Dispatch / Loads</h3>
            <p className="text-gray-600">Load planning, assignment, and execution</p>
          </Link>

          {/* Documents */}
          <Link
            href="/documents"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 00-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.707 0l5.414-5.414a1 1 0 01-.707-.293H9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Documents</h3>
            <p className="text-gray-600">Company documents, policies, and compliance</p>
          </Link>

          {/* Company Operations Vault */}
          <Link
            href="/documents/company-operations-vault"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m2 4a2 2 0 012-2v6a2 2 0 01-2 2h6a2 2 0 012-2V9a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Company Operations Vault</h3>
            <p className="text-gray-600">HR, finance, security, and governance policies</p>
          </Link>

          {/* Settlements/Payroll */}
          <Link
            href="/settlements"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2zm-3 6h-6m0 0v6m0 0a3 3 0 00-3 3h6a3 3 0 003-3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Settlements / Payroll</h3>
            <p className="text-gray-600">Driver settlements and payroll processing</p>
          </Link>

          {/* Safety/Compliance */}
          <Link
            href="/safety"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0M12 15V7m0 0a3 3 0 00-6h3a3 3 0 006 0v8a3 3 0 00-6zm0 0a9 9 0 11-18 0 9 9 0 0118 0" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Safety / Compliance</h3>
            <p className="text-gray-600">Safety programs and compliance management</p>
          </Link>

          {/* Fleet Financials */}
          <Link
            href="/fleet-financials"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3-1.343-3-3 0-1.657 1.343-3 3 0 1.657-1.343 3-3 3 0 1.657 1.343 3 3zm0 0a9 9 0 11-18 0 9 9 0 0118 0zm0 0a9 9 0 11-18 0 9 9 0 0118 0" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Fleet Financials</h3>
            <p className="text-gray-600">Load profitability, assumption modeling, and management P&L</p>
          </Link>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Link
            href="/portals"
            className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7" />
            </svg>
            Back to Portals
          </Link>
        </div>
      </div>
    </div>
  );
}
