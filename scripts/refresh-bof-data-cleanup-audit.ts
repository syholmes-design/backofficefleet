import fs from "node:fs";
import path from "node:path";
import { getBofData } from "@/lib/load-bof-data";
import { getCanonicalLoadEvidenceForLoad } from "@/lib/canonical-load-evidence";

type AuditRow = {
  loadId: string;
  driverId: string;
  driverName: string;
  status: string;
  riskReason: string;
  dispatchBlockedReason: string;
  evidenceAvailableCount: number;
  evidenceMissingCount: number;
  evidencePathStatus: "available" | "partial" | "missing" | "not_required";
  missingEvidenceTypes: string[];
};

function formatRiskReason(load: {
  dispatchExceptionFlag?: boolean;
  sealStatus?: string;
  podStatus?: string;
}): string {
  const reasons: string[] = [];
  if (load.dispatchExceptionFlag) reasons.push("dispatchExceptionFlag");
  if (String(load.sealStatus).toUpperCase() === "MISMATCH") reasons.push("seal:Mismatch");
  if (String(load.podStatus).toLowerCase() === "pending") reasons.push("pod_pending");
  return reasons.join(";") || "none";
}

const data = getBofData();
const driverNameById = new Map(data.drivers.map((d) => [d.id, d.name]));

const audit7: AuditRow[] = data.loads.map((load) => {
  const evidence = getCanonicalLoadEvidenceForLoad(data, load.id);
  const required = evidence.filter((row) => row.status !== "not_required");
  const available = required.filter((row) => row.status === "available");
  const missing = required.filter((row) => row.status === "missing");
  const placeholder = required.filter((row) => row.status === "placeholder");
  const missingEvidenceTypes = [...missing, ...placeholder].map((row) => row.evidenceType);

  let evidencePathStatus: AuditRow["evidencePathStatus"] = "missing";
  if (required.length === 0) {
    evidencePathStatus = "not_required";
  } else if (available.length === required.length) {
    evidencePathStatus = "available";
  } else if (available.length > 0) {
    evidencePathStatus = "partial";
  } else {
    evidencePathStatus = "missing";
  }

  const riskReason = formatRiskReason(load);

  return {
    loadId: load.id,
    driverId: load.driverId,
    driverName: driverNameById.get(load.driverId) ?? load.driverId,
    status: load.status,
    riskReason,
    dispatchBlockedReason: riskReason === "none" ? "none" : riskReason,
    evidenceAvailableCount: available.length,
    evidenceMissingCount: missing.length + placeholder.length,
    evidencePathStatus,
    missingEvidenceTypes,
  };
});

const reportPath = path.join(process.cwd(), "data", "audit-reports", "bof-data-cleanup-audit.json");
const raw = fs.readFileSync(reportPath, "utf-8");
const report = JSON.parse(raw) as Record<string, unknown>;
report.audit7 = audit7;
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");

console.log(`Updated audit7 in ${reportPath}`);
