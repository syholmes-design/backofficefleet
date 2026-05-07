import { Metadata } from 'next';
import { getBofData } from '@/lib/load-bof-data';
import { getCustomerPortalProfile, getCustomerVisibleLoads } from '@/lib/demo-portals';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Customer Portal',
  description: 'Controlled visibility into shipments, proof documents, exceptions, claims, and invoice readiness.',
};

export default function CustomerPortalPage() {
  const data = getBofData();
  const customerProfile = getCustomerPortalProfile();
  const visibleLoads = getCustomerVisibleLoads(data);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Customer Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Controlled visibility into shipments, proof documents, exceptions, claims, and invoice readiness.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
            <div className="text-lg font-bold text-blue-900 mb-2">
              {customerProfile.customerName}
            </div>
            <div className="text-sm text-blue-600">
              Demo Customer Portal
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {customerProfile.activeLoads}
            </div>
            <div className="text-sm text-gray-600">Active Loads</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {customerProfile.deliveredThisWeek}
            </div>
            <div className="text-sm text-gray-600">Delivered This Week</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {customerProfile.documentsAvailable}
            </div>
            <div className="text-sm text-gray-600">Documents Available</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {customerProfile.exceptionsClaims}
            </div>
            <div className="text-sm text-gray-600">Exceptions / Claims</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-teal-600 mb-2">
              {customerProfile.invoicesReady}
            </div>
            <div className="text-sm text-gray-600">Invoices Ready</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Active Shipments */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002 2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z" />
              </svg>
              Active Shipments
            </h2>
            
            <div className="space-y-4">
              {visibleLoads.slice(0, 6).map((load) => (
                <div key={load.loadId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-gray-900">{load.loadId}</div>
                      <div className="text-sm text-gray-600">{load.pickup} → {load.delivery}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        load.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                        load.status === 'En Route' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {load.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">ETA:</span>
                      <span className="font-medium">{load.eta}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Proof:</span>
                      <span className={`font-medium ${
                        load.proofStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {load.proofStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Invoice:</span>
                      <span className={`font-medium ${
                        load.invoiceStatus === 'Ready' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {load.invoiceStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Proof */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0M12 15V7m0 0a3 3 0 00-6h3a3 3 0 006 0v8a3 3 0 00-6zm0 0a9 9 0 11-18 0 9 9 0 0118 0" />
              </svg>
              Delivery Proof
            </h2>
            
            <div className="space-y-4">
              {visibleLoads.filter(load => load.status === 'Delivered').slice(0, 3).map((load) => (
                <div key={load.loadId} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-900 mb-3">
                    {load.loadId} - Proof Bundle
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Link
                      href={`/generated/loads/${load.loadId}/bol.html`}
                      className="flex items-center p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 00-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01-.707-.293H9z" />
                      </svg>
                      <div className="text-sm">BOL</div>
                    </Link>
                    
                    <Link
                      href={`/generated/loads/${load.loadId}/pod.html`}
                      className="flex items-center p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 00-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01-.707-.293H9z" />
                      </svg>
                      <div className="text-sm">Signed BOL / POD</div>
                    </Link>
                    
                    <Link
                      href={`/generated/loads/${load.loadId}/delivery-photo.html`}
                      className="flex items-center p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a9 9 0 114.292 0 5.708 0 4 4 0 00-4 4 4 00-4-4zm0 0a9 9 0 11-18 0 9 9 0 0118 0" />
                      </svg>
                      <div className="text-sm">Delivery Photo</div>
                    </Link>
                    
                    <Link
                      href={`/generated/loads/${load.loadId}/seal-records.html`}
                      className="flex items-center p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4M5 7v10a2 2 0 002 2h10a2 2 0 002 2V7a2 2 0 00-2-2h-2m2 4a2 2 0 012-2v6a2 2 0 01-2 2h6a2 2 0 012-2V9a2 2 0 01-2-2z" />
                      </svg>
                      <div className="text-sm">Seal Records</div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exceptions and Claims */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 0a9 9 0 11-18 0 9 9 0 0118 0m0 0a9 9 0 11-18 0 9 9 0 0118 0" />
              </svg>
              Exceptions and Claims
            </h2>
            
            <div className="space-y-4">
              {visibleLoads.slice(0, 3).map((load) => (
                <div key={load.loadId} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-red-900">{load.loadId}</div>
                      <div className="text-sm text-red-700">
                        Seal Mismatch
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {load.pickup} → {load.delivery}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Requires seal verification
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice / Receivables Status */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2zm-3 6h-6m0 0v6m0 0a3 3 0 00-3 3h6a3 3 0 003-3z" />
              </svg>
              Invoice / Receivables Status
            </h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                          <div>
                                <div className="font-medium text-gray-900">Invoice Ready</div>
                                <div className="text-sm text-gray-600">Ready for customer review</div>
                          </div>
                          <div className="text-right">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Ready
                                </span>
                          </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                          {customerProfile.invoicesReady} invoices ready for customer access
                    </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                          <div>
                                <div className="font-medium text-gray-900">Factored</div>
                                <div className="text-sm text-gray-600">Advanced to customer</div>
                          </div>
                          <div className="text-right">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Active
                                </span>
                          </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                          {customerProfile.invoicesReady} invoices factored and available
                    </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                          <div>
                                <div className="font-medium text-gray-900">Pending POD</div>
                                <div className="text-sm text-gray-600">Awaiting proof of delivery</div>
                          </div>
                          <div className="text-right">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Pending
                                </span>
                          </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                          2 loads awaiting delivery proof
                    </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controlled Access Callout */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            Controlled Access
          </h3>
          <p className="text-blue-800">
            Customers see only shipments, documents, proof, and billing status BOF exposes to them. Internal payroll, driver HR, compliance, and back-office controls remain restricted to manager portal.
          </p>
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
