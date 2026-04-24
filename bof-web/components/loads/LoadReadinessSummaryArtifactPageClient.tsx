"use client";

import Link from "next/link";
import { useLoadReadinessMessagingStore } from "@/lib/stores/load-readiness-messaging-store";

export function LoadReadinessSummaryArtifactPageClient({ loadId }: { loadId: string }) {
  const getFinalReadinessArtifact = useLoadReadinessMessagingStore(
    (s) => s.getFinalReadinessArtifact
  );
  const artifact = getFinalReadinessArtifact(loadId);

  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/loads">Loads</Link>
        <span aria-hidden> / </span>
        <Link href={`/loads/${loadId}`}>Load {loadId}</Link>
        <span aria-hidden> / </span>
        <span>Pre-Trip Readiness Summary</span>
      </nav>
      <h1 className="bof-title">BOF Driver Pre-Trip Readiness Summary</h1>
      {artifact ? (
        <>
          <p className="bof-muted bof-small">
            <code className="bof-code">{artifact.artifactFileName}</code> ·{" "}
            {new Date(artifact.artifactGeneratedAt).toLocaleString()}
          </p>
          <iframe
            title="BOF Readiness Summary Artifact"
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
        <div className="bof-card">
          <p className="bof-muted">
            No stored readiness artifact for this load yet. Open the load detail and click{" "}
            <strong>Open Final Readiness Summary</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
