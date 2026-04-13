import Link from "next/link";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";
import { driverPhotoPath } from "@/lib/driver-photo";
import { getBofData } from "@/lib/load-bof-data";
import {
  buildCommandCenterItems,
  settlementTotals,
} from "@/lib/executive-layer";
import { formatUsd } from "@/lib/format-money";

export const metadata = {
  title: "Dashboard | BOF",
  description: "Executive overview",
};

export default function DashboardPage() {
  const data = getBofData();
  const st = settlementTotals(data);
  const attention = buildCommandCenterItems(data).slice(0, 6);

  const loadsActive = data.loads.filter(
    (l) => l.status === "En Route" || l.status === "Pending"
  ).length;
  const openCompliance = data.complianceIncidents.filter(
    (c) => c.status === "OPEN"
  ).length;

  return (
    <div className="bof-page">
      <h1 className="bof-title">Dashboard</h1>
      <p className="bof-lead">
        Overview only — open modules for full detail.
      </p>

      <section className="bof-kpi-grid" aria-label="Key metrics">
        <Link href="/drivers" className="bof-kpi bof-kpi-link">
          <span className="bof-kpi-label">Active drivers</span>
          <span className="bof-kpi-value">{data.drivers.length}</span>
        </Link>
        <Link href="/loads" className="bof-kpi bof-kpi-link">
          <span className="bof-kpi-label">Loads (in motion / pending)</span>
          <span className="bof-kpi-value">{loadsActive}</span>
        </Link>
        <div className="bof-kpi">
          <span className="bof-kpi-label">Open compliance items</span>
          <span className="bof-kpi-value">{openCompliance}</span>
        </div>
        <div className="bof-kpi">
          <span className="bof-kpi-label">Payroll — drivers pending / hold</span>
          <span className="bof-kpi-value">{st.pendingOrHold}</span>
        </div>
      </section>

      <section className="bof-section" aria-label="Modules">
        <h2 className="bof-h2">Modules</h2>
        <div className="bof-cards">
          <Link href="/settlements" className="bof-card">
            <span className="bof-card-title">Settlements</span>
            <span className="bof-card-desc">
              Net {formatUsd(st.totalNet)} this period · {st.pendingOrHold}{" "}
              awaiting action
            </span>
          </Link>
          <Link href="/money-at-risk" className="bof-card">
            <span className="bof-card-title">Money at Risk</span>
            <span className="bof-card-desc">
              Financial exposure register and rollups
            </span>
          </Link>
          <Link href="/command-center" className="bof-card">
            <span className="bof-card-title">Command Center</span>
            <span className="bof-card-desc">
              Cross-functional issues and next actions
            </span>
          </Link>
          <Link href="/drivers" className="bof-card">
            <span className="bof-card-title">Drivers</span>
            <span className="bof-card-desc">
              Profiles, readiness, and credential documents
            </span>
          </Link>
          <Link href="/loads" className="bof-card">
            <span className="bof-card-title">Loads / dispatch</span>
            <span className="bof-card-desc">
              Loads with links to assigned drivers
            </span>
          </Link>
        </div>
      </section>

      <section className="bof-section" aria-label="Settlements summary">
        <h2 className="bof-h2">Settlements / payroll (summary)</h2>
        <div className="bof-summary-row">
          <div className="bof-summary-pill">
            <span className="bof-muted">Total gross pay</span>
            <strong>{formatUsd(st.totalGross)}</strong>
          </div>
          <div className="bof-summary-pill">
            <span className="bof-muted">Total deductions</span>
            <strong>{formatUsd(st.totalDeductions)}</strong>
          </div>
          <div className="bof-summary-pill">
            <span className="bof-muted">Total net pay</span>
            <strong>{formatUsd(st.totalNet)}</strong>
          </div>
        </div>
        <Link href="/settlements" className="bof-cta">
          View Settlements →
        </Link>
      </section>

      <section className="bof-section" aria-label="Attention">
        <h2 className="bof-h2">What needs attention right now</h2>
        <ul className="bof-attention-list">
          {attention.map((item) => (
            <li key={item.id} className="bof-attention-item">
              <span className={`bof-sev bof-sev-${item.severity}`}>
                {item.severity}
              </span>
              <div>
                <strong>{item.title}</strong>
                <span className="bof-muted">
                  {" "}
                  · {item.bucket}
                  {item.driver && item.driverId ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="bof-attention-driver">
                        <DriverLink
                          driverId={item.driverId}
                          className="bof-attention-driver-photo"
                        >
                          <DriverAvatar
                            name={item.driver}
                            photoUrl={driverPhotoPath(item.driverId)}
                            size={24}
                          />
                        </DriverLink>
                        <DriverLink driverId={item.driverId}>
                          {item.driver}
                        </DriverLink>
                      </span>
                    </>
                  ) : item.driver ? (
                    ` · ${item.driver}`
                  ) : null}
                </span>
                <p className="bof-attention-detail">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/command-center" className="bof-link-secondary">
          Open Command Center for full list →
        </Link>
      </section>
    </div>
  );
}
