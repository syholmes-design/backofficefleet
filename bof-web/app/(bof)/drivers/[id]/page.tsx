import { notFound } from "next/navigation";
import Link from "next/link";
import { getBofData } from "@/lib/load-bof-data";
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

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const data = getBofData();
  return data.drivers.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  const d = getDriverById(data, id);
  return {
    title: d ? `${d.name} | Driver | BOF` : "Driver | BOF",
  };
}

export default async function DriverDetailPage({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  const driver = getDriverById(data, id);
  if (!driver) notFound();

  const documents = getOrderedDocumentsForDriver(data, id);
  const medicalDoc = documents.find((d) => d.type === "Medical Card");
  const medicalExpanded = getDriverMedicalExpanded(data, id);
  const supplementalDocs = getSupplementalDocumentsForDriver(data, id);
  const primaryStackExtra = getPrimaryStackExtraDocuments(data, id);
  const secondaryStackOrdered = getSecondaryStackDocumentsOrdered(data, id);
  const mcsa5876Signed =
    secondaryStackOrdered.find((d) => d.type === "MCSA-5876 (signed PDF)") ?? null;
  const readiness = readinessFromDocuments(documents);
  const trucks = assignedTrucksForDriver(data, id);
  const primary = primaryAssignedTruck(data, id);
  const compliance = complianceNotesForDriver(data, id);
  const engineDriverDocs = listEngineDocumentsForDriver(data, id);
  const isRefDriver = isJohnCarterReferenceDriver(driver.id);

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

  return (
    <div className="bof-page bof-driver-hub">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/drivers">Drivers</Link>
        <span aria-hidden> / </span>
        <span>{driver.name}</span>
      </nav>

      {/* Canonical driver hub: profile + operations */}
      <section
        className="bof-driver-hub-section bof-driver-hub-section--profile"
        aria-label="Profile and operations"
      >
        <header className="bof-driver-header">
          <DriverAvatar
            name={driver.name}
            photoUrl={driverPhotoPath(driver.id)}
            size={88}
          />
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
      </section>

      {compliance.length > 0 && (
        <section
          className="bof-driver-hub-section"
          aria-labelledby="driver-hub-compliance-heading"
        >
          <h2 id="driver-hub-compliance-heading" className="bof-h2 bof-driver-hub-h2">
            Compliance
          </h2>
          <p className="bof-doc-section-lead bof-driver-hub-lead">
            Open incidents for this driver. Credential-level risk still surfaces on
            individual document cards and in the{" "}
            <Link href="/documents" className="bof-link-secondary">
              document vault
            </Link>
            .
          </p>
          <ul className="bof-compliance-mini">
            {compliance.map((c) => (
              <li key={c.incidentId}>
                <span className="bof-badge bof-badge-warn">{c.severity}</span>{" "}
                {c.type} — <span className="bof-muted">{c.status}</span>
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
            ))}
          </ul>
        </section>
      )}

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
