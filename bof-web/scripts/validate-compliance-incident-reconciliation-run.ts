/**
 * Runtime checks: credential-slot OPEN incidents vs getDriverCredentialStatus + reconciliation wiring.
 */
import fs from "fs";
import path from "path";

import raw from "../lib/demo-data.json";
import type { BofData } from "../lib/load-bof-data";
import {
  credentialSlotFromIncidentType,
  hasIndependentInvestigation,
  reconcileCredentialIncident,
} from "../lib/compliance/credential-incident-reconciliation";
import { getDriverCredentialStatus } from "../lib/driver-credential-status";
import { countEffectiveOpenComplianceIncidents } from "../lib/dashboard-insights";

const ROOT = process.cwd();
const data = raw as unknown as BofData;

function main() {
  const issues: string[] = [];

  for (const inc of data.complianceIncidents ?? []) {
    const st = String(inc.status ?? "").toUpperCase();
    if (st === "CLOSED" || st === "RESOLVED") continue;
    const driverId = String(inc.driverId ?? "").trim();
    if (!driverId) continue;

    const slot = credentialSlotFromIncidentType(String(inc.type ?? ""));
    if (!slot) continue;

    const cred = getDriverCredentialStatus(data, driverId);
    const rec = reconcileCredentialIncident(data, inc);

    if (slot === "medicalCard" && cred.medicalCard.status === "valid" && rec.display) {
      issues.push(
        `${inc.incidentId}: OPEN Medical credential incident still displays while canonical medicalCard is valid`
      );
    }

    if (
      slot === "mvr" &&
      cred.mvr.status === "valid" &&
      rec.display &&
      !hasIndependentInvestigation(inc)
    ) {
      issues.push(
        `${inc.incidentId}: OPEN MVR credential incident still displays while canonical MVR is valid (no independent investigation)`
      );
    }
  }

  const cmpWatch = ["CMP-001", "CMP-002", "CMP-003", "CMP-004"];
  for (const id of cmpWatch) {
    const inc = data.complianceIncidents?.find((c) => c.incidentId === id);
    if (!inc) continue;
    const rec = reconcileCredentialIncident(data, inc);
    const slot = credentialSlotFromIncidentType(String(inc.type ?? ""));
    if (!slot) {
      issues.push(`${id}: expected credential-related incident type`);
      continue;
    }
    const st = String(inc.status ?? "").toUpperCase();
    if (st === "CLOSED" || st === "RESOLVED") {
      if (rec.reconciledStatus !== "resolved") {
        issues.push(`${id}: closed incident should reconcile as resolved, got ${rec.reconciledStatus}`);
      }
      continue;
    }
    if (
      rec.reconciledStatus !== "stale_suppressed" &&
      rec.reconciledStatus !== "active_verified"
    ) {
      issues.push(
        `${id}: OPEN CMP credential incident must be stale_suppressed or active_verified; got ${rec.reconciledStatus} (${rec.reason})`
      );
    }
    if (
      (rec.reconciledStatus === "stale_suppressed" ||
        rec.reconciledStatus === "active_verified") &&
      !String(rec.reason ?? "").trim()
    ) {
      issues.push(`${id}: reconciliation missing reason`);
    }
  }

  const effective = countEffectiveOpenComplianceIncidents(data);
  let rawOpenCredential = 0;
  let displayedCredentialOpen = 0;
  for (const inc of data.complianceIncidents ?? []) {
    const st = String(inc.status ?? "").toUpperCase();
    if (st === "CLOSED" || st === "RESOLVED") continue;
    if (!credentialSlotFromIncidentType(String(inc.type ?? ""))) continue;
    rawOpenCredential++;
    if (reconcileCredentialIncident(data, inc).display) displayedCredentialOpen++;
  }
  if (displayedCredentialOpen > rawOpenCredential) {
    issues.push("credential display count exceeds raw open credential incidents (logic error)");
  }

  const filesNeedReconcile = [
    "lib/safety-command-feed.ts",
    "lib/dashboard-insights.ts",
    "lib/executive-layer.ts",
    "lib/driver-review-explanation.ts",
    "lib/driver-dispatch-eligibility.ts",
    "lib/driver-queries.ts",
    "lib/command-center-system.ts",
    "lib/pretrip-tablet.ts",
    "lib/document-vault.ts",
    "lib/safety-bonus.ts",
    "lib/load-risk-explanation.ts",
    "lib/bof-savings-layer.ts",
    "lib/claim-packet.ts",
    "lib/generated-documents.ts",
    "lib/bof-generated-svgs.ts",
    "app/api/generate/_shared.ts",
  ];
  for (const rel of filesNeedReconcile) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) {
      issues.push(`missing ${rel}`);
      continue;
    }
    const src = fs.readFileSync(p, "utf8");
    if (!src.includes("reconcileCredentialIncident")) {
      issues.push(`${rel} must import/use reconcileCredentialIncident for compliance incidents`);
    }
  }

  const forbiddenDriverNameJoin = [
    "lib/executive-layer.ts",
    "lib/dashboard-insights.ts",
    "lib/safety-command-feed.ts",
  ];
  const risky =
    /complianceIncidents[\s\S]{0,240}\.find\s*\(\s*\([^)]*\)\s*=>\s*[^)]*\.name\s*===/;
  for (const rel of forbiddenDriverNameJoin) {
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    if (risky.test(src)) {
      issues.push(`${rel}: avoid joining compliance incidents to drivers by driver.name`);
    }
  }

  if (issues.length) {
    console.error(`validate-compliance-incident-reconciliation: ${issues.length} issue(s)`);
    for (const i of issues) console.error(`  - ${i}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `validate-compliance-incident-reconciliation: OK (effective open compliance count=${effective}; OPEN credential incidents displayed after reconcile=${displayedCredentialOpen}/${rawOpenCredential})`
  );
}

main();
