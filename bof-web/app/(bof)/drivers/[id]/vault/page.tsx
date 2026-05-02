"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getOrderedDocumentsForDriver, readinessFromDocuments } from "@/lib/driver-queries";
import { getDriverDocumentPacket } from "@/lib/driver-doc-registry";

type Props = {
  params: Promise<{ id: string }>;
};

type DqfVaultPreviewVariant = "cdl" | "medical" | "standard";

function DqfVaultDocPreviewIframe({
  src,
  title,
  variant,
}: {
  src: string;
  title: string;
  variant: DqfVaultPreviewVariant;
}) {
  const variantClass =
    variant === "cdl"
      ? "bof-dqf-doc-preview--cdl"
      : variant === "medical"
        ? "bof-dqf-doc-preview--medical"
        : "bof-dqf-doc-preview--standard";
  return (
    <div className={`bof-dqf-doc-preview ${variantClass}`}>
      <div className="bof-dqf-doc-preview-frame">
        <iframe src={src} className="bof-dqf-doc-preview-iframe" title={title} />
      </div>
    </div>
  );
}

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
        <div className="bg-white rounded-lg shadow-lg p-6 bof-dqf-doc-vault">
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
                  <DqfVaultDocPreviewIframe src={packet.cdl || "about:blank"} title="CDL Copy" variant="cdl" />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Medical Card</h3>
                  <p className="text-sm text-gray-600 mb-3">Medical Certification Card</p>
                  <DqfVaultDocPreviewIframe
                    src={packet.medicalCard || "about:blank"}
                    title="Medical Card"
                    variant="medical"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">MVR</h3>
                  <p className="text-sm text-gray-600 mb-3">Motor Vehicle Record</p>
                  <DqfVaultDocPreviewIframe src={packet.mvr || "about:blank"} title="MVR" variant="standard" />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">PSP / Clearinghouse</h3>
                  <p className="text-sm text-gray-600 mb-3">Pre-Employment Screening Program</p>
                  <DqfVaultDocPreviewIframe
                    src={packet.fmcsaCompliance || "about:blank"}
                    title="PSP / Clearinghouse"
                    variant="standard"
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
                  <DqfVaultDocPreviewIframe
                    src={`/generated/drivers/${id}/road_test_certificate.html`}
                    title="Road Test Certificate"
                    variant="standard"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Prior Employer Inquiry</h3>
                  <p className="text-sm text-gray-600 mb-3">Employment Verification</p>
                  <DqfVaultDocPreviewIframe
                    src={`/generated/drivers/${id}/prior_employer_inquiry.html`}
                    title="Prior Employer Inquiry"
                    variant="standard"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Annual Review</h3>
                  <p className="text-sm text-gray-600 mb-3">Annual Driving Record Review</p>
                  <DqfVaultDocPreviewIframe
                    src={`/generated/drivers/${id}/qualification-file.html`}
                    title="Annual Review"
                    variant="standard"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Drug Test Result</h3>
                  <p className="text-sm text-gray-600 mb-3">Drug Screening Results</p>
                  <DqfVaultDocPreviewIframe
                    src={`/generated/drivers/${id}/drug_test_result.html`}
                    title="Drug Test Result"
                    variant="standard"
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
                  <DqfVaultDocPreviewIframe
                    src={packet.i9 || "about:blank"}
                    title="I-9 / Employment Authorization"
                    variant="standard"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">W-9</h3>
                  <p className="text-sm text-gray-600 mb-3">Tax Withholding Form</p>
                  <DqfVaultDocPreviewIframe src={packet.w9 || "about:blank"} title="W-9" variant="standard" />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Emergency Contact</h3>
                  <p className="text-sm text-gray-600 mb-3">Primary + secondary emergency contacts</p>
                  <DqfVaultDocPreviewIframe
                    src={packet.emergencyContact || "about:blank"}
                    title="Emergency Contact"
                    variant="standard"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Bank Information</h3>
                  <p className="text-sm text-gray-600 mb-3">Payroll/direct-deposit details</p>
                  <DqfVaultDocPreviewIframe
                    src={packet.bankInformation || "about:blank"}
                    title="Bank Information"
                    variant="standard"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Safety Acknowledgment</h3>
                  <p className="text-sm text-gray-600 mb-3">Safety Policy Acknowledgment</p>
                  <DqfVaultDocPreviewIframe
                    src={`/generated/drivers/${id}/safety-acknowledgment.html`}
                    title="Safety Acknowledgment"
                    variant="standard"
                  />
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">Medical Summary</h3>
                  <p className="text-sm text-gray-600 mb-3">Medical History Summary</p>
                  <DqfVaultDocPreviewIframe
                    src={`/generated/drivers/${id}/bof-medical-summary.html`}
                    title="Medical Summary"
                    variant="standard"
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
