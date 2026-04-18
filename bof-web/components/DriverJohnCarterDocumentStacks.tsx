"use client";

import Link from "next/link";
import type { DocumentRow } from "@/lib/driver-queries";
import {
  JOHN_CARTER_CDL_NUMBER,
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

export function DriverJohnCarterDocumentStacks({
  driverName,
  primaryCore,
  primaryExtra,
  secondary,
}: Props) {
  return (
    <div className="bof-jc-doc-stacks">
      <p className="bof-doc-section-lead bof-jc-id-banner">
        Reference driver: <code className="bof-code">{JOHN_CARTER_REFERENCE_DRIVER_ID}</code>{" "}
        (routes &amp; vault) · CDL / license record{" "}
        <code className="bof-code">{JOHN_CARTER_CDL_NUMBER}</code> (spreadsheet / credential
        match). Same person — both identifiers resolve to this profile.
      </p>

      <DriverDocumentsPanel
        driverId={JOHN_CARTER_REFERENCE_DRIVER_ID}
        driverName={driverName}
        documents={primaryCore}
        headingId="jc-docs-primary-core"
        sectionTitle="Primary — required credentials"
        sectionLead="Seven core fleet credentials. Each card links to the generated demo shell under /generated/drivers/DRV-001/."
        legendTypes={undefined}
      />

      <DriverDocumentsPanel
        driverId={JOHN_CARTER_REFERENCE_DRIVER_ID}
        driverName={driverName}
        documents={primaryExtra}
        headingId="jc-docs-primary-extra"
        sectionTitle="Primary — MCSA-5875 exam report and emergency contact"
        sectionLead="MCSA-5875 (exam report) and on-file emergency contact packet. Medical card summary and MCSA-5876 detail remain in the Medical certificate section above."
        legendTypes={[...JOHN_CARTER_PRIMARY_EXTRA_TYPES]}
      />

      <DriverDocumentsPanel
        driverId={JOHN_CARTER_REFERENCE_DRIVER_ID}
        driverName={driverName}
        documents={secondary}
        headingId="jc-docs-secondary"
        sectionTitle="Secondary — applications, acknowledgments &amp; internal workflow"
        sectionLead="Signed MCSA-5876 PDF, profile dashboard, and workflow shells driven from driver_templates_expanded.xlsx where applicable."
        legendTypes={[...JOHN_CARTER_SECONDARY_TYPE_ORDER]}
      />

      <p className="bof-muted bof-small bof-jc-vault-note">
        Every row appears in the{" "}
        <Link href="/documents" className="bof-link-secondary">
          document vault
        </Link>{" "}
        (filter by John Carter / DRV-001).
      </p>
    </div>
  );
}
