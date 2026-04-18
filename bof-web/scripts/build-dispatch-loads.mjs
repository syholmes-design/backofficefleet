/**
 * Build Step 2: loads[] from Dispatch_Clean only. Merges into existing lib/demo-data.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = resolveMainSourceXlsxPath(ROOT);
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");

const STATUS_MAP = new Map([
  ["DELIVERED", "Delivered"],
  ["IN_TRANSIT", "En Route"],
  ["INTRANSIT", "En Route"],
  ["PENDING", "Pending"],
]);

function normHeader(s) {
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

function normNameKey(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
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

function driverIdFromLegacy(raw, validIds) {
  const m = /^driver\s*(\d+)$/i.exec(String(raw ?? "").trim());
  if (!m) return null;
  const num = parseInt(m[1], 10);
  let width = 3;
  for (const id of validIds) {
    const mm = /^DRV-(\d+)$/.exec(id);
    if (mm) width = Math.max(width, mm[1].length);
  }
  const candidate = `DRV-${String(num).padStart(width, "0")}`;
  return validIds.has(candidate) ? candidate : null;
}

function parseRequiredNumber(v, label, rowLabel) {
  if (v === "" || v === null || v === undefined) {
    throw new Error(`${rowLabel}: missing required ${label}`);
  }
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
  if (Number.isNaN(n)) {
    throw new Error(`${rowLabel}: ${label} is not numeric`);
  }
  return n;
}

function parseExceptionFlag(v) {
  const s = String(v ?? "")
    .trim()
    .toUpperCase();
  if (!s) return false;
  return (
    s === "Y" ||
    s === "YES" ||
    s === "TRUE" ||
    s === "1" ||
    s === "X"
  );
}

function mapLoadStatus(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const key = t.toUpperCase().replace(/\s+/g, "_");
  return STATUS_MAP.get(key) ?? t;
}

function normalizePodStatus(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!s) return "pending";
  if (s === "verified" || s === "received" || s === "complete" || s === "completed") {
    return "verified";
  }
  if (s === "pending" || s === "in_review" || s === "review") return "pending";
  if (s === "missing" || s === "none") return "missing";
  throw new Error(
    `Invalid POD Status "${raw}" (expected verified, pending, missing, or aliases received/complete)`
  );
}

function loadNumberFromSheet(loadIdCell) {
  const s = String(loadIdCell ?? "").trim();
  const m = /^(?:L-?)?(\d+)$/i.exec(s.replace(/\s+/g, ""));
  if (m) return m[1];
  return s;
}

function sealStatusFromSeals(pickup, delivery) {
  const p = String(pickup ?? "").trim();
  const d = String(delivery ?? "").trim();
  if (p === "" && d === "") return "OK";
  if (p === d) return "OK";
  return "Mismatch";
}

function resolveDriverId(row, header, validIds, nameToId, rowLabel) {
  const iDrvCol = findCol(header, ["driver id", "driverid"]);
  const iLegacy = findCol(header, ["legacy driver id"]);
  const iName = findCol(header, ["driver name"]);

  if (iDrvCol >= 0) {
    const cell = String(row[iDrvCol] ?? "").trim();
    if (cell) {
      const fixed = fixDriverIdCase(cell, validIds);
      if (fixed) return fixed;
    }
  }
  if (iLegacy >= 0) {
    const cell = String(row[iLegacy] ?? "").trim();
    if (cell) {
      const id = driverIdFromLegacy(cell, validIds);
      if (id) return id;
    }
  }
  if (iName >= 0) {
    const cell = String(row[iName] ?? "").trim();
    if (cell) {
      const id = nameToId.get(normNameKey(cell));
      if (id) return id;
    }
  }
  throw new Error(`${rowLabel}: could not resolve driverId from sheet`);
}

function buildDispatchOpsNotes(row, header) {
  const parts = [];
  const iReason = findCol(header, [
    "reason for pending status",
    "pending status reason",
  ]);
  const iOverride = findCol(header, ["override reason"]);
  const iAudit = findCol(header, ["audit log"]);
  for (const idx of [iReason, iOverride, iAudit]) {
    if (idx < 0) continue;
    const t = String(row[idx] ?? "").trim();
    if (t) parts.push(t);
  }
  return parts.join(" | ");
}

function readDispatchLoads(workbook, validIds, nameToId) {
  const sheet = workbook.Sheets["Dispatch_Clean"];
  if (!sheet) {
    throw new Error('Workbook must contain sheet "Dispatch_Clean".');
  }
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });
  if (!rows.length) {
    throw new Error("Dispatch_Clean: empty sheet");
  }
  const header = rows[0].map((h) => String(h ?? "").trim());

  const iLoadId = findCol(header, ["load id"]);
  const iAsset = findCol(header, ["asset id"]);
  const iRevenue = findCol(header, ["revenue"]);
  const iBackhaul = findCol(header, ["backhaul pay", "backhaul"]);
  const iExportStatus = findCol(header, ["export load status"]);
  const iLoadStatus = findCol(header, ["load status"]);
  const iOrigin = findCol(header, ["origin"]);
  const iDest = findCol(header, ["destination"]);
  const iPod = findCol(header, ["pod status"]);
  const iPickupSeal = findCol(header, ["seal number (pickup)", "pickup seal"]);
  const iDelSeal = findCol(header, ["seal number (delivery)", "delivery seal"]);
  const iExc = findCol(header, ["exception flag"]);
  const iSealIssue = findCol(header, ["seal issue type"]);

  const required = [
    ["Load ID", iLoadId],
    ["Asset ID", iAsset],
    ["Revenue", iRevenue],
    ["Backhaul Pay", iBackhaul],
    ["Origin", iOrigin],
    ["Destination", iDest],
    ["POD Status", iPod],
    ["Seal Number (Pickup)", iPickupSeal],
    ["Seal Number (Delivery)", iDelSeal],
  ];
  for (const [label, idx] of required) {
    if (idx < 0) {
      throw new Error(`Dispatch_Clean: missing required column (${label})`);
    }
  }

  const statusCol =
    iExportStatus >= 0 ? iExportStatus : iLoadStatus;
  if (statusCol < 0) {
    throw new Error(
      "Dispatch_Clean: missing Load Status or Export Load Status column"
    );
  }

  const loads = [];
  const seenIds = new Set();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row.some((c) => String(c ?? "").trim() !== "")) continue;

    const rowLabel = `Dispatch_Clean row ${r + 1}`;
    const loadIdCell = String(row[iLoadId] ?? "").trim();
    if (!loadIdCell) throw new Error(`${rowLabel}: empty Load ID`);

    const driverId = resolveDriverId(row, header, validIds, nameToId, rowLabel);
    if (!validIds.has(driverId)) {
      throw new Error(`${rowLabel}: driverId ${driverId} not in drivers[]`);
    }

    const origin = String(row[iOrigin] ?? "").trim();
    const destination = String(row[iDest] ?? "").trim();
    if (!origin) throw new Error(`${rowLabel}: empty Origin`);
    if (!destination) throw new Error(`${rowLabel}: empty Destination`);

    const revenue = parseRequiredNumber(row[iRevenue], "Revenue", rowLabel);
    const backhaulPay = parseRequiredNumber(
      row[iBackhaul],
      "Backhaul Pay",
      rowLabel
    );

    const statusRaw = String(row[statusCol] ?? "").trim();
    if (!statusRaw) {
      throw new Error(`${rowLabel}: empty status (export/load status)`);
    }
    const status = mapLoadStatus(statusRaw);
    if (!status) {
      throw new Error(`${rowLabel}: could not map status`);
    }

    const podStatus = normalizePodStatus(row[iPod]);

    const pickupSeal = String(row[iPickupSeal] ?? "").trim();
    const deliverySeal = String(row[iDelSeal] ?? "").trim();
    const sealStatus = sealStatusFromSeals(pickupSeal, deliverySeal);

    const exceptionCol = iExc >= 0 ? parseExceptionFlag(row[iExc]) : false;
    const sealIssueRaw =
      iSealIssue >= 0 ? String(row[iSealIssue] ?? "").trim().toUpperCase() : "";
    const sealIssueFlag =
      sealIssueRaw !== "" && sealIssueRaw !== "VERIFIED";
    const dispatchExceptionFlag =
      sealStatus === "Mismatch" || exceptionCol || sealIssueFlag;

    const dispatchOpsNotes = buildDispatchOpsNotes(row, header);

    const seq = loads.length + 1;
    const id = `L${String(seq).padStart(3, "0")}`;
    if (seenIds.has(id)) throw new Error(`Duplicate load id ${id}`);
    seenIds.add(id);

    const number = loadNumberFromSheet(loadIdCell);
    if (!number) {
      throw new Error(`${rowLabel}: could not derive number from Load ID`);
    }

    const assetId = String(row[iAsset] ?? "").trim();
    if (!assetId) throw new Error(`${rowLabel}: empty Asset ID`);

    const load = {
      id,
      number,
      driverId,
      assetId,
      origin,
      destination,
      revenue,
      backhaulPay,
      status,
      podStatus,
      pickupSeal,
      deliverySeal,
      sealStatus,
      dispatchExceptionFlag,
    };
    if (dispatchOpsNotes) load.dispatchOpsNotes = dispatchOpsNotes;
    loads.push(load);
  }

  return loads;
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`Missing workbook: ${XLSX_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(DEMO_PATH)) {
    console.error(`Missing ${DEMO_PATH}`);
    process.exit(1);
  }

  const demo = JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));
  if (!Array.isArray(demo.drivers)) {
    throw new Error("demo-data.json: missing drivers[]");
  }

  const validIds = new Set(demo.drivers.map((d) => d.id));
  const nameToId = new Map();
  for (const d of demo.drivers) {
    nameToId.set(normNameKey(d.name), d.id);
  }

  const workbook = XLSX.readFile(XLSX_PATH, { cellDates: true, type: "file" });
  const loads = readDispatchLoads(workbook, validIds, nameToId);

  const ids = new Set(loads.map((l) => l.id));
  if (ids.size !== loads.length) {
    throw new Error("Duplicate load ids in output");
  }

  for (const l of loads) {
    if (!validIds.has(l.driverId)) {
      throw new Error(`Load ${l.id}: invalid driverId ${l.driverId}`);
    }
    if (l.revenue === undefined || l.revenue === null || Number.isNaN(l.revenue)) {
      throw new Error(`Load ${l.id}: invalid revenue`);
    }
  }

  const out = {
    ...demo,
    loads,
  };

  fs.writeFileSync(DEMO_PATH, JSON.stringify(out, null, 2), "utf8");

  const validation = {
    totalLoads: loads.length,
    allDriverIdsValid: loads.every((l) => validIds.has(l.driverId)),
    allRevenuePresent: loads.every(
      (l) => typeof l.revenue === "number" && !Number.isNaN(l.revenue)
    ),
    uniqueLoadIds: ids.size === loads.length,
  };
  console.log(JSON.stringify({ validation }, null, 2));
}

main();
