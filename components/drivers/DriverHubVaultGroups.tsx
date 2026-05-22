"use client";

import Link from "next/link";
import type { DriverDqfDocumentRow } from "@/lib/driver-dqf-readiness";
import {
  DRIVER_VAULT_UI_GROUP_DESCRIPTION,
  DRIVER_VAULT_UI_GROUP_LABEL,
  DRIVER_VAULT_UI_GROUP_ORDER,
  type DriverVaultUiGroup,
  groupDqfRowsByVaultUi,
} from "@/lib/driver-vault-ui-groups";

type Props = {
  driverId: string;
  documents: DriverDqfDocumentRow[];
};

function statusPillClass(status: DriverDqfDocumentRow["status"]): string {
  if (status === "ready") return "bof-status-pill bof-status-pill-ok";
  if (status === "missing" || status === "expired") return "bof-status-pill bof-status-pill-danger";
  if (status === "expiring_soon") return "bof-status-pill bof-status-pill-warn";
  return "bof-status-pill bof-status-pill-warn";
}

function statusLabel(status: DriverDqfDocumentRow["status"]): string {
  const raw = status.replace(/_/g, " ");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function DriverHubVaultGroups({ driverId, documents }: Props) {
  const grouped = groupDqfRowsByVaultUi(documents);
  const vaultBase = `/drivers/${driverId}/vault`;

  return (
    <div className="bof-driver-hub-vault-groups" aria-label="Driver vault by category">
      <div className="bof-driver-hub-vault-groups-head">
        <h3 className="bof-h3" style={{ marginBottom: "0.35rem" }}>
          Qualification file — vault layout
        </h3>
        <p className="bof-doc-section-lead" style={{ marginBottom: "0.75rem" }}>
          Same five categories as the{" "}
          <Link href={vaultBase} className="bof-link-secondary">
            driver vault
          </Link>
          . Open a section there for full review actions.
        </p>
        <nav className="bof-driver-hub-vault-jump" aria-label="Jump to vault sections">
          {DRIVER_VAULT_UI_GROUP_ORDER.map((g) => {
            const n = grouped[g].length;
            if (!n) return null;
            return (
              <Link key={g} href={`${vaultBase}#vault-${g}`} className="bof-driver-hub-vault-jump-link">
                {DRIVER_VAULT_UI_GROUP_LABEL[g]}
                <span className="bof-driver-hub-vault-jump-count">{n}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {DRIVER_VAULT_UI_GROUP_ORDER.map((g: DriverVaultUiGroup) => {
        const rows = grouped[g];
        if (!rows.length) return null;
        return (
          <details key={g} className="bof-driver-doc-group bof-driver-hub-vault-group">
            <summary className="bof-driver-hub-vault-summary">
              <span className="bof-driver-hub-vault-summary-title">{DRIVER_VAULT_UI_GROUP_LABEL[g]}</span>
              <span className="bof-muted bof-small"> ({rows.length})</span>
            </summary>
            <p className="bof-driver-hub-vault-blurb">{DRIVER_VAULT_UI_GROUP_DESCRIPTION[g]}</p>
            <div className="bof-driver-doc-table">
              {rows.map((row) => (
                <div key={row.canonicalType} className="bof-driver-hub-vault-row">
                  <span className="bof-driver-doc-col bof-driver-doc-col-title">{row.label}</span>
                  <span className="bof-driver-doc-col">
                    <span className={statusPillClass(row.status)}>{statusLabel(row.status)}</span>
                    {row.optionalForReadiness ? (
                      <span className="bof-muted bof-small" style={{ marginLeft: "0.35rem" }}>
                        Optional
                      </span>
                    ) : null}
                  </span>
                  <span className="bof-driver-doc-col bof-muted bof-small">{row.expirationDate ?? "—"}</span>
                  <span className="bof-driver-doc-col bof-driver-hub-vault-actions">
                    {row.fileUrl ? (
                      <a
                        href={row.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bof-link-secondary bof-small"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="bof-muted bof-small">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <p className="bof-driver-hub-vault-foot">
              <Link href={`${vaultBase}#vault-${g}`} className="bof-link-secondary bof-small">
                Full table &amp; review in vault →
              </Link>
            </p>
          </details>
        );
      })}
    </div>
  );
}
