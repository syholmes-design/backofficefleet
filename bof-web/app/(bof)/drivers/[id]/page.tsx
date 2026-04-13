import { notFound } from "next/navigation";
import Link from "next/link";
import { getBofData } from "@/lib/load-bof-data";
import {
  assignedTrucksForDriver,
  complianceNotesForDriver,
  getDriverById,
  getOrderedDocumentsForDriver,
  primaryAssignedTruck,
  readinessFromDocuments,
} from "@/lib/driver-queries";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverDocumentsPanel } from "@/components/DriverDocumentsPanel";
import { driverPhotoPath } from "@/lib/driver-photo";
import {
  GENERATED_PUBLIC_PREFIX,
  listEngineDocumentsForDriver,
} from "@/lib/document-engine";
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
  const readiness = readinessFromDocuments(documents);
  const trucks = assignedTrucksForDriver(data, id);
  const primary = primaryAssignedTruck(data, id);
  const compliance = complianceNotesForDriver(data, id);
  const engineDriverDocs = listEngineDocumentsForDriver(data, id);

  const truckLabel =
    trucks.length === 0
      ? null
      : trucks.length === 1
        ? trucks[0]
        : `${primary ?? trucks[0]} (${trucks.length} assets on record)`;

  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/drivers">Drivers</Link>
        <span aria-hidden> / </span>
        <span>{driver.name}</span>
      </nav>

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

      <section className="bof-driver-info-grid" aria-label="Contact and assignment">
        <div className="bof-info-block">
          <h2 className="bof-h3">Contact</h2>
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
          <h2 className="bof-h3">Emergency contact</h2>
          <dl className="bof-dl">
            <dt>Name</dt>
            <dd>{driver.emergencyContactName}</dd>
            <dt>Relationship</dt>
            <dd>{driver.emergencyContactRelationship}</dd>
            <dt>Phone</dt>
            <dd>
              <a
                href={`tel:${driver.emergencyContactPhone.replace(/\D/g, "")}`}
              >
                {driver.emergencyContactPhone}
              </a>
            </dd>
          </dl>
        </div>
        <div className="bof-info-block">
          <h2 className="bof-h3">Assignment</h2>
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
        {compliance.length > 0 && (
          <div className="bof-info-block bof-info-block-wide">
            <h2 className="bof-h3">Compliance flags</h2>
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
          </div>
        )}
      </section>

      <DriverDocumentsPanel
        driverId={driver.id}
        driverName={driver.name}
        documents={documents}
      />

      <DocumentEnginePanel
        title="Document automation engine — driver packet"
        lead="Credential shells and emergency contact sheet from drivers[] and documents[] only. Hover / click as on load detail."
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
