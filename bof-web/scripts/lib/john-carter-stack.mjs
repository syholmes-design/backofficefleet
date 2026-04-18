/**
 * John Carter (DRV-001) gold-standard demo stack only.
 * CDL OH1668243 ↔ DRV-001 mapping for spreadsheet identity; app routes stay on DRV-001.
 */
export const JOHN_CARTER_DRIVER_ID = "DRV-001";
export const JOHN_CARTER_CDL_NUMBER = "OH1668243";

/** Supplemental rows fully defined here (avoid duplicates from prev merge). */
export const JOHN_CARTER_MANAGED_SUPPLEMENTAL_TYPES = [
  "MCSA-5875",
  "Emergency Contact",
  "Driver Application",
  "Safety Acknowledgment",
  "Qualification File",
  "Incident / Accident Report",
  "BOF Medical Summary",
  "MCSA-5876 (signed PDF)",
  "Driver profile (HTML)",
];

const GEN = (name) => `/generated/drivers/${JOHN_CARTER_DRIVER_ID}/${name}`;

function stripManagedJohnCarterSupplementals(documents) {
  const drop = new Set(JOHN_CARTER_MANAGED_SUPPLEMENTAL_TYPES);
  return documents.filter(
    (d) =>
      !(
        d.driverId === JOHN_CARTER_DRIVER_ID &&
        d.type &&
        drop.has(String(d.type))
      )
  );
}

function docStatusFromExpiry(iso) {
  if (!iso || !String(iso).trim()) return "VALID";
  const exp = new Date(`${String(iso).trim()}T12:00:00`);
  if (Number.isNaN(exp.getTime())) return "VALID";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return exp < today ? "EXPIRED" : "VALID";
}

function patchCoreSeven(documents, expanded) {
  const ex = expanded?.[JOHN_CARTER_DRIVER_ID] ?? {};
  const medExp = ex.medicalExpirationDate || "2026-09-07";
  const medIssue = ex.medicalIssueDate || "2024-03-13";
  const genericExp = "2026-12-31";

  const patchByType = {
    CDL: {
      status: "VALID",
      expirationDate: "2027-08-22",
      issueDate: "2022-08-26",
      cdlNumber: JOHN_CARTER_CDL_NUMBER,
      licenseClass: "Class A",
      cdlIssueDate: "2022-08-26",
      cdlExpiration: "2027-08-22",
      cdlEndorsements: "T, N",
      cdlRestrictions: "None",
      fileUrl: GEN("cdl.html"),
      previewUrl: GEN("cdl.html"),
      docTier: "primary",
      sourceLicenseNumber: JOHN_CARTER_CDL_NUMBER,
    },
    "Medical Card": {
      status: docStatusFromExpiry(medExp),
      expirationDate: medExp,
      issueDate: medIssue,
      fileUrl: GEN("medical-card.html"),
      previewUrl: GEN("medical-card.html"),
      docTier: "primary",
    },
    MVR: {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: GEN("mvr.html"),
      previewUrl: GEN("mvr.html"),
      docTier: "primary",
    },
    "I-9": {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: GEN("i9.html"),
      previewUrl: GEN("i9.html"),
      docTier: "primary",
    },
    FMCSA: {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: GEN("fmcsa.html"),
      previewUrl: GEN("fmcsa.html"),
      docTier: "primary",
    },
    "W-9": {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: GEN("w9.html"),
      previewUrl: GEN("w9.html"),
      docTier: "primary",
    },
    "Bank Info": {
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: GEN("bank-info.html"),
      previewUrl: GEN("bank-info.html"),
      docTier: "primary",
    },
  };

  return documents.map((d) => {
    if (d.driverId !== JOHN_CARTER_DRIVER_ID) return d;
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

function buildManagedSupplementalRows(expanded) {
  const ex = expanded?.[JOHN_CARTER_DRIVER_ID] ?? {};
  const medExp = ex.medicalExpirationDate || "2026-09-07";
  const genericExp = "2026-12-31";
  const id = JOHN_CARTER_DRIVER_ID;

  const rows = [
    {
      driverId: id,
      type: "MCSA-5875",
      status: "VALID",
      expirationDate: medExp,
      fileUrl: GEN("mcsa-5875.html"),
      previewUrl: GEN("mcsa-5875.html"),
      docTier: "primary",
      demoPlaceholder: true,
    },
    {
      driverId: id,
      type: "Emergency Contact",
      status: "VALID",
      fileUrl: GEN("emergency-contact.html"),
      previewUrl: GEN("emergency-contact.html"),
      docTier: "primary",
      demoPlaceholder: true,
    },
    {
      driverId: id,
      type: "Driver Application",
      status: /complete/i.test(String(ex.appStatus ?? "")) ? "VALID" : "PENDING REVIEW",
      expirationDate: ex.appSubmissionDate || "",
      fileUrl: GEN("driver-application.html"),
      previewUrl: GEN("driver-application.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    {
      driverId: id,
      type: "Safety Acknowledgment",
      status: /ack/i.test(String(ex.safetyAckStatus ?? "")) ? "VALID" : "PENDING REVIEW",
      expirationDate: ex.safetyAckDate || "",
      fileUrl: GEN("safety-acknowledgment.html"),
      previewUrl: GEN("safety-acknowledgment.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    {
      driverId: id,
      type: "Qualification File",
      status: /current/i.test(String(ex.qualFileStatus ?? "")) ? "VALID" : "PENDING REVIEW",
      expirationDate: "",
      fileUrl: GEN("qualification-file.html"),
      previewUrl: GEN("qualification-file.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    {
      driverId: id,
      type: "Incident / Accident Report",
      status: incidentDocStatus(ex.incidentReportCount),
      expirationDate: ex.lastIncidentDate || "",
      fileUrl: GEN("incident-report.html"),
      previewUrl: GEN("incident-report.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    {
      driverId: id,
      type: "BOF Medical Summary",
      status: bofSummaryStatus(ex.bofMedicalSummaryStatus),
      expirationDate: "",
      fileUrl: GEN("bof-medical-summary.html"),
      previewUrl: GEN("bof-medical-summary.html"),
      docTier: "secondary",
      demoPlaceholder: true,
    },
    {
      driverId: id,
      type: "MCSA-5876 (signed PDF)",
      status: "VALID",
      expirationDate: medExp,
      fileUrl: "/documents/drivers/DRV-001/john-carter-mcsa-5876-signed.pdf",
      previewUrl: "/documents/drivers/DRV-001/john-carter-mcsa-5876-signed.pdf",
      docTier: "secondary",
      demoPlaceholder: false,
    },
    {
      driverId: id,
      type: "Driver profile (HTML)",
      status: "VALID",
      expirationDate: genericExp,
      fileUrl: "/documents/drivers/DRV-001/john-carter-profile-dashboard.html",
      previewUrl: "/documents/drivers/DRV-001/john-carter-profile-dashboard.html",
      docTier: "secondary",
      demoPlaceholder: false,
    },
  ];

  return rows.filter((r) => JOHN_CARTER_MANAGED_SUPPLEMENTAL_TYPES.includes(r.type));
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
 * @param {object[]} documents
 * @param {Record<string, object>} driverMedicalExpanded
 */
export function applyJohnCarterGoldStack(documents, driverMedicalExpanded) {
  let out = stripManagedJohnCarterSupplementals(documents);
  out = patchCoreSeven(out, driverMedicalExpanded);
  const extra = buildManagedSupplementalRows(driverMedicalExpanded);
  return [...out, ...extra];
}
