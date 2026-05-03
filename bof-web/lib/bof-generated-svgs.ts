/**
 * Build SVG document bodies from BofData only (no invented names, amounts, or routes).
 * Shared by the API route and optional scripts/generate-bof-documents.mjs (keep in sync).
 */
import type { BofData } from "./load-bof-data";
import { reconcileCredentialIncident } from "./compliance/credential-incident-reconciliation";
import { coordsForCity } from "./load-route-geo";
import { getLoadProofItems } from "./load-proof";
import {
  buildRfidDockRowForLoad,
  buildRfidFuelRowForLoad,
  buildRfidMaintenanceRows,
} from "./rfid-intelligence";

type DriverWithEmergencyContact = BofData["drivers"][number] & {
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
};

function escapeXml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgDocument(title: string, lines: string[]) {
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

function loadRecord(data: BofData, loadId: string) {
  return data.loads.find((l) => l.id === loadId) ?? null;
}

function driverRecord(data: BofData, driverId: string) {
  return data.drivers.find((d) => d.id === driverId) ?? null;
}

const DRIVER_DOC_TYPES = [
  "CDL",
  "Medical Card",
  "MVR",
  "I-9",
  "FMCSA",
  "W-9",
  "Bank Info",
] as const;

type DocRow = {
  type: string;
  status: string;
  expirationDate?: string;
  fileUrl?: string;
};

function docRowsForDriver(data: BofData, driverId: string): DocRow[] {
  const map = new Map<string, DocRow>();
  for (const r of data.documents) {
    if (r.driverId === driverId)
      map.set(r.type, {
        type: r.type,
        status: r.status,
        expirationDate: (r as { expirationDate?: string }).expirationDate,
        fileUrl: (r as { fileUrl?: string }).fileUrl,
      });
  }
  return DRIVER_DOC_TYPES.map((t) => map.get(t) ?? { type: t, status: "MISSING" });
}

function bundleLine(
  data: BofData,
  loadId: string,
  key: string,
  label: string
): string {
  const b =
    "loadProofBundles" in data && data.loadProofBundles
      ? (data.loadProofBundles as Record<string, { items?: Record<string, { status?: string; notes?: string }> }>)[loadId]?.items?.[key]
      : undefined;
  if (b) {
    const st = b.status ?? "—";
    const n = b.notes ? ` · ${b.notes}` : "";
    return `${label}: ${st}${n}`;
  }
  return `${label}: (no bundle override — see load proof panel for derived state)`;
}

export function buildLoadGeneratedSvg(
  data: BofData,
  loadId: string,
  file: string
): string | null {
  const load = loadRecord(data, loadId);
  if (!load) return null;
  const driver = driverRecord(data, load.driverId);
  const dname = driver?.name ?? load.driverId;
  const header = [
    `driverId: ${load.driverId}`,
    `loadId: ${load.id}`,
    `assetId: ${load.assetId}`,
    `loadNumber: ${load.number}`,
    `driverName: ${dname}`,
  ];
  const inc = data.complianceIncidents.filter((c) => {
    if (c.driverId !== load.driverId || c.status !== "OPEN") return false;
    return reconcileCredentialIncident(data, c).display;
  });
  const mar = data.moneyAtRisk?.filter((m) => m.assetId === load.assetId) ?? [];
  const oCoord = coordsForCity(load.origin);
  const dCoord = coordsForCity(load.destination);

  const map: Record<string, string> = {
    "rate-confirmation.svg": svgDocument(`Rate Confirmation · ${loadId}`, [
      ...header,
      `origin: ${load.origin}`,
      `destination: ${load.destination}`,
      `linehaulRevenue (source): ${load.revenue}`,
      `backhaulPay (source): ${load.backhaulPay}`,
      `loadStatus: ${load.status}`,
      bundleLine(data, loadId, "Rate Confirmation", "Proof bundle — Rate Confirmation"),
    ]),
    "bol.svg": svgDocument(`Bill of Lading · ${loadId}`, [
      ...header,
      `pickupSeal: ${load.pickupSeal || "—"}`,
      `deliverySeal: ${load.deliverySeal || "—"}`,
      `sealStatus: ${load.sealStatus}`,
      bundleLine(data, loadId, "BOL", "Proof bundle — BOL"),
    ]),
    "dispatch-instructions.svg": svgDocument(`Dispatch Instructions · ${loadId}`, [
      ...header,
      (load.dispatchOpsNotes ?? "").trim()
        ? `dispatchOpsNotes: ${(load.dispatchOpsNotes ?? "").trim()}`
        : "dispatchOpsNotes: (empty in source)",
      `dispatchExceptionFlag: ${load.dispatchExceptionFlag}`,
    ]),
    "pretrip-checklist.svg": svgDocument(`Pre-Trip Checklist · ${loadId}`, [
      ...header,
      `podStatus: ${load.podStatus}`,
      bundleLine(data, loadId, "Pre-Trip Cargo Photo", "Pre-Trip Cargo Photo"),
      bundleLine(data, loadId, "Pickup Seal Photo", "Pickup Seal Photo"),
      bundleLine(data, loadId, "Delivery Seal Photo", "Delivery Seal Photo"),
    ]),
    "cargo-photo-record.svg": svgDocument(`Cargo Photo Record · ${loadId}`, [
      ...header,
      bundleLine(data, loadId, "Pre-Trip Cargo Photo", "Pre-Trip Cargo Photo"),
    ]),
    "pickup-seal-verification.svg": svgDocument(`Pickup Seal Verification · ${loadId}`, [
      ...header,
      `pickupSeal: ${load.pickupSeal || "—"}`,
      bundleLine(data, loadId, "Pickup Seal Photo", "Pickup Seal Photo"),
    ]),
    "delivery-seal-verification.svg": svgDocument(
      `Delivery Seal Verification · ${loadId}`,
      [
        ...header,
        `deliverySeal: ${load.deliverySeal || "—"}`,
        bundleLine(data, loadId, "Delivery Seal Photo", "Delivery Seal Photo"),
      ]
    ),
    "pod.svg": svgDocument(`Proof of Delivery · ${loadId}`, [
      ...header,
      `podStatus: ${load.podStatus}`,
      bundleLine(data, loadId, "POD", "POD"),
    ]),
    "invoice.svg": svgDocument(`Invoice · ${loadId}`, [
      ...header,
      `linehaulRevenue (source): ${load.revenue}`,
      `backhaulPay (source): ${load.backhaulPay}`,
      `dispatchExceptionFlag: ${load.dispatchExceptionFlag}`,
      "Invoice total in BOF demo is derived from source load revenue + backhaul pay.",
    ]),
    "empty-trailer-confirmation.svg": svgDocument(
      `Empty Trailer Confirmation · ${loadId}`,
      [
        ...header,
        bundleLine(
          data,
          loadId,
          "Delivery / Empty-Trailer Photo",
          "Delivery / Empty-Trailer Photo"
        ),
      ]
    ),
    "gps-geolocation-summary.svg": svgDocument(`GPS / Geolocation Summary · ${loadId}`, [
      ...header,
      `originLabel: ${load.origin}`,
      `originApproxLatLng (demo static table): ${oCoord[0].toFixed(4)}, ${oCoord[1].toFixed(4)}`,
      `destinationLabel: ${load.destination}`,
      `destinationApproxLatLng (demo static table): ${dCoord[0].toFixed(4)}, ${dCoord[1].toFixed(4)}`,
      "Note: Live GPS trace not in BOF source data.",
    ]),
    "weather-traffic-summary.svg": svgDocument(`Weather / Traffic Summary · ${loadId}`, [
      ...header,
      "Weather detail: not present in BOF source dataset.",
      "Traffic detail: not present in BOF source dataset.",
      `Context: loadStatus=${load.status} sealStatus=${load.sealStatus}`,
    ]),
    "hos-status-summary.svg": svgDocument(`HOS / Compliance Summary · ${loadId}`, [
      ...header,
      inc.length === 0
        ? "Open compliance incidents (source): none"
        : `Open compliance incidents (source): ${inc.length}`,
      ...inc.map(
        (c) =>
          `  · ${c.incidentId} | ${c.type} | ${c.severity} | ${c.status}`
      ),
    ]),
    "camera-status-summary.svg": svgDocument(`Camera Status Summary · ${loadId}`, [
      ...header,
      "Dash / inward camera status: not tracked in BOF source data.",
    ]),
    "lumper-receipt.svg": svgDocument(`Lumper Receipt · ${loadId}`, [
      ...header,
      bundleLine(data, loadId, "Lumper Receipt", "Lumper Receipt"),
    ]),
    "fuel-receipt.svg": svgDocument(`Fuel Receipt · ${loadId}`, [
      ...header,
      bundleLine(data, loadId, "Fuel Receipt", "Fuel Receipt"),
    ]),
    "maintenance-readiness-report.svg": svgDocument(
      `Maintenance Readiness · ${loadId}`,
      [
        ...header,
        mar.length === 0
          ? "moneyAtRisk rows for this assetId: none"
          : `moneyAtRisk rows for assetId ${load.assetId}:`,
        ...mar.map(
          (m) =>
            `  · ${m.id} | ${m.category} | $${m.amount} | ${m.status} | ${m.rootCause}`
        ),
      ]
    ),
    "tire-check-report.svg": svgDocument(`Tire Check Report · ${loadId}`, [
      ...header,
      "Tire inspection record: not present in BOF source data.",
    ]),
    "rf-pod-verification-report.svg": (() => {
      const proofs = getLoadProofItems(data, loadId);
      const emptyP = proofs.find(
        (p) => p.type === "Delivery / Empty-Trailer Photo"
      );
      const rfidP = proofs.find(
        (p) => p.type === "RFID / Dock Validation Record"
      );
      const podP = proofs.find((p) => p.type === "POD");
      const dock = buildRfidDockRowForLoad(data, loadId);
      const rfEmptyOk =
        emptyP?.status === "Complete" ||
        (rfidP?.status === "Complete" &&
          (String(load.podStatus).toLowerCase() === "verified" ||
            load.status === "Delivered"));
      return svgDocument(`RF POD Verification Report · ${loadId}`, [
        ...header,
        `podStatus (loads[]): ${load.podStatus}`,
        `rfEmptyTrailerChainOk (derived): ${rfEmptyOk}`,
        dock
          ? `rfDock id=${dock.id} trailerConfirmedAtDock=${dock.trailerConfirmedAtDock}`
          : "rfDock: —",
        podP ? `proof POD status=${podP.status}` : "proof POD: —",
      ]);
    })(),
    "rf-seal-exception-report.svg": (() => {
      const dock = buildRfidDockRowForLoad(data, loadId);
      return svgDocument(`RF Seal Exception Report · ${loadId}`, [
        ...header,
        `sealStatus (loads[]): ${load.sealStatus}`,
        `pickupSeal: ${load.pickupSeal || "—"}`,
        `deliverySeal: ${load.deliverySeal || "—"}`,
        dock
          ? `rfDock id=${dock.id} narrative=${dock.unloadCheckpointNarrative}`
          : "rfDock: —",
      ]);
    })(),
    "rf-fuel-efficiency-report.svg": (() => {
      const fuel = buildRfidFuelRowForLoad(data, loadId);
      if (!fuel) {
        return svgDocument(`RF Fuel Efficiency Report · ${loadId}`, [
          ...header,
          "rfFuel: load not found",
        ]);
      }
      return svgDocument(`RF Fuel Efficiency Report · ${loadId}`, [
        ...header,
        `rfFuel id=${fuel.id}`,
        `routeCheckpointMatch=${fuel.routeCheckpointMatch}`,
        `unauthorizedFuelingFlag=${fuel.unauthorizedFuelingFlag}`,
        `fuelAnomalyOpportunityUsd=${fuel.fuelAnomalyOpportunityUsd}`,
        fuel.verifiedFuelingNarrative,
      ]);
    })(),
    "rf-maintenance-alert-report.svg": (() => {
      const maint = buildRfidMaintenanceRows(data).find((r) =>
        r.relatedLoadIds.includes(loadId)
      );
      if (!maint) {
        return svgDocument(`RF Maintenance Alert Report · ${loadId}`, [
          ...header,
          "rfMaint: no row for this load asset chain (fallback)",
        ]);
      }
      return svgDocument(`RF Maintenance Alert Report · ${loadId}`, [
        ...header,
        `rfMaint id=${maint.id}`,
        `assetId=${maint.assetId}`,
        `overdueExposureUsd=${maint.overdueExposureUsd}`,
        `serviceZoneVerified=${maint.serviceZoneVerified}`,
        maint.readinessImpact,
      ]);
    })(),
  };
  return map[file] ?? null;
}

const DRIVER_FILE_MAP: { file: string; type: string }[] = [
  { file: "cdl.svg", type: "CDL" },
  { file: "medical-card.svg", type: "Medical Card" },
  { file: "mvr.svg", type: "MVR" },
  { file: "i9.svg", type: "I-9" },
  { file: "fmcsa-compliance-record.svg", type: "FMCSA" },
  { file: "w9.svg", type: "W-9" },
  { file: "bank-direct-deposit.svg", type: "Bank Info" },
];

export function buildDriverGeneratedSvg(
  data: BofData,
  driverId: string,
  file: string
): string | null {
  const driver = driverRecord(data, driverId) as DriverWithEmergencyContact | null;
  if (!driver) return null;
  if (file === "emergency-contact-sheet.svg") {
    return svgDocument(`Emergency Contact · ${driverId}`, [
      `driverId: ${driverId}`,
      `driverName: ${driver.name}`,
      `address: ${driver.address}`,
      `phone: ${driver.phone}`,
      `email: ${driver.email}`,
      `emergencyContactName: ${driver.emergencyContactName ?? "Not on file"}`,
      `emergencyContactRelationship: ${driver.emergencyContactRelationship ?? "Not on file"}`,
      `emergencyContactPhone: ${driver.emergencyContactPhone ?? "Not on file"}`,
    ]);
  }
  if (file === "credential-register.svg") {
    const rows = docRowsForDriver(data, driverId);
    return svgDocument(`Credential Register · ${driverId}`, [
      `driverId: ${driverId}`,
      `driverName: ${driver.name}`,
      ...rows.map((r) => `${r.type}: ${r.status}`),
    ]);
  }
  const hit = DRIVER_FILE_MAP.find((x) => x.file === file);
  if (hit) {
    const rows = docRowsForDriver(data, driverId);
    const row = rows.find((r) => r.type === hit.type) ?? {
      type: hit.type,
      status: "MISSING",
    };
    return svgDocument(`${hit.type} · ${driverId}`, [
      `driverId: ${driverId}`,
      `driverName: ${driver.name}`,
      `documentType: ${hit.type}`,
      `status (source documents[]): ${row.status}`,
      row.expirationDate
        ? `expirationDate: ${row.expirationDate}`
        : "expirationDate: (not in source)",
      row.fileUrl ? `fileUrl (source): ${row.fileUrl}` : "fileUrl (source): —",
    ]);
  }
  return null;
}

export function buildClaimGeneratedSvg(
  data: BofData,
  incidentId: string,
  file: string
): string | null {
  const inc = data.complianceIncidents.find((c) => c.incidentId === incidentId);
  if (!inc) return null;
  const driver = driverRecord(data, inc.driverId);
  const base = [
    `incidentId: ${inc.incidentId}`,
    `driverId: ${inc.driverId}`,
    `driverName: ${driver?.name ?? inc.driverId}`,
    `type: ${inc.type}`,
    `status: ${inc.status}`,
    `severity: ${inc.severity}`,
  ];
  const map: Record<string, string> = {
    "evidence-summary.svg": svgDocument(`Evidence Summary · ${incidentId}`, base),
    "dispute-letter.svg": svgDocument(`Compliance Record · ${incidentId}`, [
      ...base,
      "Form: compliance / dispute letter shell",
      `Narrative (source incident type): ${inc.type}`,
    ]),
    "insurance-notice.svg": svgDocument(`Insurance Notice · ${incidentId}`, [
      `incidentId: ${incidentId}`,
      "Insurance notice detail: not in BOF source data.",
    ]),
    "claim-packet-cover.svg": svgDocument(`Claim Packet · ${incidentId}`, [
      `incidentId: ${incidentId}`,
      `driverId: ${inc.driverId}`,
      `Linked compliance type: ${inc.type}`,
    ]),
    "damage-report.svg": svgDocument(`Damage Report · ${incidentId}`, [
      `incidentId: ${incidentId}`,
      "Physical damage report: not in BOF source for this incident.",
    ]),
  };
  return map[file] ?? null;
}

export function buildExceptionGeneratedSvg(
  data: BofData,
  marId: string,
  file: string
): string | null {
  const mar = data.moneyAtRisk?.find((m) => m.id === marId);
  if (!mar) return null;
  const map: Record<string, string> = {
    "settlement-hold-explanation.svg": svgDocument(`Exception / Hold · ${marId}`, [
      `moneyAtRiskId: ${mar.id}`,
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
    ]),
    "dispute-letter.svg": svgDocument(`Dispute Letter · ${marId}`, [
      `moneyAtRiskId: ${mar.id}`,
      `category: ${mar.category}`,
      `rootCause (source): ${mar.rootCause}`,
    ]),
    "evidence-summary.svg": svgDocument(`Evidence Summary · ${marId}`, [
      `moneyAtRiskId: ${mar.id}`,
      `loadId: ${mar.loadId ?? "—"}`,
      "Attach load proof stack and driver docs from BOF UI.",
    ]),
  };
  return map[file] ?? null;
}

export function buildSettlementGeneratedSvg(
  data: BofData,
  settlementId: string,
  file: string
): string | null {
  const st = data.settlements?.find((s) => s.settlementId === settlementId);
  if (!st) return null;
  const driver = driverRecord(data, st.driverId);
  const pend = (st.pendingReason ?? "").trim();
  const map: Record<string, string> = {
    "settlement-summary.svg": svgDocument(`Settlement · ${settlementId}`, [
      `settlementId: ${settlementId}`,
      `driverId: ${st.driverId}`,
      `driverName: ${driver?.name ?? st.driverId}`,
      `status: ${st.status}`,
      `exportStatus: ${st.exportStatus}`,
      `grossPay (source): ${st.grossPay}`,
      `netPay (source): ${st.netPay}`,
      `deductions (source): ${st.deductions}`,
      pend ? `pendingReason: ${pend}` : "pendingReason: (empty)",
    ]),
    "settlement-hold-explanation.svg": svgDocument(
      `Settlement Hold · ${settlementId}`,
      pend
        ? [
            `settlementId: ${settlementId}`,
            `driverId: ${st.driverId}`,
            `pendingReason (source): ${pend}`,
          ]
        : [
            `settlementId: ${settlementId}`,
            "No active hold reason in source pendingReason field.",
          ]
    ),
    "insurance-notice.svg": svgDocument(`Payroll / Benefits · ${settlementId}`, [
      `settlementId: ${settlementId}`,
      `insurancePremiums (source): ${st.insurancePremiums}`,
      `hsaFsaHealthDeduction (source): ${st.hsaFsaHealthDeduction}`,
    ]),
  };
  return map[file] ?? null;
}

export const LOAD_GENERATED_FILES = [
  "rate-confirmation.svg",
  "bol.svg",
  "dispatch-instructions.svg",
  "pretrip-checklist.svg",
  "cargo-photo-record.svg",
  "pickup-seal-verification.svg",
  "delivery-seal-verification.svg",
  "pod.svg",
  "invoice.svg",
  "empty-trailer-confirmation.svg",
  "gps-geolocation-summary.svg",
  "weather-traffic-summary.svg",
  "hos-status-summary.svg",
  "camera-status-summary.svg",
  "lumper-receipt.svg",
  "fuel-receipt.svg",
  "maintenance-readiness-report.svg",
  "tire-check-report.svg",
  "rf-pod-verification-report.svg",
  "rf-seal-exception-report.svg",
  "rf-fuel-efficiency-report.svg",
  "rf-maintenance-alert-report.svg",
] as const;

export const DRIVER_GENERATED_FILES = [
  "emergency-contact-sheet.svg",
  "credential-register.svg",
  ...DRIVER_FILE_MAP.map((x) => x.file),
] as const;

export const CLAIM_GENERATED_FILES = [
  "evidence-summary.svg",
  "dispute-letter.svg",
  "insurance-notice.svg",
  "claim-packet-cover.svg",
  "damage-report.svg",
] as const;

export const EXCEPTION_GENERATED_FILES = [
  "settlement-hold-explanation.svg",
  "dispute-letter.svg",
  "evidence-summary.svg",
] as const;

export const SETTLEMENT_GENERATED_FILES = [
  "settlement-summary.svg",
  "settlement-hold-explanation.svg",
  "insurance-notice.svg",
] as const;
