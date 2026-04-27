"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getOrderedDocumentsForDriver, readinessFromDocuments, assignedTrucksForDriver, primaryAssignedTruck, complianceNotesForDriver } from "@/lib/driver-queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DriverProfilePage({ params }: Props) {
  const { id } = use(params);
  const { data } = useBofDemoData();
  const driver = data.drivers.find(d => d.id === id);
  
  if (!driver) {
    notFound();
  }

  // Check if there's a richer compiled dashboard for this driver
  const hasRichDashboard = id === "DRV-001"; // John Carter has rich dashboard
  
  if (hasRichDashboard) {
    // Redirect to compiled dashboard
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {driver.name} - Profile Dashboard
            </h1>
            <div className="prose">
              <p className="text-gray-600 mb-4">
                Opening compiled driver profile dashboard for {driver.name}...
              </p>
              <iframe
                src={`/generated/drivers/${id}/john-carter-profile-dashboard.html`}
                className="w-full h-[800px] border-0 rounded"
                title={`${driver.name} Profile Dashboard`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generic profile view for drivers without rich dashboards
  const documents = getOrderedDocumentsForDriver(data, id);
  const readiness = readinessFromDocuments(documents);
  const trucks = assignedTrucksForDriver(data, id);
  const primary = primaryAssignedTruck(data, id);
  const compliance = complianceNotesForDriver(data, id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {driver.name} - Profile
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Driver Identity Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver Identity</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <img
                    src={(driver as { photoUrl?: string }).photoUrl?.trim() || `/generated/drivers/${id}/${id}.png`}
                    alt={driver.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{driver.name}</p>
                    <p className="text-sm text-gray-500">{driver.id}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">CDL Class/State:</span> {driver.licenseClass} / {driver.licenseState}</p>
                  <p><span className="font-medium">CDL Number:</span> {(driver as { referenceCdlNumber?: string }).referenceCdlNumber}</p>
                  <p><span className="font-medium">Date of Birth:</span> {(driver as { dateOfBirth?: string }).dateOfBirth}</p>
                </div>
              </div>
            </div>

            {/* Compliance Overview */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ready Documents:</span>
                  <span className="text-green-600 font-semibold">{readiness.valid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Missing Documents:</span>
                  <span className="text-red-600 font-semibold">{readiness.missing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Expired Documents:</span>
                  <span className="text-orange-600 font-semibold">{readiness.expired}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    readiness.missing + readiness.expired === 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {readiness.missing + readiness.expired === 0 ? 'Ready' : 'Action Required'}
                  </span>
                </div>
              </div>
            </div>

            {/* Asset Assignment */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Assignment</h2>
              <div className="space-y-2">
                {trucks.length === 0 ? (
                  <p className="text-gray-500">Unassigned</p>
                ) : (
                  <div>
                    <p className="font-medium">Assigned Assets:</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {trucks.map(truck => (
                        <li key={truck}>{truck}</li>
                      ))}
                    </ul>
                    {primary && (
                      <p className="text-sm text-green-600">Primary: {primary}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Operational Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Operational Summary</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Current Load:</span>
                  <span className="text-gray-700">
                    {data.loads.find(l => l.driverId === id && (l.status === "En Route" || l.status === "Pending"))?.number || "Available"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className="text-gray-700">Available at Terminal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
