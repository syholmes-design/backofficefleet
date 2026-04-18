"use client";

import type { DocumentRow } from "@/lib/driver-queries";
import {
  JOHN_CARTER_PRIMARY_EXTRA_TYPES,
  JOHN_CARTER_SECONDARY_TYPE_ORDER,
} from "@/lib/john-carter-reference";
import { DriverDocumentsPanel } from "@/components/DriverDocumentsPanel";

export type DriverFleetDocumentStacksProps = {
  driverId: string;
  driverName: string;
  primaryCore: DocumentRow[];
  primaryExtra: DocumentRow[];
  secondary: DocumentRow[];
};

/**
 * Fleet document layout: primary core (7), primary extensions (MCSA-5875, emergency),
 * then secondary / workflow. Same structure for every driver; DRV-001 keeps curated
 * PDF/HTML assets via demo-data URLs.
 */
export function DriverFleetDocumentStacks({
  driverId,
  driverName,
  primaryCore,
  primaryExtra,
  secondary,
}: DriverFleetDocumentStacksProps) {
  return (
    <div className="bof-driver-doc-stacks">
      <DriverDocumentsPanel
        driverId={driverId}
        driverName={driverName}
        documents={primaryCore}
        headingId={`fleet-docs-primary-core-${driverId}`}
        sectionTitle="Primary — required credentials"
        sectionLead="Seven core types. Open each card for file paths and preview."
        legendTypes={undefined}
      />

      <DriverDocumentsPanel
        driverId={driverId}
        driverName={driverName}
        documents={primaryExtra}
        headingId={`fleet-docs-primary-extra-${driverId}`}
        sectionTitle="Primary — MCSA-5875 and emergency contact"
        sectionLead="Exam report (5875) and printable emergency packet; medical summary card lives in the section above when present."
        legendTypes={[...JOHN_CARTER_PRIMARY_EXTRA_TYPES]}
      />

      <DriverDocumentsPanel
        driverId={driverId}
        driverName={driverName}
        documents={secondary}
        headingId={`fleet-docs-secondary-${driverId}`}
        sectionTitle="Secondary — applications and internal workflow"
        sectionLead="Signed MCSA-5876 (or demo HTML), profile, and spreadsheet-driven workflow shells."
        legendTypes={[...JOHN_CARTER_SECONDARY_TYPE_ORDER]}
      />
    </div>
  );
}
