# Dispatch Board v2 Spec — Next.js Adaptation Notice

This file is the controlling source of truth for the BackOfficeFleet Dispatch Board v2 implementation.

The original spec below was written as a single-file HTML application. For the BOF demo repo, Windsurf must adapt the design, data, checklists, modals, tabs, document wiring, photo packet, and behavior into the existing Next.js app as a **second dispatch page**.

## Non-Negotiable Implementation Guardrails

1. **Do not replace the current dispatch page.** Create a separate route, preferably `app/(bof)/dispatch-v2/page.tsx`, exposed as `/dispatch-v2`.
2. **Do not truncate this spec.** Every required section, data record, modal, tab, checklist group, photo zone, and validation item must be accounted for.
3. **Do not invent a different dispatch board.** Adapt this spec faithfully into React/TypeScript/Tailwind.
4. **Do not silently alter locked data.** Preserve the 12 loads, KPI values, statuses, BOLs, RCs, POs, seal values, miles, revenues, and settlement hold values.
5. **Do not fake completed document wiring.** Link existing generated docs only when real files exist. Otherwise show `Template ready / not generated yet`.
6. **Do not fake completed photo assets.** Wire the intended image paths, but use safe fallbacks if files are missing.
7. **Do not stop after drafting.** Implement files, run validation, and report changed files.
8. **Do not push unless explicitly instructed.**

## Recommended Next.js File Targets

- `app/(bof)/dispatch-v2/page.tsx`
- `components/dispatch-v2/DispatchV2Page.tsx`
- `components/dispatch-v2/DispatchKpiRow.tsx`
- `components/dispatch-v2/DispatchFilterBar.tsx`
- `components/dispatch-v2/DispatchTable.tsx`
- `components/dispatch-v2/LoadDetailModal.tsx`
- `components/dispatch-v2/PreTripPacketModal.tsx`
- `components/dispatch-v2/SignaturePad.tsx`
- `lib/dispatch-v2-demo-data.ts`
- `docs/dispatch-v2-image-prompts.md`

## Original Engineering Spec Follows

---

# BOF DISPATCH BOARD — WINDSURF ENGINEERING SPEC
## Version 1.0 | Single-File HTML Application

---

## ⚠️ WINDSURF EXECUTION RULES (READ BEFORE WRITING ANY CODE)

1. **NEVER truncate.** Every section marked `[REQUIRED]` must appear in the final output. If you are approaching a context limit, split output into numbered parts (Part 1/3, Part 2/3, etc.) and wait for the user to say "continue" before proceeding. Do NOT summarize, stub, or omit any section.
2. **NEVER drift.** Do not invent features, rename variables, change color values, or alter data. Every color hex, every field name, every load record, every checklist item is locked in this spec.
3. **NEVER use placeholders.** No `// TODO`, no `/* add content here */`, no `[INSERT DATA]`. Every array, every function, every DOM element must be fully implemented.
4. **Build in order.** Complete each PHASE fully before starting the next. Each phase ends with a `✅ PHASE COMPLETE` checkpoint comment in the code.
5. **One file output.** Deliver a single `index.html` file. All CSS is in a `<style>` block in `<head>`. All JavaScript is in a `<script>` block before `</body>`. No external files except the Google Fonts `<link>` and Tailwind CDN `<script>`.
6. **Self-test before delivering.** After writing all code, mentally trace: (a) Do all 12 loads render in the table? (b) Does clicking "Pre-Trip" open the modal for the correct load? (c) Do all 5 tabs switch correctly? (d) Does the progress bar update as checkboxes are checked? (e) Does the signature canvas draw on mouse drag? If any answer is no — fix it before delivering.

---

## PHASE 0 — FILE SCAFFOLD [REQUIRED]

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BOF Operations Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* === PHASE 1: DESIGN TOKENS === */
    /* === PHASE 2: GLOBAL BASE === */
    /* === PHASE 3: COMPONENT STYLES === */
  </style>
</head>
<body>
  <!-- === PHASE 4: NAV BAR === -->
  <!-- === PHASE 5: KPI ROW === -->
  <!-- === PHASE 6: FILTER BAR === -->
  <!-- === PHASE 7: DISPATCH TABLE === -->
  <!-- === PHASE 8: LOAD DETAIL MODAL === -->
  <!-- === PHASE 9: PRE-TRIP PACKET MODAL === -->
  <script>
    /* === PHASE 10: DATA LAYER === */
    /* === PHASE 11: TABLE ENGINE === */
    /* === PHASE 12: FILTER ENGINE === */
    /* === PHASE 13: LOAD DETAIL MODAL LOGIC === */
    /* === PHASE 14: PRE-TRIP MODAL LOGIC === */
    /* === PHASE 15: SIGNATURE PAD === */
    /* === PHASE 16: PROGRESS TRACKER === */
    /* === PHASE 17: CLOCK & INIT === */
  </script>
</body>
</html>
```

✅ Write the scaffold first, then fill each phase in order.

---

## PHASE 1 — DESIGN TOKENS (CSS :root) [REQUIRED]

Paste these exact values into `:root {}`. Do not alter any hex value.

```css
:root {
  --bg-base: #060d1a;
  --bg-card: #0d1b2e;
  --bg-card-hover: #111f35;
  --bg-surface: #162035;
  --border: rgba(255,255,255,0.08);
  --border-bright: rgba(99,179,237,0.3);
  --accent: #3b82f6;
  --accent-glow: rgba(59,130,246,0.4);
  --accent-dark: #1d4ed8;
  --gold: #f59e0b;
  --emerald: #10b981;
  --rose: #f43f5e;
  --amber: #fb923c;
  --purple: #a78bfa;
  --text-primary: #f0f6ff;
  --text-secondary: #8ba3c1;
  --text-muted: #4a6280;
}
```

✅ PHASE 1 COMPLETE

---

## PHASE 2 — GLOBAL BASE STYLES [REQUIRED]

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  min-height: 100vh;
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(16,185,129,0.05) 0%, transparent 50%),
    radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: auto, auto, 28px 28px;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--bg-surface); border-radius: 3px; }

/* Transitions */
* { transition-property: none; } /* reset — apply per-element below */

/* Card */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.card:hover {
  border-color: var(--border-bright);
  box-shadow: 0 4px 32px rgba(59,130,246,0.15);
}

/* Primary button */
.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(59,130,246,0.3);
  transition: filter 0.2s, transform 0.2s;
}
.btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }

/* Outline button */
.btn-outline {
  background: transparent;
  border: 1px solid var(--accent);
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  color: var(--accent);
  cursor: pointer;
  transition: background 0.2s;
}
.btn-outline:hover { background: rgba(59,130,246,0.1); }

/* Status badges */
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  font-weight: 600;
  font-size: 11px;
  padding: 4px 12px;
  white-space: nowrap;
}
.badge-delivered {
  background: rgba(16,185,129,0.15);
  color: #34d399;
  border: 1px solid rgba(52,211,153,0.3);
  box-shadow: 0 0 8px rgba(16,185,129,0.15);
}
.badge-in-transit {
  background: rgba(59,130,246,0.15);
  color: #60a5fa;
  border: 1px solid rgba(96,165,250,0.3);
  box-shadow: 0 0 8px rgba(59,130,246,0.2);
  animation: pulse-blue 2s infinite;
}
.badge-pending {
  background: rgba(251,146,60,0.15);
  color: #fb923c;
  border: 1px solid rgba(251,146,60,0.3);
  box-shadow: 0 0 8px rgba(251,146,60,0.15);
}

@keyframes pulse-blue {
  0%, 100% { box-shadow: 0 0 8px rgba(59,130,246,0.2); }
  50% { box-shadow: 0 0 16px rgba(59,130,246,0.5); }
}

/* Fade-in animation */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeInUp 0.4s ease forwards; }

/* Slide-in from right */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
.slide-in { animation: slideInRight 0.3s ease forwards; }
```

✅ PHASE 2 COMPLETE

---

## PHASE 3 — COMPONENT STYLES [REQUIRED]

Write CSS for these specific components. Do NOT skip any:

### 3A — Nav Bar
```css
#nav-bar {
  height: 64px;
  background: linear-gradient(135deg, #0a1628 0%, #0f2744 50%, #0a1e3d 100%);
  border-bottom: 1px solid rgba(59,130,246,0.2);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}
```

### 3B — KPI Cards
```css
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  padding: 24px;
}
@media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 640px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  opacity: 0; /* animated in via JS */
}
.kpi-number {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  margin: 8px 0 6px;
}
.kpi-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
```

### 3C — Filter Bar
```css
#filter-bar {
  margin: 0 24px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.filter-input {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: 8px;
  height: 38px;
  padding: 0 12px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.filter-input:focus { border-color: var(--accent); }
```

### 3D — Dispatch Table
```css
#table-container {
  margin: 0 24px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}
#dispatch-table { width: 100%; border-collapse: collapse; }
#dispatch-table thead {
  background: #0a1628;
  position: sticky;
  top: 64px;
}
#dispatch-table th {
  text-align: left;
  padding: 14px 16px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
#dispatch-table th:hover { color: var(--text-secondary); }
#dispatch-table td {
  padding: 14px 16px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  white-space: nowrap;
}
#dispatch-table tbody tr {
  cursor: pointer;
  transition: background 0.2s;
}
#dispatch-table tbody tr:hover { background: rgba(59,130,246,0.06); }

.pretrip-btn {
  background: rgba(59,130,246,0.1);
  border: 1px solid rgba(59,130,246,0.4);
  color: #60a5fa;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}
.pretrip-btn:hover { background: rgba(59,130,246,0.25); }
```

### 3E — Modal Overlay & Panel
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: none;
}
.modal-overlay.open { display: block; }
.modal-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(860px, 100vw);
  background: var(--bg-card);
  border-left: 1px solid var(--border-bright);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease;
}
.modal-header {
  background: linear-gradient(135deg, #0f2744, #1a3a6e);
  padding: 24px;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid rgba(59,130,246,0.2);
}
```

### 3F — Pre-Trip Tabs
```css
.tab-nav {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  flex-shrink: 0;
}
.tab-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.tab-btn.active {
  background: rgba(59,130,246,0.2);
  border-color: rgba(59,130,246,0.4);
  color: #60a5fa;
}
.tab-panel { display: none; padding: 24px; }
.tab-panel.active { display: block; }
```

### 3G — Checklist Items
```css
.check-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.check-item:last-child { border-bottom: none; }
.check-box {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border: 2px solid var(--border-bright);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-top: 1px;
}
.check-box.checked {
  background: var(--accent);
  border-color: var(--accent);
}
.check-box.checked::after {
  content: '✓';
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.check-label { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }
.check-label.checked { color: var(--text-muted); text-decoration: line-through; }
```

### 3H — Photo Zones
```css
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 600px) { .photo-grid { grid-template-columns: repeat(2, 1fr); } }

.photo-zone {
  border: 2px dashed rgba(59,130,246,0.3);
  border-radius: 12px;
  background: rgba(59,130,246,0.04);
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.photo-zone:hover {
  border-color: rgba(59,130,246,0.6);
  background: rgba(59,130,246,0.08);
}
.photo-zone.captured {
  border-color: rgba(16,185,129,0.5);
  background: rgba(16,185,129,0.05);
}
.photo-zone.captured::after {
  content: '✓ Captured';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16,185,129,0.15);
  border-radius: 10px;
  color: #34d399;
  font-weight: 700;
  font-size: 14px;
}
```

### 3I — Progress Bar
```css
.progress-bar-track {
  height: 6px;
  background: #1e3a5f;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 3px;
  transition: width 0.4s ease;
}
```

### 3J — Signature Canvas
```css
#sig-canvas {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border-bright);
  border-radius: 8px;
  cursor: crosshair;
  display: block;
  width: 100%;
  max-width: 400px;
  height: 120px;
}
```

### 3K — Section Headers (collapsible)
```css
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
  user-select: none;
}
.section-header .chevron {
  transition: transform 0.2s;
  color: var(--text-muted);
  font-size: 12px;
}
.section-header.collapsed .chevron { transform: rotate(-90deg); }
.section-body { margin-top: 4px; }
.section-body.collapsed { display: none; }
```

✅ PHASE 3 COMPLETE

---

## PHASE 4 — NAV BAR HTML [REQUIRED]

```html
<nav id="nav-bar">
  <div style="display:flex;align-items:center;gap:12px;">
    <!-- Truck SVG icon -->
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 4v4h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
    <div>
      <div style="font-size:22px;font-weight:800;color:#fff;line-height:1;">BOF</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1;">Operations Portal</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:20px;">
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="width:8px;height:8px;background:#10b981;border-radius:50%;display:inline-block;animation:pulse-blue 2s infinite;"></span>
      <span style="font-size:12px;font-weight:700;color:#34d399;letter-spacing:0.08em;">LIVE</span>
    </div>
    <div style="text-align:right;">
      <div id="live-clock" style="font-size:18px;font-weight:700;color:var(--text-primary);font-variant-numeric:tabular-nums;"></div>
      <div style="font-size:12px;color:var(--text-secondary);">Thu, May 14, 2026</div>
    </div>
    <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">DS</div>
  </div>
</nav>
```

✅ PHASE 4 COMPLETE

---

## PHASE 5 — KPI ROW HTML [REQUIRED]

Build 6 KPI cards. Computed values (use exactly):
- Total Loads: **12**
- Delivered: **7** (L-501, L-503, L-505, L-506, L-508, L-510, L-512)
- In Transit: **3** (L-502, L-507, L-511)
- Pending: **2** (L-504, L-509)
- Total Revenue: **$26,661**
- Total Miles: **6,927**

Each card uses class `kpi-card` and has a left border in its accent color. Apply `opacity:0` inline — JS will animate them in with staggered `.fade-in` class + delay.

Cards in order:
1. 🚛 TOTAL LOADS — accent `var(--accent)` — left border `var(--accent)`
2. ✅ DELIVERED — accent `var(--emerald)` — left border `var(--emerald)`
3. 🔄 IN TRANSIT — accent `#60a5fa` — left border `#60a5fa`
4. ⏳ PENDING — accent `var(--amber)` — left border `var(--amber)`
5. 💰 TOTAL REVENUE — accent `var(--gold)` — left border `var(--gold)`
6. 📍 TOTAL MILES — accent `var(--purple)` — left border `var(--purple)`

✅ PHASE 5 COMPLETE

---

## PHASE 6 — FILTER BAR HTML [REQUIRED]

```html
<div id="filter-bar">
  <!-- Search -->
  <div style="position:relative;flex:1;min-width:220px;">
    <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input id="search-input" class="filter-input" style="padding-left:32px;width:100%;" placeholder="Search loads, drivers, customers..." />
  </div>
  <!-- Status filter -->
  <select id="filter-status" class="filter-input">
    <option value="">All Statuses</option>
    <option value="DELIVERED">Delivered</option>
    <option value="IN_TRANSIT">In Transit</option>
    <option value="PENDING">Pending</option>
  </select>
  <!-- Customer filter -->
  <select id="filter-customer" class="filter-input">
    <option value="">All Customers</option>
    <!-- JS will populate dynamically -->
  </select>
  <!-- Driver filter -->
  <select id="filter-driver" class="filter-input">
    <option value="">All Drivers</option>
    <!-- JS will populate dynamically -->
  </select>
</div>
```

✅ PHASE 6 COMPLETE

---

## PHASE 7 — DISPATCH TABLE HTML [REQUIRED]

```html
<div id="table-container">
  <table id="dispatch-table">
    <thead>
      <tr>
        <th data-col="id">Load # <span class="sort-icon"></span></th>
        <th data-col="driver">Driver <span class="sort-icon"></span></th>
        <th data-col="customer">Customer <span class="sort-icon"></span></th>
        <th data-col="origin">Origin → Dest <span class="sort-icon"></span></th>
        <th data-col="commodity">Commodity <span class="sort-icon"></span></th>
        <th data-col="weight">Weight <span class="sort-icon"></span></th>
        <th data-col="miles">Miles <span class="sort-icon"></span></th>
        <th data-col="revenue">Revenue <span class="sort-icon"></span></th>
        <th data-col="status">Status <span class="sort-icon"></span></th>
        <th>Pre-Trip</th>
      </tr>
    </thead>
    <tbody id="table-body">
      <!-- JS renders all 12 rows -->
    </tbody>
  </table>
</div>
```

✅ PHASE 7 COMPLETE

---

## PHASE 8 — LOAD DETAIL MODAL HTML [REQUIRED]

```html
<div id="detail-overlay" class="modal-overlay">
  <div class="modal-panel" id="detail-panel">
    <div class="modal-header">
      <button onclick="closeDetail()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.1);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;">×</button>
      <div style="font-size:11px;color:var(--gold);letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">LOAD DETAIL</div>
      <div id="detail-load-id" style="font-size:28px;font-weight:800;color:#fff;margin:4px 0;"></div>
      <div id="detail-meta" style="font-size:13px;color:var(--text-secondary);"></div>
    </div>
    <div id="detail-body" style="padding:24px;"></div>
  </div>
</div>
```

The `detail-body` is populated by JS with organized sections:
- **Load Summary**: customer, consignee, origin/dest full addresses, commodity, weight, pallets, pieces, BOL, RC, PO, broker
- **Schedule**: pickup date, window, delivery date, window
- **Revenue Breakdown**: linehaul, fuel surcharge, detention, accessorial, lumper, **Total Revenue** (bold gold)
- **Seal & Proof**: seal numbers (pickup + delivery), seal status badge, proof status, POD status, settlement hold
- **Team**: truck, trailer, driver, dispatcher

Use info-row style: `display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:13px;`
Label: `color:var(--text-muted)` | Value: `color:var(--text-primary); font-weight:500`

✅ PHASE 8 COMPLETE

---

## PHASE 9 — PRE-TRIP PACKET MODAL HTML [REQUIRED]

```html
<div id="pretrip-overlay" class="modal-overlay">
  <div class="modal-panel" id="pretrip-panel">
    <!-- Sticky Header -->
    <div class="modal-header">
      <button onclick="closePretrip()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.1);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;">×</button>
      <div style="font-size:11px;color:var(--gold);letter-spacing:0.1em;text-transform:uppercase;font-weight:600;margin-bottom:4px;">PRE-TRIP INSPECTION PACKET</div>
      <div id="pt-load-id" style="font-size:28px;font-weight:800;color:#fff;"></div>
      <div id="pt-meta" style="font-size:13px;color:var(--text-secondary);margin-top:4px;"></div>
      <!-- Truck/Trailer chips -->
      <div id="pt-chips" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;"></div>
      <!-- Progress -->
      <div style="margin-top:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;">Packet Completion</span>
          <span id="pt-pct" style="font-size:13px;font-weight:700;color:var(--accent);">0%</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" id="pt-progress" style="width:0%;"></div>
        </div>
      </div>
    </div>
    <!-- Tab Nav -->
    <div class="tab-nav">
      <button class="tab-btn active" onclick="switchTab(0,this)">📄 Driver Docs</button>
      <button class="tab-btn" onclick="switchTab(1,this)">🚛 Vehicle Inspection</button>
      <button class="tab-btn" onclick="switchTab(2,this)">📸 Photo Packet</button>
      <button class="tab-btn" onclick="switchTab(3,this)">📦 Load Documents</button>
      <button class="tab-btn" onclick="switchTab(4,this)">✍️ Sign-Off</button>
    </div>
    <!-- Tab Panels (JS fills content) -->
    <div id="tab-0" class="tab-panel active"></div>
    <div id="tab-1" class="tab-panel"></div>
    <div id="tab-2" class="tab-panel"></div>
    <div id="tab-3" class="tab-panel"></div>
    <div id="tab-4" class="tab-panel"></div>
  </div>
</div>
```

✅ PHASE 9 COMPLETE

---

## PHASE 10 — DATA LAYER [REQUIRED]

Declare `const loads = [ ... ]` with ALL 12 objects. Each object must include every field listed below. Do not omit any field, do not use `...` shorthand, do not write "similar entries follow." Write all 12 in full.

**Required fields per load object:**
```
id, driver, driverId, customer, consignee,
origin, destination, originFull, destFull,
commodity, weight, pallets, pieces,
miles, revenue, driverPay,
status, pickupDate, deliveryDate,
pickupWindow, deliveryWindow,
truck, trailer, dispatcher,
broker, brokerMC, bol, rc, po,
sealPickup, sealDelivery, sealStatus,
proofStatus, podStatus,
linehaul, fuel, detention, accessorial, lumper,
settlementHold, pickupAddr, deliveryAddr
```

**All 12 load records (copy exactly):**

| id | driver | customer | origin | destination | commodity | weight | pallets | pieces | miles | revenue | driverPay | status | pickupDate | deliveryDate | truck | trailer | dispatcher | broker | brokerMC | bol | rc | po | sealPickup | sealDelivery | sealStatus | proofStatus | podStatus | linehaul | fuel | detention | accessorial | lumper | settlementHold |
|----|--------|----------|--------|-------------|-----------|--------|---------|--------|-------|---------|-----------|--------|------------|--------------|-------|---------|------------|--------|----------|-----|----|----|-----------|-------------|------------|-------------|-----------|----------|------|-----------|-------------|--------|----------------|
| L-501 | John Carter | Peachtree Foods | Cleveland, OH | Dallas, TX | Frozen Foods | 26,024 lbs | 19 | 456 | 240 | 2065 | 560 | DELIVERED | Jul 1, 2026 | Jul 2, 2026 | T-102 | TRL-2854 | Tina Brooks | BlueLine Logistics | MC-782104 | BOL-501-9935 | RC-501-204 | PO-84000 | SEAL-83921 | SEAL-83920 | MISMATCH | COMPLETE | RECEIVED | 1640 | 240 | 0 | 120 | 315 | NO |
| L-502 | Maria Lopez | Lakeside Plastics | Chicago, IL | Memphis, TN | Dry Groceries | 40,981 lbs | 25 | 675 | 297 | 1895 | 504 | IN_TRANSIT | Jul 3, 2026 | Jul 4, 2026 | T-101 | TRL-2559 | Jamal Reeves | Summit Freight | MC-641255 | BOL-502-5557 | RC-502-703 | PO-84001 | SEAL-55219 | SEAL-55219 | VERIFIED | COMPLETE | PENDING | 1476 | 216 | 50 | 58 | 0 | NO |
| L-503 | Alex Kim | Midwest Paper Co. | Columbus, OH | Indianapolis, IN | Plastic Resins | 21,169 lbs | 23 | 1081 | 354 | 2145 | 588 | DELIVERED | Jul 5, 2026 | Jul 6, 2026 | T-107 | TRL-2452 | Morgan Patel | IronRoute Transport | MC-518903 | BOL-503-5333 | RC-503-718 | PO-84002 | SEAL-77102 | — | PENDING | INCOMPLETE | RECEIVED | 1722 | 252 | 75 | 51 | 240 | YES |
| L-504 | Priya Patel | Sunbelt Beverages | Charlotte, NC | Savannah, GA | Building Materials | 19,501 lbs | 19 | 836 | 411 | 2038 | 546 | PENDING | Jul 7, 2026 | Jul 8, 2026 | T-108 | TRL-2396 | Avery Collins | NorthStar 3PL | MC-774221 | BOL-504-4814 | RC-504-181 | PO-84003 | SEAL-61044 | SEAL-61043 | MISMATCH | COMPLETE | RECEIVED | 1599 | 234 | 0 | 117 | 0 | NO |
| L-505 | Kenji Tanaka | Frontier Retail DC | Dallas, TX | Chicago, IL | Paper Products | 26,845 lbs | 19 | 779 | 468 | 2245 | 616 | DELIVERED | Jul 9, 2026 | Jul 10, 2026 | T-104 | TRL-2432 | Nina Harris | Pioneer Brokerage | MC-699114 | BOL-505-1916 | RC-505-963 | PO-84004 | SEAL-44018 | SEAL-44018 | VERIFIED | COMPLETE | PENDING | 1804 | 264 | 25 | 107 | 0 | NO |
| L-506 | Marcus Chen | Ozark Building Supply | Springfield, MO | Nashville, TN | Consumer Packaged Goods | 30,964 lbs | 26 | 624 | 525 | 2122 | 574 | DELIVERED | Jul 11, 2026 | Jul 12, 2026 | T-103 | TRL-2371 | Tina Brooks | BlueLine Logistics | MC-782104 | BOL-506-5040 | RC-506-242 | PO-84005 | SEAL-99871 | — | PENDING | COMPLETE | RECEIVED | 1681 | 246 | 0 | 123 | 315 | NO |
| L-507 | Sofia Gomez | Prairie Grain Co. | Omaha, NE | Pittsburgh, PA | Beverages | 30,608 lbs | 24 | 936 | 582 | 2358 | 644 | IN_TRANSIT | Jul 13, 2026 | Jul 14, 2026 | T-109 | TRL-2579 | Jamal Reeves | Summit Freight | MC-641255 | BOL-507-5119 | RC-507-641 | PO-84006 | SEAL-73005 | SEAL-73099 | MISMATCH | INCOMPLETE | RECEIVED | 1886 | 276 | 50 | 88 | 315 | YES |
| L-508 | Liam Smith | Peachtree Foods | Atlanta, GA | Phoenix, AZ | Auto Parts | 34,403 lbs | 17 | 612 | 639 | 1831 | 490 | DELIVERED | Jul 15, 2026 | Jul 16, 2026 | T-110 | TRL-2208 | Morgan Patel | IronRoute Transport | MC-518903 | BOL-508-5889 | RC-508-991 | PO-84007 | SEAL-18542 | SEAL-18542 | VERIFIED | COMPLETE | PENDING | 1435 | 210 | 75 | 30 | 315 | NO |
| L-509 | Emma Brown | Lakeside Plastics | Cleveland, OH | Dallas, TX | Frozen Foods | 20,806 lbs | 27 | 1242 | 696 | 2449 | 672 | PENDING | Jul 17, 2026 | Jul 18, 2026 | T-111 | TRL-2170 | Avery Collins | NorthStar 3PL | MC-774221 | BOL-509-9727 | RC-509-878 | PO-84008 | SEAL-26790 | SEAL-26791 | MISMATCH | COMPLETE | RECEIVED | 1967 | 288 | 0 | 145 | 125 | NO |
| L-510 | Noah Wilson | Midwest Paper Co. | Columbus, OH | Memphis, TN | Dry Groceries | 31,074 lbs | 23 | 782 | 753 | 1977 | 532 | DELIVERED | Jul 19, 2026 | Jul 20, 2026 | T-105 | TRL-2629 | Nina Harris | Pioneer Brokerage | MC-699114 | BOL-510-2982 | RC-510-562 | PO-84009 | SEAL-48113 | — | PENDING | COMPLETE | RECEIVED | 1558 | 228 | 25 | 89 | 125 | NO |
| L-511 | Olivia Lee | Sunbelt Beverages | Charlotte, NC | Atlanta, GA | Plastic Resins | 41,702 lbs | 27 | 729 | 810 | 2313 | 630 | IN_TRANSIT | Jul 21, 2026 | Jul 22, 2026 | T-112 | TRL-2584 | Tina Brooks | BlueLine Logistics | MC-782104 | BOL-511-7669 | RC-511-926 | PO-84010 | SEAL-91420 | SEAL-91420 | VERIFIED | INCOMPLETE | PENDING | 1845 | 270 | 0 | 135 | 125 | YES |
| L-512 | Unassigned | Frontier Retail DC | Dallas, TX | St. Louis, MO | Building Materials | 41,862 lbs | 22 | 990 | 867 | 2219 | 602 | DELIVERED | Jul 23, 2026 | Jul 24, 2026 | T-106 | TRL-2211 | Jamal Reeves | Summit Freight | MC-641255 | BOL-512-4139 | RC-512-354 | PO-84011 | SEAL-35864 | SEAL-35860 | MISMATCH | COMPLETE | RECEIVED | 1763 | 258 | 50 | 79 | 315 | NO |

✅ PHASE 10 COMPLETE

---

## PHASE 11 — TABLE ENGINE [REQUIRED]

Write these functions completely. No stubs.

**`renderTable(data)`** — clears `#table-body` innerHTML, iterates `data`, creates one `<tr>` per load with:
- `td` for: id, driver, customer, `${origin} → ${destination}`, commodity, weight, miles, `$${revenue.toLocaleString()}`, status badge, pretrip button
- Status badge: use CSS classes `badge badge-delivered` / `badge badge-in-transit` / `badge badge-pending`. Display text: "DELIVERED" / "IN TRANSIT" / "PENDING"
- Row `onclick`: `openDetail(load.id)` — BUT pretrip button `onclick` must call `openPretrip(load.id)` and call `event.stopPropagation()` to prevent row click from also firing

**`populateFilters()`** — reads unique values of `customer` and `driver` from `loads` array, appends `<option>` elements to `#filter-customer` and `#filter-driver`

**`applyFilters()`** — reads values from `#search-input`, `#filter-status`, `#filter-customer`, `#filter-driver`. Filters `loads` array. Calls `renderTable(filtered)`.

Wire events: `addEventListener('input', applyFilters)` on search input. `addEventListener('change', applyFilters)` on all selects.

**Sort state**: `let sortCol = null, sortDir = 1;`
Each `th[data-col]` gets click handler: toggles direction if same col, resets to 1 if new col. Sorts current filtered array. Updates sort icon (▲/▼). Calls `renderTable`.

✅ PHASE 11 COMPLETE

---

## PHASE 12 — LOAD DETAIL MODAL LOGIC [REQUIRED]

**`openDetail(loadId)`**:
1. Find load by id in `loads`
2. Set `#detail-load-id` innerHTML to load.id
3. Set `#detail-meta` to `${load.driver} · ${load.truck} · ${load.trailer}`
4. Build `#detail-body` innerHTML with 5 info sections (Load Summary, Schedule, Revenue Breakdown, Seal & Proof, Team). Use info-row style for each field
5. Set `#detail-overlay` classList to include `open`

**`closeDetail()`**: removes `open` from `#detail-overlay`. Click on overlay background (not panel) also closes.

Revenue breakdown must show: linehaul `$${load.linehaul}`, fuel surcharge `$${load.fuel}`, detention `$${load.detention}`, accessorial `$${load.accessorial}`, lumper `$${load.lumper}`, then a divider and **Total: `$${load.revenue.toLocaleString()}`** in bold gold.

Settlement hold badge: if `YES` → red badge "⚠ HOLD"; if `NO` → green badge "✓ CLEAR".

✅ PHASE 12 COMPLETE

---

## PHASE 13 — PRE-TRIP MODAL LOGIC [REQUIRED]

### Global state
```js
let currentPretripLoad = null;
let checkedItems = {};    // key: itemId, value: boolean
let capturedPhotos = {};  // key: photoId, value: boolean
```

**`openPretrip(loadId)`**:
1. Set `currentPretripLoad` = load found by id
2. Reset `checkedItems = {}` and `capturedPhotos = {}`
3. Set `#pt-load-id` text to load.id
4. Set `#pt-meta` to `${load.driver} · ${load.driverId}`
5. Set `#pt-chips` to 3 chips: Truck: `${load.truck}` | Trailer: `${load.trailer}` | Date: May 14, 2026
6. Call `buildTab0()`, `buildTab1()`, `buildTab2()`, `buildTab3()`, `buildTab4()`
7. Call `switchTab(0)` to show tab 0
8. Call `updateProgress()`
9. Show `#pretrip-overlay` (add class `open`)

**`closePretrip()`**: removes `open` from `#pretrip-overlay`

**`switchTab(index, btnEl)`**:
- Removes `active` from all `.tab-panel` and `.tab-btn`
- Adds `active` to `#tab-${index}` and `btnEl`

**`updateProgress()`**:
- Count total checkboxes = Object.keys generated for all checklist items
- Count total photos = 9
- Total trackable = checklist count + 9
- Checked = Object.values(checkedItems).filter(Boolean).length + Object.values(capturedPhotos).filter(Boolean).length
- Pct = Math.round(checked / total * 100)
- Set `#pt-progress` width to `${pct}%`
- Set `#pt-pct` text to `${pct}%`

### Checklist builder helpers
Write `makeCheckItem(id, label)` — returns an HTML string for a `.check-item` div. On click, toggle `checkedItems[id]`, update UI, call `updateProgress()`.

Write `makeSection(title, items)` — returns a collapsible section with header and list of check items. Header click toggles `.collapsed` on header and body.

### `buildTab0()` — Driver Documents [REQUIRED — write all items]
Two sections:

**DRIVER CREDENTIALS** (5 items):
- `cdl` — Commercial Driver's License (CDL-A) — Valid & on person
- `medcert` — USDOT Medical Certificate — Current & not expired
- `eld` — Driver ELD / Hours of Service Log — Reviewed & reset
- `clearinghouse` — Drug & Alcohol Clearinghouse Auth — Confirmed
- `badge` — Driver ID / Company Badge — Present

**REGULATORY** (3 items):
- `drugtest` — FMCSA Drug Test Clearance — On file
- `authority` — Motor Carrier Authority — Verified
- `permits` — State-Specific Permits (if required) — N/A or confirmed

### `buildTab1()` — Vehicle Inspection [REQUIRED — write all items]

Use 2-column grid on desktop for the tractor sections. Write ALL items exactly:

**ENGINE & UNDER HOOD** (6):
- `oil` — Engine oil level — Adequate
- `coolant` — Coolant level — Full, no leaks
- `ps_fluid` — Power steering fluid — Adequate
- `belts` — Belts & hoses — No cracks or fraying
- `battery` — Battery — Secure, terminals clean
- `air_filter` — Air filter — Not clogged

**TIRES & WHEELS (Tractor)** (4):
- `tread` — Tread depth ≥ 4/32" steering / ≥ 2/32" drive
- `inflation` — Tire inflation — Properly inflated, no bulges
- `lug_nuts` — Lug nuts — All present and tight
- `valve_stems` — Valve stems — Caps present

**BRAKES** (4):
- `svc_brake` — Service brakes — Functional, no sponge or pull
- `park_brake` — Parking/Emergency brake — Engages and holds
- `air_lines` — Air lines — No leaks, proper connection
- `air_psi` — Air pressure builds to 100 PSI within 2 min

**LIGHTS & SIGNALS** (6):
- `headlights` — Headlights (high & low beam) — Functioning
- `brake_lights` — Brake lights — Functioning
- `turn_signals` — Turn signals (all 4) — Functioning
- `hazards` — Hazard lights — Functioning
- `clearance` — Clearance / marker lights — All lit
- `reverse` — Reverse lights — Functioning

**EXTERIOR & SAFETY** (5):
- `windshield` — Windshield — No cracks in driver's view
- `mirrors` — Mirrors — Clean, properly adjusted
- `horn` — Horn — Audible
- `wipers` — Wipers & washer fluid — Working
- `reflectors` — Reflectors / mud flaps — Present

**EMERGENCY EQUIPMENT** (4):
- `extinguisher` — Fire extinguisher — Charged, mounted accessible
- `triangles` — Warning triangles / flares — Set of 3
- `first_aid` — First aid kit — Stocked
- `fuses` — Spare fuses — Present

**TRAILER INSPECTION** — header shows: "Trailer: [load.trailer]" (6):
- `fifth_wheel` — Fifth-wheel coupling — Locked, kingpin secure
- `landing_gear` — Landing gear — Fully raised, crank stowed
- `trailer_air` — Air lines & electrical connections — Secure, no leaks
- `trailer_tires` — Trailer tires — Inflated, no damage (all positions)
- `trailer_lights` — Trailer lights — Brake, turn, clearance functioning
- `rear_doors` — Rear doors — Secured, hinges intact
- `door_seals` — Door seals — Intact · Seal: `${load.sealPickup}`
- `cargo_secure` — Cargo securement — Straps/chains checked, load stable
- `reefer` — Reefer unit (if temp-controlled) — Set to correct temp

### `buildTab2()` — Photo Packet [REQUIRED — write all 9 zones]

Header: `"Required Pre-Departure Photos"` + photo count badge: `<span id="photo-count">0 / 9 Photos Captured</span>`

Build a `.photo-grid` div with 9 `.photo-zone` divs. Each zone has camera SVG icon (36px, color #3b82f6), label text, sub-label text. On click: toggle `capturedPhotos[photoId]`, toggle class `.captured` on zone, update `#photo-count`, call `updateProgress()`.

All 9 zones (id, label, sub-label):
1. `photo_cdl` — "Driver with CDL" — "Driver holding CDL next to truck door"
2. `photo_selfie` — "Driver Selfie (Dash Cam)" — "Face clearly visible, in cab"
3. `photo_front` — "Truck Front" — "Full front view, license plate visible"
4. `photo_driver_side` — "Truck Driver Side" — "Full driver-side profile"
5. `photo_pass_side` — "Truck Passenger Side" — "Full passenger-side profile"
6. `photo_fifthwheel` — "Fifth Wheel / Coupling" — "Close-up of kingpin lock"
7. `photo_seal` — "Trailer Rear + Seal" — `"Doors closed · Seal: ${load.sealPickup}"`
8. `photo_eld` — "Dashboard / ELD Screen" — "Odometer, ELD status, duty status"
9. `photo_fuel` — "Fuel Receipt" — "Current fuel level or receipt"

### `buildTab3()` — Load Documents [REQUIRED]

Show a styled info card (read-only, bg rgba(0,0,0,0.3), border-radius 12px, padding 16px) pre-populated from current load:
```
Load: [id]  |  BOL: [bol]  |  RC: [rc]  |  PO: [po]
Customer: [customer]  |  Consignee: [consignee]
Origin: [pickupAddr]
Destination: [deliveryAddr]
Commodity: [commodity]  |  Weight: [weight]  |  Pallets: [pallets]
Pickup: [pickupDate]  |  Window: [pickupWindow]
Delivery: [deliveryDate]  |  Window: [deliveryWindow]
Broker: [broker] ([brokerMC])
```

Then a document checklist with 8 items:
- `doc_rc` — Rate Confirmation (`${load.rc}`) — Signed copy on file
- `doc_bol` — Bill of Lading (`${load.bol}`) — Original with driver
- `doc_po` — Customer PO (`${load.po}`) — Confirmed with shipper
- `doc_lumper` — Lumper Receipt Authorization — `${load.lumper > 0 ? 'Pre-authorized $' + load.lumper : 'N/A'}`
- `doc_fuel` — Fuel Card / IFTA Authorization — Issued
- `doc_permits` — Oversize / Hazmat Permits — N/A
- `doc_insurance` — Proof of Insurance Certificate — On file
- `doc_emergency` — Emergency Contact Sheet — In cab

### `buildTab4()` — Sign-Off [REQUIRED]

**Completion rings / bars**: 4 mini progress bars showing pct for:
- Driver Docs (8 items)
- Vehicle Inspection (35 items)
- Photos (9 items)
- Load Documents (8 items)

Calculate each: count checked in that group / total in group × 100. Display as horizontal bar + label + percentage.

**Overall readiness score**: sum all checked / 60 total. Big number styled: `<100% → var(--amber)`, `100% → var(--emerald)`.

**Certification block** (styled bg rgba(0,0,0,0.3), border-left 3px solid var(--gold), padding 16px, font-size 12px, color var(--text-secondary), line-height 1.6):
```
By signing below, I certify that I have completed the pre-trip inspection
in accordance with FMCSA regulations (49 CFR §392.7 and §396.13), that the
vehicle is in safe operating condition, and that all required documents
are present and accounted for. I understand that falsifying this inspection
report is a violation of federal law.
```

**Driver Name input**: pre-filled with `load.driver`, styled dark input.

**Timestamp**: read-only, value = current date/time string.

**Signature canvas**: `<canvas id="sig-canvas" width="400" height="120"></canvas>`. "Clear Signature" button below it (calls `clearSig()`).

**Action buttons row**:
- "💾 Save Draft" — `btn-outline`
- "📤 Submit Packet" — `btn-primary` — onClick: show inline success message "✅ Pre-Trip Packet Submitted · Packet ID: PT-[load.id]-[timestamp] · [datetime]" styled in emerald
- "🖨️ Print Packet" — `btn-outline` — onClick: `window.print()`

✅ PHASE 13 COMPLETE

---

## PHASE 14 — SIGNATURE PAD [REQUIRED]

```js
function initSignaturePad() {
  const canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let drawing = false;
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  canvas.addEventListener('mousedown', e => {
    drawing = true;
    const r = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    const r = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.stroke();
  });
  canvas.addEventListener('mouseup', () => drawing = false);
  canvas.addEventListener('mouseleave', () => drawing = false);

  // Touch support
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    drawing = true;
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(t.clientX - r.left, t.clientY - r.top);
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!drawing) return;
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    ctx.lineTo(t.clientX - r.left, t.clientY - r.top);
    ctx.stroke();
  });
  canvas.addEventListener('touchend', () => drawing = false);
}

function clearSig() {
  const canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}
```

Call `initSignaturePad()` every time Tab 4 becomes active (inside `switchTab` when index === 4).

✅ PHASE 14 COMPLETE

---

## PHASE 15 — CLOCK & INIT [REQUIRED]

```js
// Live clock
function updateClock() {
  const now = new Date();
  document.getElementById('live-clock').textContent =
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// KPI card staggered fade-in
document.querySelectorAll('.kpi-card').forEach((card, i) => {
  setTimeout(() => {
    card.style.opacity = '1';
    card.classList.add('fade-in');
  }, i * 100);
});

// Close modals on overlay click
document.getElementById('detail-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeDetail();
});
document.getElementById('pretrip-overlay').addEventListener('click', function(e) {
  if (e.target === this) closePretrip();
});

// Initial render
populateFilters();
renderTable(loads);
applyFilters();
```

✅ PHASE 15 COMPLETE

---

## FINAL SELF-TEST CHECKLIST [REQUIRED]

Before delivering, verify every item:

- [ ] All 12 loads render in the table on page load
- [ ] Status badges show correct color for each load
- [ ] Search input filters rows in real time
- [ ] Status / Customer / Driver dropdowns filter correctly
- [ ] Clicking a row opens Load Detail modal with correct data
- [ ] Clicking overlay background closes modal
- [ ] Clicking "📋 Pre-Trip" opens Pre-Trip modal (does NOT also open detail modal)
- [ ] All 5 tabs switch correctly with active highlight
- [ ] Driver Docs tab has 8 checkboxes across 2 sections
- [ ] Vehicle Inspection tab has 35 checkboxes across 7 sections
- [ ] Photo Packet has 9 photo zones; clicking toggles captured state and photo count
- [ ] Load Documents tab shows correct load data + 8 document items
- [ ] Sign-Off tab shows 4 section progress bars + signature canvas
- [ ] Overall progress bar in header updates when any checkbox or photo is clicked
- [ ] Signature canvas draws on mouse drag and clears on "Clear" click
- [ ] Clock updates every second
- [ ] KPI cards fade in staggered on load
- [ ] No JavaScript errors in console
- [ ] All 12 load data objects are present and fully populated

---

## DELIVERY FORMAT

Deliver the complete `index.html` as a single fenced code block:

```html
<!DOCTYPE html>
...complete file...
</html>
```

If output must be split, use:
- **Part 1/N** — through end of `</style>`
- **Part 2/N** — `