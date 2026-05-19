#!/usr/bin/env node
/**
 * Generates committed synthetic PNG stills for the V4 Safety Events feed.
 *
 * These are demo evidence images, not production photographs. Each asset carries
 * a visible synthetic-evidence footer so the walkthrough feels realistic without
 * implying the stills came from real incidents.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "evidence", "safety");
const MANIFEST_PATH = path.join(OUT_DIR, "safety-evidence-manifest.json");

const EVENTS = [
  {
    id: "EVT-001",
    file: "evt-001-hos-eld.png",
    type: "HOS ELD excerpt",
    driver: "Noah Wilson (DRV-010)",
    unit: "T-110",
    location: "I-40 near Nashville, TN",
    title: "Exceeded 11-hour driving limit",
    detail: "Drive clock over limit; reset required before dispatch release.",
    scene: "eld",
    severity: "CRITICAL",
  },
  {
    id: "EVT-002",
    file: "evt-002-harsh-braking-dashcam.png",
    type: "Dashcam telematics still",
    driver: "Marcus Chen (DRV-006)",
    unit: "T-111",
    location: "Mile Marker 212",
    title: "Sudden hard stop detected",
    detail: "Rapid deceleration event captured with following-distance overlay.",
    scene: "dashcam",
    severity: "WARNING",
  },
  {
    id: "EVT-003",
    file: "evt-003-speeding-telematics.png",
    type: "Speed event snapshot",
    driver: "Priya Patel (DRV-004)",
    unit: "T-108",
    location: "Memphis, TN",
    title: "78 MPH in 55 MPH zone",
    detail: "GPS speed threshold exceeded; route plan review required.",
    scene: "speed",
    severity: "CRITICAL",
  },
  {
    id: "EVT-004",
    file: "evt-004-geofence-yard-exit.png",
    type: "Yard geofence snapshot",
    driver: "Maria Lopez (DRV-002)",
    unit: "T-101",
    location: "Cleveland Yard",
    title: "Exited designated yard area",
    detail: "Unit crossed yard boundary; authorization check required.",
    scene: "geofence",
    severity: "WARNING",
  },
  {
    id: "EVT-005",
    file: "evt-005-break-hos-violation.png",
    type: "HOS break audit",
    driver: "Liam Smith (DRV-008)",
    unit: "T-104",
    location: "I-71 near Columbus, OH",
    title: "Missed required 30-minute break",
    detail: "Break not logged before available drive window expired.",
    scene: "eld",
    severity: "CRITICAL",
  },
  {
    id: "EVT-006",
    file: "evt-006-maintenance-photo-missing.png",
    type: "Inspection upload audit",
    driver: "Emma Brown (DRV-009)",
    unit: "T-106",
    location: "Cleveland Terminal",
    title: "Required tire/asset photos missing",
    detail: "Dispatch release blocked until tire and asset photos are uploaded.",
    scene: "missing",
    severity: "WARNING",
  },
  {
    id: "EVT-007",
    file: "evt-007-following-distance.png",
    type: "ADAS following-distance still",
    driver: "Alex Kim (DRV-003)",
    unit: "T-103",
    location: "I-80 near Toledo, OH",
    title: "Short following distance for 42 seconds",
    detail: "Telematics flagged sustained close following interval.",
    scene: "dashcam",
    severity: "WARNING",
  },
  {
    id: "EVT-008",
    file: "evt-008-lane-departure.png",
    type: "ADAS lane alert still",
    driver: "Robert Johnson (DRV-012)",
    unit: "T-112",
    location: "I-75 near Dayton, OH",
    title: "Unsignaled lane departure",
    detail: "Lane-control coaching module recommended.",
    scene: "lane",
    severity: "WARNING",
  },
  {
    id: "EVT-009",
    file: "evt-009-tire-inspection-failure.png",
    type: "Pre-trip tire photo",
    driver: "Priya Patel (DRV-004)",
    unit: "T-108",
    location: "Memphis, TN Yard",
    title: "Tread/sidewall check failed",
    detail: "Dispatch hold triggered by tire inspection evidence.",
    scene: "tire",
    severity: "CRITICAL",
  },
  {
    id: "EVT-010",
    file: "evt-010-fatigue-alert.png",
    type: "Dashcam fatigue still",
    driver: "Noah Wilson (DRV-010)",
    unit: "T-110",
    location: "I-40 near Knoxville, TN",
    title: "Fatigue alert during overnight segment",
    detail: "Driver statement and fatigue coaching required.",
    scene: "fatigue",
    severity: "CRITICAL",
  },
  {
    id: "EVT-011",
    file: "evt-011-backing-dock-contact.png",
    type: "Dock camera still",
    driver: "Marcus Chen (DRV-006)",
    unit: "T-111",
    location: "Customer dock - Indianapolis, IN",
    title: "Low-speed backing contact",
    detail: "Dock bumper contact; no cargo loss reported.",
    scene: "dock",
    severity: "WARNING",
  },
  {
    id: "EVT-012",
    file: "evt-012-speeding-threshold.png",
    type: "Speed threshold snapshot",
    driver: "Maria Lopez (DRV-002)",
    unit: "T-101",
    location: "I-90 near Erie, PA",
    title: "Speed threshold exceeded",
    detail: "7 MPH over threshold for 90 seconds; reviewed coaching note on file.",
    scene: "speed",
    severity: "WARNING",
  },
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sceneMarkup(scene, severity) {
  const alert = severity === "CRITICAL" ? "#ef4444" : "#f59e0b";
  if (scene === "eld") {
    return `
      <rect x="66" y="246" width="760" height="306" rx="18" fill="#0b1220" stroke="#334155"/>
      <text x="92" y="292" fill="#dbeafe" font-size="26" font-weight="700">ELD duty-status timeline</text>
      <rect x="94" y="336" width="640" height="36" rx="18" fill="#1d4ed8"/>
      <rect x="94" y="390" width="690" height="36" rx="18" fill="${alert}"/>
      <rect x="94" y="444" width="430" height="36" rx="18" fill="#16a34a"/>
      <text x="754" y="417" fill="#fee2e2" font-size="20" font-weight="700">OVER LIMIT</text>
      <text x="94" y="520" fill="#93c5fd" font-size="18">Drive clock exceeded available HOS window</text>
    `;
  }
  if (scene === "speed") {
    return `
      <rect x="82" y="238" width="356" height="260" rx="178" fill="#111827" stroke="${alert}" stroke-width="14"/>
      <text x="162" y="386" fill="#f8fafc" font-size="92" font-weight="800">78</text>
      <text x="246" y="432" fill="#cbd5e1" font-size="24">MPH</text>
      <rect x="524" y="272" width="300" height="176" rx="18" fill="#0f172a" stroke="#334155"/>
      <text x="558" y="326" fill="#e2e8f0" font-size="24" font-weight="700">Posted zone</text>
      <text x="594" y="398" fill="#fca5a5" font-size="58" font-weight="800">55 MPH</text>
    `;
  }
  if (scene === "geofence") {
    return `
      <rect x="70" y="230" width="760" height="330" rx="18" fill="#102033" stroke="#334155"/>
      <path d="M126 504 C226 418 276 474 360 380 C454 274 566 336 700 260" fill="none" stroke="#38bdf8" stroke-width="8"/>
      <rect x="214" y="300" width="372" height="174" rx="20" fill="none" stroke="#22c55e" stroke-width="5" stroke-dasharray="14 12"/>
      <circle cx="644" cy="286" r="18" fill="${alert}"/>
      <text x="626" y="252" fill="#fed7aa" font-size="18" font-weight="700">Unit outside yard</text>
      <text x="102" y="538" fill="#bfdbfe" font-size="18">Geofence boundary crossed with unit active</text>
    `;
  }
  if (scene === "missing") {
    return `
      <rect x="86" y="238" width="250" height="250" rx="22" fill="#111827" stroke="#475569"/>
      <path d="M154 374 L196 330 L246 392 L282 350 L314 420 H118 Z" fill="#334155"/>
      <circle cx="275" cy="306" r="28" fill="#475569"/>
      <line x1="110" y1="262" x2="312" y2="464" stroke="${alert}" stroke-width="12"/>
      <rect x="420" y="270" width="396" height="170" rx="18" fill="#0f172a" stroke="#334155"/>
      <text x="454" y="328" fill="#fef3c7" font-size="26" font-weight="700">Inspection photos missing</text>
      <text x="454" y="382" fill="#cbd5e1" font-size="20">Tire photo: not uploaded</text>
      <text x="454" y="416" fill="#cbd5e1" font-size="20">Asset walkaround: not uploaded</text>
    `;
  }
  if (scene === "tire") {
    return `
      <rect x="82" y="230" width="760" height="334" rx="18" fill="#111827" stroke="#334155"/>
      <circle cx="320" cy="396" r="128" fill="#030712" stroke="#64748b" stroke-width="26"/>
      <circle cx="320" cy="396" r="58" fill="#1f2937"/>
      <path d="M212 332 C292 352 350 352 430 328" fill="none" stroke="${alert}" stroke-width="10"/>
      <rect x="522" y="296" width="250" height="62" rx="12" fill="#7f1d1d"/>
      <text x="548" y="336" fill="#fee2e2" font-size="24" font-weight="700">TREAD FAIL</text>
      <text x="526" y="408" fill="#cbd5e1" font-size="20">Sidewall scuffing visible</text>
      <text x="526" y="444" fill="#cbd5e1" font-size="20">Dispatch hold triggered</text>
    `;
  }
  if (scene === "lane") {
    return `
      <rect x="56" y="232" width="800" height="330" rx="18" fill="#0c1424" stroke="#334155"/>
      <path d="M112 552 L332 246" stroke="#e2e8f0" stroke-width="9" stroke-dasharray="38 30"/>
      <path d="M702 552 L494 246" stroke="#e2e8f0" stroke-width="9" stroke-dasharray="38 30"/>
      <rect x="376" y="386" width="126" height="68" rx="14" fill="#2563eb"/>
      <path d="M438 374 L534 304" stroke="${alert}" stroke-width="9" marker-end="url(#arrow)"/>
      <text x="562" y="344" fill="#fed7aa" font-size="24" font-weight="700">Lane drift</text>
    `;
  }
  if (scene === "fatigue") {
    return `
      <rect x="70" y="230" width="772" height="330" rx="18" fill="#111827" stroke="#334155"/>
      <circle cx="294" cy="384" r="120" fill="#1e293b"/>
      <path d="M226 358 Q260 338 294 358" stroke="#f8fafc" stroke-width="8" fill="none"/>
      <path d="M318 358 Q352 338 386 358" stroke="#f8fafc" stroke-width="8" fill="none"/>
      <path d="M252 432 Q306 470 360 432" stroke="#94a3b8" stroke-width="8" fill="none"/>
      <rect x="506" y="298" width="270" height="116" rx="18" fill="#7f1d1d"/>
      <text x="536" y="348" fill="#fee2e2" font-size="28" font-weight="800">FATIGUE ALERT</text>
      <text x="536" y="386" fill="#fecaca" font-size="20">Overnight segment</text>
    `;
  }
  if (scene === "dock") {
    return `
      <rect x="72" y="242" width="770" height="306" rx="18" fill="#172033" stroke="#334155"/>
      <rect x="114" y="310" width="260" height="170" rx="8" fill="#475569"/>
      <rect x="432" y="278" width="258" height="214" rx="14" fill="#1e293b"/>
      <rect x="462" y="326" width="198" height="118" rx="10" fill="#2563eb"/>
      <circle cx="434" cy="496" r="24" fill="#0f172a"/>
      <circle cx="654" cy="496" r="24" fill="#0f172a"/>
      <path d="M396 388 L430 388" stroke="${alert}" stroke-width="9"/>
      <text x="122" y="524" fill="#e2e8f0" font-size="20">Dock bumper contact zone marked for review</text>
    `;
  }
  return `
    <rect x="56" y="232" width="800" height="330" rx="18" fill="#0c1424" stroke="#334155"/>
    <path d="M112 552 L332 246" stroke="#e2e8f0" stroke-width="9" stroke-dasharray="38 30"/>
    <path d="M702 552 L494 246" stroke="#e2e8f0" stroke-width="9" stroke-dasharray="38 30"/>
    <rect x="382" y="374" width="126" height="68" rx="14" fill="#2563eb"/>
    <rect x="202" y="350" width="150" height="76" rx="14" fill="#334155"/>
    <path d="M348 388 L378 388" stroke="${alert}" stroke-width="8"/>
    <text x="542" y="348" fill="#fed7aa" font-size="24" font-weight="700">Telematics alert</text>
  `;
}

function renderSvg(event) {
  const alert = event.severity === "CRITICAL" ? "#ef4444" : "#f59e0b";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${alert}" />
    </marker>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="24" y="24" width="1232" height="672" rx="18" fill="none" stroke="#334155" stroke-width="2"/>
  <rect x="44" y="44" width="1192" height="116" rx="16" fill="#0f172a" stroke="#1e293b"/>
  <text x="70" y="86" fill="#93c5fd" font-size="20" font-family="Segoe UI, Arial" font-weight="700">${esc(event.id)} - ${esc(event.type)}</text>
  <text x="70" y="124" fill="#f8fafc" font-size="28" font-family="Segoe UI, Arial" font-weight="800">${esc(event.title)}</text>
  <rect x="1050" y="66" width="148" height="44" rx="22" fill="${alert}"/>
  <text x="1076" y="95" fill="#fff7ed" font-size="18" font-family="Segoe UI, Arial" font-weight="800">${esc(event.severity)}</text>
  ${sceneMarkup(event.scene, event.severity)}
  <rect x="900" y="230" width="316" height="330" rx="18" fill="#0f172a" stroke="#334155"/>
  <text x="930" y="278" fill="#e2e8f0" font-size="22" font-family="Segoe UI, Arial" font-weight="700">${esc(event.driver)}</text>
  <text x="930" y="318" fill="#94a3b8" font-size="18" font-family="Segoe UI, Arial">Unit: ${esc(event.unit)}</text>
  <text x="930" y="358" fill="#94a3b8" font-size="18" font-family="Segoe UI, Arial">${esc(event.location)}</text>
  <line x1="930" y1="386" x2="1184" y2="386" stroke="#334155"/>
  <text x="930" y="432" fill="#f8fafc" font-size="18" font-family="Segoe UI, Arial" font-weight="700">Safety desk note</text>
  <foreignObject x="930" y="450" width="250" height="80">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font:16px Segoe UI, Arial; color:#cbd5e1; line-height:1.35">${esc(event.detail)}</div>
  </foreignObject>
  <rect x="44" y="612" width="1192" height="54" rx="14" fill="#020617" stroke="#1e293b"/>
  <text x="70" y="646" fill="#fbbf24" font-size="18" font-family="Segoe UI, Arial" font-weight="800">SYNTHETIC DEMO EVIDENCE</text>
  <text x="324" y="646" fill="#94a3b8" font-size="16" font-family="Segoe UI, Arial">Generated for BOF fleet-owner walkthrough; not a production incident photo.</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const event of EVENTS) {
    const svg = renderSvg(event);
    const outPath = path.join(OUT_DIR, event.file);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`[generate-safety-event-evidence] wrote ${path.relative(ROOT, outPath)}`);
  }

  const existing = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
    : { version: 1, description: "Committed demo safety stills.", files: [] };

  const files = new Set(Array.isArray(existing.files) ? existing.files : []);
  for (const event of EVENTS) files.add(`/evidence/safety/${event.file}`);
  existing.version = 2;
  existing.description = "Committed demo safety stills (PNG + SVG). Referenced by safety evidence registries and load-doc manifests.";
  existing.files = Array.from(files).sort();
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
