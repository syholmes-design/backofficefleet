/**
 * Generates BOF demo FMCSA DQF Compliance Summary HTML per driver (DRV-001–DRV-012).
 * Run: npx tsx scripts/generate-driver-dqf-summaries.ts
 * (Also invoked via scripts/generate-driver-dqf-summaries.mjs.)
 *
 * Credential statuses and dates come only from canonical BOF helpers keyed by driverId.
 * No wall-clock timestamps or nondeterministic RNG — synthetic reviewer fields use deterministic helpers only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BofData } from "../lib/load-bof-data";
import { getBofData } from "../lib/load-bof-data";
import {
  getDriverById,
  getOrderedDocumentsForDriver,
  getSecondaryStackDocumentsOrdered,
  getDriverMedicalExpanded,
  type DocumentRow,
} from "../lib/driver-queries";
import { getDriverDispatchEligibility } from "../lib/driver-dispatch-eligibility";
import { getSafetyScorecardRows, getSafetyViolationActions } from "../lib/safety-scorecard";
import { getCanonicalDriverDocuments } from "../lib/driver-credential-status";
import { getDriverMedicalCardStatus, describeCredentialExpiration } from "../lib/driver-doc-registry";
import {
  getDqfReviewerForDriver,
  getDqfDeterministicTimestamp,
  getDqfSyntheticReviewNotes,
} from "./lib/dqf-demo-synthetic-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMPLATE_PATH = path.join(
  ROOT,
  "scripts/templates/driver-docs/dqf-compliance-summary.template.html"
);
const MANIFEST_LIB = path.join(ROOT, "lib/generated/driver-doc-manifest.json");
const MANIFEST_PUBLIC = path.join(ROOT, "public/generated/drivers/driver-doc-manifest.json");
const INDEX_PATH = path.join(ROOT, "lib/generated/driver-public-doc-index.json");

const DRIVER_IDS = Array.from({ length: 12 }, (_, i) => `DRV-${String(i + 1).padStart(3, "0")}`);

const SYNTHETIC_FIELD_LIST =
  "reviewerName, reviewerTitle, reviewerSignatureText, reviewerSignedAt, reviewDate, reviewNotes, carrierDisplay, driverAcknowledgmentStatus, driverSignatureTextOrPending, driverAckSignedAt, driverAckLabel, annualMvrNotes, syntheticDemoFieldsNote";

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pillClass(status: string) {
  const u = status.toUpperCase().replace(/\s+/g, "_");
  if (u === "VALID" || u === "SUMMARY" || u === "COMPLETE") return "pill-ok";
  if (u === "EXPIRED" || u === "MISSING") return "pill-bad";
  return "pill-warn";
}

function docByType(
  rows: ReturnType<typeof getOrderedDocumentsForDriver>,
  type: string
) {
  return rows.find((r) => r.type === type);
}

function parseHomeState(address?: string): { display: string; source: string } {
  const m = /\b([A-Z]{2})\s+(\d{5})(-\d{4})?\s*$/i.exec(String(address ?? "").trim());
  if (m) return { display: m[1].toUpperCase(), source: "derived" };
  return { display: "—", source: "missing" };
}

function loadProofLine(data: BofData, driverId: string): { value: string; source: string } {
  const loads = data.loads.filter((l) => l.driverId === driverId).slice(0, 3);
  if (loads.length === 0) {
    return { value: "No demo loads for this driverId.", source: "canonical" };
  }
  const parts = loads.map(
    (l) =>
      `${l.id} POD=${String(l.podStatus ?? "—")} seals=${String(l.sealStatus ?? "—")} status=${String(l.status ?? "—")}`
  );
  return { value: parts.join(" · "), source: "canonical" };
}

function replaceAll(template: string, map: Record<string, string>) {
  let out = template;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

function buildDocumentRows(args: {
  driverApp?: DocumentRow;
  core: ReturnType<typeof getOrderedDocumentsForDriver>;
  canonical: ReturnType<typeof getCanonicalDriverDocuments>;
  medicalCanon: ReturnType<typeof getDriverMedicalCardStatus>;
  annualMvrNotes: string;
  reviewNotes: string;
}) {
  const { driverApp, core, canonical, medicalCanon, annualMvrNotes, reviewNotes } = args;
  const rows: string[] = [];

  const pushRow = (
    label: string,
    status: string,
    exp: string,
    fileMeta: string,
    notes: string
  ) => {
    rows.push(
      `<tr><td>${esc(label)}</td><td><span class="status-pill ${pillClass(status)}">${esc(status)}</span></td><td>${esc(exp)}</td><td>${esc(fileMeta)}</td><td>${esc(notes)}</td></tr>`
    );
  };

  const appStatus = driverApp?.status ?? "MISSING";
  const appExp = driverApp?.expirationDate?.trim() || "—";
  const appFile = driverApp?.fileUrl || driverApp?.previewUrl ? "canonical" : "missing";
  const appFileLabel =
    appFile === "canonical" ? "On file — BOF documents[] row" : "Missing / needs review";
  pushRow("Driver Application", appStatus, appExp, appFileLabel, reviewNotes.slice(0, 120));

  for (const label of [
    ["CDL / road test equivalent", "CDL"],
    ["Medical Examiner’s Certificate", "Medical Card"],
    ["MVR", "MVR"],
  ] as const) {
    const d = docByType(core, label[1]);
    const st = label[1] === "Medical Card" ? medicalCanon.rowStatus : d?.status ?? "MISSING";
    const exp =
      label[1] === "Medical Card"
        ? medicalCanon.expirationDate?.trim() ||
          describeCredentialExpiration(medicalCanon.expirationDate)
        : d?.expirationDate?.trim() || describeCredentialExpiration(d?.expirationDate);
    const has =
      label[1] === "Medical Card"
        ? Boolean(medicalCanon.fileUrl || d?.fileUrl || d?.previewUrl)
        : Boolean(d?.fileUrl || d?.previewUrl);
    pushRow(
      label[0],
      st,
      exp,
      has ? "canonical — indexed vault" : "missing",
      label[1] === "CDL" ? "Status from canonical CDL row + expiration." : ""
    );
  }

  const mvr = docByType(core, "MVR");
  const mvrExp = mvr?.expirationDate?.trim() || "—";
  pushRow(
    "Annual MVR / annual review",
    mvr ? (mvr.status ?? "MISSING") : "MISSING",
    mvrExp,
    mvr?.fileUrl || mvr?.previewUrl ? "derived — tied to MVR pull" : "missing",
    annualMvrNotes
  );

  for (const [label, type] of [
    ["FMCSA compliance (source record)", "FMCSA"],
    ["I-9", "I-9"],
    ["W-9", "W-9"],
    ["Bank information", "Bank Info"],
  ] as const) {
    const d = docByType(core, type);
    const st = d?.status ?? "MISSING";
    const exp = d?.expirationDate?.trim() || "—";
    const has = Boolean(d?.fileUrl || d?.previewUrl);
    pushRow(label, st, exp, has ? "canonical — indexed vault" : "missing", "");
  }

  const ec = canonical.find((c) => c.type === "Emergency Contact") as
    | { status?: string; expirationDate?: string; fileUrl?: string | null }
    | undefined;
  const ecExp = ec?.expirationDate?.trim() || "—";
  pushRow(
    "Emergency contact",
    ec?.status ?? "MISSING",
    ecExp,
    ec?.fileUrl ? "canonical — indexed vault" : "missing",
    ""
  );

  const ic = canonical.find((c) => c.type === "Insurance Card");
  pushRow(
    "Insurance card",
    ic?.status ?? "MISSING",
    ic?.expirationDate?.trim() || "—",
    ic?.fileUrl ? "canonical — indexed vault" : "missing",
    ""
  );

  return rows.join("\n");
}

function buildChecklistRows(args: {
  driverApp?: DocumentRow;
  core: ReturnType<typeof getOrderedDocumentsForDriver>;
  medicalCanon: ReturnType<typeof getDriverMedicalCardStatus>;
  eligibility: ReturnType<typeof getDriverDispatchEligibility>;
  violationOpen: boolean;
}) {
  const { driverApp, core, medicalCanon, eligibility, violationOpen } = args;
  const cdl = docByType(core, "CDL");
  const mvr = docByType(core, "MVR");
  const fmcsa = docByType(core, "FMCSA");
  const rows: string[] = [];
  const push = (item: string, ok: boolean, notes: string) => {
    const state = ok ? "Complete" : "Needs review";
    rows.push(`<tr><td>${esc(item)}</td><td>${esc(state)}</td><td>${esc(notes)}</td></tr>`);
  };

  push("Application on file", Boolean(driverApp?.fileUrl || driverApp?.previewUrl), "documents[] Driver Application");
  push(
    "Initial MVR / licensing inquiry",
    Boolean(mvr?.fileUrl || mvr?.previewUrl),
    "MVR row + vault path"
  );
  push(
    "Medical certification",
    medicalCanon.rowStatus !== "MISSING" && medicalCanon.rowStatus !== "EXPIRED",
    medicalCanon.reason
  );
  push(
    "CDL / road test equivalent",
    String(cdl?.status ?? "").toUpperCase() === "VALID",
    "Canonical CDL status"
  );
  push(
    "Annual MVR",
    Boolean(mvr?.expirationDate) || Boolean(mvr?.fileUrl),
    mvr?.expirationDate ? `MVR expiration / review: ${mvr.expirationDate}` : "Align annual pull with MVR on file"
  );
  push(
    "Annual review",
    eligibility.status !== "blocked",
    "Dispatch eligibility gate (no hard blockers)"
  );
  push(
    "Violation certification",
    !violationOpen,
    violationOpen ? "Open safety violation follow-ups" : "No high-severity open violations in scorecard feed"
  );
  push(
    "Medical variance / SPE",
    false,
    "Not present in BOF driverMedicalExpanded for this demo slice"
  );
  push(
    "Safety / incident review",
    eligibility.hardBlockers.every((h) => !/Safety hard gate/i.test(h)),
    "See safety section"
  );

  return rows.join("\n");
}

function buildSafetyRows(
  driverId: string,
  eligibility: ReturnType<typeof getDriverDispatchEligibility>,
  loadProof: { value: string; source: string }
) {
  const row = getSafetyScorecardRows().find((r) => r.driverId === driverId);
  const violations = getSafetyViolationActions().filter((v) => v.driverId === driverId);
  const openV = violations.filter((v) => v.severity === "High").length;
  const lines: string[] = [];
  const push = (topic: string, value: string, source: string) => {
    lines.push(
      `<tr><td>${esc(topic)}</td><td>${esc(value)}</td><td>${esc(source)}</td></tr>`
    );
  };
  push(
    "Safety tier",
    row?.performanceTier ?? "—",
    row ? "canonical" : "missing"
  );
  push(
    "Open safety events (high severity count)",
    String(openV),
    "canonical"
  );
  push(
    "HOS / OOS snapshot",
    row
      ? `HOS ${row.hosCompliancePct}% · OOS violations ${row.oosViolations}`
      : "—",
    row ? "canonical" : "missing"
  );
  push("Recent load POD / seal snapshot (demo)", loadProof.value, loadProof.source);
  push("Dispatch hard gates (safety-related)", eligibility.hardBlockers.join("; ") || "None", "derived");
  return lines.join("\n");
}

function main() {
  const data = getBofData();
  const templateRaw = fs.readFileSync(TEMPLATE_PATH, "utf8");

  const manifestLib = JSON.parse(fs.readFileSync(MANIFEST_LIB, "utf8")) as Record<
    string,
    Record<string, string>
  >;
  const manifestPublic = JSON.parse(fs.readFileSync(MANIFEST_PUBLIC, "utf8")) as Record<
    string,
    Record<string, string>
  >;

  for (const driverId of DRIVER_IDS) {
    const driver = getDriverById(data, driverId);
    if (!driver) {
      console.error(`generate-driver-dqf-summaries: missing driver ${driverId}`);
      process.exitCode = 1;
      continue;
    }

    const core = getOrderedDocumentsForDriver(data, driverId);
    const secondary = getSecondaryStackDocumentsOrdered(data, driverId);
    const driverApp = secondary.find((d) => d.type === "Driver Application");
    const canonical = getCanonicalDriverDocuments(data, driverId);
    const eligibility = getDriverDispatchEligibility(data, driverId);
    const medicalCanon = getDriverMedicalCardStatus(data, driverId);
    const medExp = getDriverMedicalExpanded(data, driverId);
    const cdlRow = docByType(core, "CDL");
    const violations = getSafetyViolationActions().filter((v) => v.driverId === driverId);
    const violationOpen = violations.some((v) => v.severity === "High");

    const reviewer = getDqfReviewerForDriver(driverId);
    const reviewSignedAt = getDqfDeterministicTimestamp(driverId, 0);
    const reviewDate = reviewSignedAt;
    const driverAckAt = getDqfDeterministicTimestamp(driverId, 2);
    const reviewNotes = getDqfSyntheticReviewNotes(driverId, eligibility.status);

    const carrierDisplay = "BackOffice Fleet — BOF demo carrier (synthetic display name)";
    const mvrForAnnual = docByType(core, "MVR");
    const annualMvrNotes = mvrRowHasPull(mvrForAnnual)
      ? "Annual cadence: align next review with MVR pull date on file (synthetic_demo checklist note)."
      : "Missing / Needs review — MVR not established for annual cycle.";

    const cdlNum =
      (medExp?.cdlNumber?.trim() ||
        medExp?.driverLicenseNumber?.trim() ||
        (driver as { referenceCdlNumber?: string }).referenceCdlNumber?.trim() ||
        cdlRow?.cdlNumber?.trim() ||
        cdlRow?.sourceLicenseNumber?.trim() ||
        "") || "—";
    const cdlNumSource =
      medExp?.cdlNumber?.trim() || medExp?.driverLicenseNumber?.trim()
        ? "canonical"
        : (driver as { referenceCdlNumber?: string }).referenceCdlNumber
          ? "canonical"
          : cdlRow?.cdlNumber || cdlRow?.sourceLicenseNumber
            ? "canonical"
            : "missing";

    const cdlClassDisplay = cdlRow?.licenseClass?.trim() || "—";
    const cdlClassSource = cdlRow?.licenseClass?.trim() ? "canonical" : "missing";

    const home = parseHomeState(driver.address);
    const homeBaseDisplay =
      medExp?.driverLicenseState?.trim() || home.display !== "—"
        ? medExp?.driverLicenseState?.trim() || home.display
        : "—";
    const homeBaseSource = medExp?.driverLicenseState?.trim()
      ? "canonical"
      : home.source;

    const loadProof = loadProofLine(data, driverId);

    const expiredCore =
      ["CDL", "MVR", "FMCSA"].some((t) => {
        const d = docByType(core, t);
        return String(d?.status ?? "").toUpperCase() === "EXPIRED";
      }) || medicalCanon.rowStatus === "EXPIRED";
    const missingCore =
      ["CDL", "MVR", "FMCSA"].some((t) => {
        const d = docByType(core, t);
        return String(d?.status ?? "").toUpperCase() === "MISSING";
      }) || medicalCanon.rowStatus === "MISSING";

    let dqfStatus: string;
    if (eligibility.status === "blocked") {
      dqfStatus = "DQF incomplete — dispatch blocked until hard gates clear";
    } else if (missingCore || expiredCore) {
      dqfStatus = "DQF requires credential remediation (missing or expired core item)";
    } else if (eligibility.status === "needs_review") {
      dqfStatus = "DQF substantively complete — follow-up required (soft warnings)";
    } else {
      dqfStatus = "DQF complete relative to BOF demo credential stack";
    }

    const determinationSummary =
      eligibility.status === "blocked"
        ? "Blocked: resolve hard dispatch gates before treating the qualification file as dispatch-ready."
        : expiredCore
          ? "Expired credential present — renewal required before dispatch."
          : missingCore
            ? "Missing required DQF item — upload or generate canonical vault record."
            : eligibility.status === "needs_review"
              ? "File usable with documented follow-ups per soft warnings."
              : "No blocking DQF gaps detected in BOF canonical data for this driverId.";

    const chk = (on: boolean) => (on ? "☑" : "☐");
    const fileComplete = !missingCore && !expiredCore && eligibility.status === "ready";
    const determinationFileComplete = `${chk(fileComplete)} File complete (demo criteria)`;
    const determinationFollowUp = `${chk(eligibility.status === "needs_review" && !missingCore && !expiredCore)} File complete with follow-up required`;
    const determinationMissing = `${chk(missingCore)} Missing required document`;
    const determinationExpired = `${chk(expiredCore)} Expired credential`;
    const determinationDispatch = `${chk(eligibility.status === "blocked")} Not dispatch eligible pending correction`;

    const htmlBody = replaceAll(templateRaw, {
      driverName: esc(driver.name),
      driverId: esc(driverId),
      reviewDate: esc(reviewDate),
      reviewerName: esc(reviewer.name),
      reviewerTitle: esc(reviewer.title),
      reviewerSignatureText: esc(reviewer.name),
      reviewerSignedAt: esc(reviewSignedAt),
      driverAcknowledgmentStatus: esc(
        "Pending — driver acknowledgment not stored in BOF demo JSON (synthetic_demo)."
      ),
      driverSignatureTextOrPending: esc("— Pending —"),
      driverAckSignedAt: esc(driverAckAt),
      driverAckLabel: esc("Awaiting driver sign-off (demo)"),
      dqfStatus: esc(dqfStatus),
      dispatchEligibility: esc(eligibility.label),
      hardBlockers: esc(eligibility.hardBlockers.join("; ") || "None"),
      softWarnings: esc(eligibility.softWarnings.join("; ") || "None"),
      recommendedAction: esc(
        eligibility.recommendedAction
          ? `${eligibility.recommendedAction.label} (${eligibility.recommendedAction.href})`
          : "None — monitor soft warnings"
      ),
      carrierDisplay: esc(carrierDisplay),
      cdlNumberDisplay: esc(cdlNum),
      cdlNumberSource: esc(cdlNumSource),
      cdlClassDisplay: esc(cdlClassDisplay),
      cdlClassSource: esc(cdlClassSource),
      homeBaseDisplay: esc(homeBaseDisplay),
      homeBaseSource: esc(homeBaseSource),
      documentRows: buildDocumentRows({
        driverApp,
        core,
        canonical,
        medicalCanon,
        annualMvrNotes,
        reviewNotes,
      }),
      checklistRows: buildChecklistRows({
        driverApp,
        core,
        medicalCanon,
        eligibility,
        violationOpen,
      }),
      safetyRows: buildSafetyRows(driverId, eligibility, loadProof),
      determinationSummary: esc(determinationSummary),
      determinationFileComplete,
      determinationFollowUp,
      determinationMissing,
      determinationExpired,
      determinationDispatch,
      syntheticDemoFieldsNote: esc(
        `Synthetic/demo fields used: ${SYNTHETIC_FIELD_LIST}. Credential columns use canonical | derived | missing flags only.`
      ),
    });

    const provenance = `<!-- BOF_TEMPLATE_SOURCE: scripts/templates/driver-docs/dqf-compliance-summary.template.html -->
<!-- BOF_DOCUMENT_TYPE: dqf_compliance_summary -->
<!-- BOF_DRIVER_ID: ${driverId} -->
<!-- BOF_SYNTHETIC_DEMO_FIELDS: ${SYNTHETIC_FIELD_LIST} -->
`;

    const outHtml = htmlBody.replace("<!doctype html>", `<!doctype html>\n${provenance}`);

    const outDir = path.join(ROOT, "public/documents/drivers", driverId);
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "dqf-compliance-summary.html");
    fs.writeFileSync(outFile, outHtml, "utf8");

    const publicUrl = `/documents/drivers/${driverId}/dqf-compliance-summary.html`;
    manifestLib[driverId] = { ...(manifestLib[driverId] ?? {}), dqfComplianceSummary: publicUrl };
    manifestPublic[driverId] = { ...(manifestPublic[driverId] ?? {}), dqfComplianceSummary: publicUrl };

    console.log(`Wrote ${path.relative(ROOT, outFile)}`);
  }

  fs.writeFileSync(MANIFEST_LIB, JSON.stringify(manifestLib, null, 2), "utf8");
  fs.writeFileSync(MANIFEST_PUBLIC, JSON.stringify(manifestPublic, null, 2), "utf8");

  const indexRaw = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")) as { generatedAt?: string; files: string[] };
  const fileSet = new Set(indexRaw.files ?? []);
  for (const driverId of DRIVER_IDS) {
    fileSet.add(`/documents/drivers/${driverId}/dqf-compliance-summary.html`);
  }
  indexRaw.files = [...fileSet].sort();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(indexRaw, null, 2), "utf8");

  console.log("generate-driver-dqf-summaries: done");
}

function mvrRowHasPull(mvr: DocumentRow | undefined) {
  return Boolean(mvr?.fileUrl || mvr?.previewUrl);
}

main();
