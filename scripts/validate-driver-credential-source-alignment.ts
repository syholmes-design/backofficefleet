/**
 * Ensures driver hub compliance dates, document packet core rows, and resolver outputs agree.
 * Run: npx tsx scripts/validate-driver-credential-source-alignment.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getBofData } from "../lib/load-bof-data";
import { buildDriverDocumentPacket } from "../lib/driver-document-packet";
import {
  complianceCredentialPrimaryLine,
  getDriverCredentialStatus,
} from "../lib/driver-credential-status";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function norm(s?: string | null): string {
  return String(s ?? "").trim();
}

function expectedPrimaryDateForCoreRow(
  canonicalType: string,
  cred: ReturnType<typeof getDriverCredentialStatus>
): string {
  switch (canonicalType) {
    case "cdl":
      return norm(cred.cdl.expirationDate);
    case "medical_card":
      return norm(cred.medicalCard.expirationDate);
    case "mvr":
      return norm(cred.mvr.expirationDate) || norm(cred.mvr.reviewDate);
    case "fmcsa_compliance":
      return norm(cred.fmcsa.reviewDate) || norm(cred.fmcsa.expirationDate);
    default:
      return "";
  }
}

function main() {
  const data = getBofData();
  const issues: string[] = [];

  for (const d of data.drivers) {
    const id = d.id;
    const cred = getDriverCredentialStatus(data, id);
    const packet = buildDriverDocumentPacket(data, id);

    for (const ct of ["cdl", "medical_card", "mvr", "fmcsa_compliance"] as const) {
      const row = packet.documents.find((r) => r.canonicalType === ct && r.group === "core_dqf");
      const exp = norm(row?.expirationDate);
      const want = expectedPrimaryDateForCoreRow(ct, cred);
      if (want && exp !== want) {
        issues.push(`${id}: core packet "${ct}" date "${exp || "(empty)"}" !== resolver "${want}"`);
      }
    }

    const hubPairs: Array<[string, ReturnType<typeof complianceCredentialPrimaryLine>]> = [
      ["CDL", complianceCredentialPrimaryLine(cred.cdl, "expiration")],
      ["Medical", complianceCredentialPrimaryLine(cred.medicalCard, "expiration")],
      ["MVR", complianceCredentialPrimaryLine(cred.mvr, "mvr_review")],
      ["FMCSA", complianceCredentialPrimaryLine(cred.fmcsa, "fmcsa_review")],
    ];
    for (const [label, line] of hubPairs) {
      const slice =
        label === "CDL"
          ? cred.cdl
          : label === "Medical"
            ? cred.medicalCard
            : label === "MVR"
              ? cred.mvr
              : cred.fmcsa;
      const hasEvidence =
        Boolean(norm(slice.expirationDate) || norm(slice.reviewDate) || norm(slice.fileUrl));
      if (hasEvidence && line === "Missing / needs review") {
        issues.push(`${id}: hub line "${label}" is Missing / needs review but resolver has date/file`);
      }
    }

    const summaryLines = [
      packet.documents.find((r) => r.canonicalType === "cdl" && r.group === "core_dqf")?.expirationDate,
      packet.documents.find((r) => r.canonicalType === "medical_card" && r.group === "core_dqf")
        ?.expirationDate,
      packet.documents.find((r) => r.canonicalType === "mvr" && r.group === "core_dqf")?.expirationDate,
      packet.documents.find((r) => r.canonicalType === "fmcsa_compliance" && r.group === "core_dqf")
        ?.expirationDate,
    ].map(norm);

    const complianceLines = [
      complianceCredentialPrimaryLine(cred.cdl, "expiration"),
      complianceCredentialPrimaryLine(cred.medicalCard, "expiration"),
      complianceCredentialPrimaryLine(cred.mvr, "mvr_review"),
      complianceCredentialPrimaryLine(cred.fmcsa, "fmcsa_review"),
    ];

    for (let i = 0; i < 4; i++) {
      const s = summaryLines[i];
      const c = complianceLines[i];
      if (norm(s) && norm(c) && s !== c && !c.includes("On file")) {
        issues.push(`${id}: document summary date slot ${i} "${s}" vs compliance card "${c}"`);
      }
    }
  }

  const hubPath = path.join(ROOT, "components/drivers/DriverDetailPageClient.tsx");
  const hubSrc = fs.readFileSync(hubPath, "utf8");
  if (/emergency\.cdl_expiration_date|emergency\.med_card_expiration_date/.test(hubSrc)) {
    issues.push("DriverDetailPageClient still reads credential dates from emergency.* driver fields");
  }

  if (issues.length) {
    console.error("validate-driver-credential-source-alignment failed:\n" + issues.join("\n"));
    process.exit(1);
  }
  console.log("validate-driver-credential-source-alignment: OK");
}

main();
