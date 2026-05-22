/**
 * Crop proof/media thumbnails from the L001–L011 composite dashboard image
 * and write PNGs under public/evidence/loads/{id}/.
 *
 * Default source: `C:/Users/syhol/Downloads/lo01-011.png` (user-provided L001–L011 composite; also
 * try `lo01-lo11.png` in Downloads if you rename the asset).
 *
 * Usage:
 *   node scripts/crop-evidence-from-composite.mjs [path-to-composite.png]
 *
 * Then: npm run generate:load-evidence
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

const DEFAULT_SRC = "C:/Users/syhol/Downloads/lo01-011.png";

/**
 * Panels that show “TBD” for seal delivery in the lo01-011 composite (no real photo to crop).
 */
const COMPOSITE_SEAL_DELIVERY_TBD_LOADS = new Set([
  "L002",
  "L004",
  "L007",
  "L008",
  "L009",
  "L011",
]);

/** Claim loads where the composite shows damage / packet as TBD (no real damage photo). */
const COMPOSITE_DAMAGE_PACKET_TBD_LOADS = new Set(["L007", "L009", "L011"]);

/** Mismatch loads where the composite shows seal-mismatch as TBD (no real photo). */
const COMPOSITE_SEAL_MISMATCH_TBD_LOADS = new Set(["L007", "L009"]);

/** 4×3 grid: L001..L011 then legend (index 11 skipped). */
const GRID_COLS = 4;
const GRID_ROWS = 3;
const PANEL_INSET = 8;

/** Inside each load panel (relative to panel after inset), tuned on lo01-011.png 368×325. */
const LAYOUT = {
  padX: 12,
  gap: 8,
  /** Top of first proof thumbnail row (below header + “Proof & Media”). */
  proofRow0Top: 52,
  proofRow0H: 88,
  /** Second proof row: delivery/empty + RFID (two wide cells). */
  proofRow1Top: 152,
  proofRow1H: 86,
  /** Exceptions row: seal mismatch | claim intake | damage | insurance */
  claimRowTop: 248,
  claimRowH: 62,
  /** Strip label band from top of each slot (photo only). */
  labelStripFrac: 0.26,
  /** Trim bottom padding inside card. */
  bottomTrimFrac: 0.06,
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function hasClaim(load) {
  return Boolean(
    load.dispatchExceptionFlag || String(load.sealStatus).toUpperCase() === "MISMATCH"
  );
}

function sealMismatchApplicable(load) {
  return String(load.sealStatus).toUpperCase() === "MISMATCH";
}

function slotBox(panelW, panelH, slot) {
  const { padX, gap } = LAYOUT;
  const w4 = Math.floor((panelW - 2 * padX - 3 * gap) / 4);
  const w2 = Math.floor((panelW - 2 * padX - gap) / 2);
  const trimLeft = slot.trimLeftPx ?? 0;
  let left;
  let top;
  let width;
  let height;
  if (slot.row === 0) {
    top = LAYOUT.proofRow0Top;
    height = LAYOUT.proofRow0H;
    width = w4;
    left = padX + slot.col * (w4 + gap);
  } else if (slot.row === 1) {
    top = LAYOUT.proofRow1Top;
    height = LAYOUT.proofRow1H;
    width = w2;
    left = padX + slot.col * (w2 + gap);
  } else {
    top = LAYOUT.claimRowTop;
    height = LAYOUT.claimRowH;
    width = w4;
    left = padX + slot.col * (w4 + gap);
  }
  if (trimLeft > 0) {
    left += trimLeft;
    width = Math.max(16, width - trimLeft);
  }
  return { left, top, width, height };
}

async function photoOnlyCrop(panelBuf, box) {
  const strip = Math.round(box.height * LAYOUT.labelStripFrac);
  const bottomCut = Math.round(box.height * LAYOUT.bottomTrimFrac);
  const innerTop = box.top + strip;
  const innerH = Math.max(24, box.height - strip - bottomCut);
  return sharp(panelBuf).extract({
    left: box.left,
    top: innerTop,
    width: box.width,
    height: innerH,
  });
}

async function isLikelyTbd(buf) {
  const st = await sharp(buf).stats();
  const m = st.channels[0].mean;
  const s = st.channels[0].stdev;
  /** “TBD” slate cards: flat mid-grey, little texture (avoid flagging real night/map photos). */
  if (s < 14 && m > 38 && m < 88) return true;
  /** Uniform dark grey panel with light “TBD” text still often lands in this band. */
  if (s < 10 && m > 18 && m < 100) return true;
  return false;
}

/**
 * Seal-delivery column sometimes bleeds the prior thumbnail; sample the **right** half only for TBD.
 * Real delivery seals stay brighter / busier on the right; “TBD” cards collapse to dark flat UI there.
 */
async function isLikelyTbdSealDelivery(buf) {
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const half = Math.max(8, Math.floor(w / 2));
  const right = await sharp(buf)
    .extract({ left: w - half, top: 0, width: half, height: h })
    .png()
    .toBuffer();
  const st = await sharp(right).stats();
  const m = st.channels[0].mean;
  const s = st.channels[0].stdev;
  const mx = st.channels[0].max;
  /** TBD slate card: dark UI + grey text; real seals stay brighter on the right half. */
  if (m < 24 && mx < 222 && s < 46) return true;
  if (m < 20 && s < 28) return true;
  return isLikelyTbd(right);
}

async function extractSlot(panelBuf, panelW, panelH, slot, tbdMode = "default") {
  const box = slotBox(panelW, panelH, slot);
  const img = await photoOnlyCrop(panelBuf, box);
  const buf = await img.png().toBuffer();
  const tbd =
    tbdMode === "sealDelivery" ? await isLikelyTbdSealDelivery(buf) : await isLikelyTbd(buf);
  return { buf, tbd, box };
}

async function loadPanelBuffer(srcPath, loadIndex) {
  const meta = await sharp(srcPath).metadata();
  const W = meta.width;
  const H = meta.height;
  const pw = W / GRID_COLS;
  const ph = H / GRID_ROWS;
  const col = loadIndex % GRID_COLS;
  const row = Math.floor(loadIndex / GRID_COLS);
  return sharp(srcPath)
    .extract({
      left: Math.round(col * pw) + PANEL_INSET,
      top: Math.round(row * ph) + PANEL_INSET,
      width: Math.round(pw) - 2 * PANEL_INSET,
      height: Math.round(ph) - 2 * PANEL_INSET,
    })
    .png()
    .toBuffer();
}

const REPORT = {
  source: "",
  dimensions: null,
  skippedTbd: [],
  filesWritten: {},
  coords: {},
};

async function main() {
  const srcPath = path.resolve(process.argv[2] || DEFAULT_SRC);
  if (!fs.existsSync(srcPath)) {
    console.error("Composite not found:", srcPath);
    process.exit(1);
  }
  const meta = await sharp(srcPath).metadata();
  REPORT.source = srcPath;
  REPORT.dimensions = { w: meta.width, h: meta.height };

  const data = readJson(DATA_PATH);
  const loads = (data.loads ?? []).filter((l) => {
    if (!/^L\d+$/.test(l.id)) return false;
    const n = Number(l.id.slice(1));
    return n >= 1 && n <= 11;
  });
  if (loads.length !== 11) {
    console.warn("Expected 11 loads L001–L011, found", loads.length);
  }

  const outRoot = path.join(ROOT, "public", "evidence", "loads");

  for (const load of loads) {
    const idx = Number(load.id.replace("L", "")) - 1;
    if (idx < 0 || idx > 10) continue;

    const panelBuf = await loadPanelBuffer(srcPath, idx);
    const pm = await sharp(panelBuf).metadata();
    const PW = pm.width;
    const PH = pm.height;

    const slots = {
      pickupPhoto: { row: 0, col: 0, file: "pickup-photo.png" },
      cargoPhoto: { row: 0, col: 1, file: "cargo-photo.png" },
      sealPickupPhoto: { row: 0, col: 2, file: "seal-pickup-photo.png" },
      sealDeliveryPhoto: {
        row: 0,
        col: 3,
        file: "seal-delivery-photo.png",
        /** Trim neighbor-column bleed from seal-pickup card in composite grid. */
        trimLeftPx: 14,
      },
      /** One thumbnail serves both delivery + empty-trailer in the composite. */
      deliveryEmpty: { row: 1, col: 0, file: "_delivery-empty.png" },
      rfidDockProof: { row: 1, col: 1, file: "rfid-dock-proof.png" },
      sealMismatchPhoto: { row: 2, col: 0, file: "seal-mismatch-photo.png" },
      /** Column 1 is claim intake document — skipped (not a photo). */
      damagePhotoPacket: { row: 2, col: 2, file: "damage-photo-packet.png" },
    };

    const loadDir = path.join(outRoot, load.id);
    fs.mkdirSync(loadDir, { recursive: true });
    REPORT.filesWritten[load.id] = [];
    REPORT.coords[load.id] = {};

    const claimOk = hasClaim(load);
    const mismatchOk = sealMismatchApplicable(load);

    function safeUnlink(fp) {
      try {
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch {
        /* ignore */
      }
    }

    async function writeIfReal(key, slotDef, extraCheck, tbdMode) {
      const { buf, tbd, box } = await extractSlot(panelBuf, PW, PH, slotDef, tbdMode);
      REPORT.coords[load.id][key] = { ...box, labelStripFrac: LAYOUT.labelStripFrac, tbd };
      if (tbd) {
        REPORT.skippedTbd.push({ load: load.id, key, reason: "flat_grey_placeholder" });
        safeUnlink(path.join(loadDir, slotDef.file));
        return;
      }
      if (extraCheck && !extraCheck()) return;
      const dest = path.join(loadDir, slotDef.file);
      await sharp(buf).png().toFile(dest);
      REPORT.filesWritten[load.id].push(path.relative(ROOT, dest));
    }

    await writeIfReal("pickupPhoto", slots.pickupPhoto);
    await writeIfReal("cargoPhoto", slots.cargoPhoto);
    await writeIfReal("sealPickupPhoto", slots.sealPickupPhoto);

    if (COMPOSITE_SEAL_DELIVERY_TBD_LOADS.has(load.id)) {
      REPORT.skippedTbd.push({
        load: load.id,
        key: "sealDeliveryPhoto",
        reason: "composite_TBD_placeholder",
      });
      safeUnlink(path.join(loadDir, "seal-delivery-photo.png"));
    } else {
      await writeIfReal("sealDeliveryPhoto", slots.sealDeliveryPhoto, undefined, "sealDelivery");
    }

    const de = await extractSlot(panelBuf, PW, PH, slots.deliveryEmpty);
    REPORT.coords[load.id].deliveryEmpty = { ...de.box, tbd: de.tbd };
    if (!de.tbd) {
      const p1 = path.join(loadDir, "empty-trailer-proof.png");
      const p2 = path.join(loadDir, "delivery-photo.png");
      await sharp(de.buf).png().toFile(p1);
      await sharp(de.buf).png().toFile(p2);
      REPORT.filesWritten[load.id].push(
        path.relative(ROOT, p1),
        path.relative(ROOT, p2)
      );
    } else {
      REPORT.skippedTbd.push({ load: load.id, key: "deliveryEmpty", reason: "TBD" });
      safeUnlink(path.join(loadDir, "empty-trailer-proof.png"));
      safeUnlink(path.join(loadDir, "delivery-photo.png"));
    }

    await writeIfReal("rfidDockProof", slots.rfidDockProof);

    if (mismatchOk) {
      if (COMPOSITE_SEAL_MISMATCH_TBD_LOADS.has(load.id)) {
        REPORT.skippedTbd.push({
          load: load.id,
          key: "sealMismatchPhoto",
          reason: "composite_TBD_placeholder",
        });
        safeUnlink(path.join(loadDir, "seal-mismatch-photo.png"));
      } else {
        await writeIfReal("sealMismatchPhoto", slots.sealMismatchPhoto);
      }
    }

    if (claimOk) {
      if (COMPOSITE_DAMAGE_PACKET_TBD_LOADS.has(load.id)) {
        REPORT.skippedTbd.push({
          load: load.id,
          key: "damagePhotoPacket",
          reason: "composite_TBD_placeholder",
        });
        for (const fn of ["cargo-damage-photo.png", "damage-photo.png", "damage-photo-packet.png"]) {
          safeUnlink(path.join(loadDir, fn));
        }
      } else {
        /** Manifest uses cargoDamagePhoto / damagePhoto; doc pipeline uses damage-photo-packet.png */
        const dmg = await extractSlot(panelBuf, PW, PH, slots.damagePhotoPacket);
        REPORT.coords[load.id].cargoDamagePhoto = { ...dmg.box, tbd: dmg.tbd };
        if (!dmg.tbd) {
          for (const fn of ["cargo-damage-photo.png", "damage-photo.png", "damage-photo-packet.png"]) {
            const p = path.join(loadDir, fn);
            await sharp(dmg.buf).png().toFile(p);
            REPORT.filesWritten[load.id].push(path.relative(ROOT, p));
          }
        } else {
          REPORT.skippedTbd.push({ load: load.id, key: "damagePhoto", reason: "TBD" });
          for (const fn of ["cargo-damage-photo.png", "damage-photo.png", "damage-photo-packet.png"]) {
            safeUnlink(path.join(loadDir, fn));
          }
        }
      }
    }

    /** equipmentPhoto: required — reuse pickup photo crop. */
    const pk = await extractSlot(panelBuf, PW, PH, slots.pickupPhoto);
    if (!pk.tbd) {
      const ep = path.join(loadDir, "equipment-photo.png");
      await sharp(pk.buf).png().toFile(ep);
      REPORT.filesWritten[load.id].push(path.relative(ROOT, ep));
    }

    /** sealPhoto → same as seal pickup per product note. */
    const sp = await extractSlot(panelBuf, PW, PH, slots.sealPickupPhoto);
    if (!sp.tbd) {
      const spPath = path.join(loadDir, "seal-photo.png");
      await sharp(sp.buf).png().toFile(spPath);
      REPORT.filesWritten[load.id].push(path.relative(ROOT, spPath));
    }
  }

  const reportPath = path.join(ROOT, ".composite-crop-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(REPORT, null, 2), "utf8");
  console.log("Wrote report:", path.relative(ROOT, reportPath));
  console.log("Done. Run: npm run generate:load-evidence");
}

await main();
