/**
 * BOF Route Owner:
 * URL: /drivers/:id/settlements
 * Type: DEMO
 * Primary component: DriverSettlementsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DriverSettlementsPage({ params }: Props) {
  const { id } = use(params);
  const { data } = useBofDemoData();
  const driver = data.drivers.find(d => d.id === id);
  
  if (!driver) {
    notFound();
  }

  // Calculate individual driver settlements (mock data for now)
  const driverSettlements = data.moneyAtRisk?.filter(m => m.driverId === id) || [];
  const totalPending = driverSettlements.reduce((sum, m) => sum + (m.amount || 0), 0);
  const openIssues = driverSettlements.filter(m => m.status === "OPEN").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {driver.name} - Settlements & Pay
          </h1>
          
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-2">Pay Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${totalPending.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Pending Pay</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {openIssues}
                  </div>
                  <div className="text-sm text-gray-600">Open Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    Active
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Pending Settlements */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Settlements</h2>
              <div className="space-y-4">
                {driverSettlements.filter(m => m.status === "OPEN").map((settlement, index) => (
                  <div key={index} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-orange-900">
                          {settlement.id}
                        </h3>
                        <p className="text-sm text-orange-700 mt-1">
                          {settlement.rootCause}
                        </p>
                        <p className="text-xs text-orange-600 mt-2">
                          Load: {settlement.loadId || "General"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-orange-600">
                          ${(settlement.amount || 0).toFixed(2)}
                        </div>
                        <span className="ml-2 px-3 py-1 bg-orange-600 text-white text-sm rounded-full">
                          OPEN
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {driverSettlements.filter(m => m.status === "OPEN").length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pending settlements
                  </div>
                )}
              </div>
            </div>

            {/* Recent Settlement History */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Settlement History</h2>
              <div className="space-y-4">
                {driverSettlements.slice(0, 5).map((settlement, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {settlement.id}
                        </h3>
                        <p className="text-sm text-gray-700 mt-1">
                          {settlement.rootCause}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          Load: {settlement.loadId || "General"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ${(settlement.amount || 0).toFixed(2)}
                        </div>
                        <span className="ml-2 px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                          PAID
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {driverSettlements.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No settlement history available
                  </div>
                )}
              </div>
            </div>

            {/* Deductions & Accessorials */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Deductions & Accessorials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Recent Deductions</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Fuel advance: $45.00</li>
                    <li>• Equipment rental: $25.00</li>
                    <li>• Insurance deductible: $150.00</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Accessorials</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Detention: 2.5 hours @ $25/hr</li>
                    <li>• Lumper fees: $125.00</li>
                    <li>• Extra stop: $75.00</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Cycle Status */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Cycle Status</h2>
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">Current Cycle</h3>
                    <p className="text-sm text-blue-700">Week 47 - 2025</p>
                    <p className="text-xs text-blue-600">Pay Date: Friday, Nov 28, 2025</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">Payment Method</h3>
                    <p className="text-sm text-blue-700">Direct Deposit</p>
                    <p className="text-xs text-blue-600">Bank: {(driver as { bankName?: string }).bankName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
