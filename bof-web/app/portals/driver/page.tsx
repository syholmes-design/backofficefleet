import { Metadata } from 'next';
import { getDriverPortalProfiles } from '@/lib/demo-portals';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Driver Portal',
  description:
    'A controlled workspace for company drivers and owner-operators to view documents, assignments, proof requirements, settlements, and acknowledgments.',
};

export default function DriverPortalPage() {
  const driverProfiles = getDriverPortalProfiles();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Driver Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A controlled workspace for company drivers and owner-operators to view documents, assignments, proof requirements, settlements, and acknowledgments.
          </p>
        </div>

        {/* Driver Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {driverProfiles.map((driver) => (
            <div
              key={driver.driverId}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300"
            >
              {/* Driver Info */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {driver.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {driver.driverId}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  Worker Type:{' '}
                  <span className="font-semibold">{driver.workerType}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Status:{' '}
                  <span
                    className={`font-semibold ${
                      driver.readinessStatus === 'Ready'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {driver.readinessStatus}
                  </span>
                </div>
              </div>

              {/* Current Assignment */}
              {driver.currentLoadId && (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    Current Assignment
                  </div>
                  <div className="text-sm text-blue-700">
                    Load {driver.currentLoadId} - {driver.currentLoadStatus}
                  </div>
                </div>
              )}

              {/* Status Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Documents:</span>
                  <span
                    className={`font-medium ${
                      driver.documentStatusSummary.includes('expiring')
                        ? 'text-yellow-600'
                        : driver.documentStatusSummary.includes('missing')
                          ? 'text-red-600'
                          : 'text-green-600'
                    }`}
                  >
                    {driver.documentStatusSummary}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Settlements:</span>
                  <span className="font-medium text-gray-900">
                    {driver.settlementStatusSummary}
                  </span>
                </div>
                {driver.pendingAcknowledgments > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium text-orange-600">
                      {driver.pendingAcknowledgments} acknowledgments
                    </span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Link
                href={`/portals/driver/${driver.driverId}`}
                className="inline-flex items-center justify-center w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Open Driver Portal
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5-5m5 5V7m0 0a3 3 0 00-6h3a3 3 0 006 0v8a3 3 0 00-6zm0 0a9 9 0 11-18 0 9 9 0 0118 0"
                  />
                </svg>
              </Link>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Link
            href="/portals"
            className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7 7"
              />
            </svg>
            Back to Portals
          </Link>
        </div>
      </div>
    </div>
  );
}