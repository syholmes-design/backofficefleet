"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useBofTemplateWorkspaceStore } from "@/lib/stores/bof-template-workspace-store";
import { buildBofDocumentViewerHref } from "@/lib/bof-document-viewer-href";
import {
  buildVaultReferenceRows,
  type BofVaultReferenceContext,
} from "@/lib/bof-vault-references";

export function BofVaultReferencesPanel({
  context,
  title = "Vault secondary references",
}: {
  context: BofVaultReferenceContext;
  title?: string;
}) {
  const pathname = usePathname();
  const getArtifact = useBofTemplateWorkspaceStore((s) => s.getArtifact);
  const rows = useMemo(() => buildVaultReferenceRows(context), [context]);

  const groups = useMemo(() => {
    return {
      dispatch: rows.filter((r) => r.ownership.vaultPrimaryOwner === "dispatch"),
      workflow: rows.filter((r) => r.ownership.vaultPrimaryOwner !== "dispatch"),
    };
  }, [rows]);

  return (
    <section className="bof-card" style={{ marginTop: 16 }}>
      <h2 className="bof-h2">{title}</h2>
      <p className="bof-muted bof-small">
        These are visible in Vault by reference. Vault-owned driver core docs remain the primary home.
      </p>

      {[{ label: "Dispatch references", rows: groups.dispatch }, { label: "Workflow references", rows: groups.workflow }].map(
        (g) =>
          g.rows.length > 0 ? (
            <div key={g.label} style={{ marginTop: 10 }}>
              <h3 className="bof-h3" style={{ marginBottom: 6 }}>{g.label}</h3>
              <div className="bof-table-wrap">
                <table className="bof-table bof-table-compact">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Ownership</th>
                      <th>Why shown in Vault</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((row) => {
                      const entity = row.entityIdForLinks;
                      const artifactKey = entity ? `${row.template.templateId}::${entity}` : "";
                      const artifact = artifactKey ? getArtifact(artifactKey) : null;
                      const canOpen = entity !== null && row.missingKeys.length === 0;
                      return (
                        <tr key={row.template.templateId}>
                          <td>{row.template.templateName}</td>
                          <td>{row.ownership.ownershipLabel}</td>
                          <td>
                            <span className="bof-small">{row.appearsReason}</span>
                            {row.missingKeys.length > 0 ? (
                              <div className="bof-small" style={{ color: "#fcd34d" }}>
                                Missing context: {row.missingKeys.join(" · ")}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {canOpen ? (
                                <>
                                  <Link
                                    href={`/documents/template-packs?packId=${encodeURIComponent(
                                      row.template.packId
                                    )}&entityId=${encodeURIComponent(entity!)}&templateId=${encodeURIComponent(
                                      row.template.templateId
                                    )}`}
                                    className="bof-link-secondary"
                                  >
                                    Open Draft
                                  </Link>
                                  <Link
                                    href={buildBofDocumentViewerHref({
                                      templateId: row.template.templateId,
                                      entityId: entity!,
                                      packId: row.template.packId,
                                      returnTo: pathname || undefined,
                                    })}
                                    className="bof-link-secondary"
                                  >
                                    Document viewer
                                  </Link>
                                  {artifact ? (
                                    <a
                                      href={artifact.artifactUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bof-link-secondary"
                                    >
                                      Open Final
                                    </a>
                                  ) : null}
                                </>
                              ) : null}
                              <Link href={row.ownerWorkflow.href} className="bof-link-secondary">
                                {row.ownerWorkflow.label}
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null
      )}
    </section>
  );
}
