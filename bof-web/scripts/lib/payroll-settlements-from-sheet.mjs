/**
 * Source of truth: settlement worksheet in the main workbook.
 * Preferred sheet order: BOF_SETTLEMENTS_SHEET override -> Payroll -> Payroll_Clean -> Vercel_Settlements.
 *
 * Includes explicit header alias mapping so workbook header variants normalize into
 * a stable settlement payload used by lib/demo-data.json + settlements UI.
 */
import XLSX from "xlsx";

const DEBUG = String(process.env.BOF_SETTLEMENTS_DEBUG ?? "").trim() === "1";
const SETTLEMENTS_SHEET_OVERRIDE = String(
  process.env.BOF_SETTLEMENTS_SHEET ?? ""
).trim();

const SAFETY_BONUS_BY_DRIVER = {
  "DRV-001": 125,
  "DRV-002": 125,
  "DRV-003": 75,
  "DRV-004": 25,
  "DRV-005": 75,
  "DRV-006": 125,
  "DRV-007": 125,
  "DRV-008": 25,
  "DRV-009": 75,
  "DRV-010": 125,
  "DRV-011": 75,
  "DRV-012": 0,
};

const SHEET_CANDIDATES = ["Payroll", "Payroll_Clean", "Vercel_Settlements"];

const DRIVER_ID_FROM_SHORT_NAME = {
  "J. CARTER": "DRV-001",
  "M. LOPEZ": "DRV-002",
  "A. KIM": "DRV-003",
  "P. PATEL": "DRV-004",
  "K. TANAKA": "DRV-005",
  "M. CHEN": "DRV-006",
  "S. GOMEZ": "DRV-007",
  "L. SMITH": "DRV-008",
  "E. BROWN": "DRV-009",
  "N. WILSON": "DRV-010",
  "O. LEE": "DRV-011",
  "R. JOHNSON": "DRV-012",
};

const HEADER_ALIASES = {
  settlementId: ["Settlement ID", "Settlement", "Payroll ID"],
  driverId: ["Driver ID", "Legacy Driver ID"],
  driverName: ["Full Name", "Driver Name", "Driver"],
  status: ["Status"],
  pendingReason: ["Pending Reason", "Hold Reason"],
  baseEarnings: ["Base Earnings", "Base Pay", "Base"],
  backhaulPay: ["Backhaul Pay", "Backhaul"],
  safetyBonus: ["Safety Bonus", "Safety Bonus Pay"],
  grossPay: ["Gross Pay", "Gross"],
  fica: ["FICA", "Medicare/FICA", "Medicare"],
  oasdi: ["OASDI", "Social Security"],
  federalWithholding: ["Federal Withholding", "Federal WH", "Federal Tax"],
  stateWithholding: ["State Withholding", "State WH", "State Tax"],
  sdi: ["SDI", "State Disability Insurance"],
  fmLeave: ["FM Leave", "Paid Family Leave", "Family Medical Leave"],
  familySupport: ["Family Support", "Child Support"],
  insurancePremiums: ["Insurance Premiums", "Insurance"],
  creditUnionSavingsClub: ["Credit Union Savings Club", "Credit Union"],
  contribution401k: ["401(k) Contribution", "401(k) Contrib.", "401k Contribution"],
  hsaFsaHealthDeduction: ["HSA/FSA Health Deduction", "HSA/FSA Health", "HSA/FSA"],
  healthInsurancePremiums: ["Health Insurance Premiums", "Health Ins. Prem.", "Health Insurance Premium"],
  lifeInsuranceAbove50k: ["Life Insurance Above 50k", "Life Ins. >50k", "Life Insurance Over 50k"],
  deductions: ["Total Deductions", "Deductions"],
  fuelReimbursement: ["Fuel Reimb.", "Fuel Reimbursement", "Fuel Reimb"],
  netPay: ["Net Pay", "Net"],
  rate401k: ["401(k) Rate", "401k Rate"],
  exportStatus: ["Export Status", "Export"],
  settlementUrl: ["Settlement URL", "Settlement Doc URL"],
  settlementDocStatus: ["Settlement Doc", "Settlement Doc Status"],
  bofGeneratedStatus: ["BOF Generated", "BOF Generated Status"],
  loadProofStatus: ["Load Proof", "Load Proof Status"],
  claimRfidNotes: ["Claim / RFID", "Claim RFID", "Claim Notes"],
  photoUrl: ["Driver Photo URL", "Photo URL"],
};

function num(v) {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v) {
  if (v == null) return "";
  return String(v).trim();
}

function normKey(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function hasValue(v) {
  return v != null && String(v).trim() !== "";
}

function hasNumericValue(v) {
  return hasValue(v) && Number.isFinite(Number(v));
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
    num(r.fica) +
    num(r.oasdi) +
    num(r.federalWithholding) +
    num(r.stateWithholding) +
    num(r.sdi) +
    num(r.fmLeave) +
    num(r.familySupport) +
    num(r.insurancePremiums) +
    num(r.creditUnionSavingsClub) +
    num(r.contribution401k) +
    num(r.hsaFsaHealthDeduction) +
    num(r.healthInsurancePremiums) +
    num(r.lifeInsuranceAbove50k)
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

function settlementIdFromDriverId(driverId) {
  const m = /^DRV-(\d+)$/i.exec(String(driverId ?? "").trim());
  if (!m) return "";
  return `STL-${m[1].padStart(3, "0")}`;
}

function buildHeaderLookup(firstRow) {
  const lookup = new Map();
  for (const key of Object.keys(firstRow ?? {})) {
    lookup.set(normKey(key), key);
  }
  return lookup;
}

function pickRawValue(row, headerLookup, aliases) {
  for (const alias of aliases) {
    const actual = headerLookup.get(normKey(alias));
    if (!actual) continue;
    const value = row[actual];
    if (value !== undefined) return value;
  }
  return null;
}

function normalizeSheetRows(rows) {
  if (!rows.length) return [];
  const headerLookup = buildHeaderLookup(rows[0]);
  return rows.map((row) => {
    const out = {};
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      out[field] = pickRawValue(row, headerLookup, aliases);
    }
    return out;
  });
}

function rowToSettlement(r) {
  const rawDriverId = str(r.driverId);
  const rawDriverName = str(r.driverName);
  const driverId =
    rawDriverId ||
    DRIVER_ID_FROM_SHORT_NAME[rawDriverName.toUpperCase()] ||
    "";
  const safetyBonus =
    hasNumericValue(r.safetyBonus) ? num(r.safetyBonus) : num(SAFETY_BONUS_BY_DRIVER[driverId]);
  const baseEarnings = num(r.baseEarnings);
  const backhaulPay = num(r.backhaulPay);

  const grossPay = hasNumericValue(r.grossPay)
    ? Math.round(num(r.grossPay) * 100) / 100
    : Math.round((baseEarnings + backhaulPay + safetyBonus) * 100) / 100;

  const dedParts = Math.round(sumDeductions(r) * 100) / 100;
  const deductions = hasNumericValue(r.deductions)
    ? Math.round(num(r.deductions) * 100) / 100
    : dedParts;

  const fuelReimbursement = num(r.fuelReimbursement);
  const netPay = hasNumericValue(r.netPay)
    ? Math.round(num(r.netPay) * 100) / 100
    : Math.round((grossPay - deductions + fuelReimbursement) * 100) / 100;

  let rate401k = "";
  if (hasValue(r.rate401k)) {
    const n = Number(r.rate401k);
    rate401k = Number.isFinite(n) ? `${Math.round(n * 10000) / 100}%` : str(r.rate401k);
  }

  return {
    driverId,
    photoUrl: normalizeSettlementPhotoUrl(r.photoUrl, driverId),
    settlementId: str(r.settlementId) || settlementIdFromDriverId(driverId),
    exportStatus: str(r.exportStatus),
    settlementUrl: str(r.settlementUrl),
    settlementDocStatus: str(r.settlementDocStatus),
    bofGeneratedStatus: str(r.bofGeneratedStatus),
    loadProofStatus: str(r.loadProofStatus),
    claimRfidNotes: str(r.claimRfidNotes),
    baseEarnings,
    backhaulPay,
    safetyBonus,
    grossPay,
    fica: num(r.fica),
    oasdi: num(r.oasdi),
    federalWithholding: num(r.federalWithholding),
    stateWithholding: num(r.stateWithholding),
    sdi: num(r.sdi),
    fmLeave: num(r.fmLeave),
    familySupport: num(r.familySupport),
    insurancePremiums: num(r.insurancePremiums),
    creditUnionSavingsClub: num(r.creditUnionSavingsClub),
    contribution401k: num(r.contribution401k),
    hsaFsaHealthDeduction: num(r.hsaFsaHealthDeduction),
    healthInsurancePremiums: num(r.healthInsurancePremiums),
    lifeInsuranceAbove50k: num(r.lifeInsuranceAbove50k),
    deductions,
    totalDeductions: deductions,
    fuelReimbursement,
    netPay,
    status: normStatus(r.status),
    pendingReason: hasValue(r.pendingReason) ? str(r.pendingReason) : "",
    rate401k,
  };
}

function pickSettlementSheet(workbook) {
  if (SETTLEMENTS_SHEET_OVERRIDE) {
    const sheet = workbook.Sheets[SETTLEMENTS_SHEET_OVERRIDE];
    if (sheet) {
      const rows = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });
      if (rows.length > 0) {
        return { sheetName: SETTLEMENTS_SHEET_OVERRIDE, rows };
      }
    }
  }
  for (const sheetName of SHEET_CANDIDATES) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });
    if (rows.length > 0) return { sheetName, rows };
  }
  return null;
}

/**
 * @param {import("xlsx").WorkBook} workbook
 * @param {object[]} _prevSettlements reserved for future merge overlays (unused — sheet is truth)
 */
export function buildPayrollSettlementRowsFromWorkbook(workbook, _prevSettlements) {
  const selected = pickSettlementSheet(workbook);
  if (!selected) return Array.isArray(_prevSettlements) ? _prevSettlements : [];
  const normalizedRows = normalizeSheetRows(selected.rows);
  const settlements = normalizedRows.map((r) => rowToSettlement(r));
  if (DEBUG) {
    const rawHeaders = Object.keys(selected.rows[0] ?? {});
    console.log(
      JSON.stringify(
        {
          settlementsDebug: {
            worksheet: selected.sheetName,
            rowCount: selected.rows.length,
            headers: rawHeaders,
            firstNormalizedRow: settlements[0] ?? null,
          },
        },
        null,
        2
      )
    );
  }
  return settlements;
}
