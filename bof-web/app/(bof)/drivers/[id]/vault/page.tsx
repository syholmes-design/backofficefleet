"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getOrderedDocumentsForDriver, readinessFromDocuments } from "@/lib/driver-queries";
import { getDriverDocumentPacket } from "@/lib/driver-doc-registry";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DriverVaultPage({ params }: Props) {
  const { id } = use(params);
  const { data } = useBofDemoData();
  const driver = data.drivers.find(d => d.id === id);
  
  if (!driver) {
    notFound();
  }

  const documents = getOrderedDocumentsForDriver(data, id);
  const readiness = readinessFromDocuments(documents);
  const packet = getDriverDocumentPacket(id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {driver.name} - Document Vault / Qualification File
          </h1>
          
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">DQF Readiness Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{readiness.valid}</div>
                  <div className="text-sm text-gray-600">Ready Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{readiness.missing}</div>
                  <div className="text-sm text-gray-600">Missing Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{readiness.expired}</div>
                  <div className="text-sm text-gray-600">Expired Documents</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Core DQF Documents */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Core DQF Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">CDL Copy</h3>
                  <p className="text-sm text-gray-600 mb-3">Commercial Driver&apos;s License</p>
                  <iframe
                    src={packet.cdl || "about:blank"}
                    className="w-full h-[400px] border-0 rounded"
                    title="CDL Copy"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Medical Card</h3>
                  <p className="text-sm text-gray-600 mb-3">Medical Certification Card</p>
                  <iframe
                    src={packet.medicalCard || "about:blank"}
                    className="w-full h-[400px] border-0 rounded"
                    title="Medical Card"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">MVR</h3>
                  <p className="text-sm text-gray-600 mb-3">Motor Vehicle Record</p>
                  <iframe
                    src={packet.mvr || "about:blank"}
                    className="w-full h-[400px] border-0 rounded"
                    title="MVR"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">PSP / Clearinghouse</h3>
                  <p className="text-sm text-gray-600 mb-3">Pre-Employment Screening Program</p>
                  <iframe
                    src={packet.fmcsaCompliance || "about:blank"}
                    className="w-full h-[400px] border-0 rounded"
                    title="PSP / Clearinghouse"
                  />
                </div>
              </div>
            </div>

            {/* Additional Compliance Documents */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Compliance Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Road Test Certificate</h3>
                  <p className="text-sm text-gray-600 mb-3">Road Test Completion</p>
                  <iframe
                    src={`/generated/drivers/${id}/road_test_certificate.html`}
                    className="w-full h-[400px] border-0 rounded"
                    title="Road Test Certificate"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Prior Employer Inquiry</h3>
                  <p className="text-sm text-gray-600 mb-3">Employment Verification</p>
                  <iframe
                    src={`/generated/drivers/${id}/prior_employer_inquiry.html`}
                    className="w-full h-[400px] border-0 rounded"
                    title="Prior Employer Inquiry"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Annual Review</h3>
                  <p className="text-sm text-gray-600 mb-3">Annual Driving Record Review</p>
                  <iframe
                    src={`/generated/drivers/${id}/qualification-file.html`}
                    className="w-full h-[400px] border-0 rounded"
                    title="Annual Review"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Drug Test Result</h3>
                  <p className="text-sm text-gray-600 mb-3">Drug Screening Results</p>
                  <iframe
                    src={`/generated/drivers/${id}/drug_test_result.html`}
                    className="w-full h-[400px] border-0 rounded"
                    title="Drug Test Result"
                  />
                </div>
              </div>
            </div>

            {/* Supporting Documents */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">I-9 / Employment Authorization</h3>
                  <p className="text-sm text-gray-600 mb-3">Employment Eligibility</p>
                  <iframe
                    src={packet.i9 || "about:blank"}
                    className="w-full h-[400px] border-0 rounded"
                    title="I-9 / Employment Authorization"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">W-9</h3>
                  <p className="text-sm text-gray-600 mb-3">Tax Withholding Form</p>
                  <iframe
                    src={packet.w9 || "about:blank"}
                    className="w-full h-[400px] border-0 rounded"
                    title="W-9"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Emergency Contact</h3>
                  <p className="text-sm text-gray-600 mb-3">Primary + secondary emergency contacts</p>
                  <iframe
                    src={packet.emergencyContact || "about:blank"}
                    className="w-full h-[400px] border-0 rounded"
                    title="Emergency Contact"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Bank Information</h3>
                  <p className="text-sm text-gray-600 mb-3">Payroll/direct-deposit details</p>
                  <iframe
                    src={packet.bankInformation || "about:blank"}
                    className="w-full h-[400px] border-0 rounded"
                    title="Bank Information"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Safety Acknowledgment</h3>
                  <p className="text-sm text-gray-600 mb-3">Safety Policy Acknowledgment</p>
                  <iframe
                    src={`/generated/drivers/${id}/safety-acknowledgment.html`}
                    className="w-full h-[400px] border-0 rounded"
                    title="Safety Acknowledgment"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Medical Summary</h3>
                  <p className="text-sm text-gray-600 mb-3">Medical History Summary</p>
                  <iframe
                    src={`/generated/drivers/${id}/bof-medical-summary.html`}
                    className="w-full h-[400px] border-0 rounded"
                    title="Medical Summary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
