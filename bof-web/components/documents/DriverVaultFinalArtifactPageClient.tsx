"use client";

import Link from "next/link";
import { useMemo } from "react";

const DRIVER_VAULT_FINAL_ARTIFACTS_KEY = "bof:driver-vault:final-artifacts:v1";

type PersistedVaultArtifactMap = Record<
  string,
  {
    artifact: {
      artifactStorageKey: string;
      sourceDriverId: string;
      sourceCategory: string;
      artifactGeneratedAt: string;
      artifactFileName: string;
    };
    html: string;
  }
>;

function artifactMapKey(driverId: string, category: string) {
  return `${driverId}::${category}`;
}

function loadArtifactHtml(driverId: string, category: string): string | null {
  try {
    const raw = window.localStorage.getItem(DRIVER_VAULT_FINAL_ARTIFACTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedVaultArtifactMap;
    const hit = parsed?.[artifactMapKey(driverId, category)];
    return hit?.html ?? null;
  } catch {
    return null;
  }
}

export function DriverVaultFinalArtifactPageClient({
  driverId,
  category,
}: {
  driverId: string;
  category: string;
}) {

  const html = useMemo(() => {
    if (!driverId || !category) return null;
    return loadArtifactHtml(driverId, category);
  }, [driverId, category]);

  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/documents" className="bof-link-secondary">
          Documents
        </Link>
        <span aria-hidden> / </span>
        <Link href="/documents/vault" className="bof-link-secondary">
          Driver Vault Workspace
        </Link>
        <span aria-hidden> / </span>
        <span>Final Artifact</span>
      </nav>
      <h1 className="bof-title">BOF Vault Final Artifact</h1>
      <p className="bof-muted">
        Driver: <code className="bof-code">{driverId || "—"}</code> · Category:{" "}
        <code className="bof-code">{category || "—"}</code>
      </p>

      {html ? (
        <iframe
          title="BOF Driver Vault Final Artifact"
          srcDoc={html}
          style={{
            width: "100%",
            minHeight: "78vh",
            border: "1px solid var(--bof-border, #2b3440)",
            borderRadius: 12,
            background: "#0f1419",
          }}
        />
      ) : (
        <div className="bof-card">
          <p className="bof-muted">
            No stored artifact found for this driver/category yet. Return to Driver Vault and click
            <strong> Open Final</strong> to generate and store it for demo retrieval.
          </p>
        </div>
      )}
    </div>
  );
}
