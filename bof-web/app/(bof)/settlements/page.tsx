import Link from "next/link";
import { getBofData } from "@/lib/load-bof-data";
import { enrichSettlementRows, settlementTotals } from "@/lib/executive-layer";
import { formatUsdFull } from "@/lib/format-money";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";
import { proofItemsForDriverLoads } from "@/lib/load-proof";
import { settlementOpsNote } from "@/lib/bof-ops-layer";
import { driverPhotoPath } from "@/lib/driver-photo";
import { GENERATED_PUBLIC_PREFIX } from "@/lib/generated-public-prefix";

export const metadata = {
  title: "Settlements | BOF",
  description: "Payroll and settlement detail",
};

const PENDING = new Set(["Pending", "On Hold", "Awaiting Receipts"]);

function usd(n: number | undefined | null) {
  return formatUsdFull(typeof n === "number" && Number.isFinite(n) ? n : 0);
}

type SettlementRow = ReturnType<typeof enrichSettlementRows>[number];

export default function SettlementsPage() {
  const data = getBofData();
  const st = settlementTotals(data);
  const rows = enrichSettlementRows(data);

  return (
    <div className="bof-page">
      <h1 className="bof-title">Settlements</h1>
      <p className="bof-lead">
        Payroll / settlement rows come from the{" "}
        <code className="bof-code">Payroll_Clean</code> sheet in the main Excel
        workbook (default{" "}
        <code className="bof-code">public/data/main-source_enhanced_bof_aligned.xlsx</code>
        , or override with env <code className="bof-code">BOF_MAIN_SOURCE_XLSX</code>
        ), merged into <code className="bof-code">lib/demo-data.json</code> when you
        run <code className="bof-code">npm run build:data</code> (or{" "}
        <code className="bof-code">npm run merge:settlements</code> for settlements
        only). This page reads that JSON. Scroll horizontally for all columns.
      </p>

      <section className="bof-kpi-grid" aria-label="Settlement totals">
        <div className="bof-kpi">
          <span className="bof-kpi-label">Total gross pay</span>
          <span className="bof-kpi-value">{formatUsdFull(st.totalGross)}</span>
        </div>
        <div className="bof-kpi">
          <span className="bof-kpi-label">Total deductions</span>
          <span className="bof-kpi-value">
            {formatUsdFull(st.totalDeductions)}
          </span>
        </div>
        <div className="bof-kpi">
          <span className="bof-kpi-label">Total net pay</span>
          <span className="bof-kpi-value">{formatUsdFull(st.totalNet)}</span>
        </div>
        <div className="bof-kpi">
          <span className="bof-kpi-label">Drivers pending or on hold</span>
          <span className="bof-kpi-value">{st.pendingOrHold}</span>
        </div>
      </section>

      <div className="bof-settlements-wrap">
        <table className="bof-table bof-table-compact bof-settlements-table">
          <thead>
            <tr>
              <th scope="col">Photo</th>
              <th scope="col">Name</th>
              <th scope="col">Driver ID</th>
              <th scope="col" className="bof-num">
                Gross pay
              </th>
              <th scope="col" className="bof-num">
                Total deductions
              </th>
              <th scope="col" className="bof-num">
                Net pay
              </th>
              <th scope="col">Status</th>
              <th scope="col">Pending reason</th>
              <th scope="col" className="bof-num" title="Base earnings">
                Base earnings
              </th>
              <th scope="col" className="bof-num" title="Backhaul pay">
                Backhaul pay
              </th>
              <th scope="col" className="bof-num">
                FICA
              </th>
              <th scope="col" className="bof-num">
                OASDI
              </th>
              <th scope="col" className="bof-num">
                Federal WH
              </th>
              <th scope="col" className="bof-num">
                State WH
              </th>
              <th scope="col" className="bof-num">
                SDI
              </th>
              <th scope="col" className="bof-num">
                FM leave
              </th>
              <th scope="col" className="bof-num">
                Family support
              </th>
              <th scope="col" className="bof-num">
                Insurance premiums
              </th>
              <th scope="col" className="bof-num">
                Credit union
              </th>
              <th scope="col" className="bof-num">
                401(k) contrib.
              </th>
              <th scope="col" className="bof-num">
                HSA/FSA health
              </th>
              <th scope="col" className="bof-num">
                Health ins. prem.
              </th>
              <th scope="col" className="bof-num">
                Life ins. &gt;50k
              </th>
              <th scope="col" className="bof-num">
                Fuel reimb.
              </th>
              <th scope="col">401(k) rate</th>
              <th scope="col">Settlement ID</th>
              <th scope="col">Export</th>
              <th scope="col">Settlement doc</th>
              <th scope="col">BOF generated</th>
              <th scope="col">Load proof</th>
              <th scope="col">Claim / RFID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <SettlementTableRow
                key={row.driverId}
                row={row}
                data={data}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettlementTableRow({
  row,
  data,
}: {
  row: SettlementRow;
  data: ReturnType<typeof getBofData>;
}) {
  const r = row as SettlementRow & {
    baseEarnings?: number;
    backhaulPay?: number;
    fica?: number;
    oasdi?: number;
    federalWithholding?: number;
    stateWithholding?: number;
    sdi?: number;
    fmLeave?: number;
    familySupport?: number;
    insurancePremiums?: number;
    creditUnionSavingsClub?: number;
    contribution401k?: number;
    hsaFsaHealthDeduction?: number;
    healthInsurancePremiums?: number;
    lifeInsuranceAbove50k?: number;
    settlementId?: string;
    exportStatus?: string;
    settlementUrl?: string;
    rate401k?: string;
  };

  const holds = proofItemsForDriverLoads(data, row.driverId).filter(
    (x) => x.blocking > 0
  );

  return (
    <tr>
      <td className="bof-table-photo-cell">
        <DriverLink driverId={row.driverId} className="bof-table-driver-hit">
          <DriverAvatar
            name={row.name}
            photoUrl={
              row.photoUrl?.trim()
                ? row.photoUrl
                : driverPhotoPath(row.driverId)
            }
            size={28}
          />
        </DriverLink>
      </td>
      <td>
        <DriverLink driverId={row.driverId}>{row.name}</DriverLink>
      </td>
      <td>
        <code className="bof-code">{row.driverId}</code>
      </td>
      <td className="bof-num">{usd(row.grossPay)}</td>
      <td className="bof-num">{usd(row.deductions)}</td>
      <td className="bof-num bof-settlements-net">{usd(row.netPay)}</td>
      <td>
        <span
          className={
            PENDING.has(row.status)
              ? "bof-badge bof-badge-warn"
              : "bof-badge bof-badge-ok"
          }
        >
          {row.status}
        </span>
      </td>
      <td className="bof-cell-muted bof-settlements-pending">
        {row.pendingReason || "—"}
      </td>
      <td className="bof-num">{usd(r.baseEarnings)}</td>
      <td className="bof-num">{usd(r.backhaulPay)}</td>
      <td className="bof-num">{usd(r.fica)}</td>
      <td className="bof-num">{usd(r.oasdi)}</td>
      <td className="bof-num">{usd(r.federalWithholding)}</td>
      <td className="bof-num">{usd(r.stateWithholding)}</td>
      <td className="bof-num">{usd(r.sdi)}</td>
      <td className="bof-num">{usd(r.fmLeave)}</td>
      <td className="bof-num">{usd(r.familySupport)}</td>
      <td className="bof-num">{usd(r.insurancePremiums)}</td>
      <td className="bof-num">{usd(r.creditUnionSavingsClub)}</td>
      <td className="bof-num">{usd(r.contribution401k)}</td>
      <td className="bof-num">{usd(r.hsaFsaHealthDeduction)}</td>
      <td className="bof-num">{usd(r.healthInsurancePremiums)}</td>
      <td className="bof-num">{usd(r.lifeInsuranceAbove50k)}</td>
      <td className="bof-num">{usd(row.fuelReimbursement)}</td>
      <td>{r.rate401k || "—"}</td>
      <td>
        {r.settlementId ? (
          <code className="bof-code">{r.settlementId}</code>
        ) : (
          "—"
        )}
      </td>
      <td className="bof-small">{r.exportStatus || "—"}</td>
      <td className="bof-small">
        {r.settlementUrl ? (
          <a
            href={r.settlementUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bof-link-secondary"
          >
            Open
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="bof-small">
        {r.settlementId ? (
          <a
            href={`${GENERATED_PUBLIC_PREFIX}/settlements/${r.settlementId}/settlement-summary.svg`}
            target="_blank"
            rel="noopener noreferrer"
            className="bof-link-secondary"
          >
            Summary
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="bof-cell-muted">
        {holds.length === 0 ? (
          "—"
        ) : (
          <span className="bof-settlement-proof-links">
            {holds.map(({ load, blocking }) => (
              <Link
                key={load.id}
                href={`/loads/${load.id}#document-engine`}
                className="bof-driver-link bof-small"
              >
                {load.number}
                <span className="bof-muted">
                  {" "}
                  ({blocking} blocker{blocking > 1 ? "s" : ""})
                </span>
              </Link>
            ))}
          </span>
        )}
      </td>
      <td className="bof-cell-muted bof-small">
        {settlementOpsNote(data, row.driverId)}
      </td>
    </tr>
  );
}
