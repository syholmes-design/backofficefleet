"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { DocumentVaultClient } from "@/components/DocumentVaultClient";
import { buildVaultRows, applyCanonicalMappingToRows, type VaultDocumentRow } from "@/lib/document-vault";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { DEFAULT_PREVIEW_DRIVER_ID, DEFAULT_WORKFLOW_LOAD_ID } from "@/lib/bof-defaults";
import { BofWorkflowFormShortcuts } from "@/components/documents/BofWorkflowFormShortcuts";
import { BofVaultReferencesPanel } from "@/components/documents/BofVaultReferencesPanel";
import { getDriverById } from "@/lib/driver-queries";
import { OPS_COPY } from "@/lib/ops-copy";

export function DocumentsPageClient() {
  const { data } = useBofDemoData();
  const workflowEntityId = data.loads[0]?.id ?? DEFAULT_WORKFLOW_LOAD_ID;
  const [rows, setRows] = useState<VaultDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVaultRows = async () => {
      try {
        setLoading(true);
        const vaultRows = buildVaultRows(data);
        const canonicalRows = await applyCanonicalMappingToRows(vaultRows);
        setRows(canonicalRows);
      } catch (error) {
        console.error('Error loading vault rows:', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadVaultRows();
  }, [data]);
  const previewDriver = getDriverById(data, DEFAULT_PREVIEW_DRIVER_ID);
  const previewSettlementId =
    data.settlements?.find((s) => s.driverId === DEFAULT_PREVIEW_DRIVER_ID)?.settlementId ?? null;
  const previewClaimId =
    data.complianceIncidents?.find((c) => c.driverId === DEFAULT_PREVIEW_DRIVER_ID)?.incidentId ?? null;

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
        <strong>Internal:</strong> Cross-pack template registry + draft workspace —{" "}
        <Link href="/documents/template-packs" className="bof-link-secondary">
          Template packs workspace
        </Link>{" "}
        (inspect mappings, demo statuses, and in-browser artifacts; not the canonical intake or npm
        document pipeline). Use the{" "}
        <Link href="/documents/template-packs/view" className="bof-link-secondary">
          BOF document viewer
        </Link>{" "}
        from template rows for save/review flows.
      </p>

      <BofWorkflowFormShortcuts
        context="documents"
        entityId={workflowEntityId}
        title="Open BOF forms from the document hub (not only via /template-packs)"
      />

      <section className="bof-oper-panel bof-oper-panel-tight" aria-label="Document table">
        {loading ? (
          <div className="bof-loading">Loading Document Vault...</div>
        ) : (
          <DocumentVaultClient rows={rows} totalExpected={rows.length} />
        )}
      </section>
      <BofVaultReferencesPanel
        context={{
          loadId: workflowEntityId,
          driverId: previewDriver?.id ?? null,
          settlementId: previewSettlementId,
          claimId: previewClaimId,
        }}
        title="Vault secondary references (registry-driven)"
      />
    </div>
  );
}
