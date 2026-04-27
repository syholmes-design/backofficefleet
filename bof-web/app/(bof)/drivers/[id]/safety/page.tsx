"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { complianceNotesForDriver } from "@/lib/driver-queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DriverSafetyPage({ params }: Props) {
  const { id } = use(params);
  const { data } = useBofDemoData();
  const driver = data.drivers.find(d => d.id === id);
  
  if (!driver) {
    notFound();
  }

  const compliance = complianceNotesForDriver(data, id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {driver.name} - Safety & Risk Management
          </h1>
          
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Current Risk Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {compliance.filter(c => c.severity.toUpperCase() === "HIGH" && c.status.toUpperCase() !== "CLOSED").length}
                  </div>
                  <div className="text-sm text-gray-600">Open High Risk Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {compliance.filter(c => c.severity.toUpperCase() === "MEDIUM" && c.status.toUpperCase() !== "CLOSED").length}
                  </div>
                  <div className="text-sm text-gray-600">Open Medium Risk Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {compliance.filter(c => c.status.toUpperCase() === "CLOSED").length}
                  </div>
                  <div className="text-sm text-gray-600">Resolved Items</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Safety Events */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Safety Events</h2>
              <div className="space-y-4">
                {compliance.filter(c => c.severity?.toUpperCase() === "HIGH").map((item, index) => (
                  <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-red-900">{item.type}</h3>
                        <p className="text-sm text-red-700 mt-1">Compliance issue requiring immediate attention</p>
                        <p className="text-xs text-red-600 mt-2">
                          Status: {item.status}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                        HIGH
                      </span>
                    </div>
                  </div>
                ))}
                {compliance.filter(c => c.severity?.toUpperCase() === "CRITICAL").map((item, index) => (
                  <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-red-900">{item.type}</h3>
                        <p className="text-sm text-red-700 mt-1">Critical compliance issue blocking operations</p>
                        <p className="text-xs text-red-600 mt-2">
                          Status: {item.status}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                        CRITICAL
                      </span>
                    </div>
                  </div>
                ))}
                {compliance.filter(c => c.severity?.toUpperCase() === "DUE_SOON").map((item, index) => (
                  <div key={index} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-orange-900">{item.type}</h3>
                        <p className="text-sm text-orange-700 mt-1">Compliance issue due soon</p>
                        <p className="text-xs text-orange-600 mt-2">
                          Status: {item.status}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-orange-600 text-white text-sm rounded-full">
                        DUE SOON
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Training & Corrective Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Training & Corrective Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Required Training</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Defensive Driving Course</li>
                    <li>• Hazardous Materials Handling</li>
                    <li>• Hours of Service Compliance</li>
                    <li>• Pre-Trip Inspection Procedures</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Corrective Actions</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Additional supervision required for 30 days</li>
                    <li>• Weekly safety reviews with dispatcher</li>
                    <li>• Mandatory rest break verification</li>
                    <li>• Equipment inspection before each trip</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Expiring Credentials */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Expiring Credentials</h2>
              <div className="space-y-3">
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-yellow-900">Medical Card</h3>
                      <p className="text-sm text-yellow-700">Expires in 45 days</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-full">
                      Expiring Soon
                    </span>
                  </div>
                </div>
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-green-900">CDL License</h3>
                      <p className="text-sm text-green-700">Expires in 2 years</p>
                    </div>
                    <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                      Current
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Open Safety Reviews */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Open Safety Reviews</h2>
              <div className="space-y-4">
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-blue-900">Quarterly Safety Review</h3>
                      <p className="text-sm text-blue-700 mt-1">Review of last 90 days driving incidents and compliance</p>
                      <p className="text-xs text-blue-600 mt-2">
                        Scheduled: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                      Scheduled
                    </span>
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
