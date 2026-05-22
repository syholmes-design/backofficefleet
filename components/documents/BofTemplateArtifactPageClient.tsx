"use client";

import Link from "next/link";
import { useBofTemplateWorkspaceStore } from "@/lib/stores/bof-template-workspace-store";

export function BofTemplateArtifactPageClient({ artifactKey }: { artifactKey: string }) {
  const getArtifact = useBofTemplateWorkspaceStore((s) => s.getArtifact);
  const artifact = getArtifact(artifactKey);

  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/documents">Documents</Link>
        <span aria-hidden> / </span>
        <Link href="/documents/template-packs">Template Packs Workspace</Link>
        <span aria-hidden> / </span>
        <span>Final Artifact</span>
      </nav>
      <h1 className="bof-title">BOF Template Artifact</h1>
      {artifact ? (
        <>
          <p className="bof-muted bof-small">
            <code className="bof-code">{artifact.artifactFileName}</code> ·{" "}
            {new Date(artifact.generatedAt).toLocaleString()}
          </p>
          <iframe
            title="BOF Template Artifact"
            srcDoc={artifact.html}
            style={{
              width: "100%",
              minHeight: "78vh",
              border: "1px solid var(--bof-border, #2b3440)",
              borderRadius: 12,
              background: "#0f1419",
            }}
          />
        </>
      ) : (
        <p className="bof-muted">Artifact not found. Generate from Template Packs Workspace.</p>
      )}
    </div>
  );
}
