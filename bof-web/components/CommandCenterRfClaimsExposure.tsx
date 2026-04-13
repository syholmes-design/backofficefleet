import Link from "next/link";
import { formatUsd } from "@/lib/format-money";
import type { BofData } from "@/lib/load-bof-data";
import { buildFleetProofRiskSummary } from "@/lib/bof-ops-layer";
import { buildClaimQueueRows } from "@/lib/claim-packet";
import { buildRfActions } from "@/lib/load-proof";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";
import { driverPhotoPath } from "@/lib/driver-photo";

export function CommandCenterRfClaimsExposure({ data }: { data: BofData }) {
  const claims = buildClaimQueueRows(data, 8);
  const proof = buildFleetProofRiskSummary(data);
  const rf = buildRfActions(data);
  const recoverable = claims.reduce((a, c) => a + c.amountAtRiskUsd, 0);

  return (
    <section className="bof-cc-rf-section" aria-label="RF and claims exposure">
      <div className="bof-cc-rf-head">
        <h2 className="bof-cc-section-title">RF / claims exposure</h2>
        <p className="bof-cc-section-lead">
          Open RF actions, claim-required loads, and dispute-sensitive proof — with
          recoverable amounts and a clear next step.
        </p>
      </div>

      <div className="bof-cc-rf-stats" aria-label="Exposure summary">
        <div className="bof-cc-rf-stat">
          <span className="bof-cc-rf-stat-label">Open RF actions</span>
          <span className="bof-cc-rf-stat-value">{rf.length}</span>
          <Link href="/rf-actions" className="bof-cc-rf-stat-link">
            Open queue →
          </Link>
        </div>
        <div className="bof-cc-rf-stat">
          <span className="bof-cc-rf-stat-label">Claim workspaces</span>
          <span className="bof-cc-rf-stat-value">{claims.length}</span>
          <span className="bof-cc-rf-stat-muted">Loads with claim packet context</span>
        </div>
        <div className="bof-cc-rf-stat">
          <span className="bof-cc-rf-stat-label">Dispute-sensitive loads</span>
          <span className="bof-cc-rf-stat-value">
            {proof.loadsWithDisputeSensitivity}
          </span>
          <span className="bof-cc-rf-stat-muted">Proof stack dispute flags</span>
        </div>
        <div className="bof-cc-rf-stat bof-cc-rf-stat--money">
          <span className="bof-cc-rf-stat-label">Recoverable (claim queue)</span>
          <span className="bof-cc-rf-stat-value bof-cc-rf-stat-value--usd">
            {formatUsd(recoverable)}
          </span>
          <span className="bof-cc-rf-stat-muted">Sum of at-risk in table below</span>
        </div>
      </div>

      <div className="bof-table-wrap bof-cc-rf-table-wrap">
        <table className="bof-table bof-table-compact">
          <thead>
            <tr>
              <th scope="col" className="bof-table-photo-col">
                Photo
              </th>
              <th scope="col">Load</th>
              <th scope="col">Driver</th>
              <th scope="col">Issues</th>
              <th scope="col" className="bof-num">
                At risk
              </th>
              <th scope="col">Next step</th>
              <th scope="col">RF-linked docs</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr>
                <td colSpan={7} className="bof-muted bof-small">
                  No active claim workspaces.
                </td>
              </tr>
            ) : (
              claims.map((c) => (
                <tr key={c.loadId}>
                  <td className="bof-table-photo-cell">
                    <DriverLink
                      driverId={c.driverId}
                      className="bof-table-driver-hit"
                    >
                      <DriverAvatar
                        name={c.driverName}
                        photoUrl={driverPhotoPath(c.driverId)}
                        size={28}
                      />
                    </DriverLink>
                  </td>
                  <td>
                    <Link
                      href={`/loads/${c.loadId}#claim-packet`}
                      className="bof-driver-link"
                    >
                      {c.loadNumber}
                    </Link>
                    <div>
                      <code className="bof-code">{c.loadId}</code>
                    </div>
                  </td>
                  <td>
                    <DriverLink driverId={c.driverId}>{c.driverName}</DriverLink>
                  </td>
                  <td className="bof-cell-muted">{c.issues}</td>
                  <td className="bof-num bof-cc-rf-money-cell">
                    {formatUsd(c.amountAtRiskUsd)}
                  </td>
                  <td className="bof-small">{c.nextStep}</td>
                  <td className="bof-small">
                    <Link
                      href={`/loads/${c.loadId}#document-engine`}
                      className="bof-link-secondary"
                    >
                      Document engine
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="bof-cc-rf-footnote bof-muted bof-small">
        Payment-blocking proof gaps and disputed items are also surfaced in{" "}
        <Link href="/money-at-risk" className="bof-link-secondary">
          Money at Risk
        </Link>{" "}
        and on each load&apos;s proof stack.
      </p>
    </section>
  );
}
