import { Metadata } from 'next';
import { getDriverPortalProfiles } from '@/lib/demo-portals';
import { getPendingAcknowledgments } from '@/lib/driver-acknowledgment-details';
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
                    <div className="group relative">
                      <span className="font-medium text-orange-600 cursor-help">
                        {driver.pendingAcknowledgments} acknowledgments
                      </span>
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                        <div className="font-medium mb-1">Pending Acknowledgments:</div>
                        {(() => {
                          const pendingAcks = getPendingAcknowledgments(driver.driverId);
                          return pendingAcks.map((ack) => (
                            <div key={ack.type} className="text-gray-300">
                              • {ack.type}
                            </div>
                          ));
                        })()}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
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
                    d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5M6 6h4.5M6 6v12h12v-4.5"
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
