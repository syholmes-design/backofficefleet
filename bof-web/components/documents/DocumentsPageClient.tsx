"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DocumentVaultClient } from "@/components/DocumentVaultClient";
import { buildVaultRows } from "@/lib/document-vault";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { DEFAULT_PREVIEW_DRIVER_ID } from "@/lib/bof-defaults";
import { getDriverById } from "@/lib/driver-queries";
import { OPS_COPY } from "@/lib/ops-copy";

export function DocumentsPageClient() {
  const { data } = useBofDemoData();

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

      <section className="bof-oper-panel bof-oper-panel-tight" aria-label="Document table">
        <DocumentVaultClient rows={rows} totalExpected={rows.length} />
      </section>
    </div>
  );
}
