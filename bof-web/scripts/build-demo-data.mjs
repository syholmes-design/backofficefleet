/**
 * Build Step 1: normalize BOF data from Excel (single source of truth).
 * Reads: data/main-source.xlsx — sheets Drivers_Clean, Documents_Clean, Compliance_Events (optional).
 * Writes: lib/demo-data.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "data", "main-source.xlsx");
const OUT_PATH = path.join(ROOT, "lib", "demo-data.json");

const DOC_TYPES = [
  "CDL",
  "Medical Card",
  "MVR",
  "I-9",
  "FMCSA",
  "W-9",
  "Bank Info",
];

const TYPE_SYNONYMS = new Map(
  [
    ["cdl", "CDL"],
    ["commercial drivers license", "CDL"],
    ["medical card", "Medical Card"],
    ["medical", "Medical Card"],
    ["med card", "Medical Card"],
    ["medcard", "Medical Card"],
    ["mvr", "MVR"],
    ["motor vehicle record", "MVR"],
    ["i-9", "I-9"],
    ["i9", "I-9"],
    ["fmcsa", "FMCSA"],
    ["w-9", "W-9"],
    ["w9", "W-9"],
    ["bank info", "Bank Info"],
    ["bank information", "Bank Info"],
    ["bank", "Bank Info"],
  ].map(([k, v]) => [k, v])
);

function normHeader(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normNameKey(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function findCol(headers, patterns) {
  const entries = headers.map((h, i) => [normHeader(h), i]);
  for (const p of patterns) {
    const np = normHeader(p);
    for (const [h, i] of entries) {
      if (h === np || h.includes(np) || np.includes(h)) {
        return i;
      }
    }
  }
  return -1;
}

function padDrv(n, width) {
  return `DRV-${String(n).padStart(width, "0")}`;
}

function driverIdForIndex(i, total) {
  const w = Math.max(3, String(total).length);
  return padDrv(i + 1, w);
}

function emailFromName(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = (parts[0] ?? "driver").toLowerCase().replace(/[^a-z0-9]/g, "") || "driver";
  const last =
    (parts.length > 1 ? parts[parts.length - 1] : "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "unknown";
  return `${first}.${last}@boftransport.demo`;
}

function canonicalDocType(raw) {
  const key = normHeader(raw).replace(/[_-]/g, " ");
  if (DOC_TYPES.includes(String(raw ?? "").trim())) return String(raw).trim();
  const syn = TYPE_SYNONYMS.get(key);
  if (syn) return syn;
  for (const t of DOC_TYPES) {
    if (normHeader(t) === key) return t;
  }
  return null;
}

function cellToString(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return "";
    return v.toISOString().slice(0, 10);
  }
  return String(v).trim();
}

function parseExpiration(v) {
  const s = cellToString(v);
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (mdy) {
    const mm = mdy[1].padStart(2, "0");
    const dd = mdy[2].padStart(2, "0");
    return `${mdy[3]}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function docStatus(isoDate) {
  if (!isoDate) return "MISSING";
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [Y, M, D] = isoDate.split("-").map(Number);
  const exp = new Date(Date.UTC(Y, M - 1, D));
  return exp >= today ? "VALID" : "EXPIRED";
}

function readSheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });
  return Array.isArray(rows) ? rows : [];
}

function buildDrivers(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h ?? "").trim());
  const iName = findCol(header, ["name", "driver name", "full name", "driver"]);
  const iAddr = findCol(header, ["address"]);
  const iPhone = findCol(header, ["phone", "mobile", "telephone", "tel"]);
  const iEmail = findCol(header, ["email", "e-mail"]);
  if (iName < 0) {
    throw new Error(
      'Drivers_Clean: could not find a "Name" (or driver name) column.'
    );
  }
  const dataRows = rows
    .slice(1)
    .filter((r) => r && r.some((c) => String(c ?? "").trim() !== ""))
    .filter((row) => String(row[iName] ?? "").trim() !== "");
  const total = dataRows.length;
  return dataRows.map((row, idx) => {
    const name = String(row[iName] ?? "").trim();
    const address = iAddr >= 0 ? String(row[iAddr] ?? "").trim() : "";
    const phone = iPhone >= 0 ? String(row[iPhone] ?? "").trim() : "";
    let email = iEmail >= 0 ? String(row[iEmail] ?? "").trim() : "";
    if (!email) email = emailFromName(name);
    return {
      id: driverIdForIndex(idx, total),
      name,
      address,
      phone,
      email,
    };
  });
}

function buildNameToId(drivers) {
  const m = new Map();
  for (const d of drivers) {
    m.set(normNameKey(d.name), d.id);
  }
  return m;
}

function resolveDriverIdForDocRow(rowObj, nameToId, validIds) {
  const keys = Object.keys(rowObj);
  for (const k of keys) {
    const nk = normHeader(k);
    if (nk === "driverid" || nk === "driver id" || nk === "drv id") {
      const v = String(rowObj[k] ?? "").trim();
      const fixed = fixDriverIdCase(v, validIds);
      if (fixed) return fixed;
    }
  }
  for (const k of keys) {
    const nk = normHeader(k);
    if (nk === "driver name" || nk === "drivername") {
      const name = String(rowObj[k] ?? "").trim();
      const id = nameToId.get(normNameKey(name));
      if (id) return id;
    }
  }
  for (const k of keys) {
    const nk = normHeader(k);
    if (nk === "name" || nk === "driver") {
      const name = String(rowObj[k] ?? "").trim();
      const id = nameToId.get(normNameKey(name));
      if (id) return id;
    }
  }
  return null;
}

function fixDriverIdCase(id, validIds) {
  if (!id) return null;
  const s = String(id).trim();
  for (const v of validIds) {
    if (v.toLowerCase() === s.toLowerCase()) return v;
  }
  const m = /^DRV-(\d+)$/i.exec(s);
  if (m) {
    const num = parseInt(m[1], 10);
    for (const v of validIds) {
      const mm = /^DRV-(\d+)$/.exec(v);
      if (mm && parseInt(mm[1], 10) === num) return v;
    }
  }
  return null;
}

/**
 * Long-format documents: one row per document with type + expiration.
 */
function ingestDocumentsLongFormat(jsonRows, drivers) {
  const validIds = new Set(drivers.map((d) => d.id));
  const nameToId = buildNameToId(drivers);
  /** @type {Map<string, Map<string, { expiration: string | null }>>} */
  const byDriverType = new Map();

  for (const rowObj of jsonRows) {
    const driverId = resolveDriverIdForDocRow(rowObj, nameToId, validIds);
    if (!driverId) continue;

    let typeCol;
    let expCol;
    for (const k of Object.keys(rowObj)) {
      const nk = normHeader(k);
      if (
        nk === "type" ||
        nk === "document type" ||
        nk === "documenttype" ||
        nk === "doc type" ||
        nk === "document" ||
        (nk.includes("document") && nk.includes("type"))
      ) {
        typeCol = k;
      }
      if (
        nk === "expiration" ||
        nk === "expiration date" ||
        nk === "expirationdate" ||
        nk === "expiry" ||
        nk === "expires" ||
        nk === "exp date"
      ) {
        expCol = k;
      }
    }
    if (!typeCol) continue;
    const canon = canonicalDocType(rowObj[typeCol]);
    if (!canon) continue;
    const expRaw = expCol ? rowObj[expCol] : "";
    const expiration = parseExpiration(expRaw);

    if (!byDriverType.has(driverId)) byDriverType.set(driverId, new Map());
    const inner = byDriverType.get(driverId);
    inner.set(canon, { expiration });
  }

  return byDriverType;
}

/**
 * Wide-format: one row per driver; columns per document type (optional suffix Exp / Expiration).
 */
function ingestDocumentsWideFormat(rows, drivers) {
  if (!rows.length) return null;
  const header = rows[0].map((h) => String(h ?? "").trim());
  const dataRows = rows.slice(1).filter((r) => r && r.some((c) => String(c ?? "").trim() !== ""));
  const iDriver = findCol(header, [
    "name",
    "driver name",
    "driver",
    "driverid",
    "driver id",
  ]);
  if (iDriver < 0) return null;

  const typeToColIdx = new Map();
  for (let c = 0; c < header.length; c++) {
    if (c === iDriver) continue;
    const h = header[c];
    const base = normHeader(h)
      .replace(/\s+/g, " ")
      .replace(/\b(expiration|expiry|expires|exp|date)\b/g, "")
      .trim();
    const canon = canonicalDocType(base) || canonicalDocType(h);
    if (canon) typeToColIdx.set(canon, c);
  }
  if (typeToColIdx.size === 0) return null;

  const validIds = new Set(drivers.map((d) => d.id));
  const nameToId = buildNameToId(drivers);
  /** @type {Map<string, Map<string, { expiration: string | null }>>} */
  const byDriverType = new Map();

  for (const row of dataRows) {
    const key = String(row[iDriver] ?? "").trim();
    let driverId = null;
    if (/^DRV-\d+$/i.test(key)) {
      driverId = fixDriverIdCase(key, validIds);
    }
    if (!driverId) driverId = nameToId.get(normNameKey(key));
    if (!driverId) continue;

    if (!byDriverType.has(driverId)) byDriverType.set(driverId, new Map());
    const inner = byDriverType.get(driverId);

    for (const t of DOC_TYPES) {
      const colIdx = typeToColIdx.get(t);
      if (colIdx == null) continue;
      const expiration = parseExpiration(row[colIdx]);
      inner.set(t, { expiration });
    }
  }

  return byDriverType;
}

function mergeDocMaps(a, b) {
  if (!a) return b ?? new Map();
  if (!b) return a;
  const out = new Map(a);
  for (const [driverId, m2] of b) {
    if (!out.has(driverId)) out.set(driverId, new Map());
    const m1 = out.get(driverId);
    for (const [t, v] of m2) {
      m1.set(t, v);
    }
  }
  return out;
}

function materializeDocuments(drivers, byDriverType) {
  const documents = [];
  for (const d of drivers) {
    const map = byDriverType.get(d.id) ?? new Map();
    for (const type of DOC_TYPES) {
      const rec = map.get(type);
      const expirationDate = rec?.expiration ?? null;
      const status = docStatus(expirationDate);
      const doc = {
        driverId: d.id,
        type,
        status,
      };
      if (expirationDate) doc.expirationDate = expirationDate;
      documents.push(doc);
    }
  }
  return documents;
}

function readDocumentsClean(workbook, drivers) {
  const rows = readSheetRows(workbook, "Documents_Clean");
  if (!rows || rows.length < 2) {
    return new Map();
  }
  const header = rows[0].map((h) => String(h ?? "").trim());
  const hasLongCols =
    findCol(header, [
      "document type",
      "documenttype",
      "type",
      "doc type",
    ]) >= 0 &&
    findCol(header, [
      "driver name",
      "drivername",
      "driver",
      "name",
      "driver id",
      "driverid",
    ]) >= 0;

  let byDriver = new Map();
  if (hasLongCols) {
    const sheet = workbook.Sheets["Documents_Clean"];
    const jsonRows = XLSX.utils.sheet_to_json(sheet, {
      raw: true,
      defval: "",
    });
    byDriver = mergeDocMaps(byDriver, ingestDocumentsLongFormat(jsonRows, drivers));
  }
  const wide = ingestDocumentsWideFormat(rows, drivers);
  byDriver = mergeDocMaps(byDriver, wide ?? new Map());
  return byDriver;
}

function readCompliance(workbook, validIds) {
  const rows = readSheetRows(workbook, "Compliance_Events");
  if (!rows || rows.length < 2) return [];
  const header = rows[0].map((h) => String(h ?? "").trim());
  const iInc = findCol(header, ["incidentid", "incident id", "id"]);
  const iDrv = findCol(header, ["driverid", "driver id"]);
  const iType = findCol(header, ["type"]);
  const iStatus = findCol(header, ["status"]);
  const iSev = findCol(header, ["severity"]);
  const iLoad = findCol(header, ["loadid", "load id"]);
  if (iDrv < 0 || iType < 0 || iStatus < 0 || iSev < 0) {
    throw new Error(
      "Compliance_Events: missing required columns (driverId, type, status, severity)."
    );
  }
  const incidents = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row.some((c) => String(c ?? "").trim() !== "")) continue;
    const rawDrv = String(row[iDrv] ?? "").trim();
    const driverId = fixDriverIdCase(rawDrv, validIds);
    if (!driverId) continue;
    const incidentId =
      iInc >= 0 && String(row[iInc] ?? "").trim()
        ? String(row[iInc]).trim()
        : `INC-${String(incidents.length + 1).padStart(4, "0")}`;
    const type = String(row[iType] ?? "").trim();
    const status = String(row[iStatus] ?? "").trim();
    const severity = String(row[iSev] ?? "").trim();
    const inc = {
      incidentId,
      driverId,
      type,
      status,
      severity,
    };
    if (iLoad >= 0 && String(row[iLoad] ?? "").trim()) {
      inc.loadId = String(row[iLoad]).trim();
    }
    incidents.push(inc);
  }
  return incidents;
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`Missing workbook: ${XLSX_PATH}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(XLSX_PATH, { cellDates: true, type: "file" });
  if (!workbook.SheetNames.includes("Drivers_Clean")) {
    throw new Error('Workbook must contain sheet "Drivers_Clean".');
  }
  if (!workbook.SheetNames.includes("Documents_Clean")) {
    throw new Error('Workbook must contain sheet "Documents_Clean".');
  }

  const driverRows = readSheetRows(workbook, "Drivers_Clean");
  const drivers = buildDrivers(driverRows);

  const byDoc = readDocumentsClean(workbook, drivers);
  const documents = materializeDocuments(drivers, byDoc);

  const validIds = new Set(drivers.map((d) => d.id));
  const complianceIncidents = workbook.SheetNames.includes("Compliance_Events")
    ? readCompliance(workbook, validIds)
    : [];

  if (documents.length !== drivers.length * DOC_TYPES.length) {
    throw new Error(
      `Document count mismatch: got ${documents.length}, expected ${drivers.length * DOC_TYPES.length}`
    );
  }

  let existingLoads = [];
  if (fs.existsSync(OUT_PATH)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
      if (Array.isArray(prev.loads)) existingLoads = prev.loads;
    } catch {
      /* ignore */
    }
  }

  const out = { drivers, documents, complianceIncidents, loads: existingLoads };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");

  const validation = {
    totalDrivers: drivers.length,
    totalDocuments: documents.length,
    expectedDocuments: drivers.length * DOC_TYPES.length,
    totalComplianceIncidents: complianceIncidents.length,
  };
  console.log(JSON.stringify({ validation }, null, 2));
}

main();
