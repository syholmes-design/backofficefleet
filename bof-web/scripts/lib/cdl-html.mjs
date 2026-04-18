/**
 * Unified demo CDL HTML (card layout). State styling: OH, IL, GA, TX.
 * Watermark: subtle geometry + state-name microtext only (no carrier branding in body).
 */

export const CDL_STATE_BY_DRIVER = {
  "DRV-001": "OH",
  "DRV-002": "IL",
  "DRV-003": "GA",
  "DRV-004": "OH",
  "DRV-005": "OH",
  "DRV-006": "TX",
  "DRV-007": "OH",
  "DRV-008": "OH",
  "DRV-009": "OH",
  "DRV-010": "IL",
  "DRV-011": "GA",
  "DRV-012": "OH",
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(rawIso) {
  const raw = String(rawIso ?? "").trim();
  if (!raw) return { iso: "", display: "" };
  const d = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { iso: escapeHtml(raw), display: escapeHtml(raw) };
  const isoOut = d.toISOString().slice(0, 10);
  const display = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
  return { iso: escapeHtml(isoOut), display: escapeHtml(display) };
}

function classLine(licenseClass) {
  const lc = String(licenseClass ?? "").trim();
  if (lc === "Class A") return "A &mdash; Combination";
  if (lc === "Class B") return "B &mdash; Straight truck / bus";
  if (lc === "Class C") return "C &mdash; Passenger / hazmat (as applicable)";
  return escapeHtml(lc || "—");
}

function stateWatermarkPhrase(state) {
  const m = {
    OH: "STATE OF OHIO",
    IL: "STATE OF ILLINOIS",
    GA: "STATE OF GEORGIA",
    TX: "STATE OF TEXAS",
  };
  const p = m[state] ?? "DEMO";
  return escapeHtml(`${p} — `.repeat(28));
}

function themeClass(state) {
  return `theme-${String(state).toLowerCase()}`;
}

function sealSvg(state) {
  if (state === "TX") {
    return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="20" cy="20" r="17" stroke="#c9d6e5" stroke-width="1.5" fill="none"/>
              <path fill="#f8fafc" d="M20 10l2.2 6.8h7.1l-5.7 4.1 2.2 6.8L20 23.6l-5.8 4.1 2.2-6.8-5.7-4.1h7.1z"/>
            </svg>`;
  }
  const cfg = {
    OH: { stroke: "#cbd5e1", fill: "#f1f5f9", code: "OH", fs: 11 },
    IL: { stroke: "#c8d4e0", fill: "#c8d4e0", code: "IL", fs: 11 },
    GA: { stroke: "#ca8a04", fill: "#fefce8", code: "GA", fs: 10 },
  };
  const c = cfg[state] ?? cfg.OH;
  return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="20" cy="20" r="17" stroke="${c.stroke}" stroke-width="1.5"/>
              <text x="20" y="24" text-anchor="middle" fill="${c.fill}" font-size="${c.fs}" font-weight="800">${c.code}</text>
            </svg>`;
}

function shapeSvg(state) {
  const paths = {
    OH: `<svg class="cdl-shape" viewBox="0 0 64 88" fill="currentColor" style="color:var(--p)" aria-hidden="true">
          <path d="M8 10 L48 6 L56 32 L50 78 L18 82 L6 48 Z"/>
        </svg>`,
    IL: `<svg class="cdl-shape" viewBox="0 0 60 80" fill="currentColor" style="color:var(--p)" aria-hidden="true">
          <path d="M8 6 L52 4 L56 28 L48 52 L38 76 L12 72 L4 44 Z"/>
        </svg>`,
    GA: `<svg class="cdl-shape" viewBox="0 0 70 90" fill="currentColor" style="color:var(--p)" aria-hidden="true">
          <path d="M10 8 L58 6 L62 22 L55 48 L48 78 L22 84 L6 52 L8 28 Z"/>
        </svg>`,
    TX: `<svg class="cdl-shape" viewBox="0 0 90 85" fill="currentColor" style="color:var(--p)" aria-hidden="true">
          <path d="M8 12 L78 8 L84 38 L76 58 L70 78 L24 82 L10 62 L6 36 Z"/>
        </svg>`,
  };
  return paths[state] ?? paths.OH;
}

function barcodeColors(state) {
  const m = {
    OH: { bg: "#f8fafc", fill: "#0f3566" },
    IL: { bg: "#f8fafc", fill: "#0f172a" },
    GA: { bg: "#f0fdf4", fill: "#14532d" },
    TX: { bg: "#f8fafc", fill: "#0f2942" },
  };
  return m[state] ?? m.OH;
}

function qrFill(state) {
  return { OH: "#0f3566", IL: "#0c2340", GA: "#14532d", TX: "#0f2942" }[state] ?? "#0f172a";
}

function stateHeadline(state) {
  return { OH: "OHIO", IL: "ILLINOIS", GA: "GEORGIA", TX: "TEXAS" }[state] ?? "DEMO";
}

/** @param {{ id: string, name: string, address: string, phone: string, email: string }} driver */
/** @param {{ driverId: string, cdlNumber?: string, licenseClass?: string, cdlIssueDate?: string, cdlExpiration?: string, cdlEndorsements?: string, cdlRestrictions?: string }} doc */
/** @param {'OH'|'IL'|'GA'|'TX'} state */
export function buildStateCdlHtml(driver, doc, state) {
  const id = doc.driverId;
  const name = escapeHtml(driver?.name ?? id);
  const photo = `/images/drivers/${escapeHtml(id)}.png`;
  const addr = escapeHtml(driver?.address ?? "");
  const phone = escapeHtml(driver?.phone ?? "");
  const email = escapeHtml(driver?.email ?? "");
  const lic = escapeHtml(String(doc.cdlNumber ?? "").trim());
  const endorse = escapeHtml(String(doc.cdlEndorsements ?? "").trim() || "—");
  const restr = escapeHtml(String(doc.cdlRestrictions ?? "").trim() || "—");
  const issue = formatDate(doc.cdlIssueDate);
  const exp = formatDate(doc.cdlExpiration || doc.expirationDate);
  const cls = classLine(doc.licenseClass);
  const tc = themeClass(state);
  const wm = stateWatermarkPhrase(state);
  const seal = sealSvg(state);
  const shape = shapeSvg(state);
  const { bg: bcBg, fill: bcFill } = barcodeColors(state);
  const qf = qrFill(state);
  const headline = stateHeadline(state);

  const title = `CDL — ${escapeHtml(driver?.name ?? id)} · ${headline} · ${escapeHtml(id)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 20px; background: #e2e8f0;
      font-family: system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a; font-size: 13px; line-height: 1.4;
    }
    .sheet { max-width: 720px; margin: 0 auto; }
    .legal {
      text-align: center; font-size: 11px; color: #64748b; margin-top: 14px;
    }
    .cdl-card {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06);
    }
    .cdl-watermark {
      position: absolute; inset: 0; pointer-events: none;
    }
    .cdl-micro {
      position: absolute; inset: 0; pointer-events: none;
      font-size: 8px; padding: 10px; line-height: 11px;
      overflow: hidden; word-break: break-all;
    }
    .cdl-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 12px;
      padding: 14px 18px;
      color: #f8fafc;
      position: relative;
    }
    .cdl-head::after {
      content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
      opacity: .4;
    }
    .cdl-head-main { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
    .cdl-seal {
      width: 52px; height: 52px; border-radius: 50%;
      display: grid; place-items: center;
      background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.22), transparent 50%);
      flex-shrink: 0;
    }
    .cdl-seal svg { width: 36px; height: 36px; }
    .cdl-state { font-size: 11px; font-weight: 800; letter-spacing: .18em; opacity: .95; }
    .cdl-title { font-size: 1.05rem; font-weight: 700; margin-top: 2px; letter-spacing: .02em; }
    .cdl-sub { font-size: 10px; opacity: .88; margin-top: 2px; }
    .cdl-body { display: grid; grid-template-columns: 128px 1fr; gap: 16px; padding: 16px 18px; position: relative; }
    .cdl-shape {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      width: 72px; height: 100px; opacity: .06; pointer-events: none;
    }
    .theme-ga .cdl-shape { right: 8px; top: 42%; transform: translateY(-50%) rotate(-8deg); width: 64px; height: 88px; }
    .theme-tx .cdl-shape { right: 6px; top: 48%; width: 78px; height: 74px; }
    .cdl-photo-wrap {
      width: 120px; height: 150px; border-radius: 8px; overflow: hidden;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.85);
    }
    .cdl-photo-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cdl-grid {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 20px;
    }
    .cdl-f { display: flex; flex-direction: column; gap: 2px; }
    .cdl-f label { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 600; }
    .cdl-f span { font-weight: 600; font-size: 13px; }
    .cdl-f .mono { font-family: ui-monospace, monospace; letter-spacing: .04em; }
    .cdl-wide { grid-column: 1 / -1; }
    .cdl-strip {
      display: flex; flex-wrap: wrap; gap: 12px 24px; padding: 12px 18px;
      border-top: 1px solid #e2e8f0;
    }
    .cdl-footer {
      display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
      padding: 12px 18px 16px; border-top: 1px dashed #cbd5e1;
    }
    .cdl-sig { flex: 1; min-width: 0; }
    .cdl-sig .line { border-bottom: 1px solid #334155; height: 28px; margin-bottom: 4px;
      font-family: "Segoe Script", "Brush Script MT", cursive; font-size: 18px; color: #1e293b;
      padding-left: 4px; }
    .cdl-sig small { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: .06em; }
    .cdl-bc { flex-shrink: 0; }
    .cdl-bc svg { display: block; height: 36px; }
    .cdl-qr { flex-shrink: 0; width: 56px; height: 56px; border: 1px solid #cbd5e1;
      border-radius: 4px; padding: 3px; background: #fff; }
    .cdl-qr svg { display: block; width: 100%; height: 100%; }

    /* Ohio */
    .theme-oh.cdl-card {
      --p: #0f3566;
      --p2: #1a4480;
      --accent: #bf0a30;
      background: linear-gradient(145deg, #fafcff 0%, #eef4fc 100%);
      border-top: 3px solid var(--accent);
    }
    .theme-oh .cdl-watermark {
      opacity: .05;
      background-image:
        repeating-linear-gradient(-38deg, transparent, transparent 11px, var(--p) 11px, var(--p) 12px),
        repeating-linear-gradient(52deg, transparent, transparent 18px, rgba(191,10,48,.12) 18px, rgba(191,10,48,.12) 19px);
    }
    .theme-oh .cdl-micro { opacity: .04; color: var(--p); }
    .theme-oh .cdl-head {
      background: linear-gradient(90deg, var(--p) 0%, var(--p2) 100%);
    }
    .theme-oh .cdl-head::after {
      background: linear-gradient(90deg, #e2e8f0, #fff, #e2e8f0);
    }
    .theme-oh .cdl-seal { border: 3px solid #cbd5e1; }
    .theme-oh .cdl-strip {
      background: linear-gradient(180deg, rgba(15,53,102,.07), rgba(15,53,102,.03));
    }
    .theme-oh .cdl-strip .cdl-f label { color: var(--p2); }
    .theme-oh .cdl-photo-wrap { border: 2px solid #cbd5e1; background: #e2e8f0; }
    .theme-oh .cdl-footer { background: #f8fafc; }

    /* Illinois */
    .theme-il.cdl-card {
      --p: #0c2340;
      --p2: #1a4a7a;
      --accent: #c8d4e0;
      background: linear-gradient(145deg, #f8fafc 0%, #eef2f7 100%);
    }
    .theme-il .cdl-watermark {
      opacity: .065;
      background-image:
        repeating-linear-gradient(-45deg, transparent, transparent 8px, var(--p) 8px, var(--p) 9px),
        repeating-linear-gradient(45deg, transparent, transparent 12px, var(--p2) 12px, var(--p2) 13px);
    }
    .theme-il .cdl-micro { opacity: .038; color: var(--p); }
    .theme-il .cdl-head {
      background: linear-gradient(90deg, var(--p) 0%, var(--p2) 100%);
      color: #f1f5f9;
    }
    .theme-il .cdl-head::after {
      background: linear-gradient(90deg, var(--accent), #fff, var(--accent));
    }
    .theme-il .cdl-seal { border: 3px solid var(--accent); }
    .theme-il .cdl-strip {
      background: linear-gradient(180deg, rgba(12,35,64,.06), rgba(12,35,64,.03));
    }
    .theme-il .cdl-strip .cdl-f label { color: var(--p2); }
    .theme-il .cdl-photo-wrap { border: 2px solid #cbd5e1; background: #e2e8f0; }
    .theme-il .cdl-footer { background: #f8fafc; }

    /* Georgia */
    .theme-ga.cdl-card {
      --p: #14532d;
      --p2: #166534;
      --accent: #ca8a04;
      background: linear-gradient(165deg, #fafdf8 0%, #f0f4ec 100%);
    }
    .theme-ga .cdl-watermark {
      opacity: .055;
      background-image:
        repeating-linear-gradient(0deg, transparent, transparent 14px, var(--p) 14px, var(--p) 15px),
        repeating-linear-gradient(90deg, transparent, transparent 18px, var(--p2) 18px, var(--p2) 19px);
    }
    .theme-ga .cdl-micro { opacity: .04; color: var(--p); }
    .theme-ga .cdl-head {
      background: linear-gradient(100deg, var(--p) 0%, var(--p2) 55%, #15803d 100%);
      color: #fefce8;
    }
    .theme-ga .cdl-head::after {
      background: linear-gradient(90deg, var(--accent), #fde047, var(--accent));
      opacity: .55;
    }
    .theme-ga .cdl-seal { border: 3px solid var(--accent); }
    .theme-ga .cdl-strip {
      background: linear-gradient(180deg, rgba(20,83,45,.06), rgba(20,83,45,.025));
    }
    .theme-ga .cdl-strip .cdl-f label { color: var(--p2); }
    .theme-ga .cdl-photo-wrap { border: 2px solid #bbf7d0; background: #ecfdf5; }
    .theme-ga .cdl-footer { background: #f7fee7; }

    /* Texas */
    .theme-tx.cdl-card {
      --p: #0f2942;
      --p2: #1e3a5f;
      --accent: #c9d6e5;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border-left: 5px solid #9b2335;
    }
    .theme-tx .cdl-watermark {
      opacity: .045;
      background-image: radial-gradient(circle at 20% 30%, var(--p) 0.5px, transparent 0.5px);
      background-size: 10px 10px;
    }
    .theme-tx .cdl-micro { opacity: .036; color: var(--p); }
    .theme-tx .cdl-head {
      background: linear-gradient(88deg, var(--p) 0%, var(--p2) 100%);
      color: #e2e8f0;
    }
    .theme-tx .cdl-head::after { display: none; }
    .theme-tx .cdl-seal { border: 3px solid var(--accent); }
    .theme-tx .cdl-strip {
      background: linear-gradient(180deg, rgba(15,41,66,.05), rgba(15,41,66,.02));
    }
    .theme-tx .cdl-strip .cdl-f label { color: var(--p2); }
    .theme-tx .cdl-photo-wrap { border: 2px solid #94a3b8; background: #e2e8f0; }
    .theme-tx .cdl-footer { background: #f8fafc; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="cdl-card ${tc}" aria-label="Synthetic ${headline} CDL demo">
      <div class="cdl-watermark" aria-hidden="true"></div>
      <div class="cdl-micro" aria-hidden="true">${wm}</div>
      <header class="cdl-head">
        <div class="cdl-head-main">
          <div class="cdl-seal" aria-hidden="true">${seal}</div>
          <div>
            <div class="cdl-state">${headline}</div>
            <div class="cdl-title">Commercial Driver License</div>
            <div class="cdl-sub">${escapeHtml(String(doc.licenseClass ?? "Class A").trim())} &middot; Demo credential</div>
          </div>
        </div>
      </header>
      <div class="cdl-body">
        ${shape}
        <div class="cdl-photo-wrap">
          <img src="${photo}" width="120" height="150" alt=""/>
        </div>
        <div>
          <div class="cdl-grid">
            <div class="cdl-f cdl-wide">
              <label>Full name</label>
              <span>${name}</span>
            </div>
            <div class="cdl-f">
              <label>License number</label>
              <span class="mono">${lic}</span>
            </div>
            <div class="cdl-f">
              <label>Driver ID</label>
              <span class="mono">${escapeHtml(id)}</span>
            </div>
            <div class="cdl-f cdl-wide">
              <label>Address</label>
              <span>${addr}</span>
            </div>
            <div class="cdl-f">
              <label>Issue date</label>
              <span>${issue.display ? `<time datetime="${issue.iso}">${issue.display}</time>` : "—"}</span>
            </div>
            <div class="cdl-f">
              <label>Expiration</label>
              <span>${exp.display ? `<time datetime="${exp.iso}">${exp.display}</time>` : "—"}</span>
            </div>
            <div class="cdl-f">
              <label>Class</label>
              <span>${cls}</span>
            </div>
            <div class="cdl-f">
              <label>Endorsements</label>
              <span>${endorse}</span>
            </div>
            <div class="cdl-f">
              <label>Restrictions</label>
              <span>${restr}</span>
            </div>
            <div class="cdl-f">
              <label>Self-certification</label>
              <span>Non-excepted interstate</span>
            </div>
          </div>
        </div>
      </div>
      <div class="cdl-strip">
        <div class="cdl-f"><label>Phone</label><span>${phone}</span></div>
        <div class="cdl-f"><label>Email</label><span>${email}</span></div>
      </div>
      <div class="cdl-footer">
        <div class="cdl-sig">
          <div class="line">${name}</div>
          <small>Holder signature (synthetic)</small>
        </div>
        <div class="cdl-bc" aria-hidden="true">
          <svg width="140" height="36" xmlns="http://www.w3.org/2000/svg">
            <rect width="140" height="36" fill="${bcBg}"/>
            <g fill="${bcFill}">
              <rect x="2" y="4" width="2" height="28"/><rect x="6" y="8" width="1" height="24"/><rect x="9" y="6" width="3" height="26"/>
              <rect x="14" y="10" width="2" height="22"/><rect x="18" y="4" width="1" height="28"/><rect x="21" y="7" width="2" height="23"/>
              <rect x="25" y="5" width="4" height="27"/><rect x="31" y="9" width="2" height="21"/><rect x="35" y="4" width="1" height="28"/>
              <rect x="38" y="6" width="3" height="24"/><rect x="43" y="8" width="2" height="22"/><rect x="47" y="5" width="2" height="25"/>
              <rect x="51" y="7" width="1" height="23"/><rect x="54" y="4" width="3" height="28"/><rect x="59" y="9" width="2" height="21"/>
              <rect x="63" y="6" width="2" height="24"/><rect x="67" y="5" width="4" height="27"/><rect x="73" y="8" width="1" height="22"/>
              <rect x="76" y="4" width="2" height="28"/><rect x="80" y="7" width="3" height="23"/><rect x="85" y="5" width="2" height="25"/>
              <rect x="89" y="10" width="2" height="20"/><rect x="93" y="4" width="1" height="28"/><rect x="96" y="6" width="3" height="24"/>
              <rect x="101" y="8" width="2" height="22"/><rect x="105" y="5" width="2" height="25"/><rect x="109" y="7" width="4" height="23"/>
              <rect x="115" y="4" width="1" height="28"/><rect x="118" y="9" width="2" height="21"/><rect x="122" y="6" width="3" height="24"/>
              <rect x="127" y="5" width="2" height="25"/><rect x="131" y="8" width="1" height="22"/><rect x="134" y="4" width="4" height="28"/>
            </g>
          </svg>
        </div>
        <div class="cdl-qr" aria-hidden="true">
          <svg viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect width="21" height="21" fill="#fff"/>
            <g fill="${qf}">
              <rect x="1" y="1" width="7" height="7"/><rect x="13" y="1" width="7" height="7"/><rect x="1" y="13" width="7" height="7"/>
              <rect x="9" y="9" width="3" height="3"/><rect x="13" y="13" width="2" height="2"/><rect x="16" y="16" width="2" height="2"/>
              <rect x="10" y="1" width="1" height="5"/><rect x="12" y="3" width="1" height="3"/><rect x="9" y="14" width="4" height="1"/>
            </g>
          </svg>
        </div>
      </div>
    </div>
    <p class="legal">Demo document — not government-issued</p>
  </div>
</body>
</html>`;
}

export function cdlStateForDriverId(driverId) {
  return CDL_STATE_BY_DRIVER[driverId] ?? "OH";
}
