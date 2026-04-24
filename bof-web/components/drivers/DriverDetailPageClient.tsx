"use client";

/**
 * Driver hub driven by useBofDemoData() so Source-of-Truth edits appear without
 * re-importing demo-data.json on the client bundle from each navigation.
 */

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  assignedTrucksForDriver,
  complianceNotesForDriver,
  getDriverById,
  getDriverMedicalExpanded,
  getOrderedDocumentsForDriver,
  getPrimaryStackExtraDocuments,
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
import { DriverFleetDocumentStacks } from "@/components/DriverFleetDocumentStacks";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";
import { GENERATED_PUBLIC_PREFIX } from "@/lib/generated-public-prefix";
import { listEngineDocumentsForDriver } from "@/lib/document-engine";
import { DocumentEnginePanel } from "@/components/DocumentEnginePanel";
import { RouteSupportWidget } from "@/components/route-support/RouteSupportWidget";
import { DieselRouteInsightWidget } from "@/components/fuel/DieselRouteInsightWidget";
import { useIntakeEngineStore } from "@/lib/stores/intake-engine-store";

export function DriverDetailPageClient({ driverId }: { driverId: string }) {
  const { data } = useBofDemoData();
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
  const primaryStackExtra = useMemo(
    () => getPrimaryStackExtraDocuments(data, driverId),
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
  const engineDriverDocs = useMemo(
    () => listEngineDocumentsForDriver(data, driverId),
    [data, driverId]
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

  const emergency = driver as typeof driver & {
    emergencyContactName?: string;
    emergencyContactRelationship?: string;
    emergencyContactPhone?: string;
  };

  const driverPhoto =
    (driver as { photoUrl?: string | undefined }).photoUrl?.trim() || driverPhotoPath(driver.id);

  return (
    <div className="bof-page bof-driver-hub">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/drivers">Drivers</Link>
        <span aria-hidden> / </span>
        <span>{driver.name}</span>
      </nav>
      <p className="bof-small" style={{ margin: "0 0 0.7rem" }}>
        <Link href={`/drivers/${driver.id}/bank-info`} className="bof-link-secondary">
          Bank Info
        </Link>
        {" · "}
        <Link href="/emergency-contacts" className="bof-link-secondary">
          Emergency Contacts
        </Link>
      </p>

      <section
        className="bof-driver-hub-section bof-driver-hub-section--profile"
        aria-label="Profile and operations"
      >
        <header className="bof-driver-header">
          <DriverAvatar name={driver.name} photoUrl={driverPhoto} size={88} />
          <div className="bof-driver-header-text">
            <h1 className="bof-title bof-title-tight">{driver.name}</h1>
            <p className="bof-driver-sub">
              <code className="bof-code">{driver.id}</code>
            </p>
            <p
              className={`bof-readiness-pill bof-readiness-${
                readiness.missing + readiness.expired > 0 ? "warn" : "ok"
              }`}
            >
              {readiness.label}
            </p>
          </div>
        </header>

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

        <div className="bof-driver-info-grid" aria-label="Contact and assignment">
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
              <dd>{emergency.emergencyContactName ?? "Not on file"}</dd>
              <dt>Relationship</dt>
              <dd>{emergency.emergencyContactRelationship ?? "Not on file"}</dd>
              <dt>Phone</dt>
              <dd>
                {emergency.emergencyContactPhone ? (
                  <a
                    href={`tel:${emergency.emergencyContactPhone.replace(/\D/g, "")}`}
                  >
                    {emergency.emergencyContactPhone}
                  </a>
                ) : (
                  "Not on file"
                )}
              </dd>
            </dl>
          </div>
          <div className="bof-info-block">
            <h3 className="bof-h3">Assignment</h3>
            <dl className="bof-dl">
              <dt>Assigned truck / asset</dt>
              <dd>{truckLabel ?? "—"}</dd>
            </dl>
            {trucks.length > 1 && (
              <p className="bof-muted bof-small">
                All assets from dispatch loads: {trucks.join(", ")}
              </p>
            )}
          </div>
        </div>

        {activeLoadForRoute && (
          <div className="bof-driver-route-support" aria-label="Route support for active trip">
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
        )}
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

        <DriverFleetDocumentStacks
          driverId={driver.id}
          driverName={driver.name}
          primaryCore={documents}
          primaryExtra={primaryStackExtra}
          secondary={secondaryStackOrdered}
        />

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

      <DocumentEnginePanel
        variant="supporting"
        title="Generated forms (automation preview)"
        lead="SVG shells built from the same demo JSON — supporting view; credential truth lives in the sections above and in the vault."
        documents={engineDriverDocs}
        crossLinks={[
          { label: "Document vault", href: "/documents" },
          { label: "Settlements", href: "/settlements" },
          { label: "Money at risk", href: "/money-at-risk" },
        ]}
      />
    </div>
  );
}
