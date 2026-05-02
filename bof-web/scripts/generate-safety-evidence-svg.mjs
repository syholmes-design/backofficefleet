#!/usr/bin/env node
/**
 * Regenerates committed demo safety evidence SVGs under public/evidence/safety/.
 * All visible text is passed through sanitizeSvgText() for valid XML/SVG PCDATA.
 *
 * No AI — safe to run anytime:
 *   node scripts/generate-safety-evidence-svg.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sanitizeSvgText } from "./lib/sanitize-svg-text.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "evidence", "safety");

/** @typedef {"patel" | "smith"} ThemeId */

/**
 * @param {object} p
 * @param {string} p.fileName
 * @param {ThemeId} p.theme
 * @param {string} p.monoLabel
 * @param {string} p.headline
 * @param {string} p.driverLine
 * @param {string} p.annotation
 * @param {string} p.syntheticLine
 * @param {string} p.locationLine
 * @param {string} p.publicPath
 */
function renderSafetyEvidenceSvg(p) {
  const isPatel = p.theme === "patel";
  const stroke = isPatel ? "#f97316" : "#f43f5e";
  const titleFill = isPatel ? "#fb923c" : "#fb7185";
  const annotationFill = isPatel ? "#fca5a5" : "#fda4af";
  const bgEnd = isPatel ? "#111827" : "#1e1b4b";

  const header = sanitizeSvgText("BOF Demo — Safety evidence");
  const mono = sanitizeSvgText(p.monoLabel);
  const headline = sanitizeSvgText(p.headline);
  const driver = sanitizeSvgText(p.driverLine);
  const annotation = sanitizeSvgText(p.annotation);
  const synthetic = sanitizeSvgText(p.syntheticLine);
  const location = sanitizeSvgText(p.locationLine);
  const footer = sanitizeSvgText(p.publicPath);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="${bgEnd}"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="22" y="22" width="1236" height="676" rx="14" fill="none" stroke="${stroke}" stroke-width="2"/>
  <text x="32" y="56" fill="${titleFill}" font-size="22" font-family="Segoe UI, Arial" font-weight="700">${header}</text>
  <text x="32" y="92" fill="#94a3b8" font-size="14" font-family="Consolas, monospace">${mono}</text>
  <text x="32" y="140" fill="#e2e8f0" font-size="26" font-family="Segoe UI, Arial" font-weight="600">${headline}</text>
  <text x="32" y="178" fill="#cbd5e1" font-size="18" font-family="Segoe UI, Arial">${driver}</text>
  <text x="32" y="210" fill="${annotationFill}" font-size="16" font-weight="700">${annotation}</text>
  <rect x="32" y="240" width="1216" height="400" rx="10" fill="#0b1220" stroke="#334155"/>
  <text x="56" y="290" fill="#93c5fd" font-size="17" font-family="Segoe UI, Arial">${synthetic}</text>
  <text x="56" y="330" fill="#a7f3d0" font-size="16" font-family="Segoe UI, Arial">${location}</text>
  <text x="32" y="698" fill="#64748b" font-size="13" font-family="Segoe UI, Arial">${footer}</text>
</svg>
`;
}

const DEFINITIONS = [
  {
    fileName: "p_patel_b102_tire_irregular_wear.svg",
    theme: "patel",
    monoLabel: "p_patel_b102_tire_irregular_wear.svg",
    headline: "B-102 tire irregular wear",
    driverLine: "Driver: Priya Patel (DRV-004) · Load L004",
    annotation: "Inspection: irregular wear pattern (demo still)",
    syntheticLine: "Synthetic demo asset — not a production photograph.",
    locationLine: "Location: Atlanta, GA · 2026-04-02",
    publicPath: "/evidence/safety/p_patel_b102_tire_irregular_wear.svg",
  },
  {
    fileName: "p_patel_pretrip_tire_tread_depth.svg",
    theme: "patel",
    monoLabel: "p_patel_pretrip_tire_tread_depth.svg",
    headline: "Pre-trip tire tread depth",
    driverLine: "Driver: Priya Patel (DRV-004) · Load L004",
    annotation: "Tread below minimum (demo still)",
    syntheticLine: "Synthetic demo asset — not a production photograph.",
    locationLine: "Location: Atlanta, GA · 2026-04-02",
    publicPath: "/evidence/safety/p_patel_pretrip_tire_tread_depth.svg",
  },
  {
    fileName: "p_patel_cargo_damage_box_puncture.svg",
    theme: "patel",
    monoLabel: "p_patel_cargo_damage_box_puncture.svg",
    headline: "Cargo damage — box puncture",
    driverLine: "Driver: Priya Patel (DRV-004) · Load L004",
    annotation: "Product / packaging damage (demo still)",
    syntheticLine: "Synthetic demo asset — not a production photograph.",
    locationLine: "Location: Atlanta, GA · 2026-04-02",
    publicPath: "/evidence/safety/p_patel_cargo_damage_box_puncture.svg",
  },
  {
    fileName: "p_patel_safety_equipment_extinguisher.svg",
    theme: "patel",
    monoLabel: "p_patel_safety_equipment_extinguisher.svg",
    headline: "Safety equipment — extinguisher tag",
    driverLine: "Driver: Priya Patel (DRV-004) · Load L004",
    annotation: "Inspection tag expired (demo still)",
    syntheticLine: "Synthetic demo asset — not a production photograph.",
    locationLine: "Location: Atlanta, GA · 2026-04-02",
    publicPath: "/evidence/safety/p_patel_safety_equipment_extinguisher.svg",
  },
  {
    fileName: "l_smith_l405_hos_violation_eld.svg",
    theme: "smith",
    monoLabel: "l_smith_l405_hos_violation_eld.svg",
    headline: "L-405 HOS violation — ELD excerpt",
    driverLine: "Driver: Liam Smith (DRV-008) · Load L008",
    annotation: "Daily driving limit exceeded (demo still)",
    syntheticLine: "Synthetic demo asset — not production ELD output.",
    locationLine: "Location: Memphis, TN · 2026-04-01",
    publicPath: "/evidence/safety/l_smith_l405_hos_violation_eld.svg",
  },
  {
    fileName: "l_smith_logbook_review_violation.svg",
    theme: "smith",
    monoLabel: "l_smith_logbook_review_violation.svg",
    headline: "Logbook review violation",
    driverLine: "Driver: Liam Smith (DRV-008) · Load L008",
    annotation: "Reset / violation noted (demo still)",
    syntheticLine: "Synthetic demo asset — not a production scan.",
    locationLine: "Location: Memphis, TN · 2026-04-01",
    publicPath: "/evidence/safety/l_smith_logbook_review_violation.svg",
  },
  {
    fileName: "l_smith_trailer_brake_inspection.svg",
    theme: "smith",
    monoLabel: "l_smith_trailer_brake_inspection.svg",
    headline: "Trailer brake inspection",
    driverLine: "Driver: Liam Smith (DRV-008) · Load L008",
    annotation: "Lining below minimum (demo still)",
    syntheticLine: "Synthetic demo asset — not a production photograph.",
    locationLine: "Location: Memphis, TN · 2026-04-01",
    publicPath: "/evidence/safety/l_smith_trailer_brake_inspection.svg",
  },
  {
    fileName: "l_smith_cargo_damage_pallet_wrap.svg",
    theme: "smith",
    monoLabel: "l_smith_cargo_damage_pallet_wrap.svg",
    headline: "Cargo damage — pallet wrap",
    driverLine: "Driver: Liam Smith (DRV-008) · Load L008",
    annotation: "Significant cargo damage / damaged wrapped pallet (demo still)",
    syntheticLine: "Synthetic demo asset — not a production photograph.",
    locationLine: "Location: Memphis, TN · 2026-04-01",
    publicPath: "/evidence/safety/l_smith_cargo_damage_pallet_wrap.svg",
  },
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const def of DEFINITIONS) {
    const outPath = path.join(OUT_DIR, def.fileName);
    fs.writeFileSync(outPath, renderSafetyEvidenceSvg(def), "utf8");
    console.log(`[generate-safety-evidence-svg] wrote ${path.relative(ROOT, outPath)}`);
  }
  console.log("[generate-safety-evidence-svg] OK");
}

main();
