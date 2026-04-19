"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";
import { readinessFromDocuments, getOrderedDocumentsForDriver } from "@/lib/driver-queries";

export function DriversListPageClient() {
  const { data } = useBofDemoData();

  const rows = useMemo(
    () =>
      data.drivers.map((d) => {
        const docs = getOrderedDocumentsForDriver(data, d.id);
        return { driver: d, readiness: readinessFromDocuments(docs) };
      }),
    [data]
  );

  return (
    <div className="bof-page">
      <h1 className="bof-title">Drivers</h1>
      <p className="bof-lead">
        Open a driver hub for profile, compliance, medical certificate, documents, and
        automation previews. Fleet-wide register lives in the{" "}
        <Link href="/documents" className="bof-link-secondary">
          document vault
        </Link>
        . Demo rows are driven by the{" "}
        <Link href="/source-of-truth" className="bof-link-secondary">
          Source of Truth
        </Link>{" "}
        when you edit persisted demo data.
      </p>

      <div className="bof-driver-list">
        {rows.map(({ driver: d, readiness: r }) => {
          const photo =
            (d as { photoUrl?: string | undefined }).photoUrl?.trim() || driverPhotoPath(d.id);
          return (
            <Link key={d.id} href={`/drivers/${d.id}`} className="bof-driver-list-card">
              <DriverAvatar name={d.name} photoUrl={photo} />
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
