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
              <div className="text-2xl font-bold text-green-600">{insights.auditReadinessScore || 85}%</div>
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
            href="/command-center"
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Command Center</h3>
            <p className="text-gray-600">Central operations control and dispatch oversight</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zM6 21a6 6 0 1112 0H6z" />
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
