import Link from "next/link";
import { getBofData } from "@/lib/load-bof-data";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";
import { readinessFromDocuments, getOrderedDocumentsForDriver } from "@/lib/driver-queries";

export const metadata = {
  title: "Drivers | BOF",
  description: "Driver roster",
};

export default function DriversIndexPage() {
  const data = getBofData();

  return (
    <div className="bof-page">
      <h1 className="bof-title">Drivers</h1>
      <p className="bof-lead">
        Open a driver hub for profile, compliance, medical certificate, documents, and
        automation previews. Fleet-wide register lives in the{" "}
        <Link href="/documents" className="bof-link-secondary">
          document vault
        </Link>
        .
      </p>

      <div className="bof-driver-list">
        {data.drivers.map((d) => {
          const docs = getOrderedDocumentsForDriver(data, d.id);
          const r = readinessFromDocuments(docs);
          return (
            <Link
              key={d.id}
              href={`/drivers/${d.id}`}
              className="bof-driver-list-card"
            >
              <DriverAvatar
                name={d.name}
                photoUrl={driverPhotoPath(d.id)}
              />
              <div className="bof-driver-list-meta">
                <span className="bof-driver-list-name">{d.name}</span>
                <code className="bof-code">{d.id}</code>
                <span className="bof-driver-list-ready">{r.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
