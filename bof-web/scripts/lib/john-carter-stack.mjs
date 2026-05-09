/**
 * Fleet-wide “gold stack” document wiring (John Carter / DRV-001 remains the curated
 * reference: real MCSA-5876 PDF + profile HTML under /documents/drivers/DRV-001/).
 * All drivers use CDL image proofs under /documents/drivers/{id}/cdl.png,
 * insurance card scans under /documents/drivers/{id}/insurance-card.png, and
 * MVR cards under /documents/drivers/{id}/mvr-card.html; other drivers get the
 * same primary/secondary structure with generated HTML under /generated/drivers/{id}/.
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
const mvrCardPath = (driverId) =>
  `/documents/drivers/${driverId}/mvr-card.html`;
const driverApplicationPath = (driverId) =>
  `/documents/drivers/${driverId}/driver-application.html`;
/** Canonical IRS W-9 PDFs under public/documents/drivers (driverId only; no generated w9.html). */
const w9CanonicalPdfPath = (driverId) =>
  `/documents/drivers/${driverId}/w9-${String(driverId).toLowerCase()}.pdf`;
/** Canonical USCIS I-9 PDFs (driverId-keyed). Legacy /generated/.../i9.html is not used when this path is on file. */
const i9CanonicalPdfPath = (driverId) =>
  `/documents/drivers/${driverId}/i9-${String(driverId).toLowerCase()}.pdf`;

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
  // BOF demo document-date rule:
  // - Main-source Excel may not provide medical-card expiration dates for all drivers
  // - Use deterministic demo fallback dates by driver ID to prevent blanket expiration bug
  // - Apply BOF demo rule: expired core documents move to 2027 for demo purposes
  // - Source-provided medical-card dates still take priority when present
  const existingMedicalDoc = documents.find(d => d.driverId === driverId && d.type === "Medical Card");
  let medExp, medIssue;
  
  if (existingMedicalDoc && existingMedicalDoc.expirationDate) {
    // Use main-source Excel data when available, but apply demo rule for expired dates
    const sourceExp = existingMedicalDoc.expirationDate;
    const sourceStatus = docStatusFromExpiry(sourceExp);
    
    if (sourceStatus === "EXPIRED") {
      // BOF demo rule: move expired core documents to 2027
      medExp = "2027-08-22"; // Use established 2027 fallback date
      medIssue = existingMedicalDoc.issueDate || "2024-03-13";
    } else {
      // Keep valid source dates
      medExp = sourceExp;
      medIssue = existingMedicalDoc.issueDate || "2024-03-13";
    }
  } else {
    // Create varied medical card expiration dates as deterministic fallback
    const driverNum = parseInt(String(driverId).replace(/\D/g, ""), 10) || 1;
    const baseYear = 2026;
    const baseMonth = 4 + (driverNum % 6); // Vary months 4-9
    const baseDay = 15 + (driverNum % 10); // Vary days 15-24
    const fallbackExp = `${baseYear}-${String(baseMonth).padStart(2, "0")}-${String(baseDay).padStart(2, "0")}`;
    
    // Apply demo rule to fallback dates as well
    if (docStatusFromExpiry(fallbackExp) === "EXPIRED") {
      medExp = "2027-08-22"; // Move expired fallbacks to 2027
    } else {
      medExp = fallbackExp; // Keep valid fallback dates
    }
    medIssue = "2024-03-13";
  }
  
  // Create specific demo scenarios for better demo purposes
  if (driverId === "DRV-003") {
    // DRV-003: Medical card expiring soon (within 30 days) for demo
    medExp = "2026-06-08"; // ~30 days from current date (May 9, 2026)
  } else if (driverId === "DRV-007") {
    // DRV-007: Medical card expiring soon (within 60 days) for demo
    medExp = "2026-07-08"; // ~60 days from current date
  } else if (driverId === "DRV-011") {
    // DRV-011: Medical card expiring soon (within 90 days) for demo
    medExp = "2026-08-08"; // ~90 days from current date
  }
  
  const genericExp = "2026-12-31";
  const cdlNum = driver?.referenceCdlNumber || placeholderCdlNumber(driverId);

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
      fileUrl: mvrCardPath(driverId),
      previewUrl: mvrCardPath(driverId),
      docTier: "primary",
    },
    "I-9": {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: i9CanonicalPdfPath(driverId),
      previewUrl: i9CanonicalPdfPath(driverId),
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
      fileUrl: w9CanonicalPdfPath(driverId),
      previewUrl: w9CanonicalPdfPath(driverId),
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
      fileUrl: driverApplicationPath(driverId),
      previewUrl: driverApplicationPath(driverId),
      docTier: "secondary",
      demoPlaceholder: false,
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
