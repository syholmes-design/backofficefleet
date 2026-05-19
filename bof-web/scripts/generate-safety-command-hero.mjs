#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "generated", "marketing", "safety-command-hero.png");

const evidenceFiles = [
  "evt-001-hos-eld.png",
  "evt-002-harsh-braking-dashcam.png",
  "evt-009-tire-inspection-failure.png",
  "evt-008-lane-departure.png",
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function imageDataUrl(file) {
  const bytes = await fs.readFile(path.join(ROOT, "public", "evidence", "safety", file));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

const thumbs = await Promise.all(evidenceFiles.map(imageDataUrl));

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="720" viewBox="0 0 1600 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#020617"/>
      <stop offset="0.52" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#042f2e"/>
    </linearGradient>
    <radialGradient id="glow" cx="68%" cy="34%" r="55%">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#020617" flood-opacity="0.65"/>
    </filter>
  </defs>

  <rect width="1600" height="720" fill="url(#bg)"/>
  <rect width="1600" height="720" fill="url(#glow)"/>

  <g opacity="0.22">
    ${Array.from({ length: 20 }, (_, i) => `<path d="M${i * 90 - 220} 720 L${i * 90 + 380} 0" stroke="#94a3b8" stroke-width="1"/>`).join("")}
    ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${130 + i * 64} H1600" stroke="#94a3b8" stroke-width="1"/>`).join("")}
  </g>

  <g filter="url(#shadow)" transform="translate(755 94)">
    <rect width="690" height="440" rx="26" fill="#0f172a" opacity="0.94" stroke="#334155"/>
    <rect x="24" y="24" width="642" height="48" rx="14" fill="#111827"/>
    <circle cx="52" cy="48" r="8" fill="#22c55e"/>
    <circle cx="82" cy="48" r="8" fill="#f59e0b"/>
    <circle cx="112" cy="48" r="8" fill="#ef4444"/>
    <text x="145" y="54" fill="#cbd5e1" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700">Safety evidence command view</text>

    <g transform="translate(24 96)">
      ${thumbs.map((src, i) => {
        const x = (i % 2) * 326;
        const y = Math.floor(i / 2) * 154;
        const label = ["HOS clock", "Hard braking", "Tire inspection", "Lane departure"][i];
        return `
          <g transform="translate(${x} ${y})">
            <rect width="304" height="132" rx="16" fill="#020617" stroke="#1e293b"/>
            <image href="${src}" x="10" y="10" width="148" height="82" preserveAspectRatio="xMidYMid slice" opacity="0.92"/>
            <text x="176" y="42" fill="#f8fafc" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700">${esc(label)}</text>
            <text x="176" y="70" fill="#93c5fd" font-family="Inter, Arial, sans-serif" font-size="14">Evidence ready</text>
            <rect x="176" y="88" width="88" height="24" rx="12" fill="#0f766e"/>
            <text x="193" y="105" fill="#ecfeff" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700">Reviewed</text>
          </g>
        `;
      }).join("")}
    </g>
  </g>

  <g transform="translate(122 138)" opacity="0.45">
    <path d="M130 30 L222 82 L222 188 L130 240 L38 188 L38 82 Z" fill="#0f172a" stroke="#60a5fa" stroke-width="4"/>
    <path d="M130 72 L184 104 L184 166 L130 198 L76 166 L76 104 Z" fill="none" stroke="#93c5fd" stroke-width="3"/>
    <path d="M0 360 C180 240 300 210 510 196 C654 186 800 145 938 54" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="22 18"/>
    <path d="M-20 428 C170 308 312 278 534 260 C700 246 812 208 982 102" fill="none" stroke="#14b8a6" stroke-width="2" stroke-dasharray="18 18"/>
  </g>

  <g transform="translate(824 572)">
    <rect width="160" height="92" rx="18" fill="#111827" opacity="0.9" stroke="#334155"/>
    <text x="24" y="38" fill="#fca5a5" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">8</text>
    <text x="24" y="66" fill="#cbd5e1" font-family="Inter, Arial, sans-serif" font-size="15">open events</text>
    <rect x="184" width="160" height="92" rx="18" fill="#111827" opacity="0.9" stroke="#334155"/>
    <text x="208" y="38" fill="#fde68a" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">5</text>
    <text x="208" y="66" fill="#cbd5e1" font-family="Inter, Arial, sans-serif" font-size="15">dispatch holds</text>
    <rect x="368" width="190" height="92" rx="18" fill="#111827" opacity="0.9" stroke="#334155"/>
    <text x="392" y="38" fill="#86efac" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">87</text>
    <text x="392" y="66" fill="#cbd5e1" font-family="Inter, Arial, sans-serif" font-size="15">avg safety score</text>
  </g>
</svg>`;

await fs.mkdir(path.dirname(OUT), { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT);
console.log(`Generated ${path.relative(ROOT, OUT)}`);
