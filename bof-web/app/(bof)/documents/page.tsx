import Link from "next/link";
import { DocumentVaultClient } from "@/components/DocumentVaultClient";
import { buildVaultRows } from "@/lib/document-vault";
import { getBofData } from "@/lib/load-bof-data";
import { DEFAULT_PREVIEW_DRIVER_ID } from "@/lib/bof-defaults";
import { getDriverById } from "@/lib/driver-queries";

export const metadata = {
  title: "Document Vault | BOF",
  description: "Fleet-wide driver credentials and compliance documents",
};

export default function DocumentsPage() {
  const data = getBofData();
  const rows = buildVaultRows(data);
  const previewDriver = getDriverById(data, DEFAULT_PREVIEW_DRIVER_ID);
  const previewLabel = previewDriver?.name ?? "the preview driver";

  return (
    <div className="bof-page">
      <h1 className="bof-title">Document Vault</h1>
      <p className="bof-lead">
        Full credential register — every driver × seven required types, plus supplemental
        rows ({previewLabel} / DRV-001 includes the full primary + secondary demo stack).
        Filter by driver, type, or status; hover proof for a quick preview when a file
        path exists, or open the driver profile for context.
      </p>
      <p className="bof-muted bof-small">
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
      </p>

      <DocumentVaultClient rows={rows} totalExpected={rows.length} />
    </div>
  );
}
