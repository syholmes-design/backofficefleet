import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDir = join(process.cwd(), "public", "evidence", "support", "settlement-documents");

mkdirSync(outputDir, { recursive: true });

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const text = (x, y, value, className = "body", extra = "") =>
  `<text x="${x}" y="${y}" class="${className}" ${extra}>${escapeXml(value)}</text>`;

const row = (label, value, y) => `
  ${text(88, y, label, "label")}
  ${text(306, y, value, "value")}
  <line x1="88" y1="${y + 18}" x2="548" y2="${y + 18}" class="rule" />
`;

const tableRow = (a, b, c, y, accent = false) => `
  <rect x="80" y="${y - 23}" width="480" height="34" rx="8" class="${accent ? "tableAccent" : "tableRow"}" />
  ${text(104, y, a, "table")}
  ${text(330, y, b, "table right", 'text-anchor="end"')}
  ${text(532, y, c, "table right", 'text-anchor="end"')}
`;

function documentPreview({
  fileName,
  eyebrow,
  title,
  subtitle,
  status,
  accent,
  rows,
  table,
  sideTitle,
  sideLines,
  footer,
  stamp,
}) {
  const rowsSvg = rows.map(([label, value], index) => row(label, value, 166 + index * 44)).join("");
  const tableSvg = table
    .map(([a, b, c, isAccent], index) => tableRow(a, b, c, 370 + index * 40, isAccent))
    .join("");
  const sideSvg = sideLines.map((line, index) => text(642, 214 + index * 34, line, "side")).join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapeXml(title)} preview">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#07111f" />
      <stop offset="100%" stop-color="#10243a" />
    </linearGradient>
    <filter id="paperShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#020617" flood-opacity="0.35" />
    </filter>
  </defs>
  <style>
    .paper { fill: #f8fafc; filter: url(#paperShadow); }
    .topBand { fill: ${accent}; }
    .mutedBand { fill: #e2e8f0; }
    .chip { fill: #dcfce7; }
    .chipText { fill: #166534; font: 700 22px Arial, sans-serif; }
    .eyebrow { fill: #ccfbf1; font: 700 20px Arial, sans-serif; letter-spacing: 1px; }
    .title { fill: #0f172a; font: 800 40px Arial, sans-serif; }
    .subtitle { fill: #475569; font: 500 22px Arial, sans-serif; }
    .label { fill: #64748b; font: 700 19px Arial, sans-serif; }
    .value { fill: #0f172a; font: 800 22px Arial, sans-serif; }
    .rule { stroke: #cbd5e1; stroke-width: 2; }
    .tableRow { fill: #eef2f7; }
    .tableAccent { fill: #dbeafe; }
    .table { fill: #1e293b; font: 800 21px Arial, sans-serif; }
    .right { font-weight: 900; }
    .sidePanel { fill: #0f172a; }
    .sideTitle { fill: #67e8f9; font: 800 24px Arial, sans-serif; }
    .side { fill: #cbd5e1; font: 700 20px Arial, sans-serif; }
    .footer { fill: #475569; font: 700 18px Arial, sans-serif; }
    .stamp { fill: none; stroke: ${accent}; stroke-width: 6; }
    .stampText { fill: ${accent}; font: 900 26px Arial, sans-serif; letter-spacing: 1px; }
  </style>
  <rect width="960" height="540" fill="url(#bg)" />
  <rect x="48" y="38" width="864" height="464" rx="24" class="paper" />
  <rect x="48" y="38" width="864" height="72" rx="24" class="topBand" />
  <rect x="48" y="86" width="864" height="24" class="topBand" />
  ${text(82, 84, eyebrow, "eyebrow")}
  <rect x="718" y="58" width="152" height="36" rx="18" class="chip" />
  ${text(794, 83, status, "chipText", 'text-anchor="middle"')}
  ${text(82, 148, title, "title")}
  ${text(84, 180, subtitle, "subtitle")}
  <rect x="610" y="150" width="242" height="292" rx="18" class="sidePanel" />
  ${text(642, 186, sideTitle, "sideTitle")}
  ${sideSvg}
  ${rowsSvg}
  <rect x="80" y="324" width="480" height="132" rx="14" class="mutedBand" />
  ${tableSvg}
  <rect x="648" y="348" width="164" height="72" rx="12" class="stamp" transform="rotate(-7 730 384)" />
  ${text(730, 394, stamp, "stampText", 'text-anchor="middle" transform="rotate(-7 730 394)"')}
  ${text(82, 480, footer, "footer")}
</svg>`;

  writeFileSync(join(outputDir, fileName), svg, "utf8");
}

const previews = [
  {
    fileName: "settlement-packet-preview.svg",
    eyebrow: "BOF SETTLEMENT",
    title: "Driver Settlement Packet",
    subtitle: "Gross-to-net reconciliation",
    status: "Ready",
    accent: "#0f766e",
    rows: [["Load", "L003"], ["Week ending", "May 18, 2026"], ["Driver", "Alex J. Kim"]],
    table: [["Gross pay", "$2,795.00", "earned", false], ["Deductions", "$810.00", "withheld", false], ["Net pay", "$1,985.00", "release", true]],
    sideTitle: "Packet includes",
    sideLines: ["Pay summary", "Deductions", "Proof checklist", "Hold review"],
    footer: "BackOfficeFleet settlement control packet",
    stamp: "RELEASED",
  },
  {
    fileName: "invoice-preview.svg",
    eyebrow: "CUSTOMER BILLING",
    title: "Load Invoice",
    subtitle: "Linehaul and accessorial billing",
    status: "Ready",
    accent: "#2563eb",
    rows: [["Invoice", "INV-L003"], ["Customer", "Midwest Retail DC"], ["Billing status", "Ready to send"]],
    table: [["Linehaul", "$2,650.00", "approved", false], ["Fuel surcharge", "$0.00", "included", false], ["Lumper reimbursement", "$145.00", "billable", true]],
    sideTitle: "Billing proof",
    sideLines: ["BOL attached", "POD attached", "Rate terms match", "No AR hold"],
    footer: "Invoice is tied to load proof and settlement release.",
    stamp: "BILLABLE",
  },
  {
    fileName: "bill-of-lading-preview.svg",
    eyebrow: "LOAD CONTROL",
    title: "Bill of Lading",
    subtitle: "Signed shipper document",
    status: "Ready",
    accent: "#7c3aed",
    rows: [["BOL", "BOL-L003"], ["Seal", "SEAL-823714"], ["Freight", "22 pallets consumer goods"]],
    table: [["Pickup", "Cleveland, OH", "signed", false], ["Delivery", "Nashville, TN", "matched", false], ["Condition", "Clean at shipper", "verified", true]],
    sideTitle: "Release checks",
    sideLines: ["Seal captured", "Pallet count", "Driver signature", "RFID scan"],
    footer: "BOL matches dispatch assignment, rate confirmation, and POD.",
    stamp: "SIGNED",
  },
  {
    fileName: "proof-of-delivery-preview.svg",
    eyebrow: "DELIVERY PROOF",
    title: "Proof of Delivery",
    subtitle: "Receiver signature and timestamp",
    status: "Ready",
    accent: "#16a34a",
    rows: [["Delivered", "May 18, 2026 2:42 PM"], ["Receiver", "K. Walker"], ["OS&D", "None reported"]],
    table: [["Signature", "Captured", "accepted", false], ["Geo/time", "Matched stop", "verified", false], ["Settlement release", "Allowed", "ready", true]],
    sideTitle: "POD evidence",
    sideLines: ["Receiver name", "Timestamp", "Location check", "Photo log"],
    footer: "POD clears driver pay, billing, and factoring readiness.",
    stamp: "DELIVERED",
  },
  {
    fileName: "rate-confirmation-preview.svg",
    eyebrow: "RATE CONTROL",
    title: "Rate Confirmation",
    subtitle: "Approved load terms",
    status: "Ready",
    accent: "#0891b2",
    rows: [["Rate con", "RC-L003"], ["Broker", "Summit Logistics"], ["Payment terms", "Net 30"]],
    table: [["Linehaul", "$2,650.00", "base", false], ["Detention", "$0.00", "none", false], ["Lumper", "$145.00", "reimbursable", true]],
    sideTitle: "Terms checked",
    sideLines: ["Lane matched", "Accessorials", "Pay basis", "Factoring ok"],
    footer: "Rate terms feed invoice, settlement, and margin controls.",
    stamp: "MATCHED",
  },
  {
    fileName: "settlement-hold-evidence-preview.svg",
    eyebrow: "HOLD REVIEW",
    title: "Settlement Hold Evidence",
    subtitle: "Reason, amount, and required fix",
    status: "Pending",
    accent: "#ca8a04",
    rows: [["Hold amount", "$180.00"], ["Reason", "Receipt approval required"], ["Owner", "Settlement desk"]],
    table: [["Evidence", "Lumper receipt", "received", false], ["Missing", "Customer approval", "needed", false], ["Action", "Verify and clear", "assigned", true]],
    sideTitle: "Hold packet",
    sideLines: ["Driver note", "Receipt image", "Rate term", "Approver queue"],
    footer: "Hold stays visible until proof and approval match the pay line.",
    stamp: "REVIEW",
  },
  {
    fileName: "lumper-receipt-preview.svg",
    eyebrow: "ACCESSORIAL",
    title: "Lumper Receipt",
    subtitle: "Vendor receipt and reimbursement",
    status: "Ready",
    accent: "#ea580c",
    rows: [["Vendor", "River City Warehouse"], ["Service", "Unload and restack"], ["Receipt", "LUMP-L003"]],
    table: [["Charge", "$145.00", "driver paid", false], ["Rate con", "Reimbursable", "matched", false], ["Settlement", "Add to gross", "ready", true]],
    sideTitle: "Receipt data",
    sideLines: ["Vendor name", "Amount", "Driver paid", "Approval"],
    footer: "Receipt is tied to gross pay and invoice accessorial recovery.",
    stamp: "APPROVED",
  },
  {
    fileName: "claim-chargeback-preview.svg",
    eyebrow: "CLAIM CONTROL",
    title: "Claim Evidence Packet",
    subtitle: "Chargeback risk and cargo proof",
    status: "Pending",
    accent: "#dc2626",
    rows: [["Claim", "CLM-L003"], ["Amount at risk", "$180.00"], ["Issue", "Pallet count discrepancy"]],
    table: [["Photos", "Dock and freight", "attached", false], ["BOL/POD", "Compared", "review", false], ["Next step", "Customer response", "open", true]],
    sideTitle: "Evidence set",
    sideLines: ["Dock photo", "Seal record", "Driver note", "POD compare"],
    footer: "Claim packet explains why money is held and what clears it.",
    stamp: "OPEN",
  },
  {
    fileName: "factoring-packet-preview.svg",
    eyebrow: "FACTORING",
    title: "Post-Trip Factoring Packet",
    subtitle: "Invoice-ready proof bundle",
    status: "Checklist",
    accent: "#4f46e5",
    rows: [["Packet", "FACT-L003"], ["Funding", "Pending proof complete"], ["Payee", "BackOfficeFleet demo"]],
    table: [["Invoice", "Required", "ready", false], ["BOL + POD", "Required", "ready", false], ["Rate confirmation", "Required", "attached", true]],
    sideTitle: "Funding checks",
    sideLines: ["NOA verified", "Proof bundle", "Customer terms", "Exception log"],
    footer: "Factoring view shows exactly what is ready or blocking funding.",
    stamp: "PACKET",
  },
];

for (const preview of previews) {
  documentPreview(preview);
}

console.log(`Generated ${previews.length} settlement document previews in ${outputDir}`);
