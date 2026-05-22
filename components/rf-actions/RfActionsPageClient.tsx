"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";
import { driverPhotoPath } from "@/lib/driver-photo";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildRfActions } from "@/lib/load-proof";

export function RfActionsPageClient() {
  const { data } = useBofDemoData();
  const actions = useMemo(() => buildRfActions(data), [data]);

  return (
    <div className="bof-page">
      <h1 className="bof-title">RF action engine</h1>
      <p className="bof-lead">
        Actions generated from the load proof layer — payment blocks, missing proofs, and dispute
        exposure. Same data powers Settlements and Money at Risk. The{" "}
        <Link href="/loads" className="bof-link-secondary">
          document automation engine
        </Link>{" "}
        on each load merges these RF actions with RFID dock/fuel/maintenance snapshots (see RF POD,
        seal, fuel, and maintenance reports).
      </p>

      <p className="bof-stats">
        <strong>{actions.length}</strong> open actions
      </p>

      <div className="bof-table-wrap">
        <table className="bof-table">
          <thead>
            <tr>
              <th scope="col">Priority</th>
              <th scope="col">Load</th>
              <th scope="col">Proof item</th>
              <th scope="col" className="bof-table-photo-col">
                Photo
              </th>
              <th scope="col">Driver</th>
              <th scope="col">Blocks payment</th>
              <th scope="col">Action</th>
              <th scope="col">Owner</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td>
                  <span
                    className={
                      a.priority === "P0" ? "bof-badge bof-badge-warn" : "bof-badge bof-badge-neutral"
                    }
                  >
                    {a.priority}
                  </span>
                </td>
                <td>
                  <Link href={`/loads/${a.loadId}`} className="bof-driver-link">
                    {a.loadNumber}
                  </Link>
                  <div>
                    <code className="bof-code">{a.loadId}</code>
                  </div>
                </td>
                <td>{a.proofType}</td>
                <td className="bof-table-photo-cell">
                  <DriverLink driverId={a.driverId} className="bof-table-driver-hit">
                    <DriverAvatar
                      name={a.driverName}
                      photoUrl={driverPhotoPath(a.driverId)}
                      size={28}
                    />
                  </DriverLink>
                </td>
                <td>
                  <DriverLink driverId={a.driverId}>{a.driverName}</DriverLink>
                </td>
                <td>{a.blocksPayment ? "Yes" : "No"}</td>
                <td className="bof-cell-muted">{a.action}</td>
                <td>{a.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
