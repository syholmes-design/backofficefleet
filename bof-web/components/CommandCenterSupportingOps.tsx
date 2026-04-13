import Link from "next/link";
import { formatUsd } from "@/lib/format-money";
import type { BofData } from "@/lib/load-bof-data";
import {
  buildFleetProofRiskSummary,
  buildMoneyStoryRows,
} from "@/lib/bof-ops-layer";
import {
  buildRfidDockRowForLoad,
  buildRfidFuelExceptionQueue,
  buildRfidMaintenanceRows,
} from "@/lib/rfid-intelligence";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";
import { driverPhotoPath } from "@/lib/driver-photo";

export function CommandCenterSupportingOps({ data }: { data: BofData }) {
  const proof = buildFleetProofRiskSummary(data);
  const fuelExc = buildRfidFuelExceptionQueue(data, 6);
  const maint = buildRfidMaintenanceRows(data).filter(
    (m) => !m.serviceZoneVerified || !m.componentEventLogged
  );
  const dockIssues: {
    loadId: string;
    loadNumber: string;
    driverId: string;
    driverName: string;
    issue: string;
    next: string;
  }[] = [];
  for (const load of data.loads) {
    const d = buildRfidDockRowForLoad(data, load.id);
    if (!d || (!d.receiptStillRequired && d.trailerConfirmedAtDock)) continue;
    dockIssues.push({
      loadId: load.id,
      loadNumber: load.number,
      driverId: load.driverId,
      driverName:
        data.drivers.find((x) => x.id === load.driverId)?.name ?? load.driverId,
      issue: d.receiptStillRequired
        ? "Lumper receipt / dock proof gap"
        : "Dock RFID pending",
      next: d.nextAction,
    });
    if (dockIssues.length >= 6) break;
  }

  const storyPreview = buildMoneyStoryRows(data).slice(0, 4);

  return (
    <section className="bof-cc-support-section" aria-label="Supporting operational detail">
      <div className="bof-cc-support-head">
        <h2 className="bof-cc-section-title">Supporting operational detail</h2>
        <p className="bof-cc-section-lead">
          Proof coverage, RFID validation queues, and financial story previews —
          same logic as load pages and Money at Risk.
        </p>
      </div>

      <div className="bof-cc-ops-kpis bof-cc-ops-kpis-premium" aria-label="Proof risk summary">
        <div className="bof-cc-ops-kpi">
          <span className="bof-cc-ops-kpi-label">Avg proof completion</span>
          <span className="bof-cc-ops-kpi-val">{proof.avgProofCompletionPct}%</span>
        </div>
        <div className="bof-cc-ops-kpi">
          <span className="bof-cc-ops-kpi-label">Loads w/ pay blockers</span>
          <span className="bof-cc-ops-kpi-val">{proof.loadsWithPaymentBlockers}</span>
        </div>
        <div className="bof-cc-ops-kpi">
          <span className="bof-cc-ops-kpi-label">Dispute-sensitive loads</span>
          <span className="bof-cc-ops-kpi-val">
            {proof.loadsWithDisputeSensitivity}
          </span>
        </div>
        <div className="bof-cc-ops-kpi">
          <span className="bof-cc-ops-kpi-label">Fleet loads</span>
          <span className="bof-cc-ops-kpi-val">{proof.loadCount}</span>
        </div>
      </div>

      <div className="bof-cc-ops-tables">
        <section className="bof-cc-ops-block">
          <h3 className="bof-h3">RFID fuel validation exceptions</h3>
          <div className="bof-table-wrap bof-table-wrap-tight">
            <table className="bof-table bof-table-compact">
              <thead>
                <tr>
                  <th scope="col">Photo</th>
                  <th>Load</th>
                  <th>Driver</th>
                  <th>Flag</th>
                  <th className="bof-num">Est. opportunity</th>
                  <th>Next action</th>
                </tr>
              </thead>
              <tbody>
                {fuelExc.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bof-muted bof-small">
                      No RFID fuel exceptions in queue.
                    </td>
                  </tr>
                ) : (
                  fuelExc.map((f) => (
                    <tr key={f.id}>
                      <td className="bof-table-photo-cell">
                        <DriverLink
                          driverId={f.driverId}
                          className="bof-table-driver-hit"
                        >
                          <DriverAvatar
                            name={f.driverName}
                            photoUrl={driverPhotoPath(f.driverId)}
                            size={28}
                          />
                        </DriverLink>
                      </td>
                      <td>
                        <Link
                          href={`/loads/${f.loadId}`}
                          className="bof-driver-link"
                        >
                          {f.loadNumber}
                        </Link>
                      </td>
                      <td>
                        <DriverLink driverId={f.driverId}>
                          {f.driverName}
                        </DriverLink>
                      </td>
                      <td>
                        {f.unauthorizedFuelingFlag ? (
                          <span className="bof-badge bof-badge-warn">
                            Review
                          </span>
                        ) : (
                          <span className="bof-badge bof-badge-neutral">
                            Checkpoint
                          </span>
                        )}
                      </td>
                      <td className="bof-num">
                        {formatUsd(f.fuelAnomalyOpportunityUsd)}
                      </td>
                      <td className="bof-small">{f.nextAction}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bof-cc-ops-block">
          <h3 className="bof-h3">RFID dock / lumper</h3>
          <div className="bof-table-wrap bof-table-wrap-tight">
            <table className="bof-table bof-table-compact">
              <thead>
                <tr>
                  <th scope="col">Photo</th>
                  <th>Load</th>
                  <th>Driver</th>
                  <th>Issue</th>
                  <th>Next action</th>
                </tr>
              </thead>
              <tbody>
                {dockIssues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="bof-muted bof-small">
                      No dock / lumper RFID gaps flagged.
                    </td>
                  </tr>
                ) : (
                  dockIssues.map((d) => (
                    <tr key={d.loadId}>
                      <td className="bof-table-photo-cell">
                        <DriverLink
                          driverId={d.driverId}
                          className="bof-table-driver-hit"
                        >
                          <DriverAvatar
                            name={d.driverName}
                            photoUrl={driverPhotoPath(d.driverId)}
                            size={28}
                          />
                        </DriverLink>
                      </td>
                      <td>
                        <Link
                          href={`/loads/${d.loadId}`}
                          className="bof-driver-link"
                        >
                          {d.loadNumber}
                        </Link>
                      </td>
                      <td>
                        <DriverLink driverId={d.driverId}>
                          {d.driverName}
                        </DriverLink>
                      </td>
                      <td className="bof-cell-muted">{d.issue}</td>
                      <td className="bof-small">{d.next}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bof-cc-ops-block">
          <h3 className="bof-h3">RFID maintenance verification</h3>
          <div className="bof-table-wrap bof-table-wrap-tight">
            <table className="bof-table bof-table-compact">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Readiness</th>
                  <th className="bof-num">Exposure</th>
                  <th>Next action</th>
                </tr>
              </thead>
              <tbody>
                {maint.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="bof-muted bof-small">
                      No maintenance RFID verification gaps.
                    </td>
                  </tr>
                ) : (
                  maint.slice(0, 6).map((m) => (
                    <tr key={m.id}>
                      <td>
                        <code className="bof-code">{m.assetId}</code>
                      </td>
                      <td className="bof-cell-muted bof-small">
                        {m.readinessImpact}
                      </td>
                      <td className="bof-num">
                        {formatUsd(m.overdueExposureUsd)}
                      </td>
                      <td className="bof-small">{m.nextAction}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {storyPreview.length > 0 && (
        <section className="bof-cc-ops-block bof-cc-ops-finance-preview">
          <h3 className="bof-h3">Financial story (preview)</h3>
          <p className="bof-muted bof-small">
            Mirrors Money at Risk “what&apos;s wrong / BOF next” rows for claim
            and RFID lanes.
          </p>
          <ul className="bof-cc-story-list">
            {storyPreview.map((s) => (
              <li key={s.id}>
                <span className="bof-cc-story-head">{s.headline}</span>
                <span className="bof-muted bof-small">{s.whatsWrong}</span>
                <span className="bof-cc-story-money">
                  {formatUsd(s.amountUsd)} · {s.bofNext}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
