"use client";

/**
 * Driver hub driven by useBofDemoData() so Source-of-Truth edits appear without
 * re-importing demo-data.json on the client bundle from each navigation.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  assignedTrucksForDriver,
  complianceNotesForDriver,
  getDriverById,
  getDriverMedicalExpanded,
  getOrderedDocumentsForDriver,
  getSecondaryStackDocumentsOrdered,
  primaryAssignedTruck,
  readinessFromDocuments,
} from "@/lib/driver-queries";
import {
  isJohnCarterReferenceDriver,
  JOHN_CARTER_CDL_NUMBER,
  JOHN_CARTER_REFERENCE_DRIVER_ID,
} from "@/lib/john-carter-reference";
import { getSupplementalDocumentsForDriver } from "@/lib/supplemental-driver-docs";
import { DriverMedicalExpandedPanel } from "@/components/DriverMedicalExpandedPanel";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";
import { GENERATED_PUBLIC_PREFIX } from "@/lib/generated-public-prefix";
import { buildDriverDocumentPacket } from "@/lib/driver-document-packet";
import { DriverDocumentPacketSection } from "@/components/drivers/DriverDocumentPacketSection";
import { RouteSupportWidget } from "@/components/route-support/RouteSupportWidget";
import { DieselRouteInsightWidget } from "@/components/fuel/DieselRouteInsightWidget";
import { useIntakeEngineStore } from "@/lib/stores/intake-engine-store";
import {
  deriveComplianceStatusFromDates,
  deriveDocStatusFromExpiration,
} from "@/lib/driver-operational-edit";
import { DemoBackButton } from "@/components/navigation/DemoBackButton";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { getDriverOperationalProfile } from "@/lib/driver-operational-profile";
import {
  complianceCredentialPrimaryLine,
  getDriverCredentialStatus,
} from "@/lib/driver-credential-status";
import { getSafetyScorecardRows } from "@/lib/safety-scorecard";
import { getDriverReviewExplanation } from "@/lib/driver-review-explanation";
import { DriverReviewDrawer } from "@/components/drivers/DriverReviewDrawer";

function homeBaseFromAddress(address: string): string {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  }
  return address.trim() || "—";
}

export function DriverDetailPageClient({ driverId }: { driverId: string }) {
  const {
    data,
    updateDriver,
    updateDocument,
    resolveDriverDispatchBlocker,
    resolveAllDriverDispatchBlockersForDemo,
    resetDriverDispatchBlockerOverrides,
    resolveDriverReviewIssue,
    resetDriverReviewOverrides,
  } = useBofDemoData();
  const intakeReadiness = useIntakeEngineStore((s) => s.driverReadinessLog);

  const driver = useMemo(() => getDriverById(data, driverId), [data, driverId]);
  const documents = useMemo(() => getOrderedDocumentsForDriver(data, driverId), [data, driverId]);
  const medicalDoc = useMemo(
    () => documents.find((d) => d.type === "Medical Card"),
    [documents]
  );
  const medicalExpanded = useMemo(
    () => getDriverMedicalExpanded(data, driverId),
    [data, driverId]
  );
  const supplementalDocs = useMemo(
    () => getSupplementalDocumentsForDriver(data, driverId),
    [data, driverId]
  );
  const secondaryStackOrdered = useMemo(
    () => getSecondaryStackDocumentsOrdered(data, driverId),
    [data, driverId]
  );
  const mcsa5876Signed = useMemo(
    () => secondaryStackOrdered.find((d) => d.type === "MCSA-5876 (signed PDF)") ?? null,
    [secondaryStackOrdered]
  );
  const readiness = useMemo(() => readinessFromDocuments(documents), [documents]);
  const trucks = useMemo(() => assignedTrucksForDriver(data, driverId), [data, driverId]);
  const primary = useMemo(() => primaryAssignedTruck(data, driverId), [data, driverId]);
  const compliance = useMemo(() => complianceNotesForDriver(data, driverId), [data, driverId]);
  const complianceSummary = useMemo(() => {
    let blocking = 0;
    let atRisk = 0;
    let resolved = 0;
    for (const row of compliance) {
      const status = row.status.toUpperCase();
      const severity = row.severity.toUpperCase();
      if (status === "CLOSED" || status === "RESOLVED") {
        resolved += 1;
      } else if (severity === "CRITICAL" || severity === "HIGH") {
        blocking += 1;
      } else {
        atRisk += 1;
      }
    }
    return { blocking, atRisk, resolved };
  }, [compliance]);
  const driverDocumentPacket = useMemo(
    () => buildDriverDocumentPacket(data, driverId),
    [data, driverId]
  );
  const operationalProfile = useMemo(
    () => getDriverOperationalProfile(data, driverId),
    [data, driverId]
  );
  const credentialStatus = useMemo(
    () => getDriverCredentialStatus(data, driverId),
    [data, driverId]
  );
  const dispatchEligibility = useMemo(
    () => getDriverDispatchEligibility(data, driverId),
    [data, driverId]
  );
  const reviewExplanation = useMemo(
    () => getDriverReviewExplanation(data, driverId),
    [data, driverId]
  );
  const safetyScoreRow = useMemo(
    () => getSafetyScorecardRows().find((r) => r.driverId === driverId),
    [driverId]
  );
  const settlementRow = useMemo(
    () => data.settlements.find((s) => s.driverId === driverId),
    [data.settlements, driverId]
  );
  const cdlDocument = useMemo(
    () => documents.find((d) => d.type === "CDL"),
    [documents]
  );
  const expiringSoonCount = useMemo(
    () => documents.filter((d) => d.status.toUpperCase() === "EXPIRING_SOON").length,
    [documents]
  );
  const expiredDocuments = useMemo(
    () => documents.filter((d) => d.status.toUpperCase() === "EXPIRED"),
    [documents]
  );
  const driverLoads = useMemo(
    () => data.loads.filter((l) => l.driverId === driverId),
    [data.loads, driverId]
  );
  const exceptionLoadCount = useMemo(
    () => driverLoads.filter((l) => Boolean(l.dispatchExceptionFlag)).length,
    [driverLoads]
  );
  const openComplianceCount = useMemo(
    () =>
      compliance.filter((c) => {
        const st = c.status.toUpperCase();
        return st !== "CLOSED" && st !== "RESOLVED";
      }).length,
    [compliance]
  );
  const isRefDriver = isJohnCarterReferenceDriver(driverId);

  const intakeReadinessForDriver = useMemo(
    () => intakeReadiness.filter((e) => e.driver_id === driverId),
    [intakeReadiness, driverId]
  );

  const activeLoadForRoute = useMemo(() => {
    const mine = data.loads.filter((l) => l.driverId === driverId);
    const en = mine.find((l) => l.status === "En Route");
    if (en) return en;
    return mine.find((l) => l.status === "Pending") ?? null;
  }, [data.loads, driverId]);

  useEffect(() => {
    if (!driver) return;
    document.title = `${driver.name} | Driver | BOF`;
  }, [driver]);

  useEffect(() => {
    const sync = () => {
      if (typeof window === "undefined") return;
      setReviewDrawerOpen(window.location.hash === "#driver-review");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  type DriverOperational = {
    emergencyContactName?: string;
    emergencyContactRelationship?: string;
    emergencyContactPhone?: string;
    secondaryContactName?: string;
    secondaryContactRelationship?: string;
    secondaryContactPhone?: string;
    bankName?: string;
    bankAccountType?: string;
    bankRoutingNumber?: string;
    bankAccountLast4?: string;
    cdl_expiration_date?: string;
    med_card_expiration_date?: string;
    mvr_expiration_date?: string;
    fmcsa_review_date?: string;
  };
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);

  const openReviewDrawer = () => {
    setReviewDrawerOpen(true);
    if (typeof window !== "undefined") {
      const base = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", `${base}#driver-review`);
    }
  };

  const closeReviewDrawer = () => {
    setReviewDrawerOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#driver-review") {
      const base = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", base);
    }
  };

  const [editingOperational, setEditingOperational] = useState(false);
  const [operationalDraft, setOperationalDraft] = useState({
    cdl_expiration_date: credentialStatus.cdl.expirationDate ?? "",
    med_card_expiration_date: credentialStatus.medicalCard.expirationDate ?? "",
    mvr_expiration_date: credentialStatus.mvr.expirationDate ?? "",
    fmcsa_review_date:
      credentialStatus.fmcsa.reviewDate ?? credentialStatus.fmcsa.expirationDate ?? "",
    emergencyContactName: operationalProfile?.primaryEmergencyName ?? "",
    emergencyContactRelationship: operationalProfile?.primaryEmergencyRelationship ?? "",
    emergencyContactPhone: operationalProfile?.primaryEmergencyPhone ?? "",
    secondaryContactName: operationalProfile?.secondaryEmergencyName ?? "",
    secondaryContactRelationship: operationalProfile?.secondaryEmergencyRelationship ?? "",
    secondaryContactPhone: operationalProfile?.secondaryEmergencyPhone ?? "",
    bankName: operationalProfile?.bankName ?? "",
    bankAccountType: operationalProfile?.bankAccountType ?? "",
    bankRoutingNumber: operationalProfile?.bankRoutingNumber ?? "",
    bankAccountLast4: operationalProfile?.bankAccountLast4 ?? "",
  });

  useEffect(() => {
    if (!driver) return;
    const d = driver as DriverOperational;
    setOperationalDraft({
      cdl_expiration_date:
        credentialStatus.cdl.expirationDate ?? d.cdl_expiration_date ?? "",
      med_card_expiration_date:
        credentialStatus.medicalCard.expirationDate ?? d.med_card_expiration_date ?? "",
      mvr_expiration_date:
        credentialStatus.mvr.expirationDate ?? d.mvr_expiration_date ?? "",
      fmcsa_review_date:
        credentialStatus.fmcsa.reviewDate ??
        credentialStatus.fmcsa.expirationDate ??
        d.fmcsa_review_date ??
        "",
      emergencyContactName:
        operationalProfile?.primaryEmergencyName ?? d.emergencyContactName ?? "",
      emergencyContactRelationship:
        operationalProfile?.primaryEmergencyRelationship ?? d.emergencyContactRelationship ?? "",
      emergencyContactPhone:
        operationalProfile?.primaryEmergencyPhone ?? d.emergencyContactPhone ?? "",
      secondaryContactName:
        operationalProfile?.secondaryEmergencyName ?? d.secondaryContactName ?? "",
      secondaryContactRelationship:
        operationalProfile?.secondaryEmergencyRelationship ?? d.secondaryContactRelationship ?? "",
      secondaryContactPhone:
        operationalProfile?.secondaryEmergencyPhone ?? d.secondaryContactPhone ?? "",
      bankName: operationalProfile?.bankName ?? d.bankName ?? "",
      bankAccountType: operationalProfile?.bankAccountType ?? d.bankAccountType ?? "",
      bankRoutingNumber: operationalProfile?.bankRoutingNumber ?? d.bankRoutingNumber ?? "",
      bankAccountLast4: operationalProfile?.bankAccountLast4 ?? d.bankAccountLast4 ?? "",
    });
  }, [
    driver,
    credentialStatus.cdl.expirationDate,
    credentialStatus.medicalCard.expirationDate,
    credentialStatus.mvr.expirationDate,
    credentialStatus.fmcsa.expirationDate,
    credentialStatus.fmcsa.reviewDate,
    operationalProfile?.primaryEmergencyName,
    operationalProfile?.primaryEmergencyRelationship,
    operationalProfile?.primaryEmergencyPhone,
    operationalProfile?.secondaryEmergencyName,
    operationalProfile?.secondaryEmergencyRelationship,
    operationalProfile?.secondaryEmergencyPhone,
    operationalProfile?.bankName,
    operationalProfile?.bankAccountType,
    operationalProfile?.bankRoutingNumber,
    operationalProfile?.bankAccountLast4,
  ]);

  function saveOperationalEdits() {
    if (!driver) return;
    const nextCompliance = deriveComplianceStatusFromDates({
      cdlExpirationDate: operationalDraft.cdl_expiration_date,
      medCardExpirationDate: operationalDraft.med_card_expiration_date,
    });
    updateDriver(driver.id, {
      ...operationalDraft,
      compliance_status: nextCompliance,
    });
    updateDocument(driver.id, "CDL", {
      expirationDate: operationalDraft.cdl_expiration_date || null,
      status: deriveDocStatusFromExpiration(operationalDraft.cdl_expiration_date),
    });
    const medDate = operationalDraft.med_card_expiration_date?.trim();
    updateDocument(
      driver.id,
      "Medical Card",
      medDate
        ? {
            expirationDate: medDate,
            status: deriveDocStatusFromExpiration(medDate),
          }
        : {
            expirationDate: medicalDoc?.expirationDate,
            status: medicalDoc?.status ?? "PENDING REVIEW",
          }
    );
    updateDocument(driver.id, "MVR", {
      expirationDate: operationalDraft.mvr_expiration_date || null,
      status: deriveDocStatusFromExpiration(operationalDraft.mvr_expiration_date),
    });
    updateDocument(driver.id, "FMCSA", {
      expirationDate: operationalDraft.fmcsa_review_date || null,
      status: deriveDocStatusFromExpiration(operationalDraft.fmcsa_review_date),
    });
    setEditingOperational(false);
  }

  if (!driver) {
    return (
      <div className="bof-page">
        <p className="bof-muted">Driver not found.</p>
        <Link href="/drivers" className="bof-link-secondary">
          Back to drivers
        </Link>
      </div>
    );
  }

  const truckLabel =
    trucks.length === 0
      ? null
      : trucks.length === 1
        ? trucks[0]
        : `${primary ?? trucks[0]} (${trucks.length} assets on record)`;

  const driverPhoto =
    (driver as { photoUrl?: string | undefined }).photoUrl?.trim() || driverPhotoPath(driver.id);

  const dispatchChipClass =
    dispatchEligibility.status === "ready"
      ? "bof-driver-dispatch-chip bof-driver-dispatch-chip--ready"
      : dispatchEligibility.status === "needs_review"
        ? "bof-driver-dispatch-chip bof-driver-dispatch-chip--review"
        : "bof-driver-dispatch-chip bof-driver-dispatch-chip--blocked";

  const dispatchChipLabel =
    dispatchEligibility.status === "ready"
      ? "Ready"
      : dispatchEligibility.status === "needs_review"
        ? "Needs review"
        : "Blocked";

  const overallDocStatusLabel =
    dispatchEligibility.status === "blocked"
      ? "Blocked — resolve hard gates"
      : readiness.expired + readiness.missing > 0
        ? "Action required — credentials"
        : expiringSoonCount > 0
          ? "Expiring soon — renew"
          : "Fleet docs ready";

  const cdlNumberDisplay =
    cdlDocument?.cdlNumber?.trim() ||
    cdlDocument?.sourceLicenseNumber?.trim() ||
    (driver as { referenceCdlNumber?: string }).referenceCdlNumber?.trim() ||
    "—";

  const licenseClassDisplay =
    cdlDocument?.licenseClass?.trim() || operationalProfile?.licenseClass?.trim() || "—";

  const licenseStateDisplay = operationalProfile?.licenseState?.trim() || "—";

  const dobDisplay =
    operationalProfile?.dob?.trim() ||
    (driver as { dateOfBirth?: string }).dateOfBirth?.trim() ||
    "—";

  const complianceStatusDisplay =
    (driver as { compliance_status?: string }).compliance_status?.trim() || "—";

  return (
    <div className="bof-page bof-driver-hub">
      <header className="bof-driver-profile-toolbar">
        <DemoBackButton fallbackHref="/drivers" />
        <div className="bof-driver-profile-toolbar-row">
          <div className="bof-driver-profile-title-block">
            <h1 className="bof-title bof-title-tight">{driver.name}</h1>
            <p className="bof-driver-sub">
              <code className="bof-code">{driver.id}</code>
              <span className="bof-muted" style={{ marginLeft: "0.5rem" }}>
                {readiness.label}
              </span>
            </p>
            <div className="bof-driver-profile-meta-row">
              {dispatchEligibility.status === "needs_review" || dispatchEligibility.status === "blocked" ? (
                <button
                  type="button"
                  className={dispatchChipClass}
                  title={dispatchEligibility.label}
                  onClick={openReviewDrawer}
                >
                  Dispatch: {dispatchChipLabel.toUpperCase()}
                </button>
              ) : (
                <span className={dispatchChipClass} title={dispatchEligibility.label}>
                  Dispatch: {dispatchChipLabel}
                </span>
              )}
              {(dispatchEligibility.status === "needs_review" || dispatchEligibility.status === "blocked") && (
                <button type="button" className="bof-link-secondary bof-small" style={{ marginLeft: "0.35rem" }} onClick={openReviewDrawer}>
                  What needs review?
                </button>
              )}
              <span
                className={`bof-readiness-pill bof-readiness-${
                  readiness.missing + readiness.expired > 0 ? "warn" : "ok"
                }`}
              >
                {overallDocStatusLabel}
              </span>
            </div>
          </div>
          <nav className="bof-driver-profile-actions" aria-label="Driver quick actions">
            <Link href={`#driver-hub-documents-heading`} className="bof-driver-profile-action">
              Open documents
            </Link>
            <Link href="#document-engine" className="bof-driver-profile-action">
              HR packet
            </Link>
            <Link href={`/drivers/${driver.id}/safety`} className="bof-driver-profile-action">
              Safety
            </Link>
            <Link href={`/drivers/${driver.id}/dispatch`} className="bof-driver-profile-action">
              Assign load
            </Link>
            <Link href={`/drivers/${driver.id}/vault`} className="bof-driver-profile-action bof-driver-profile-action--ghost">
              Vault
            </Link>
          </nav>
        </div>
      </header>
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/drivers">Drivers</Link>
        <span aria-hidden> / </span>
        <span>{driver.name}</span>
      </nav>

      <section
        className="bof-driver-hub-section bof-driver-hub-section--profile"
        aria-label="Profile and operations"
      >
        {isRefDriver && (
          <p className="bof-driver-ref-strip">
            Reference record: BOF id{" "}
            <code className="bof-code">{JOHN_CARTER_REFERENCE_DRIVER_ID}</code>
            {" · "}
            CDL <code className="bof-code">{JOHN_CARTER_CDL_NUMBER}</code> (same driver;
            routes and vault use {JOHN_CARTER_REFERENCE_DRIVER_ID}).
          </p>
        )}

        {intakeReadinessForDriver.length > 0 ? (
          <div className="bof-driver-intake-readiness" style={{ marginTop: "0.75rem" }}>
            <h3 className="bof-h3">Intake Engine — driver readiness</h3>
            <ul className="bof-intake-engine-bullet">
              {intakeReadinessForDriver.map((e) => (
                <li key={e.id}>
                  <strong>{e.readiness_impact.replace(/_/g, " ")}</strong> · {e.detail}{" "}
                  <Link href={`/intake/${e.intake_id}`} className="bof-link-secondary">
                    {e.intake_id}
                  </Link>
                  <span className="bof-muted">
                    {" "}
                    · {new Date(e.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="bof-driver-profile-columns">
          <div>
            <div className="bof-driver-panel" aria-labelledby="driver-identity-heading">
              <h2 id="driver-identity-heading" className="bof-h3">
                Driver identity
              </h2>
              <div className="bof-driver-identity-header">
                <DriverAvatar name={driver.name} photoUrl={driverPhoto} size={112} />
                <div style={{ minWidth: 0 }}>
                  <p className="bof-muted bof-small" style={{ margin: 0 }}>
                    Profile status
                  </p>
                  <p style={{ margin: "0.2rem 0 0", fontWeight: 700, color: "#f8fafc" }}>
                    {complianceStatusDisplay}
                  </p>
                  <p className="bof-muted bof-small" style={{ margin: "0.5rem 0 0" }}>
                    Home base
                  </p>
                  <p style={{ margin: "0.15rem 0 0", color: "#e2e8f0", fontSize: "0.88rem" }}>
                    {homeBaseFromAddress(driver.address)}
                  </p>
                </div>
              </div>
              <dl className="bof-driver-identity-dl">
                <dt>CDL class / state</dt>
                <dd>
                  {licenseClassDisplay} · {licenseStateDisplay}
                </dd>
                <dt>CDL number</dt>
                <dd>
                  <code className="bof-code">{cdlNumberDisplay}</code>
                </dd>
                <dt>Date of birth</dt>
                <dd>{dobDisplay}</dd>
              </dl>
            </div>

            <div className="bof-driver-panel" aria-labelledby="driver-asset-heading">
              <h2 id="driver-asset-heading" className="bof-h3">
                Asset assignment
              </h2>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Primary tractor</span>
                <span className="bof-driver-ops-v">{primary ?? truckLabel ?? "—"}</span>
              </div>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Trailer</span>
                <span className="bof-driver-ops-v">Not on load record (demo)</span>
              </div>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Current load</span>
                <span className="bof-driver-ops-v">
                  {activeLoadForRoute ? (
                    <>
                      <Link href={`/loads/${activeLoadForRoute.id}`} className="bof-link-secondary">
                        {activeLoadForRoute.number}
                      </Link>
                      <span className="bof-muted"> · {activeLoadForRoute.status}</span>
                    </>
                  ) : (
                    <span>Available for assignment</span>
                  )}
                </span>
              </div>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Asset readiness</span>
                <span className="bof-driver-ops-v">{truckLabel ? "Assets on record" : "No assets linked"}</span>
              </div>
              {trucks.length > 1 && (
                <p className="bof-muted bof-small" style={{ marginTop: "0.65rem" }}>
                  All recorded assets: {trucks.join(", ")}
                </p>
              )}
              <div style={{ marginTop: "0.85rem", display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {activeLoadForRoute ? (
                  <Link href={`/loads/${activeLoadForRoute.id}`} className="bof-driver-profile-action">
                    Open load
                  </Link>
                ) : null}
                <Link href={`/drivers/${driver.id}/dispatch`} className="bof-driver-profile-action">
                  Assign load
                </Link>
              </div>
            </div>

            {activeLoadForRoute ? (
              <div className="bof-driver-panel" aria-label="Route support for active trip">
                <h3 className="bof-h3">Trip route support</h3>
                <p className="bof-muted bof-small">
                  Next rest stop context for{" "}
                  <Link href={`/loads/${activeLoadForRoute.id}`} className="bof-link-secondary">
                    load {activeLoadForRoute.number}
                  </Link>{" "}
                  (<code className="bof-code">{activeLoadForRoute.id}</code>) ·{" "}
                  <Link href={`/trip-release/${activeLoadForRoute.id}`} className="bof-link-secondary">
                    Trip release
                  </Link>
                </p>
                <RouteSupportWidget loadId={activeLoadForRoute.id} variant="full" />
                <DieselRouteInsightWidget loadId={activeLoadForRoute.id} variant="full" />
              </div>
            ) : null}
          </div>

          <div>
            <div className="bof-driver-panel" aria-labelledby="driver-compliance-overview-heading">
              <h2 id="driver-compliance-overview-heading" className="bof-h3">
                Compliance overview
              </h2>
              <p className="bof-muted bof-small" style={{ marginTop: 0 }}>
                Seven fleet-required credential slots plus core dispatch documents.
              </p>
              <div className="bof-driver-metric-grid">
                <div className="bof-driver-metric">
                  <div className="bof-driver-metric-label">Ready</div>
                  <div className="bof-driver-metric-value bof-driver-metric-value--ok">{readiness.valid}</div>
                </div>
                <div className="bof-driver-metric">
                  <div className="bof-driver-metric-label">Missing</div>
                  <div
                    className={`bof-driver-metric-value${
                      readiness.missing > 0 ? " bof-driver-metric-value--danger" : ""
                    }`}
                  >
                    {readiness.missing}
                  </div>
                </div>
                <div className="bof-driver-metric">
                  <div className="bof-driver-metric-label">Expired</div>
                  <div
                    className={`bof-driver-metric-value${
                      readiness.expired > 0 ? " bof-driver-metric-value--danger" : ""
                    }`}
                  >
                    {readiness.expired}
                  </div>
                </div>
                <div className="bof-driver-metric">
                  <div className="bof-driver-metric-label">Expiring soon</div>
                  <div
                    className={`bof-driver-metric-value${
                      expiringSoonCount > 0 ? " bof-driver-metric-value--warn" : ""
                    }`}
                  >
                    {expiringSoonCount}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <span className={dispatchChipClass}>Overall: {overallDocStatusLabel}</span>
              </div>
              {expiredDocuments.map((doc) => (
                <div key={doc.type} className="bof-driver-doc-alert" role="status">
                  <div className="bof-driver-doc-alert-title">{doc.type} expired</div>
                  <div className="bof-driver-doc-alert-body">
                    Expiration: {doc.expirationDate ?? "—"}. Renew the credential and upload the updated file to
                    the driver vault, then refresh this hub.
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <Link href="#driver-hub-documents-heading" className="bof-driver-profile-action">
                      Open documents
                    </Link>
                  </div>
                </div>
              ))}
              {readiness.missing > 0 && expiredDocuments.length === 0 ? (
                <div className="bof-driver-doc-alert" role="status">
                  <div className="bof-driver-doc-alert-title">Missing required documents</div>
                  <div className="bof-driver-doc-alert-body">
                    {dispatchEligibility.hardBlockers.find((b) => b.includes("missing")) ??
                      "One or more fleet-required documents are not on file. Upload scans in the document stacks below."}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <Link href="#driver-hub-documents-heading" className="bof-driver-profile-action">
                      Open documents
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bof-driver-panel" aria-labelledby="driver-ops-summary-heading">
              <h2 id="driver-ops-summary-heading" className="bof-h3">
                Operational summary
              </h2>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Dispatch eligibility</span>
                <span className="bof-driver-ops-v">
                  {dispatchEligibility.label}
                  {(dispatchEligibility.status === "needs_review" || dispatchEligibility.status === "blocked") && (
                    <>
                      {" "}
                      <button type="button" className="bof-link-secondary" onClick={openReviewDrawer}>
                        View review details
                      </button>
                    </>
                  )}
                </span>
              </div>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Current load</span>
                <span className="bof-driver-ops-v">
                  {activeLoadForRoute
                    ? `${activeLoadForRoute.number} (${activeLoadForRoute.status})`
                    : "Available"}
                </span>
              </div>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Safety tier</span>
                <span className="bof-driver-ops-v">
                  {safetyScoreRow ? safetyScoreRow.performanceTier : "No score on file"}
                  {safetyScoreRow ? ` · HOS ${safetyScoreRow.hosCompliancePct}%` : ""}
                </span>
              </div>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Settlement</span>
                <span className="bof-driver-ops-v">
                  {settlementRow ? `${settlementRow.status ?? "—"}` : "—"}
                </span>
              </div>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Open compliance items</span>
                <span className="bof-driver-ops-v">{openComplianceCount}</span>
              </div>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Loads w/ dispatch exception</span>
                <span className="bof-driver-ops-v">{exceptionLoadCount}</span>
              </div>
              <div className="bof-driver-ops-row">
                <span className="bof-driver-ops-k">Recommended next step</span>
                <span className="bof-driver-ops-v">
                  {reviewExplanation.recommendedNextStepText ? (
                    <>
                      <span>{reviewExplanation.recommendedNextStepText}</span>
                      {(dispatchEligibility.recommendedAction ?? reviewExplanation.primaryAction) ? (
                        <>
                          {" "}
                          <Link
                            href={
                              (dispatchEligibility.recommendedAction ?? reviewExplanation.primaryAction)!.href
                            }
                            className="bof-link-secondary"
                          >
                            {(dispatchEligibility.recommendedAction ?? reviewExplanation.primaryAction)!.label}
                          </Link>
                        </>
                      ) : null}
                    </>
                  ) : dispatchEligibility.recommendedAction ? (
                    <Link
                      href={dispatchEligibility.recommendedAction.href}
                      className="bof-link-secondary"
                    >
                      {dispatchEligibility.recommendedAction.label}
                    </Link>
                  ) : (
                    <span className="bof-muted">No action — profile clean for dispatch</span>
                  )}
                </span>
              </div>
              {dispatchEligibility.hardBlockerDetails.length > 0 ||
              dispatchEligibility.demoResolvedHardBlockers.length > 0 ? (
                <div
                  className="bof-driver-ops-row"
                  style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}
                >
                  <span className="bof-driver-ops-k">Dispatch hard gates</span>
                  {dispatchEligibility.hardBlockerDetails.length > 0 ? (
                    <ul className="bof-muted" style={{ margin: 0, paddingLeft: "1.1rem" }}>
                      {dispatchEligibility.hardBlockerDetails.map((b) => (
                        <li key={b.id}>{b.message}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="bof-muted bof-small" style={{ margin: 0 }}>
                      No active hard gates — remaining items are soft warnings or demo overrides.
                    </p>
                  )}
                  {dispatchEligibility.demoResolvedHardBlockers.length > 0 ? (
                    <p className="bof-small bof-muted" style={{ margin: 0 }}>
                      <strong>Resolved for demo:</strong>{" "}
                      {dispatchEligibility.demoResolvedHardBlockers.map((b) => b.message).join(" · ")}
                    </p>
                  ) : null}
                  {dispatchEligibility.softWarnings.some((w) => w.startsWith("Demo override active")) ? (
                    <p className="bof-small bof-muted" style={{ margin: 0 }}>
                      {dispatchEligibility.softWarnings.find((w) => w.startsWith("Demo override active"))}
                    </p>
                  ) : null}
                  {dispatchEligibility.status === "blocked" && dispatchEligibility.hardBlockerDetails.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {dispatchEligibility.hardBlockerDetails.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="bof-intake-engine-btn"
                          onClick={() =>
                            resolveDriverDispatchBlocker(
                              driverId,
                              b.id,
                              b.id.startsWith("medical_card")
                                ? "Mark credential reviewed for demo"
                                : "Override block for demo"
                            )
                          }
                        >
                          {b.id.startsWith("medical_card")
                            ? "Mark credential reviewed for demo"
                            : "Override block for demo"}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="bof-intake-engine-btn"
                        onClick={() => resolveAllDriverDispatchBlockersForDemo(driverId)}
                      >
                        Resolve all for demo
                      </button>
                    </div>
                  ) : null}
                  {dispatchEligibility.demoResolvedHardBlockers.length > 0 ? (
                    <button
                      type="button"
                      className="bof-link-secondary"
                      style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      onClick={() => resetDriverDispatchBlockerOverrides(driverId)}
                    >
                      Reset demo overrides
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bof-driver-detail-grid" aria-label="Contact and operational details">
          <div className="bof-info-block">
            <h3 className="bof-h3">Operational quick edit</h3>
            <p className="bof-muted bof-small">
              Edit compliance dates and core contact/payment fields directly on this screen.
            </p>
            {!editingOperational ? (
              <button
                type="button"
                className="bof-intake-engine-btn"
                onClick={() => setEditingOperational(true)}
              >
                Edit operational fields
              </button>
            ) : (
              <div className="bof-driver-vault-form">
                <label>
                  <span>CDL expiration date</span>
                  <input
                    type="date"
                    value={operationalDraft.cdl_expiration_date}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, cdl_expiration_date: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Medical certification expiration date</span>
                  <input
                    type="date"
                    value={operationalDraft.med_card_expiration_date}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, med_card_expiration_date: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>MVR expiration date</span>
                  <input
                    type="date"
                    value={operationalDraft.mvr_expiration_date}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, mvr_expiration_date: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>FMCSA review date</span>
                  <input
                    type="date"
                    value={operationalDraft.fmcsa_review_date}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, fmcsa_review_date: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Emergency contact name</span>
                  <input
                    value={operationalDraft.emergencyContactName}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, emergencyContactName: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Emergency contact relationship</span>
                  <input
                    value={operationalDraft.emergencyContactRelationship}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({
                        ...s,
                        emergencyContactRelationship: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Emergency contact phone</span>
                  <input
                    value={operationalDraft.emergencyContactPhone}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, emergencyContactPhone: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Secondary contact name</span>
                  <input
                    value={operationalDraft.secondaryContactName}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, secondaryContactName: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Secondary contact relationship</span>
                  <input
                    value={operationalDraft.secondaryContactRelationship}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({
                        ...s,
                        secondaryContactRelationship: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Secondary contact phone</span>
                  <input
                    value={operationalDraft.secondaryContactPhone}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, secondaryContactPhone: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Bank name</span>
                  <input
                    value={operationalDraft.bankName}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, bankName: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Bank account type</span>
                  <input
                    value={operationalDraft.bankAccountType}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, bankAccountType: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Bank routing number</span>
                  <input
                    value={operationalDraft.bankRoutingNumber}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, bankRoutingNumber: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Bank account last 4</span>
                  <input
                    value={operationalDraft.bankAccountLast4}
                    onChange={(e) =>
                      setOperationalDraft((s) => ({ ...s, bankAccountLast4: e.target.value }))
                    }
                  />
                </label>
                <div className="bof-driver-vault-actions">
                  <button
                    type="button"
                    className="bof-intake-engine-btn bof-intake-engine-btn--primary"
                    onClick={saveOperationalEdits}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="bof-intake-engine-btn"
                    onClick={() => setEditingOperational(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="bof-info-block">
            <h3 className="bof-h3">Contact</h3>
            <dl className="bof-dl">
              <dt>Address</dt>
              <dd>{driver.address}</dd>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${driver.phone.replace(/\D/g, "")}`}>{driver.phone}</a>
              </dd>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${driver.email}`}>{driver.email}</a>
              </dd>
            </dl>
          </div>
          <div className="bof-info-block">
            <h3 className="bof-h3">Emergency contact</h3>
            <dl className="bof-dl">
              <dt>Name</dt>
              <dd>
                {operationalProfile?.primaryEmergencyName?.trim()
                  ? operationalProfile.primaryEmergencyName
                  : credentialStatus.emergencyContact.status === "missing"
                    ? "Missing / needs review"
                    : "On file — details need review"}
              </dd>
              <dt>Relationship</dt>
              <dd>
                {operationalProfile?.primaryEmergencyRelationship?.trim()
                  ? operationalProfile.primaryEmergencyRelationship
                  : credentialStatus.emergencyContact.status === "missing"
                    ? "Missing / needs review"
                    : "—"}
              </dd>
              <dt>Phone</dt>
              <dd>
                {operationalProfile?.primaryEmergencyPhone?.trim() ? (
                  <a
                    href={`tel:${operationalProfile.primaryEmergencyPhone.replace(/\D/g, "")}`}
                  >
                    {operationalProfile.primaryEmergencyPhone}
                  </a>
                ) : credentialStatus.emergencyContact.status === "missing" ? (
                  "Missing / needs review"
                ) : (
                  "On file — details need review"
                )}
              </dd>
            </dl>
          </div>
          <div className="bof-info-block">
            <h3 className="bof-h3">Secondary contact</h3>
            <dl className="bof-dl">
              <dt>Name</dt>
              <dd>
                {operationalProfile?.secondaryEmergencyName?.trim()
                  ? operationalProfile.secondaryEmergencyName
                  : "—"}
              </dd>
              <dt>Relationship</dt>
              <dd>
                {operationalProfile?.secondaryEmergencyRelationship?.trim()
                  ? operationalProfile.secondaryEmergencyRelationship
                  : "—"}
              </dd>
              <dt>Phone</dt>
              <dd>
                {operationalProfile?.secondaryEmergencyPhone?.trim()
                  ? operationalProfile.secondaryEmergencyPhone
                  : "—"}
              </dd>
            </dl>
          </div>
          <div className="bof-info-block">
            <h3 className="bof-h3">Compliance dates</h3>
            <p className="bof-muted bof-small" style={{ marginTop: 0 }}>
              Same source as document summary —{" "}
              <code className="bof-code">getDriverCredentialStatus</code>.
            </p>
            <dl className="bof-dl">
              <dt>CDL expiration</dt>
              <dd>{complianceCredentialPrimaryLine(credentialStatus.cdl, "expiration")}</dd>
              <dt>Medical certification expiration</dt>
              <dd>{complianceCredentialPrimaryLine(credentialStatus.medicalCard, "expiration")}</dd>
              <dt>MVR expiration</dt>
              <dd>{complianceCredentialPrimaryLine(credentialStatus.mvr, "mvr_review")}</dd>
              <dt>FMCSA review date</dt>
              <dd>{complianceCredentialPrimaryLine(credentialStatus.fmcsa, "fmcsa_review")}</dd>
            </dl>
          </div>
          <div className="bof-info-block">
            <h3 className="bof-h3">Bank information</h3>
            <dl className="bof-dl">
              <dt>Bank name</dt>
              <dd>
                {operationalProfile?.bankName?.trim()
                  ? operationalProfile.bankName
                  : credentialStatus.bankInformation.status === "missing"
                    ? "Missing / needs review"
                    : "On file — details need review"}
              </dd>
              <dt>Account type</dt>
              <dd>
                {operationalProfile?.bankAccountType?.trim()
                  ? operationalProfile.bankAccountType
                  : credentialStatus.bankInformation.status === "missing"
                    ? "Missing / needs review"
                    : "—"}
              </dd>
              <dt>Routing number</dt>
              <dd>
                {operationalProfile?.bankRoutingNumber?.trim()
                  ? operationalProfile.bankRoutingNumber
                  : credentialStatus.bankInformation.status === "missing"
                    ? "Missing / needs review"
                    : "—"}
              </dd>
              <dt>Account last 4</dt>
              <dd>
                {operationalProfile?.bankAccountLast4?.trim()
                  ? operationalProfile.bankAccountLast4
                  : credentialStatus.bankInformation.status === "missing"
                    ? "Missing / needs review"
                    : "—"}
              </dd>
            </dl>
          </div>
        </div>
      </section>

      <section
        className="bof-driver-hub-section"
        aria-labelledby="driver-hub-compliance-heading"
      >
        <h2 id="driver-hub-compliance-heading" className="bof-h2 bof-driver-hub-h2">
          Compliance
        </h2>
        <p className="bof-doc-section-lead bof-driver-hub-lead">
          Incident posture and generated packet links for this driver. Credential-level risk still surfaces on
          individual document cards and in the{" "}
          <Link href="/documents" className="bof-link-secondary">
            document vault
          </Link>
          .
        </p>
        {compliance.length > 0 ? (
          <ul className="bof-compliance-mini">
            {compliance.map((c) => {
              const status = c.status.toUpperCase();
              const severity = c.severity.toUpperCase();
              const resolved = status === "CLOSED" || status === "RESOLVED";
              const blocking = !resolved && (severity === "CRITICAL" || severity === "HIGH");
              return (
                <li key={c.incidentId} className="bof-compliance-mini-row">
                  <span className="bof-compliance-mini-head">
                    <span
                      className={
                        resolved
                          ? "bof-status-pill bof-status-pill-ok"
                          : blocking
                            ? "bof-status-pill bof-status-pill-danger"
                            : "bof-status-pill bof-status-pill-info"
                      }
                    >
                      {resolved
                        ? "Resolved / clean"
                        : blocking
                          ? "Blocking action"
                          : "At risk"}
                    </span>
                    <span className="bof-badge bof-badge-warn">{c.severity}</span>
                  </span>
                  <span className="bof-compliance-mini-title">
                    {c.type} — <span className="bof-muted">{c.status}</span>
                  </span>
                  <div className="bof-small">
                    <a
                      href={`${GENERATED_PUBLIC_PREFIX}/claims/${c.incidentId}/evidence-summary.svg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bof-link-secondary"
                    >
                      Generated compliance packet
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="bof-empty-state">
            <h3 className="bof-h3">No incidents on this driver profile</h3>
            <p className="bof-muted bof-small">Current shared data indicates a clean compliance lane.</p>
          </div>
        )}
        <div className="bof-driver-compliance-summary">
          <span className="bof-status-pill bof-status-pill-danger">
            Blocking: {complianceSummary.blocking}
          </span>
          <span className="bof-status-pill bof-status-pill-info">
            At risk: {complianceSummary.atRisk}
          </span>
          <span className="bof-status-pill bof-status-pill-ok">
            Resolved: {complianceSummary.resolved}
          </span>
        </div>
      </section>

      {medicalDoc && (
        <section
          className="bof-driver-hub-section"
          aria-label="Medical certificate"
        >
          <DriverMedicalExpandedPanel
            driverName={driver.name}
            medicalDoc={medicalDoc}
            expanded={medicalExpanded}
            mcsa5876Signed={mcsa5876Signed}
            medicalCanonical={credentialStatus.medicalCard}
          />
        </section>
      )}

      <section
        className="bof-driver-hub-section"
        aria-labelledby="driver-hub-documents-heading"
      >
        <h2 id="driver-hub-documents-heading" className="bof-h2 bof-driver-hub-h2">
          Documents &amp; credentials
        </h2>
        <p className="bof-doc-section-lead bof-driver-hub-lead">
          Primary slots are the seven fleet-required types, plus MCSA-5875 and emergency
          contact. Secondary files (MCSA-5876, profile, applications, internal summaries)
          stay linked here and in the{" "}
          <Link href="/documents" className="bof-link-secondary">
            vault
          </Link>
          .
        </p>

        <DriverDocumentPacketSection packet={driverDocumentPacket} />

        {supplementalDocs.length > 0 && (
          <div className="bof-driver-hub-supplemental">
            <h3 className="bof-h3">Additional attachments</h3>
            <ul className="bof-compliance-mini">
              {supplementalDocs.map((doc) => (
                <li key={`${doc.driverId}-${doc.type}`}>
                  <a
                    href={doc.fileUrl ?? doc.previewUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    {doc.type}
                    {doc.status ? ` (${doc.status})` : ""}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="bof-driver-hub-section" aria-labelledby="driver-hr-generated-packet-heading">
        <h2 id="driver-hr-generated-packet-heading" className="bof-h2 bof-driver-hub-h2">
          HR packet shortcuts
        </h2>
        <p className="bof-doc-section-lead bof-driver-hub-lead">
          Administrative packet documents are now deduplicated into Generated Administrative Summaries
          in the document summary above. Use shortcuts below for full workflow pages.
        </p>
        <div className="bof-driver-hub-supplemental">
          <ul className="bof-compliance-mini">
            <li>
              <Link href={`/drivers/${driver.id}/hr`} className="bof-link-secondary">
                HR &amp; administrative record
              </Link>
            </li>
            <li>
              <Link href={`/drivers/${driver.id}/vault`} className="bof-link-secondary">
                Driver document vault / qualification file
              </Link>
            </li>
            <li>
              <Link href="/documents" className="bof-link-secondary">
                BOF document vault index
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {reviewDrawerOpen ? (
        <DriverReviewDrawer
          data={data}
          driverId={driverId}
          onClose={closeReviewDrawer}
          resolveDriverDispatchBlocker={resolveDriverDispatchBlocker}
          resolveDriverReviewIssue={resolveDriverReviewIssue}
          resetDriverReviewOverrides={resetDriverReviewOverrides}
        />
      ) : null}
    </div>
  );
}
