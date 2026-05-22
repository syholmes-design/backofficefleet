/**
 * Generates SVG operational documents under public/generated/ from lib/demo-data.json only.
 * No fabricated names, addresses, load numbers, or dollar amounts — values come from JSON.
 *
 * Run: node scripts/generate-bof-documents.mjs
 * Writes: lib/generated-manifest.json (optional inventory for static mirrors)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const OUT_PUBLIC = path.join(ROOT, "public", "generated");
const MANIFEST_PATH = path.join(ROOT, "lib", "generated-manifest.json");

/** Mirrors bof-web/lib/load-route-geo.ts (demo city centers only). */
const CITY_COORDS = {
  "Cleveland, OH": [41.4993, -81.6944],
  "Chicago, IL": [41.8781, -87.6298],
  "Akron, OH": [41.0814, -81.519],
  "Detroit, MI": [42.3314, -83.0458],
  "Columbus, OH": [39.9612, -82.9988],
  "Indianapolis, IN": [39.7684, -86.1581],
  "Cincinnati, OH": [39.1031, -84.512],
  "Louisville, KY": [38.2527, -85.7585],
  "Toledo, OH": [41.6528, -83.5379],
  "Pittsburgh, PA": [40.4406, -79.9959],
  "Dayton, OH": [39.7589, -84.1916],
  "Lexington, KY": [38.0406, -84.5037],
  "Canton, OH": [40.7989, -81.3784],
  "Youngstown, OH": [41.0998, -80.6495],
  "Sandusky, OH": [41.4489, -82.708],
  "Mansfield, OH": [40.7584, -82.5154],
  "Springfield, OH": [39.9242, -83.8088],
  "Buffalo, NY": [42.8864, -78.8784],
};

function coordsForCity(label) {
  const k = (label || "").trim();
  if (CITY_COORDS[k]) return CITY_COORDS[k];
  const city = k.split(",")[0]?.trim().toLowerCase() ?? "";
  const entry = Object.entries(CITY_COORDS).find(([key]) =>
    key.toLowerCase().startsWith(city)
  );
  return entry ? entry[1] : [40.4173, -82.9061];
}

function escapeXml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgDocument(title, lines) {
  const lh = 15;
  const startY = 48;
  const tspans = lines.map((line, i) => {
    return `<tspan x="28" y="${startY + i * lh}">${escapeXml(line)}</tspan>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="612" height="792" viewBox="0 0 612 792">
  <rect width="612" height="792" fill="#f8fafc" stroke="#cbd5e1"/>
  <text x="28" y="32" font-family="system-ui,Segoe UI,sans-serif" font-size="13" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <text font-family="system-ui,Segoe UI,sans-serif" font-size="10" fill="#1e293b">
    ${tspans.join("")}
  </text>
</svg>`;
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function writeSvg(dir, name, title, lines) {
  ensureDir(dir);
  const fp = path.join(dir, name);
  fs.writeFileSync(fp, svgDocument(title, lines), "utf8");
  return name;
}

function loadDriver(data, driverId) {
  return data.drivers.find((d) => d.id === driverId) ?? null;
}

function docRowsForDriver(data, driverId) {
  const types = [
    "CDL",
    "Medical Card",
    "MVR",
    "I-9",
    "FMCSA",
    "W-9",
    "Bank Info",
  ];
  const map = new Map();
  for (const r of data.documents) {
    if (r.driverId === driverId) map.set(r.type, r);
  }
  return types.map((t) => map.get(t) ?? { type: t, status: "MISSING" });
}

function openIncidentsForDriver(data, driverId) {
  return data.complianceIncidents.filter(
    (c) => c.driverId === driverId && c.status === "OPEN"
  );
}

function marForAsset(data, assetId) {
  if (!data.moneyAtRisk) return [];
  return data.moneyAtRisk.filter((m) => m.assetId === assetId);
}

function settlementForDriver(data, driverId) {
  if (!data.settlements) return null;
  return data.settlements.find((s) => s.driverId === driverId) ?? null;
}

function bundleItems(data, loadId) {
  const b = data.loadProofBundles?.[loadId]?.items;
  return b ?? {};
}

function generateLoadPacket(data, load, manifest) {
  const loadId = load.id;
  const dir = path.join(OUT_PUBLIC, "loads", loadId);
  const driver = loadDriver(data, load.driverId);
  const dname = driver?.name ?? load.driverId;
  const daddr = driver?.address ?? "(address not in source)";
  const bundle = bundleItems(data, loadId);
  const proofLine = (label, key) => {
    const o = bundle[key];
    if (o) {
      const st = o.status ?? "—";
      const n = o.notes ? ` · ${o.notes}` : "";
      return `${label}: ${st}${n}`;
    }
    return `${label}: (no bundle override — see load proof panel for derived state)`;
  };

  const files = [];

  const header = [
    `driverId: ${load.driverId}`,
    `loadId: ${load.id}`,
    `assetId: ${load.assetId}`,
    `loadNumber: ${load.number}`,
    `driverName: ${dname}`,
  ];

  files.push(
    writeSvg(dir, "rate-confirmation.svg", `Rate Confirmation · ${loadId}`, [
      ...header,
      `origin: ${load.origin}`,
      `destination: ${load.destination}`,
      `linehaulRevenue (source): ${load.revenue}`,
      `backhaulPay (source): ${load.backhaulPay}`,
      `loadStatus: ${load.status}`,
      proofLine("Proof bundle — Rate Confirmation", "Rate Confirmation"),
    ])
  );

  files.push(
    writeSvg(dir, "bol.svg", `Bill of Lading · ${loadId}`, [
      ...header,
      `pickupSeal: ${load.pickupSeal || "—"}`,
      `deliverySeal: ${load.deliverySeal || "—"}`,
      `sealStatus: ${load.sealStatus}`,
      proofLine("Proof bundle — BOL", "BOL"),
    ])
  );

  const disp = (load.dispatchOpsNotes || "").trim();
  files.push(
    writeSvg(dir, "dispatch-instructions.svg", `Dispatch Instructions · ${loadId}`, [
      ...header,
      disp ? `dispatchOpsNotes: ${disp}` : "dispatchOpsNotes: (empty in source)",
      `dispatchExceptionFlag: ${load.dispatchExceptionFlag}`,
    ])
  );

  files.push(
    writeSvg(dir, "pretrip-checklist.svg", `Pre-Trip Checklist · ${loadId}`, [
      ...header,
      `podStatus: ${load.podStatus}`,
      proofLine("Pre-Trip Cargo Photo", "Pre-Trip Cargo Photo"),
      proofLine("Pickup Seal Photo", "Pickup Seal Photo"),
      proofLine("Delivery Seal Photo", "Delivery Seal Photo"),
    ])
  );

  files.push(
    writeSvg(dir, "cargo-photo-record.svg", `Cargo Photo Record · ${loadId}`, [
      ...header,
      proofLine("Pre-Trip Cargo Photo", "Pre-Trip Cargo Photo"),
    ])
  );

  files.push(
    writeSvg(dir, "pickup-seal-verification.svg", `Pickup Seal Verification · ${loadId}`, [
      ...header,
      `pickupSeal: ${load.pickupSeal || "—"}`,
      proofLine("Pickup Seal Photo", "Pickup Seal Photo"),
    ])
  );

  files.push(
    writeSvg(dir, "delivery-seal-verification.svg", `Delivery Seal Verification · ${loadId}`, [
      ...header,
      `deliverySeal: ${load.deliverySeal || "—"}`,
      proofLine("Delivery Seal Photo", "Delivery Seal Photo"),
    ])
  );

  files.push(
    writeSvg(dir, "pod.svg", `Proof of Delivery · ${loadId}`, [
      ...header,
      `podStatus: ${load.podStatus}`,
      proofLine("POD", "POD"),
    ])
  );

  files.push(
    writeSvg(dir, "empty-trailer-confirmation.svg", `Empty Trailer Confirmation · ${loadId}`, [
      ...header,
      proofLine("Delivery / Empty-Trailer Photo", "Delivery / Empty-Trailer Photo"),
    ])
  );

  const oCoord = coordsForCity(load.origin);
  const dCoord = coordsForCity(load.destination);
  files.push(
    writeSvg(dir, "gps-geolocation-summary.svg", `GPS / Geolocation Summary · ${loadId}`, [
      ...header,
      `originLabel: ${load.origin}`,
      `originApproxLatLng (demo static table): ${oCoord[0].toFixed(4)}, ${oCoord[1].toFixed(4)}`,
      `destinationLabel: ${load.destination}`,
      `destinationApproxLatLng (demo static table): ${dCoord[0].toFixed(4)}, ${dCoord[1].toFixed(4)}`,
      "Note: Live GPS trace not in BOF source data.",
    ])
  );

  files.push(
    writeSvg(dir, "weather-traffic-summary.svg", `Weather / Traffic Summary · ${loadId}`, [
      ...header,
      "Weather detail: not present in BOF source dataset.",
      "Traffic detail: not present in BOF source dataset.",
      `Context: loadStatus=${load.status} sealStatus=${load.sealStatus}`,
    ])
  );

  const inc = openIncidentsForDriver(data, load.driverId);
  files.push(
    writeSvg(dir, "hos-status-summary.svg", `HOS / Compliance Summary · ${loadId}`, [
      ...header,
      inc.length === 0
        ? "Open compliance incidents (source): none"
        : `Open compliance incidents (source): ${inc.length}`,
      ...inc.map(
        (c) =>
          `  · ${c.incidentId} | ${c.type} | ${c.severity} | ${c.status}`
      ),
    ])
  );

  files.push(
    writeSvg(dir, "camera-status-summary.svg", `Camera Status Summary · ${loadId}`, [
      ...header,
      "Dash / inward camera status: not tracked in BOF source data.",
    ])
  );

  files.push(
    writeSvg(dir, "lumper-receipt.svg", `Lumper Receipt · ${loadId}`, [
      ...header,
      proofLine("Lumper Receipt", "Lumper Receipt"),
    ])
  );

  files.push(
    writeSvg(dir, "fuel-receipt.svg", `Fuel Receipt · ${loadId}`, [
      ...header,
      proofLine("Fuel Receipt", "Fuel Receipt"),
    ])
  );

  const mar = marForAsset(data, load.assetId);
  files.push(
    writeSvg(dir, "maintenance-readiness-report.svg", `Maintenance Readiness · ${loadId}`, [
      ...header,
      mar.length === 0
        ? "moneyAtRisk rows for this assetId: none"
        : `moneyAtRisk rows for assetId ${load.assetId}:`,
      ...mar.map(
        (m) =>
          `  · ${m.id} | ${m.category} | $${m.amount} | ${m.status} | ${m.rootCause}`
      ),
    ])
  );

  files.push(
    writeSvg(dir, "tire-check-report.svg", `Tire Check Report · ${loadId}`, [
      ...header,
      "Tire inspection record: not present in BOF source data.",
    ])
  );

  // RF-linked reports (keep in sync with lib/bof-generated-svgs.ts)
  files.push(
    writeSvg(
      dir,
      "rf-pod-verification-report.svg",
      `RF POD Verification Report · ${loadId}`,
      [
        ...header,
        `podStatus: ${load.podStatus}`,
        "rfEmptyTrailerChainOk: (see live API — derived from proof + RFID dock)",
      ]
    )
  );
  files.push(
    writeSvg(
      dir,
      "rf-seal-exception-report.svg",
      `RF Seal Exception Report · ${loadId}`,
      [
        ...header,
        `sealStatus: ${load.sealStatus}`,
        `pickupSeal: ${load.pickupSeal || "—"}`,
        `deliverySeal: ${load.deliverySeal || "—"}`,
      ]
    )
  );
  files.push(
    writeSvg(dir, "rf-fuel-efficiency-report.svg", `RF Fuel Efficiency Report · ${loadId}`, [
      ...header,
      `dispatchExceptionFlag: ${load.dispatchExceptionFlag}`,
      `status: ${load.status}`,
      "rfFuel row: generated at runtime from rfid-intelligence.ts",
    ])
  );
  files.push(
    writeSvg(
      dir,
      "rf-maintenance-alert-report.svg",
      `RF Maintenance Alert Report · ${loadId}`,
      [
        ...header,
        `assetId: ${load.assetId}`,
        "rfMaint row: generated at runtime from rfid-intelligence.ts",
      ]
    )
  );

  manifest.loads[loadId] = files;
}

function generateDriverPacket(data, driver, manifest) {
  const id = driver.id;
  const dir = path.join(OUT_PUBLIC, "drivers", id);
  const files = [];
  files.push(
    writeSvg(dir, "emergency-contact-sheet.svg", `Emergency Contact · ${id}`, [
      `driverId: ${id}`,
      `driverName: ${driver.name}`,
      `address: ${driver.address}`,
      `phone: ${driver.phone}`,
      `email: ${driver.email}`,
      `emergencyContactName: ${driver.emergencyContactName}`,
      `emergencyContactRelationship: ${driver.emergencyContactRelationship}`,
      `emergencyContactPhone: ${driver.emergencyContactPhone}`,
    ])
  );

  const rows = docRowsForDriver(data, id);
  files.push(
    writeSvg(dir, "credential-register.svg", `Credential Register · ${id}`, [
      `driverId: ${id}`,
      `driverName: ${driver.name}`,
      ...rows.map((r) => `${r.type}: ${r.status}`),
    ])
  );

  const types = [
    ["cdl.svg", "CDL"],
    ["medical-card.svg", "Medical Card"],
    ["mvr.svg", "MVR"],
    ["i9.svg", "I-9"],
    ["fmcsa-compliance-record.svg", "FMCSA"],
    ["w9.svg", "W-9"],
    ["bank-direct-deposit.svg", "Bank Info"],
  ];
  for (const [fname, t] of types) {
    const row = rows.find((r) => r.type === t);
    files.push(
      writeSvg(dir, fname, `${t} · ${id}`, [
        `driverId: ${id}`,
        `driverName: ${driver.name}`,
        `documentType: ${t}`,
        `status (source documents[]): ${row?.status ?? "MISSING"}`,
        row?.expirationDate
          ? `expirationDate: ${row.expirationDate}`
          : "expirationDate: (not in source)",
        row?.fileUrl ? `fileUrl (source): ${row.fileUrl}` : "fileUrl (source): —",
      ])
    );
  }

  manifest.drivers[id] = files;
}

function generateClaimPacket(data, inc, manifest) {
  const id = inc.incidentId;
  const dir = path.join(OUT_PUBLIC, "claims", id);
  const driver = loadDriver(data, inc.driverId);
  const files = [];
  files.push(
    writeSvg(dir, "evidence-summary.svg", `Evidence Summary · ${id}`, [
      `incidentId: ${id}`,
      `driverId: ${inc.driverId}`,
      `driverName: ${driver?.name ?? inc.driverId}`,
      `type: ${inc.type}`,
      `status: ${inc.status}`,
      `severity: ${inc.severity}`,
    ])
  );
  files.push(
    writeSvg(dir, "dispute-letter.svg", `Compliance Record · ${id}`, [
      `incidentId: ${id}`,
      `driverId: ${inc.driverId}`,
      "Form: compliance / dispute letter shell",
      `Narrative (source incident type): ${inc.type}`,
    ])
  );
  files.push(
    writeSvg(dir, "insurance-notice.svg", `Insurance Notice · ${id}`, [
      `incidentId: ${id}`,
      "Insurance notice detail: not in BOF source data.",
    ])
  );
  files.push(
    writeSvg(dir, "claim-packet-cover.svg", `Claim Packet · ${id}`, [
      `incidentId: ${id}`,
      `driverId: ${inc.driverId}`,
      `Linked compliance type: ${inc.type}`,
    ])
  );
  files.push(
    writeSvg(dir, "damage-report.svg", `Damage Report · ${id}`, [
      `incidentId: ${id}`,
      "Physical damage report: not in BOF source for this incident.",
    ])
  );
  manifest.claims[id] = files;
}

function generateExceptionPacket(data, mar, manifest) {
  const id = mar.id;
  const dir = path.join(OUT_PUBLIC, "exceptions", id);
  const files = [];
  files.push(
    writeSvg(dir, "settlement-hold-explanation.svg", `Exception / Hold · ${id}`, [
      `moneyAtRiskId: ${id}`,
      `category: ${mar.category}`,
      `driverId: ${mar.driverId}`,
      `driver: ${mar.driver}`,
      `loadId: ${mar.loadId ?? "—"}`,
      `assetId: ${mar.assetId ?? "—"}`,
      `amount (source): ${mar.amount}`,
      `status: ${mar.status}`,
      `rootCause: ${mar.rootCause}`,
      `nextBestAction: ${mar.nextBestAction}`,
      `owner: ${mar.owner}`,
    ])
  );
  files.push(
    writeSvg(dir, "dispute-letter.svg", `Dispute Letter · ${id}`, [
      `moneyAtRiskId: ${id}`,
      `category: ${mar.category}`,
      `rootCause (source): ${mar.rootCause}`,
    ])
  );
  files.push(
    writeSvg(dir, "evidence-summary.svg", `Evidence Summary · ${id}`, [
      `moneyAtRiskId: ${id}`,
      `loadId: ${mar.loadId ?? "—"}`,
      "Attach load proof stack and driver docs from BOF UI.",
    ])
  );
  manifest.exceptions[id] = files;
}

function generateSettlementPacket(data, st, manifest) {
  const id = st.settlementId;
  const dir = path.join(OUT_PUBLIC, "settlements", id);
  const driver = loadDriver(data, st.driverId);
  const files = [];
  const pend = (st.pendingReason || "").trim();
  files.push(
    writeSvg(dir, "settlement-summary.svg", `Settlement · ${id}`, [
      `settlementId: ${id}`,
      `driverId: ${st.driverId}`,
      `driverName: ${driver?.name ?? st.driverId}`,
      `status: ${st.status}`,
      `exportStatus: ${st.exportStatus}`,
      `grossPay (source): ${st.grossPay}`,
      `netPay (source): ${st.netPay}`,
      `deductions (source): ${st.deductions}`,
      pend ? `pendingReason: ${pend}` : "pendingReason: (empty)",
    ])
  );
  if (pend) {
    files.push(
      writeSvg(dir, "settlement-hold-explanation.svg", `Settlement Hold · ${id}`, [
        `settlementId: ${id}`,
        `driverId: ${st.driverId}`,
        `pendingReason (source): ${pend}`,
      ])
    );
  } else {
    files.push(
      writeSvg(dir, "settlement-hold-explanation.svg", `Settlement Hold · ${id}`, [
        `settlementId: ${id}`,
        "No active hold reason in source pendingReason field.",
      ])
    );
  }
  files.push(
    writeSvg(dir, "insurance-notice.svg", `Payroll / Benefits · ${id}`, [
      `settlementId: ${id}`,
      `insurancePremiums (source): ${st.insurancePremiums}`,
      `hsaFsaHealthDeduction (source): ${st.hsaFsaHealthDeduction}`,
    ])
  );
  manifest.settlements[id] = files;
}

function main() {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const data = JSON.parse(raw);

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    loads: {},
    drivers: {},
    claims: {},
    exceptions: {},
    settlements: {},
    unavailableInSource: [
      "Live GPS breadcrumb trail",
      "Historical weather observations for lane",
      "Real-time traffic telemetry",
      "Per-load tire PSI inspection readings",
      "Dash camera online/offline telemetry",
    ],
  };

  fs.rmSync(OUT_PUBLIC, { recursive: true, force: true });
  ensureDir(OUT_PUBLIC);

  for (const load of data.loads) {
    generateLoadPacket(data, load, manifest);
  }
  for (const driver of data.drivers) {
    generateDriverPacket(data, driver, manifest);
  }
  for (const inc of data.complianceIncidents || []) {
    generateClaimPacket(data, inc, manifest);
  }
  for (const mar of data.moneyAtRisk || []) {
    generateExceptionPacket(data, mar, manifest);
  }
  for (const st of data.settlements || []) {
    generateSettlementPacket(data, st, manifest);
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Wrote", OUT_PUBLIC, "and", MANIFEST_PATH);
}

main();
