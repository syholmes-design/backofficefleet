import Link from "next/link";
import { getBofData } from "@/lib/load-bof-data";
import { formatUsdFull } from "@/lib/format-money";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";
import { driverPhotoPath } from "@/lib/driver-photo";
import { buildProofRiskRows } from "@/lib/load-proof";
import { buildMoneyStoryRows } from "@/lib/bof-ops-layer";
import { GENERATED_PUBLIC_PREFIX } from "@/lib/generated-public-prefix";

export const metadata = {
  title: "Money at Risk | BOF",
  description: "Financial risk register",
};

export default function MoneyAtRiskPage() {
  const data = getBofData();
  const summary =
    "moneyAtRiskSummary" in data && data.moneyAtRiskSummary
      ? data.moneyAtRiskSummary
      : null;
  const rows =
    "moneyAtRisk" in data && Array.isArray(data.moneyAtRisk)
      ? data.moneyAtRisk
      : [];
  const proofRows = buildProofRiskRows(data);
  const storyRows = buildMoneyStoryRows(data);

  return (
    <div className="bof-page">
      <h1 className="bof-title">Money at Risk</h1>
      <p className="bof-lead">
        Executive financial exposure — same figures inform Command Center.
      </p>

      {summary && (
        <section className="bof-kpi-grid" aria-label="Risk rollups">
          <div className="bof-kpi">
            <span className="bof-kpi-label">Total money at risk</span>
            <span className="bof-kpi-value">
              {formatUsdFull(summary.totalAtRisk)}
            </span>
          </div>
          <div className="bof-kpi">
            <span className="bof-kpi-label">Payroll pending amount</span>
            <span className="bof-kpi-value">
              {formatUsdFull(summary.payrollPending)}
            </span>
          </div>
          <div className="bof-kpi">
            <span className="bof-kpi-label">Settlement holds</span>
            <span className="bof-kpi-value">
              {formatUsdFull(summary.settlementHolds)}
            </span>
          </div>
          <div className="bof-kpi">
            <span className="bof-kpi-label">Claims / damage exposure</span>
            <span className="bof-kpi-value">
              {formatUsdFull(summary.claimsExposure)}
            </span>
          </div>
          <div className="bof-kpi">
            <span className="bof-kpi-label">Compliance-driven risk</span>
            <span className="bof-kpi-value">
              {formatUsdFull(summary.complianceRisk)}
            </span>
          </div>
          <div className="bof-kpi">
            <span className="bof-kpi-label">Maintenance-driven risk</span>
            <span className="bof-kpi-value">
              {formatUsdFull(summary.maintenanceRisk)}
            </span>
          </div>
        </section>
      )}

      {proofRows.length > 0 && (
        <section className="bof-section" aria-label="Proof-driven exposure">
          <h2 className="bof-h2">Proof / payment holds (from load proof layer)</h2>
          <p className="bof-muted bof-small">
            Derived from missing or blocking proof items on each load. Open the
            load to close gaps.
          </p>
          <div className="bof-table-wrap">
            <table className="bof-table">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col" className="bof-table-photo-col">
                    Photo
                  </th>
                  <th scope="col">Driver</th>
                  <th scope="col">Load</th>
                  <th scope="col" className="bof-num">
                    Revenue at risk
                  </th>
                  <th scope="col">Root cause</th>
                  <th scope="col">Next action</th>
                  <th scope="col">Owner</th>
                </tr>
              </thead>
              <tbody>
                {proofRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.category}</td>
                    <td className="bof-table-photo-cell">
                      <DriverLink
                        driverId={row.driverId}
                        className="bof-table-driver-hit"
                      >
                        <DriverAvatar
                          name={row.driver}
                          photoUrl={driverPhotoPath(row.driverId)}
                          size={28}
                        />
                      </DriverLink>
                    </td>
                    <td>
                      <DriverLink driverId={row.driverId}>{row.driver}</DriverLink>
                    </td>
                    <td>
                      <Link
                        href={`/loads/${row.loadId}#document-engine`}
                        className="bof-driver-link"
                      >
                        {row.loadId}
                      </Link>
                      <div>
                        <code className="bof-code">{row.assetId}</code>
                      </div>
                    </td>
                    <td className="bof-num">{formatUsdFull(row.amount)}</td>
                    <td>{row.rootCause}</td>
                    <td>{row.nextBestAction}</td>
                    <td>{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {storyRows.length > 0 && (
        <section className="bof-section" aria-label="Claim and RFID financial story">
          <h2 className="bof-h2">
            Claim, proof, and RFID — financial story
          </h2>
          <p className="bof-muted bof-small">
            What is wrong, how much is affected, and what BOF recommends next —
            derived from claim workspaces, proof holds, and RFID validation
            lanes (demo estimates).
          </p>
          <div className="bof-table-wrap">
            <table className="bof-table">
              <thead>
                <tr>
                  <th scope="col">Lane</th>
                  <th scope="col">Headline</th>
                  <th scope="col" className="bof-table-photo-col">
                    Photo
                  </th>
                  <th scope="col">Driver</th>
                  <th scope="col">Load / asset</th>
                  <th scope="col" className="bof-num">
                    Money
                  </th>
                  <th scope="col">What&apos;s wrong</th>
                  <th scope="col">BOF next</th>
                  <th scope="col">RF docs</th>
                </tr>
              </thead>
              <tbody>
                {storyRows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="bof-badge bof-badge-neutral">
                        {s.lane.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="bof-small">{s.headline}</td>
                    <td className="bof-table-photo-cell">
                      {s.driverId ? (
                        <DriverLink
                          driverId={s.driverId}
                          className="bof-table-driver-hit"
                        >
                          <DriverAvatar
                            name={s.driverName}
                            photoUrl={driverPhotoPath(s.driverId)}
                            size={28}
                          />
                        </DriverLink>
                      ) : (
                        <span className="bof-muted">—</span>
                      )}
                    </td>
                    <td>
                      {s.driverId ? (
                        <DriverLink driverId={s.driverId}>
                          {s.driverName}
                        </DriverLink>
                      ) : (
                        <span className="bof-muted">—</span>
                      )}
                    </td>
                    <td className="bof-small">
                      {s.loadId && (
                        <Link
                          href={
                            s.lane === "claim"
                              ? `/loads/${s.loadId}#claim-packet`
                              : `/loads/${s.loadId}#document-engine`
                          }
                          className="bof-driver-link"
                        >
                          {s.loadId}
                        </Link>
                      )}
                      {s.assetId && (
                        <span>
                          {s.loadId ? " · " : ""}
                          <code className="bof-code">{s.assetId}</code>
                        </span>
                      )}
                      {!s.loadId && !s.assetId && "—"}
                    </td>
                    <td className="bof-num">{formatUsdFull(s.amountUsd)}</td>
                    <td className="bof-cell-muted bof-small">{s.whatsWrong}</td>
                    <td className="bof-small">{s.bofNext}</td>
                    <td className="bof-small">
                      {s.loadId ? (
                        <Link
                          href={`/loads/${s.loadId}#document-engine`}
                          className="bof-link-secondary"
                        >
                          Engine
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <h2 className="bof-h2">Financial risk register</h2>
      <div className="bof-table-wrap">
        <table className="bof-table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col" className="bof-table-photo-col">
                Photo
              </th>
              <th scope="col">Driver</th>
              <th scope="col">Load / asset</th>
              <th scope="col" className="bof-num">
                Amount at risk
              </th>
              <th scope="col">Root cause</th>
              <th scope="col">Next best action</th>
              <th scope="col">Owner</th>
              <th scope="col">Status</th>
              <th scope="col">BOF generated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.category}</td>
                <td className="bof-table-photo-cell">
                  <DriverLink
                    driverId={row.driverId}
                    className="bof-table-driver-hit"
                  >
                    <DriverAvatar
                      name={row.driver}
                      photoUrl={driverPhotoPath(row.driverId)}
                      size={28}
                    />
                  </DriverLink>
                </td>
                <td>
                  <DriverLink driverId={row.driverId}>{row.driver}</DriverLink>
                  <div>
                    <code className="bof-code">{row.driverId}</code>
                  </div>
                </td>
                <td>
                  {row.loadId && (
                    <span>
                      Load <code className="bof-code">{row.loadId}</code>
                    </span>
                  )}
                  {row.assetId && (
                    <span>
                      {row.loadId ? " · " : ""}
                      Asset <code className="bof-code">{row.assetId}</code>
                    </span>
                  )}
                  {!row.loadId && !row.assetId && "—"}
                </td>
                <td className="bof-num">{formatUsdFull(row.amount)}</td>
                <td>{row.rootCause}</td>
                <td>{row.nextBestAction}</td>
                <td>{row.owner}</td>
                <td>
                  <span className="bof-badge bof-badge-neutral">
                    {row.status}
                  </span>
                </td>
                <td className="bof-small">
                  <a
                    href={`${GENERATED_PUBLIC_PREFIX}/exceptions/${row.id}/settlement-hold-explanation.svg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Exception doc
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
