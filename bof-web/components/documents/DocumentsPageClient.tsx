"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DocumentVaultClient } from "@/components/DocumentVaultClient";
import { buildVaultRows } from "@/lib/document-vault";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { DEFAULT_PREVIEW_DRIVER_ID, DEFAULT_WORKFLOW_LOAD_ID } from "@/lib/bof-defaults";
import { BofWorkflowFormShortcuts } from "@/components/documents/BofWorkflowFormShortcuts";
import { BofVaultReferencesPanel } from "@/components/documents/BofVaultReferencesPanel";
import { getDriverById } from "@/lib/driver-queries";
import { OPS_COPY } from "@/lib/ops-copy";

export function DocumentsPageClient() {
  const { data } = useBofDemoData();
  const workflowEntityId = data.loads[0]?.id ?? DEFAULT_WORKFLOW_LOAD_ID;

  const rows = useMemo(() => buildVaultRows(data), [data]);
  const previewDriver = getDriverById(data, DEFAULT_PREVIEW_DRIVER_ID);

  return (
    <div className="bof-page">
      <h1 className="bof-title">Document Vault</h1>
      <p className="bof-lead">
        {OPS_COPY.documentsLead} {OPS_COPY.documentsStory} Credential rows reflect edits from the{" "}
        <Link href="/source-of-truth" className="bof-link-secondary">
          Source of Truth
        </Link>
        .
      </p>
      <p className="bof-muted bof-small bof-oper-sublead">
        BOF also builds{" "}
        <strong>generated credential SVGs</strong> from the same JSON on each{" "}
        <Link
          href={`/drivers/${DEFAULT_PREVIEW_DRIVER_ID}`}
          className="bof-link-secondary"
        >
          driver profile
        </Link>{" "}
        (open &quot;Generated driver forms&quot;). Load, settlement, and
        exception packets link from load detail, settlements, and money at risk.
        {previewDriver ? (
          <>
            {" "}
            Preview driver: <strong>{previewDriver.name}</strong>.
          </>
        ) : null}
      </p>
      <p className="bof-muted bof-small bof-oper-sublead">
        Need guided per-driver document assembly? Open{" "}
        <Link href="/documents/vault" className="bof-link-secondary">
          BOF Vault Driver Workspace
        </Link>{" "}
        for category-level uploads, shared autofill fields, and generated BOF preview output.
      </p>
      <p className="bof-muted bof-small bof-oper-sublead">
        Vault view order: <strong>Vault-owned driver core</strong> first, then{" "}
        <strong>dispatch references</strong>, then <strong>workflow references</strong> (load / billing /
        claims owned).
      </p>
      <p className="bof-muted bof-small bof-oper-sublead">
        Need unified cross-pack operations forms? Open{" "}
        <Link href="/documents/template-packs" className="bof-link-secondary">
          BOF Template Packs Workspace
        </Link>{" "}
        for standardized intake, field ops, billing/settlement, driver/dispatch readiness, and
        insurance/claims templates with editable + generated artifact flow. Use the{" "}
        <Link href="/documents/template-packs/view" className="bof-link-secondary">
          BOF document viewer
        </Link>{" "}
        (open from any template row) for save, review, final generation, and stakeholder routing.
      </p>

      <BofWorkflowFormShortcuts
        context="documents"
        entityId={workflowEntityId}
        title="Open BOF forms from the document hub (not only via /template-packs)"
      />

      <section className="bof-oper-panel bof-oper-panel-tight" aria-label="Document table">
        <DocumentVaultClient rows={rows} totalExpected={rows.length} />
      </section>
      <BofVaultReferencesPanel
        context={{ loadId: workflowEntityId, driverId: previewDriver?.id ?? null }}
        title="Vault secondary references (registry-driven)"
      />
    </div>
  );
}
