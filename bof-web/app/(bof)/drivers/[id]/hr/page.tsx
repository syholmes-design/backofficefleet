"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getDriverDocumentPacket } from "@/lib/driver-doc-registry";
import { getDriverOperationalProfile } from "@/lib/driver-operational-profile";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DriverHRPage({ params }: Props) {
  const { id } = use(params);
  const { data } = useBofDemoData();
  const driver = data.drivers.find(d => d.id === id);
  const profile = getDriverOperationalProfile(data, id);
  const packet = getDriverDocumentPacket(id);
  
  if (!driver) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {driver.name} - HR & Administrative Record
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emergency Contact */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Name:</span>
                  <p className="text-gray-700">{driver.emergencyContactName}</p>
                </div>
                <div>
                  <span className="font-medium">Relationship:</span>
                  <p className="text-gray-700">{driver.emergencyContactRelationship}</p>
                </div>
                <div>
                  <span className="font-medium">Phone:</span>
                  <p className="text-gray-700">{driver.emergencyContactPhone}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p className="text-gray-700">{profile?.primaryEmergencyEmail || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Address:</span>
                  <p className="text-gray-700">{profile?.primaryEmergencyAddress || "—"}</p>
                </div>
              </div>
            </div>

            {/* Secondary Contact */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Secondary Contact</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Name:</span>
                  <p className="text-gray-700">{profile?.secondaryEmergencyName || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Relationship:</span>
                  <p className="text-gray-700">{profile?.secondaryEmergencyRelationship || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Phone:</span>
                  <p className="text-gray-700">{profile?.secondaryEmergencyPhone || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p className="text-gray-700">{profile?.secondaryEmergencyEmail || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Address:</span>
                  <p className="text-gray-700">{profile?.secondaryEmergencyAddress || "—"}</p>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank & Direct Deposit</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Bank Name:</span>
                  <p className="text-gray-700">{profile?.bankName || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Account Type:</span>
                  <p className="text-gray-700">{profile?.bankAccountType || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Last 4 Digits:</span>
                  <p className="text-gray-700">{profile?.bankAccountLast4 || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Payment Preference:</span>
                  <p className="text-gray-700">{profile?.paymentPreference || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p className="text-green-600 font-medium">{profile?.bankStatus || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Submission Date:</span>
                  <p className="text-gray-700">{profile?.bankSubmissionDate || "—"}</p>
                </div>
              </div>
            </div>

            {/* Tax & Employment */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax & Employment</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Tax Classification:</span>
                  <p className="text-gray-700">{profile?.taxClassification || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">TIN Type:</span>
                  <p className="text-gray-700">{profile?.tinType || "—"}</p>
                </div>
                <div>
                  <span className="font-medium">Hire Date:</span>
                  <p className="text-gray-700">Onboarding Complete</p>
                </div>
                <div>
                  <span className="font-medium">Handbook Acknowledgment:</span>
                  <p className="text-green-600 font-medium">Signed</p>
                </div>
                <div>
                  <span className="font-medium">Orientation Checklist:</span>
                  <p className="text-green-600 font-medium">Complete</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Generated HR packet links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {[
                ["I-9 document", packet.i9],
                ["W-9 document", packet.w9],
                ["Emergency Contact document", packet.emergencyContact],
                ["Bank Information document", packet.bankInformation],
                ["FMCSA Compliance document", packet.fmcsaCompliance],
                ["Medical Card document", packet.medicalCard],
              ].map(([label, href]) =>
                href ? (
                  <a key={label} className="text-teal-700 hover:underline" href={href} target="_blank" rel="noreferrer">{label}</a>
                ) : (
                  <span key={label} className="text-amber-700">{label}: Missing / Needs review</span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
