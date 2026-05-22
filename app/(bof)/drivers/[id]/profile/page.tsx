/**
 * BOF Route Owner:
 * URL: /drivers/:id/profile
 * Type: DEMO
 * Primary component: DriverProfilePage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  assignedTrucksForDriver,
  complianceNotesForDriver,
  getDriverById,
  getOrderedDocumentsForDriver,
  primaryAssignedTruck,
  readinessFromDocuments,
} from "@/lib/driver-queries";
import { DemoBackButton } from "@/components/navigation/DemoBackButton";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { getDriverOperationalProfile } from "@/lib/driver-operational-profile";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DriverProfilePage({ params }: Props) {
  const { id } = use(params);
  const { data } = useBofDemoData();
  const driver = getDriverById(data, id);
  if (!driver) {
    notFound();
  }
  const profileDriver = driver as typeof driver & {
    photoUrl?: string;
    licenseClass?: string;
    licenseState?: string;
    referenceCdlNumber?: string;
    dateOfBirth?: string;
    compliance_status?: string;
  };

  const hasRichDashboard = id === "DRV-001";

  const documents = useMemo(() => getOrderedDocumentsForDriver(data, id), [data, id]);
  const readiness = useMemo(() => readinessFromDocuments(documents), [documents]);
  const trucks = useMemo(() => assignedTrucksForDriver(data, id), [data, id]);
  const primary = useMemo(() => primaryAssignedTruck(data, id), [data, id]);
  const compliance = useMemo(() => complianceNotesForDriver(data, id), [data, id]);
  const eligibility = useMemo(() => getDriverDispatchEligibility(data, id), [data, id]);
  const operational = useMemo(() => getDriverOperationalProfile(data, id), [data, id]);
  const expiringSoon = useMemo(
    () => documents.filter((d) => d.status.toUpperCase() === "EXPIRING_SOON").length,
    [documents]
  );
  const expiredDocs = useMemo(
    () => documents.filter((d) => d.status.toUpperCase() === "EXPIRED"),
    [documents]
  );
  const activeLoad = useMemo(() => {
    const mine = data.loads.filter((l) => l.driverId === id);
    return mine.find((l) => l.status === "En Route") ?? mine.find((l) => l.status === "Pending") ?? null;
  }, [data.loads, id]);

  const dispatchChipClass =
    eligibility.status === "ready"
      ? "bof-driver-dispatch-chip bof-driver-dispatch-chip--ready"
      : eligibility.status === "needs_review"
        ? "bof-driver-dispatch-chip bof-driver-dispatch-chip--review"
        : "bof-driver-dispatch-chip bof-driver-dispatch-chip--blocked";

  const photo =
    profileDriver.photoUrl?.trim() || driverPhotoPath(id);

  const cdlDoc = documents.find((d) => d.type === "CDL");

  if (hasRichDashboard) {
    return (
      <div className="bof-page bof-driver-hub">
        <header className="bof-driver-profile-toolbar">
          <DemoBackButton fallbackHref={`/drivers/${id}`} />
          <div className="bof-driver-profile-toolbar-row">
            <div className="bof-driver-profile-title-block">
              <h1 className="bof-title bof-title-tight">{driver.name}</h1>
              <p className="bof-driver-sub">
                <code className="bof-code">{driver.id}</code>
                <span className={`${dispatchChipClass}`} style={{ marginLeft: "0.65rem" }}>
                  Dispatch:{" "}
                  {eligibility.status === "ready"
                    ? "Ready"
                    : eligibility.status === "needs_review"
                      ? "Needs review"
                      : "Blocked"}
                </span>
                {(eligibility.status === "needs_review" || eligibility.status === "blocked") && (
                  <Link href={`/drivers/${id}#driver-review`} className="bof-link-secondary bof-small" style={{ marginLeft: "0.5rem" }}>
                    View review details
                  </Link>
                )}
              </p>
              <p className="bof-muted bof-small" style={{ marginTop: "0.35rem" }}>
                Compiled profile dashboard (reference driver). Operational hub:{" "}
                <Link href={`/drivers/${id}`} className="bof-link-secondary">
                  Open driver hub
                </Link>
                .
              </p>
            </div>
            <nav className="bof-driver-profile-actions" aria-label="Quick links">
              <Link href={`/drivers/${id}`} className="bof-driver-profile-action">
                Driver hub
              </Link>
              <Link href={`/drivers/${id}/hr`} className="bof-driver-profile-action bof-driver-profile-action--ghost">
                HR record
              </Link>
            </nav>
          </div>
        </header>
        <div className="bof-driver-panel" style={{ marginBottom: "1rem" }}>
          <p className="bof-muted bof-small" style={{ margin: 0 }}>
            Embedded dashboard HTML — same data as the BOF driver hub, formatted for printable / kiosk review.
          </p>
        </div>
        <div
          className="bof-driver-panel"
          style={{ padding: 0, overflow: "hidden", minHeight: "min(80vh, 820px)" }}
        >
          <iframe
            src={`/generated/drivers/${id}/john-carter-profile-dashboard.html`}
            className="w-full border-0"
            style={{ minHeight: "min(80vh, 820px)", height: "80vh", display: "block", background: "#0f172a" }}
            title={`${driver.name} profile dashboard`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bof-page bof-driver-hub">
      <header className="bof-driver-profile-toolbar">
        <DemoBackButton fallbackHref={`/drivers/${id}`} />
        <div className="bof-driver-profile-toolbar-row">
          <div className="bof-driver-profile-title-block">
            <h1 className="bof-title bof-title-tight">{driver.name}</h1>
            <p className="bof-driver-sub">
              <code className="bof-code">{driver.id}</code>
              <span className={dispatchChipClass} style={{ marginLeft: "0.65rem" }}>
                Dispatch:{" "}
                {eligibility.status === "ready"
                  ? "Ready"
                  : eligibility.status === "needs_review"
                    ? "Needs review"
                    : "Blocked"}
              </span>
              {(eligibility.status === "needs_review" || eligibility.status === "blocked") && (
                <Link href={`/drivers/${id}#driver-review`} className="bof-link-secondary bof-small" style={{ marginLeft: "0.5rem" }}>
                  View review details
                </Link>
              )}
            </p>
            <p className="bof-muted bof-small" style={{ marginTop: "0.35rem" }}>
              Lightweight profile view. For documents, HR packet, and route tools use the{" "}
              <Link href={`/drivers/${id}`} className="bof-link-secondary">
                driver hub
              </Link>
              .
            </p>
          </div>
          <nav className="bof-driver-profile-actions" aria-label="Quick links">
            <Link href={`/drivers/${id}`} className="bof-driver-profile-action">
              Open driver hub
            </Link>
            <Link href={`/drivers/${id}#driver-hub-documents-heading`} className="bof-driver-profile-action">
              Documents
            </Link>
            <Link href={`/drivers/${id}/dispatch`} className="bof-driver-profile-action">
              Assign load
            </Link>
          </nav>
        </div>
      </header>

      <div className="bof-driver-profile-columns">
        <div className="bof-driver-panel">
          <h2 className="bof-h3">Driver identity</h2>
          <div className="bof-driver-identity-header">
            <DriverAvatar name={driver.name} photoUrl={photo} size={96} />
            <div style={{ minWidth: 0 }}>
              <p className="bof-muted bof-small" style={{ margin: 0 }}>
                Compliance status
              </p>
              <p style={{ margin: "0.2rem 0 0", fontWeight: 700, color: "#f8fafc" }}>
                {profileDriver.compliance_status?.trim() || "—"}
              </p>
            </div>
          </div>
          <dl className="bof-driver-identity-dl">
            <dt>CDL class / state</dt>
            <dd>
              {(cdlDoc?.licenseClass || profileDriver.licenseClass || operational?.licenseClass || "—") +
                " · " +
                (operational?.licenseState || profileDriver.licenseState || "—")}
            </dd>
            <dt>CDL number</dt>
            <dd>
              <code className="bof-code">
                {cdlDoc?.cdlNumber || cdlDoc?.sourceLicenseNumber || profileDriver.referenceCdlNumber || "—"}
              </code>
            </dd>
            <dt>Date of birth</dt>
            <dd>{operational?.dob || profileDriver.dateOfBirth || "—"}</dd>
          </dl>
        </div>

        <div className="bof-driver-panel">
          <h2 className="bof-h3">Compliance overview</h2>
          <div className="bof-driver-metric-grid">
            <div className="bof-driver-metric">
              <div className="bof-driver-metric-label">Ready</div>
              <div className="bof-driver-metric-value bof-driver-metric-value--ok">{readiness.valid}</div>
            </div>
            <div className="bof-driver-metric">
              <div className="bof-driver-metric-label">Missing</div>
              <div
                className={`bof-driver-metric-value${readiness.missing > 0 ? " bof-driver-metric-value--danger" : ""}`}
              >
                {readiness.missing}
              </div>
            </div>
            <div className="bof-driver-metric">
              <div className="bof-driver-metric-label">Expired</div>
              <div
                className={`bof-driver-metric-value${readiness.expired > 0 ? " bof-driver-metric-value--danger" : ""}`}
              >
                {readiness.expired}
              </div>
            </div>
            <div className="bof-driver-metric">
              <div className="bof-driver-metric-label">Expiring soon</div>
              <div
                className={`bof-driver-metric-value${expiringSoon > 0 ? " bof-driver-metric-value--warn" : ""}`}
              >
                {expiringSoon}
              </div>
            </div>
          </div>
          {expiredDocs.map((doc) => (
            <div key={doc.type} className="bof-driver-doc-alert" role="status">
              <div className="bof-driver-doc-alert-title">{doc.type} expired</div>
              <div className="bof-driver-doc-alert-body">
                Expires: {doc.expirationDate ?? "—"}. Renew and upload on the driver hub document stacks.
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <Link href={`/drivers/${id}#driver-hub-documents-heading`} className="bof-driver-profile-action">
                  Open documents
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bof-driver-panel">
          <h2 className="bof-h3">Asset assignment</h2>
          <div className="bof-driver-ops-row">
            <span className="bof-driver-ops-k">Primary tractor</span>
            <span className="bof-driver-ops-v">{primary ?? (trucks[0] ?? "—")}</span>
          </div>
          <div className="bof-driver-ops-row">
            <span className="bof-driver-ops-k">Current load</span>
            <span className="bof-driver-ops-v">
              {activeLoad ? (
                <Link href={`/loads/${activeLoad.id}`} className="bof-link-secondary">
                  {activeLoad.number} · {activeLoad.status}
                </Link>
              ) : (
                "Available for assignment"
              )}
            </span>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <Link href={`/drivers/${id}/dispatch`} className="bof-driver-profile-action">
              Assign load
            </Link>
          </div>
        </div>

        <div className="bof-driver-panel">
          <h2 className="bof-h3">Operational summary</h2>
          <div className="bof-driver-ops-row">
            <span className="bof-driver-ops-k">Dispatch</span>
            <span className="bof-driver-ops-v">{eligibility.label}</span>
          </div>
          <div className="bof-driver-ops-row">
            <span className="bof-driver-ops-k">Open compliance items</span>
            <span className="bof-driver-ops-v">
              {compliance.filter((c) => {
                const st = c.status.toUpperCase();
                return st !== "CLOSED" && st !== "RESOLVED";
              }).length}
            </span>
          </div>
          {eligibility.recommendedAction ? (
            <div style={{ marginTop: "0.65rem" }}>
              <Link href={eligibility.recommendedAction.href} className="bof-driver-profile-action">
                {eligibility.recommendedAction.label}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
