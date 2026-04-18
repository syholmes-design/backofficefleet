"use client";

import type { DocumentRow } from "@/lib/driver-queries";
import {
  JOHN_CARTER_PRIMARY_EXTRA_TYPES,
  JOHN_CARTER_REFERENCE_DRIVER_ID,
  JOHN_CARTER_SECONDARY_TYPE_ORDER,
} from "@/lib/john-carter-reference";
import { DriverDocumentsPanel } from "@/components/DriverDocumentsPanel";

type Props = {
  driverName: string;
  primaryCore: DocumentRow[];
  primaryExtra: DocumentRow[];
  secondary: DocumentRow[];
};

/**
 * Reference-driver (DRV-001) document layout: primary core, primary extensions, secondary.
 * Identifier banner and vault links live on the parent driver hub page.
 */
export function DriverJohnCarterDocumentStacks({
  driverName,
  primaryCore,
  primaryExtra,
  secondary,
}: Props) {
  return (
    <div className="bof-driver-doc-stacks">
      <DriverDocumentsPanel
        driverId={JOHN_CARTER_REFERENCE_DRIVER_ID}
        driverName={driverName}
        documents={primaryCore}
        headingId="jc-docs-primary-core"
        sectionTitle="Primary — required credentials"
        sectionLead="Seven core types. Open each card for file paths and preview."
        legendTypes={undefined}
      />

      <DriverDocumentsPanel
        driverId={JOHN_CARTER_REFERENCE_DRIVER_ID}
        driverName={driverName}
        documents={primaryExtra}
        headingId="jc-docs-primary-extra"
        sectionTitle="Primary — MCSA-5875 and emergency contact"
        sectionLead="Exam report (5875) and printable emergency packet; profile summary remains under Profile above."
        legendTypes={[...JOHN_CARTER_PRIMARY_EXTRA_TYPES]}
      />

      <DriverDocumentsPanel
        driverId={JOHN_CARTER_REFERENCE_DRIVER_ID}
        driverName={driverName}
        documents={secondary}
        headingId="jc-docs-secondary"
        sectionTitle="Secondary — applications and internal workflow"
        sectionLead="Signed MCSA-5876 PDF, profile HTML, and spreadsheet-driven workflow shells."
        legendTypes={[...JOHN_CARTER_SECONDARY_TYPE_ORDER]}
      />
    </div>
  );
}
