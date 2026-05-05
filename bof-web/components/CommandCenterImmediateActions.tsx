import Link from "next/link";
import { formatUsd } from "@/lib/format-money";
import type { ImmediateActionRow } from "@/lib/bof-savings-layer";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";

function priorityClass(p: ImmediateActionRow["priority"]) {
  if (p === "P0") return "bof-cc-pri bof-cc-pri--p0";
  if (p === "P1") return "bof-cc-pri bof-cc-pri--p1";
  return "bof-cc-pri bof-cc-pri--p2";
}

function priorityLabel(p: ImmediateActionRow["priority"]) {
  if (p === "P0") return "Critical";
  if (p === "P1") return "High";
  if (p === "P2") return "Medium";
  return "Watch";
}

export function CommandCenterImmediateActions({
  rows,
}: {
  rows: ImmediateActionRow[];
}) {
  return (
    <section
      className="bof-cc-immediate-section"
      aria-labelledby="cc-immediate-heading"
    >
      <div className="bof-cc-immediate-head">
        <h2 id="cc-immediate-heading" className="bof-cc-immediate-title">
          Immediate actions required
        </h2>
        <p className="bof-cc-immediate-lead">
          RF issues, POD gaps, compliance, and settlement holds — prioritized for
          the control center.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="bof-cc-immediate-empty bof-muted bof-small">
          No queued actions from current registers.
        </p>
      ) : (
        <div className="bof-cc-immediate-table-wrap">
          <table className="bof-table bof-cc-immediate-table">
            <thead>
              <tr>
                <th scope="col">Severity</th>
                <th scope="col">Issue</th>
                <th scope="col">Load</th>
                <th scope="col" className="bof-table-photo-col">
                  Photo
                </th>
                <th scope="col">Driver</th>
                <th scope="col" className="bof-num">
                  At risk
                </th>
                <th scope="col">Resolve</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className={priorityClass(r.priority)}>{priorityLabel(r.priority)}</span>
                  </td>
                  <td className="bof-cc-immediate-issue">{r.label}</td>
                  <td className="bof-small">
                    {r.loadId ? (
                      <>
                        <Link
                          href={`/loads/${r.loadId}`}
                          className="bof-driver-link"
                        >
                          {r.loadNumber ?? r.loadId}
                        </Link>
                        <div>
                          <code className="bof-code">{r.loadId}</code>
                        </div>
                      </>
                    ) : (
                      <span className="bof-muted">—</span>
                    )}
                  </td>
                  <td className="bof-table-photo-cell">
                    <Link
                      href={`/drivers/${r.driverId}`}
                      className="bof-table-driver-hit"
                    >
                      <DriverAvatar
                        name={r.driverName}
                        photoUrl={driverPhotoPath(r.driverId)}
                        size={28}
                      />
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={`/drivers/${r.driverId}`}
                      className="bof-link-secondary"
                    >
                      {r.driverName}
                    </Link>
                  </td>
                  <td className="bof-num">
                    {r.amountAtRiskUsd != null
                      ? formatUsd(r.amountAtRiskUsd)
                      : "—"}
                  </td>
                  <td>
                    <Link href={r.resolveHref} className="bof-cc-resolve-btn">
                      Resolve
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
