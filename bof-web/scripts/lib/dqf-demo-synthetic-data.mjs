/**
 * Deterministic synthetic reviewer / signature metadata for DQF compliance summary (demo only).
 * No Math.random / no Date.now — derive from driverId string only.
 */

const REVIEWER_POOL = [
  { name: "Alicia Morgan", title: "BOF Compliance Coordinator" },
  { name: "Marcus Reed", title: "BOF Safety & Compliance Reviewer" },
  { name: "Danielle Brooks", title: "BOF Driver Qualification Specialist" },
  { name: "Ethan Wallace", title: "BOF Operations Compliance Lead" },
];

function driverOrdinal(driverId) {
  const m = /^DRV-(\d{3})$/i.exec(String(driverId ?? "").trim());
  if (!m) return 1;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** @param {string} driverId */
export function getDqfReviewerForDriver(driverId) {
  const ord = driverOrdinal(driverId);
  const idx = (ord - 1) % REVIEWER_POOL.length;
  return { ...REVIEWER_POOL[idx], source: "synthetic_demo" };
}

/**
 * ISO-like display string from driver ordinal + day offset (deterministic).
 * @param {string} driverId
 * @param {number} dayOffset
 */
export function getDqfDeterministicTimestamp(driverId, dayOffset = 0) {
  const ord = driverOrdinal(driverId);
  const d = new Date(Date.UTC(2026, 0, 10 + ((ord + dayOffset) % 28), 14 + (ord % 5), (ord * 3) % 60, 0, 0));
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/**
 * @param {string} driverId
 * @param {string} eligibilityStatus ready | needs_review | blocked
 */
export function getDqfSyntheticReviewNotes(driverId, eligibilityStatus) {
  const ord = driverOrdinal(driverId);
  const base =
    eligibilityStatus === "blocked"
      ? "DQF review held — resolve hard blockers before next dispatch assignment."
      : eligibilityStatus === "needs_review"
        ? "DQF file substantively complete; soft warnings require documented follow-up."
        : "DQF credential stack aligned with BOF canonical document index for this driverId.";
  return `${base} (demo note #${ord})`;
}

/**
 * @param {{ role: string; name: string; title: string; signedAt: string; status: string; signatureText: string }} p
 */
export function getDqfSignatureBlockHtml(p) {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  return `
<div class="sig-block">
  <div class="sig-role">${esc(p.role)}</div>
  <div class="sig-script">${esc(p.signatureText)}</div>
  <div class="sig-meta">${esc(p.name)} — ${esc(p.title)}</div>
  <div class="sig-line"></div>
  <div class="sig-date">${esc(p.signedAt)}</div>
  <div class="sig-status">${esc(p.status)}</div>
</div>`.trim();
}
