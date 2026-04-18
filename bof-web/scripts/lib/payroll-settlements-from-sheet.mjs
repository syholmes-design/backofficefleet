/**
 * Source of truth: main workbook (see `main-source-path.mjs`) → sheet `Payroll_Clean`.
 *
 * Fallback logic (when Excel formula cells are not evaluated by xlsx and come through as null):
 * - Gross pay: use `Gross Pay` when > 0; otherwise `Base Earnings` + `Backhaul Pay`.
 * - Total deductions: use `Total Deductions` when > 0; otherwise sum of individual deduction columns.
 * - Net pay: use `Net Pay` when > 0; otherwise gross − deductions + `Fuel Reimb.`.
 * - Pending reason: sheet `Pending Reason` only (blank cells stay blank).
 *
 * `Driver Photo URL` in the workbook often points at placeholder paths (e.g. `/drivers/DRV-001.jpg`)
 * that are not shipped under `/public`. Those are cleared so the Settlements UI falls back to
 * `/images/drivers/{driverId}.png` via `driverPhotoPath`.
 */
import XLSX from "xlsx";

function num(v) {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v) {
  if (v == null) return "";
  return String(v).trim();
}

function normStatus(raw) {
  const u = str(raw).toUpperCase();
  if (u === "PAID") return "Paid";
  if (u === "PENDING") return "Pending";
  if (u === "ON HOLD" || u === "ONHOLD") return "On Hold";
  if (!u) return "Pending";
  return str(raw);
}

function sumDeductions(r) {
  return (
    num(r["FICA"]) +
    num(r["OASDI"]) +
    num(r["Federal Withholding"]) +
    num(r["State Withholding"]) +
    num(r["SDI"]) +
    num(r["FM Leave"]) +
    num(r["Family Support"]) +
    num(r["Insurance Premiums"]) +
    num(r["Credit Union Savings Club"]) +
    num(r["401(k) Contribution"]) +
    num(r["HSA/FSA Health Deduction"]) +
    num(r["Health Insurance Premiums"]) +
    num(r["Life Insurance Above 50k"])
  );
}

/** Clear spreadsheet placeholders that do not exist under `public/`. */
function normalizeSettlementPhotoUrl(raw, driverId) {
  const u = str(raw);
  if (!u) return "";
  if (u.startsWith("/images/")) return u;
  // Workbook uses /drivers/DRV-xxx.jpg — BOF ships headshots under /images/drivers/*.png
  if (/^\/drivers\/[^/]+\.(jpe?g|png)$/i.test(u)) return "";
  return u;
}

function rowToSettlement(r) {
  const driverId = str(r["Driver ID"]);
  const baseEarnings = num(r["Base Earnings"]);
  const backhaulPay = num(r["Backhaul Pay"]);
  const grossFromSheet = num(r["Gross Pay"]);
  const grossPay =
    grossFromSheet > 0
      ? Math.round(grossFromSheet * 100) / 100
      : Math.round((baseEarnings + backhaulPay) * 100) / 100;

  const dedParts = Math.round(sumDeductions(r) * 100) / 100;
  const totalFromSheet = num(r["Total Deductions"]);
  const deductions =
    Math.round((totalFromSheet > 0 ? totalFromSheet : dedParts) * 100) / 100;

  const fuelReimbursement = num(r["Fuel Reimb."]);
  const netFromSheet = num(r["Net Pay"]);
  const netPay =
    netFromSheet > 0
      ? Math.round(netFromSheet * 100) / 100
      : Math.round((grossPay - deductions + fuelReimbursement) * 100) / 100;

  /** Spreadsheet only — do not inherit stale strings from prior demo-data.json. */
  const pendingReason =
    r["Pending Reason"] != null && String(r["Pending Reason"]).trim() !== ""
      ? str(r["Pending Reason"])
      : "";

  const rateRaw = r["401(k) Rate"];
  let rate401k = "";
  if (rateRaw != null && rateRaw !== "") {
    const n = Number(rateRaw);
    rate401k = Number.isFinite(n)
      ? `${Math.round(n * 10000) / 100}%`
      : str(rateRaw);
  }

  return {
    driverId,
    photoUrl: normalizeSettlementPhotoUrl(r["Driver Photo URL"], driverId),
    settlementId: str(r["Settlement ID"]),
    exportStatus: str(r["Export Status"]),
    settlementUrl: str(r["Settlement URL"]),
    baseEarnings,
    backhaulPay,
    grossPay,
    fica: num(r["FICA"]),
    oasdi: num(r["OASDI"]),
    federalWithholding: num(r["Federal Withholding"]),
    stateWithholding: num(r["State Withholding"]),
    sdi: num(r["SDI"]),
    fmLeave: num(r["FM Leave"]),
    familySupport: num(r["Family Support"]),
    insurancePremiums: num(r["Insurance Premiums"]),
    creditUnionSavingsClub: num(r["Credit Union Savings Club"]),
    contribution401k: num(r["401(k) Contribution"]),
    hsaFsaHealthDeduction: num(r["HSA/FSA Health Deduction"]),
    healthInsurancePremiums: num(r["Health Insurance Premiums"]),
    lifeInsuranceAbove50k: num(r["Life Insurance Above 50k"]),
    deductions,
    fuelReimbursement,
    netPay,
    status: normStatus(r["Status"]),
    pendingReason,
    rate401k,
  };
}

/**
 * @param {import("xlsx").WorkBook} workbook
 * @param {object[]} _prevSettlements reserved for future merge overlays (unused — sheet is truth)
 */
export function buildPayrollSettlementRowsFromWorkbook(workbook, _prevSettlements) {
  const sheet = workbook.Sheets["Payroll_Clean"];
  if (!sheet) return Array.isArray(_prevSettlements) ? _prevSettlements : [];
  const rows = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });
  return rows.map((r) => rowToSettlement(r));
}
