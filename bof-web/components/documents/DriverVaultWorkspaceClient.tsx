"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  DRIVER_VAULT_CATEGORIES,
  type DriverVaultCategory,
} from "@/lib/driver-vault-workspace";
import { useDriverVaultWorkspaceStore } from "@/lib/stores/driver-vault-workspace-store";
import { BofWorkflowFormShortcuts } from "@/components/documents/BofWorkflowFormShortcuts";
import { BofTemplateUsageSurface } from "@/components/documents/BofTemplateUsageSurface";
import { mapDriverVaultCategoryToOwnership } from "@/lib/bof-vault-ownership-adapter";

function statusClass(status: string) {
  if (status === "valid") return "bof-status-pill bof-status-pill-ok";
  if (status === "review_pending" || status === "expiring_soon") return "bof-status-pill bof-status-pill-warn";
  if (status === "missing" || status === "expired") return "bof-status-pill bof-status-pill-danger";
  return "bof-status-pill bof-status-pill-muted";
}

function readinessClass(label: string) {
  if (label.startsWith("Ready")) return "bof-status-pill bof-status-pill-ok";
  if (label.startsWith("At risk")) return "bof-status-pill bof-status-pill-warn";
  return "bof-status-pill bof-status-pill-danger";
}

export function DriverVaultWorkspaceClient() {
  const { data } = useBofDemoData();
  const initFromData = useDriverVaultWorkspaceStore((s) => s.initFromData);
  const initialized = useDriverVaultWorkspaceStore((s) => s.initialized);
  const drivers = useDriverVaultWorkspaceStore((s) => s.drivers);
  const selectedDriverId = useDriverVaultWorkspaceStore((s) => s.selectedDriverId);
  const selectedCategory = useDriverVaultWorkspaceStore((s) => s.selectedCategory);
  const selectDriver = useDriverVaultWorkspaceStore((s) => s.selectDriver);
  const selectCategory = useDriverVaultWorkspaceStore((s) => s.selectCategory);
  const updateSharedField = useDriverVaultWorkspaceStore((s) => s.updateSharedField);
  const updateTemplateField = useDriverVaultWorkspaceStore((s) => s.updateTemplateField);
  const regeneratePreview = useDriverVaultWorkspaceStore((s) => s.regeneratePreview);
  const markReviewed = useDriverVaultWorkspaceStore((s) => s.markReviewed);
  const replaceUpload = useDriverVaultWorkspaceStore((s) => s.replaceUpload);
  const openFinalArtifact = useDriverVaultWorkspaceStore((s) => s.openFinalArtifact);

  if (!initialized) {
    initFromData(data);
  }

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.driverId === selectedDriverId) ?? drivers[0],
    [drivers, selectedDriverId]
  );
  const activeCategory = (selectedCategory ?? "Driver Profile") as DriverVaultCategory;
  const activeWorkspace = selectedDriver?.categories[activeCategory];

  const driversWithSummary = useMemo(() => {
    return drivers.map((d) => {
      const items = Object.values(d.categories);
      const missing = items.filter((i) => i.documentStatus === "missing").length;
      const expiring = items.filter((i) => i.documentStatus === "expiring_soon").length;
      const expired = items.filter((i) => i.documentStatus === "expired").length;
      const reviewed = items.filter((i) => i.reviewState === "reviewed").length;
      const needsReview = items.filter((i) => i.reviewState !== "reviewed").length;
      const readiness =
        missing === 0 && expired === 0
          ? "Ready"
          : expired > 0
            ? "Blocked"
            : "At risk";
      return { ...d, missing, expiring, expired, reviewed, needsReview, readiness };
    });
  }, [drivers]);

  if (!selectedDriver || !activeWorkspace) {
    return (
      <div className="bof-page">
        <h1 className="bof-title">Driver Vault Workspace</h1>
        <p className="bof-muted">No driver workspaces available.</p>
      </div>
    );
  }

  const workflowEntityId = selectedDriver.driverId;

  return (
    <div className="bof-page bof-driver-vault">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/documents" className="bof-link-secondary">
          Documents
        </Link>
        <span aria-hidden> / </span>
        <span>Driver Vault Workspace</span>
      </nav>
      <h1 className="bof-title">BOF Vault — Driver Document Workspace</h1>
      <p className="bof-lead">
        Upload once. Reuse everywhere. Manage all 12 BOF drivers by category with shared autofill,
        template editing, and generated BOF-style preview.
      </p>

      <BofWorkflowFormShortcuts
        context="vault"
        entityId={workflowEntityId}
        title="From BOF Vault — open compliance packets & linked forms"
      />
      <BofTemplateUsageSurface
        context="vault_documents"
        entityId={workflowEntityId}
        title="Vault document ownership map"
        subtitle="Vault-owned driver records first; dispatch/load/billing/claim docs appear as secondary references."
      />

      <section className="bof-driver-vault-grid">
        <aside className="bof-driver-vault-panel">
          <h2 className="bof-h2">Drivers ({drivers.length})</h2>
          <div className="bof-driver-vault-driver-list">
            {driversWithSummary.map((d) => (
              <button
                key={d.driverId}
                type="button"
                className={`bof-driver-vault-driver-btn ${d.driverId === selectedDriver.driverId ? "is-active" : ""}`}
                onClick={() => selectDriver(d.driverId)}
              >
                <div className="bof-driver-vault-driver-head">
                  <strong>{d.driverName}</strong>
                  <code className="bof-code">{d.driverId}</code>
                </div>
                <div className="bof-driver-vault-driver-meta">
                  <span className={readinessClass(d.readiness)}>{d.readiness}</span>
                  <span className="bof-muted">Missing {d.missing}</span>
                  <span className="bof-muted">Expiring {d.expiring}</span>
                  <span className="bof-muted">Expired {d.expired}</span>
                  <span className="bof-muted">Reviewed {d.reviewed}/11</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="bof-driver-vault-main">
          <section className="bof-driver-vault-panel">
            <h2 className="bof-h2">
              {selectedDriver.driverName} <code className="bof-code">{selectedDriver.driverId}</code>
            </h2>
            <div className="bof-driver-vault-categories">
              {DRIVER_VAULT_CATEGORIES.map((category) => {
                const cat = selectedDriver.categories[category];
                const ownership = mapDriverVaultCategoryToOwnership(category);
                return (
                  <button
                    key={category}
                    type="button"
                    className={`bof-driver-vault-cat-btn ${category === activeCategory ? "is-active" : ""}`}
                    onClick={() => selectCategory(category)}
                  >
                    <span>{category}</span>
                    <span className="bof-muted bof-small">{ownership.ownershipLabel}</span>
                    <span className={statusClass(cat.documentStatus)}>
                      {cat.documentStatus.replace(/_/g, " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bof-driver-vault-detail-grid">
            <article className="bof-driver-vault-panel">
              <h3 className="bof-h3">1) Source uploads</h3>
              {activeWorkspace.sourceUploads.length ? (
                <ul className="bof-driver-vault-upload-list">
                  {activeWorkspace.sourceUploads.map((u) => (
                    <li key={u.source_id}>
                      <div>
                        <strong>{u.file_name}</strong>
                        <div className="bof-muted bof-small">
                          {u.source_type} · {new Date(u.uploaded_at).toLocaleString()}
                        </div>
                      </div>
                      {u.source_url ? (
                        <a
                          href={u.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bof-link-secondary"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="bof-muted">Demo upload</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="bof-muted">No source uploads yet for this category.</p>
              )}
              <button
                type="button"
                className="bof-intake-engine-btn"
                onClick={() => replaceUpload(selectedDriver.driverId, activeCategory)}
              >
                Replace Upload
              </button>
            </article>

            <article className="bof-driver-vault-panel">
              <h3 className="bof-h3">2) Shared profile fields</h3>
              <div className="bof-driver-vault-form">
                {Object.entries(selectedDriver.sharedProfileFields).map(([key, value]) => (
                  <label key={key}>
                    <span>{key.replace(/_/g, " ")}</span>
                    <input
                      value={value}
                      onChange={(e) =>
                        updateSharedField(selectedDriver.driverId, key, e.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            </article>

            <article className="bof-driver-vault-panel">
              <h3 className="bof-h3">3) Template fields ({activeCategory})</h3>
              <div className="bof-driver-vault-form">
                {Object.entries(activeWorkspace.templateFields).map(([key, value]) => (
                  <label key={key}>
                    <span>{key.replace(/_/g, " ")}</span>
                    <input
                      value={value}
                      onChange={(e) =>
                        updateTemplateField(
                          selectedDriver.driverId,
                          activeCategory,
                          key,
                          e.target.value
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </article>

            <article className="bof-driver-vault-panel">
              <h3 className="bof-h3">4) Finished BOF document preview</h3>
              <div className="bof-driver-vault-preview">
                <div className="bof-driver-vault-preview-head">
                  <strong>{activeWorkspace.generatedPreview.title}</strong>
                  <span className="bof-muted">{activeWorkspace.generatedPreview.subtitle}</span>
                </div>
                <dl>
                  {activeWorkspace.generatedPreview.sections.map((s) => (
                    <div key={s.label}>
                      <dt>{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="bof-driver-vault-actions">
                <button
                  type="button"
                  className="bof-intake-engine-btn"
                  onClick={() => regeneratePreview(selectedDriver.driverId, activeCategory)}
                >
                  Regenerate Preview
                </button>
                <button
                  type="button"
                  className="bof-intake-engine-btn"
                  onClick={() => markReviewed(selectedDriver.driverId, activeCategory)}
                >
                  Mark Reviewed
                </button>
                <button type="button" className="bof-intake-engine-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="bof-intake-engine-btn bof-intake-engine-btn--primary"
                  onClick={() => openFinalArtifact(selectedDriver.driverId, activeCategory)}
                >
                  Open Final
                </button>
              </div>
              <p className="bof-muted bof-small">
                Status:{" "}
                <span className={statusClass(activeWorkspace.documentStatus)}>
                  {activeWorkspace.documentStatus.replace(/_/g, " ")}
                </span>{" "}
                · Review: {activeWorkspace.reviewState.replace(/_/g, " ")} · Confidence:{" "}
                {activeWorkspace.extractedFieldConfidence}
              </p>
              {activeWorkspace.finalArtifact ? (
                <p className="bof-muted bof-small">
                  Final artifact:{" "}
                  <code className="bof-code">{activeWorkspace.finalArtifact.artifactFileName}</code>
                  {" · "}
                  {new Date(activeWorkspace.finalArtifact.artifactGeneratedAt).toLocaleString()}
                </p>
              ) : null}
            </article>
          </section>
        </main>
      </section>
    </div>
  );
}
