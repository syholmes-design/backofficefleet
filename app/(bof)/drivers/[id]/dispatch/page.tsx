/**
 * BOF Route Owner:
 * URL: /drivers/:id/dispatch
 * Type: DEMO
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { notFound } from "next/navigation";
import { getBofData } from "@/lib/load-bof-data";
import { assignedTrucksForDriver, primaryAssignedTruck } from "@/lib/driver-queries";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const data = getBofData();
  return data.drivers.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  const d = data.drivers.find((row) => row.id === id);
  return {
    title: d ? `${d.name} | Dispatch | BOF` : "Dispatch | BOF",
  };
}

export default async function DriverDispatchPage({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  const driver = data.drivers.find((d) => d.id === id);

  if (!driver) notFound();

  // Get current operational context for this driver
  const activeLoad = data.loads.find((l) => l.driverId === id && (l.status === "En Route" || l.status === "Pending"));
  const trucks = assignedTrucksForDriver(data, id);
  const primary = primaryAssignedTruck(data, id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {driver.name} - Current Operations
          </h1>
          
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Current Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {activeLoad ? "On Duty" : "Available"}
                  </div>
                  <div className="text-sm text-gray-600">Operational Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {trucks.length > 0 ? primary || trucks[0] : "Unassigned"}
                  </div>
                  <div className="text-sm text-gray-600">Assigned Asset</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Current Load Details */}
            {activeLoad && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Load Details</h2>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Load Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Revenue:</span>
                          <span className="text-gray-700">${activeLoad.revenue}</span>
                        </div>
                        <div>
                          <span className="font-medium">Backhaul Pay:</span>
                          <span className="text-gray-700">${activeLoad.backhaulPay}</span>
                        </div>
                        <div>
                          <span className="font-medium">POD Status:</span>
                          <span className="text-gray-700">{activeLoad.podStatus}</span>
                        </div>
                        <div>
                          <span className="font-medium">Seal Status:</span>
                          <span className="text-gray-700">{activeLoad.sealStatus}</span>
                        </div>
                        <div>
                          <span className="font-medium">Origin:</span>
                          <span className="text-gray-700">{activeLoad.origin}</span>
                        </div>
                        <div>
                          <span className="font-medium">Destination:</span>
                          <span className="text-gray-700">{activeLoad.destination}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Load Status</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Status:</span>
                          <span className="text-gray-700">{activeLoad.status}</span>
                        </div>
                        <div>
                          <span className="font-medium">Pickup Seal:</span>
                          <span className="text-gray-700">{activeLoad.pickupSeal}</span>
                        </div>
                        <div>
                          <span className="font-medium">Delivery Seal:</span>
                          <span className="text-gray-700">{activeLoad.deliverySeal}</span>
                        </div>
                        <div>
                          <span className="font-medium">ETA:</span>
                          <span className="text-gray-700">2:30 PM Today</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
            )}

            {/* Load Documents */}
            {activeLoad && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Load Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2">Bill of Lading</h3>
                    <p className="text-sm text-gray-600 mb-3">Primary shipping document</p>
                    <a
                      href={`/loads/${activeLoad.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View BOL
                    </a>
                  </div>
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2">Rate Confirmation</h3>
                    <p className="text-sm text-gray-600 mb-3">Payment terms and rates</p>
                    <a
                      href={`/loads/${activeLoad.id}`}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      View Rate Con
                    </a>
                  </div>
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2">Proof of Delivery</h3>
                    <p className="text-sm text-gray-600 mb-3">Delivery confirmation</p>
                    <a
                      href={`/loads/${activeLoad.id}`}
                      className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      View POD
                    </a>
                  </div>
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2">Invoice</h3>
                    <p className="text-sm text-gray-600 mb-3">Billing document</p>
                    <a
                      href={`/loads/${activeLoad.id}`}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      View Invoice
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Dispatch Instructions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dispatch Instructions</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Route Instructions</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>Follow primary route unless dispatcher advises otherwise</li>
                      <li>Call dispatcher for any route deviations</li>
                      <li>Update ETA at each stop</li>
                      <li>Report any delivery issues immediately</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Safety Requirements</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>Pre-trip inspection required</li>
                      <li>HOS compliance check before departure</li>
                      <li>Weather conditions check at each stop</li>
                      <li>Secure load properly before transit</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Communication Protocol</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>Daily check-in with dispatcher</li>
                      <li>Report arrival/departure at each stop</li>
                      <li>Immediate notification for any delays</li>
                      <li>End-of-day status report</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* No Active Load */}
            {!activeLoad && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability Status</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Available</div>
                    <div className="text-sm text-gray-600">Driver is currently available for assignment</div>
                    <div className="mt-4">
                      <a
                        href="/dispatch"
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        View Available Loads
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
