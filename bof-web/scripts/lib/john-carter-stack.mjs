/**
 * Fleet-wide “gold stack” document wiring (John Carter / DRV-001 remains the curated
 * reference: real MCSA-5876 PDF + profile HTML under /documents/drivers/DRV-001/).
 * All drivers use CDL image proofs under /documents/drivers/{id}/cdl.png and
 * insurance card scans under /documents/drivers/{id}/insurance-card.png; other
 * drivers get the same primary/secondary structure with generated HTML under
 * /generated/drivers/{id}/.
 */
export const JOHN_CARTER_DRIVER_ID = "DRV-001";
export const JOHN_CARTER_CDL_NUMBER = "OH1668243";

/** Supplemental rows owned by this module (stripped before rebuild). */
export const FLEET_MANAGED_SUPPLEMENTAL_TYPES = [
  "MCSA-5875",
  "Emergency Contact",
  "Driver Application",
  "Safety Acknowledgment",
  "Qualification File",
  "Insurance Card",
  "Incident / Accident Report",
  "BOF Medical Summary",
  "MCSA-5876 (signed PDF)",
  "Driver profile (HTML)",
];

/** @deprecated use FLEET_MANAGED_SUPPLEMENTAL_TYPES */
export const JOHN_CARTER_MANAGED_SUPPLEMENTAL_TYPES = FLEET_MANAGED_SUPPLEMENTAL_TYPES;

const genPath = (driverId, name) => `/generated/drivers/${driverId}/${name}`;
const cdlImagePath = (driverId) => `/documents/drivers/${driverId}/cdl.png`;
const insuranceCardPath = (driverId) =>
  `/documents/drivers/${driverId}/insurance-card.png`;

function stripManagedFleetSupplementals(documents) {
  const drop = new Set(FLEET_MANAGED_SUPPLEMENTAL_TYPES);
  return documents.filter(
    (d) => !(d.driverId && d.type && drop.has(String(d.type)))
  );
}

function placeholderCdlNumber(driverId) {
  const m = /^DRV-(\d+)$/i.exec(driverId);
  const n = m ? parseInt(m[1], 10) : 1;
  return `DLN-${String(n).padStart(5, "0")}`;
}

function docStatusFromExpiry(iso) {
  if (!iso || !String(iso).trim()) return "VALID";
  const exp = new Date(`${String(iso).trim()}T12:00:00`);
  if (Number.isNaN(exp.getTime())) return "VALID";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return exp < today ? "EXPIRED" : "VALID";
}

function cdlNumberFor(driverId, ex, driver) {
  if (driverId === JOHN_CARTER_DRIVER_ID) return JOHN_CARTER_CDL_NUMBER;
  const fromEx = String(ex?.cdlNumber ?? "").trim();
  if (fromEx) return fromEx;
  const fromDriver = String(driver?.referenceCdlNumber ?? "").trim();
  if (fromDriver) return fromDriver;
  return placeholderCdlNumber(driverId);
}

function patchCoreSevenForDriver(documents, driverId, ex, driver) {
  const medExp = ex.medicalExpirationDate || "2026-09-07";
  const medIssue = ex.medicalIssueDate || "2024-03-13";
  const genericExp = "2026-12-31";
  const cdlNum = cdlNumberFor(driverId, ex, driver);

  const patchByType = {
    CDL: {
      status: "VALID",
      expirationDate: "2027-08-22",
      issueDate: "2022-08-26",
      cdlNumber: cdlNum,
      licenseClass: "Class A",
      cdlIssueDate: "2022-08-26",
      cdlExpiration: "2027-08-22",
      cdlEndorsements: "T, N",
      cdlRestrictions: "None",
      fileUrl: cdlImagePath(driverId),
      previewUrl: cdlImagePath(driverId),
      docTier: "primary",
      sourceLicenseNumber: cdlNum,
    },
    "Medical Card": {
      status: docStatusFromExpiry(medExp),
      expirationDate: medExp,
      issueDate: medIssue,
      fileUrl: genPath(driverId, "medical-card.html"),
      previewUrl: genPath(driverId, "medical-card.html"),
      docTier: "primary",
    },
    MVR: {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: genPath(driverId, "mvr.html"),
      previewUrl: genPath(driverId, "mvr.html"),
      docTier: "primary",
    },
    "I-9": {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: genPath(driverId, "i9.html"),
      previewUrl: genPath(driverId, "i9.html"),
      docTier: "primary",
    },
    FMCSA: {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: genPath(driverId, "fmcsa.html"),
      previewUrl: genPath(driverId, "fmcsa.html"),
      docTier: "primary",
    },
    "W-9": {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: genPath(driverId, "w9.html"),
      previewUrl: genPath(driverId, "w9.html"),
      docTier: "primary",
    },
    "Bank Info": {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: genPath(driverId, "bank-info.html"),
      previewUrl: genPath(driverId, "bank-info.html"),
      docTier: "primary",
    },
  };

  return documents.map((d) => {
    if (d.driverId !== driverId) return d;
    const p = patchByType[d.type];
    if (!p) return d;
    return { ...d, ...p };
  });
}

function incidentDocStatus(countStr) {
  const n = parseInt(String(countStr ?? "0").trim(), 10) || 0;
  if (n === 0) return "VALID";
  return "AT RISK";
}

function bofSummaryStatus(s) {
  const u = String(s ?? "").toLowerCase();
  if (u.includes("reviewed") || u.includes("complete")) return "VALID";
  if (u.includes("pending")) return "PENDING REVIEW";
  return "VALID";
}

function buildManagedSupplementalRows(driverId, ex, driver) {
  const medExp = ex.medicalExpirationDate || "2026-09-07";
  const genericExp = "2026-12-31";

  const mcsa5876 =
    driverId === JOHN_CARTER_DRIVER_ID
      ? {
          driverId,
          type: "MCSA-5876 (signed PDF)",
          status: "VALID",
          expirationDate: medExp,
          fileUrl: "/documents/drivers/DRV-001/john-carter-mcsa-5876-signed.pdf",
          previewUrl: "/documents/drivers/DRV-001/john-carter-mcsa-5876-signed.pdf",
          docTier: "secondary",
          demoPlaceholder: false,
        }
      : {
          driverId,
          type: "MCSA-5876 (signed PDF)",
          status: "VALID",
          expirationDate: medExp,
          fileUrl: genPath(driverId, "mcsa-5876-signed.html"),
          previewUrl: genPath(driverId, "mcsa-5876-signed.html"),
          docTier: "secondary",
          demoPlaceholder: true,
        };

  const profile =
    driverId === JOHN_CARTER_DRIVER_ID
      ? {
          driverId,
          type: "Driver profile (HTML)",
          status: "VALID",
          expirationDate: genericExp,
          fileUrl: "/documents/drivers/DRV-001/john-carter-profile-dashboard.html",
          previewUrl: "/documents/drivers/DRV-001/john-carter-profile-dashboard.html",
          docTier: "secondary",
          demoPlaceholder: false,
        }
      : {
          driverId,
          type: "Driver profile (HTML)",
          status: "VALID",
          expirationDate: genericExp,
          fileUrl: genPath(driverId, "driver-profile.html"),
          previewUrl: genPath(driverId, "driver-profile.html"),
          docTier: "secondary",
          demoPlaceholder: true,
        };

  const rows = [
    {
      driverId,
      type: "MCSA-5875",
      status: "VALID",
      expirationDate: medExp,
      fileUrl: genPath(driverId, "mcsa-5875.html"),
      previewUrl: genPath(driverId, "mcsa-5875.html"),
      docTier: "primary",
      demoPlaceholder: true,
    },
    {
      driverId,
      type: "Emergency Contact",
      status: "VALID",
      fileUrl: genPath(driverId, "emergency-contact.html"),
      previewUrl: genPath(driverId, "emergency-contact.html"),
      docTier: "primary",
      demoPlaceholder: true,
    },
    {
      driverId,
      type: "Driver Application",
      status: /complete/i.test(String(ex.appStatus ?? "")) ? "VALID" : "PENDING REVIEW",
      expirationDate: ex.appSubmissionDate || "",
      fileUrl: genPath(driverId, "driver-application.html"),
      previewUrl: genPath(driverId, "driver-application.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    {
      driverId,
      type: "Safety Acknowledgment",
      status: /ack/i.test(String(ex.safetyAckStatus ?? "")) ? "VALID" : "PENDING REVIEW",
      expirationDate: ex.safetyAckDate || "",
      fileUrl: genPath(driverId, "safety-acknowledgment.html"),
      previewUrl: genPath(driverId, "safety-acknowledgment.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    {
      driverId,
      type: "Qualification File",
      status: /current/i.test(String(ex.qualFileStatus ?? "")) ? "VALID" : "PENDING REVIEW",
      expirationDate: "",
      fileUrl: genPath(driverId, "qualification-file.html"),
      previewUrl: genPath(driverId, "qualification-file.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    {
      driverId,
      type: "Insurance Card",
      status: "VALID",
      expirationDate: "",
      fileUrl: insuranceCardPath(driverId),
      previewUrl: insuranceCardPath(driverId),
      docTier: "secondary",
      demoPlaceholder: false,
    },
    {
      driverId,
      type: "Incident / Accident Report",
      status: incidentDocStatus(ex.incidentReportCount),
      expirationDate: ex.lastIncidentDate || "",
      fileUrl: genPath(driverId, "incident-report.html"),
      previewUrl: genPath(driverId, "incident-report.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    {
      driverId,
      type: "BOF Medical Summary",
      status: bofSummaryStatus(ex.bofMedicalSummaryStatus),
      expirationDate: "",
      fileUrl: genPath(driverId, "bof-medical-summary.html"),
      previewUrl: genPath(driverId, "bof-medical-summary.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    mcsa5876,
    profile,
  ];

  return rows.filter((r) => FLEET_MANAGED_SUPPLEMENTAL_TYPES.includes(r.type));
}

/**
 * When a spreadsheet row keys John Carter by CDL number (OH1668243) instead of DRV-001.
 * @param {Record<string, unknown>} rowObj
 * @param {(s: string) => string} normHeader same normalizer as build-demo-data
 */
export function resolveDriverIdFromCdlColumn(rowObj, normHeader, validIds) {
  if (!validIds.has(JOHN_CARTER_DRIVER_ID)) return null;
  const want = JOHN_CARTER_CDL_NUMBER.toUpperCase().replace(/[^A-Z0-9]/g, "");
  for (const k of Object.keys(rowObj)) {
    const nkC = normHeader(k).replace(/[\s_-]+/g, "");
    const isCdlCol =
      nkC === "cdlnumber" ||
      nkC === "commercialdriverslicensenumber" ||
      nkC === "cdlno" ||
      (nkC.includes("cdl") && nkC.includes("number"));
    if (!isCdlCol) continue;
    const t = String(rowObj[k] ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (t === want) return JOHN_CARTER_DRIVER_ID;
  }
  return null;
}

export function patchDriversForJohnCarter(drivers) {
  return drivers.map((d) => {
    if (d.id !== JOHN_CARTER_DRIVER_ID) return d;
    return {
      ...d,
      emergencyContactName: "Jane Carter",
      emergencyContactRelationship: "Spouse",
      emergencyContactPhone: "216-555-0198",
      referenceCdlNumber: JOHN_CARTER_CDL_NUMBER,
    };
  });
}

/**
 * Demo emergency + CDL display id for non-reference drivers (spreadsheet expanded
 * row wins for referenceCdlNumber when CDL_Number is populated).
 */
export function augmentDriversWithFleetDemoFields(drivers, driverMedicalExpanded) {
  return drivers.map((d) => {
    if (d.id === JOHN_CARTER_DRIVER_ID) return d;
    const ex = driverMedicalExpanded?.[d.id] ?? {};
    const ref =
      String(ex.cdlNumber ?? "").trim() ||
      String(d.referenceCdlNumber ?? "").trim() ||
      placeholderCdlNumber(d.id);
    const first = String(d.name ?? "Driver").trim().split(/\s+/)[0] || "Driver";
    const n = parseInt(String(d.id).replace(/\D/g, ""), 10) || 1;
    return {
      ...d,
      referenceCdlNumber: ref,
      emergencyContactName: `${first} — emergency contact (demo)`,
      emergencyContactRelationship: "Family",
      emergencyContactPhone: `555-01${String(n).padStart(2, "0")}`,
    };
  });
}

/**
 * @param {object[]} documents
 * @param {object[]} drivers
 * @param {Record<string, object>} driverMedicalExpanded
 */
export function applyFleetGoldStack(documents, drivers, driverMedicalExpanded) {
  let out = stripManagedFleetSupplementals(documents);
  const byId = new Map(drivers.map((d) => [d.id, d]));
  for (const d of drivers) {
    const ex = driverMedicalExpanded?.[d.id] ?? {};
    out = patchCoreSevenForDriver(out, d.id, ex, byId.get(d.id));
    out = [...out, ...buildManagedSupplementalRows(d.id, ex, byId.get(d.id))];
  }
  return out;
}
