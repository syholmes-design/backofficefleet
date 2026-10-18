"""Generate the demo driver ID-card images (CDL, medical examiner's certificate, insurance ID card).

Every value comes from the fictional demo seed (lib/emergency-contacts/drivers.ts and
lib/demo-data.json), and every card is marked as a fictional sample. No state seal, insurer brand
or real-world ID layout is reproduced. Output files keep their existing names and pixel sizes so
document links and previews keep working.

Usage: python3 -I scripts/generate-demo-id-card-images.py
"""
import json
import os
import re
from datetime import date

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DRIVERS_DIR = os.path.join(ROOT, "public", "documents", "drivers")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
STATE_NAMES = {"OH": "Ohio", "IL": "Illinois", "GA": "Georgia", "TX": "Texas"}


def load_drivers():
    source = open(os.path.join(ROOT, "lib", "emergency-contacts", "drivers.ts"), encoding="utf8").read()
    drivers = {}
    for block in re.findall(r"\{\s*id: \"(DRV-\d{3})\"(.*?)primaryContact:", source, re.S):
        driver_id, body = block
        fields = dict(re.findall(r"(\w+): \"((?:[^\"\\]|\\.)*)\"", body))
        fields = {k: v.replace('\\"', '"') for k, v in fields.items()}
        drivers[driver_id] = fields
    demo = json.load(open(os.path.join(ROOT, "lib", "demo-data.json"), encoding="utf8"))
    for doc in demo.get("documents", []):
        d = drivers.get(doc.get("driverId"))
        if d is None:
            continue
        if doc.get("type") == "Medical Card":
            d["medicalExpiration"] = doc.get("expirationDate") or ""
            d["medicalIssue"] = doc.get("issueDate") or ""
        if doc.get("type") == "Insurance Card":
            d["insuranceExpiration"] = doc.get("expirationDate") or ""
    return drivers


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def us_date(iso):
    try:
        return date.fromisoformat(iso).strftime("%m/%d/%Y")
    except ValueError:
        return iso or "—"


def headshot(driver_id, box):
    path = os.path.join(ROOT, "public", "images", "drivers", f"{driver_id}.png")
    if not os.path.exists(path):
        return None
    return ImageOps.fit(Image.open(path).convert("RGB"), box, centering=(0.5, 0.3))


def card(size, title, subtitle, color, driver_id, rows, footer):
    w, h = size
    s = w / 1536
    img = Image.new("RGB", size, "#f4f6f8")
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([int(12 * s), int(12 * s), w - int(12 * s), h - int(12 * s)], radius=int(36 * s), fill="#ffffff", outline="#c9d1d9", width=max(2, int(4 * s)))
    d.rectangle([int(12 * s), int(60 * s), w - int(12 * s), int(200 * s)], fill=color)
    d.text((int(60 * s), int(78 * s)), title, font=font(int(56 * s), True), fill="white")
    d.text((int(60 * s), int(146 * s)), subtitle, font=font(int(32 * s)), fill="white")
    photo_box = (int(380 * s), int(470 * s))
    photo = headshot(driver_id, photo_box)
    px, py = int(60 * s), int(240 * s)
    if photo:
        img.paste(photo, (px, py))
    d.rectangle([px, py, px + photo_box[0], py + photo_box[1]], outline="#8b949e", width=max(2, int(3 * s)))
    x, y = int(500 * s), int(250 * s)
    label_font = font(int(30 * s))
    line = int((h - 330 * s) / max(len(rows), 1))
    line = min(line, int(74 * s))
    value_x = x + int(300 * s)
    room = w - value_x - int(50 * s)
    for label, value in rows:
        d.text((x, y), label.upper(), font=label_font, fill="#57606a")
        size_px = int(38 * s)
        value_font = font(size_px, True)
        while d.textlength(value, font=value_font) > room and size_px > 12:
            size_px -= 1
            value_font = font(size_px, True)
        d.text((value_x, y - int(4 * s)), value, font=value_font, fill="#0d1117")
        y += line
    d.text((int(60 * s), h - int(92 * s)), footer, font=font(int(28 * s)), fill="#57606a")
    # Diagonal watermark: the card is visibly a fictional sample.
    mark = Image.new("RGBA", size, (0, 0, 0, 0))
    md = ImageDraw.Draw(mark)
    text = "SAMPLE  •  FICTIONAL DEMO DATA"
    mark_px = int(92 * s)
    mf = font(mark_px, True)
    while md.textlength(text, font=mf) > w * 0.8 and mark_px > 12:
        mark_px -= 2
        mf = font(mark_px, True)
    tw = md.textlength(text, font=mf)
    md.text(((w - tw) / 2, h / 2 - 60 * s), text, font=mf, fill=(200, 30, 30, 70))
    mark = mark.rotate(18, resample=Image.BICUBIC, center=(w / 2, h / 2))
    img = Image.alpha_composite(img.convert("RGBA"), mark)
    return img


def save(img, path, original_mode):
    if original_mode == "RGBA":
        img.save(path)
    else:
        rgb = img.convert("RGB")
        if path.lower().endswith((".jpg", ".jpeg")):
            rgb.save(path, quality=88)
        else:
            rgb.save(path)


def main():
    drivers = load_drivers()
    written = 0
    for driver_id, drv in sorted(drivers.items()):
        folder = os.path.join(DRIVERS_DIR, driver_id)
        if not os.path.isdir(folder):
            continue
        n = driver_id[-3:]
        state = drv.get("licenseState", "")
        cdl_rows = [
            ("Name", drv.get("fullName", "")),
            ("Address", drv.get("fullAddress", "")),
            ("Date of birth", drv.get("dob", "")),
            ("CDL number", drv.get("licenseNumber", "")),
            ("Class", drv.get("licenseClass", "").replace("Class ", "")),
            ("Sex / Height", f"{drv.get('gender', '')} / {drv.get('height', '')}"),
            ("Eyes / Hair", f"{drv.get('eyes', '')} / {drv.get('hair', '')}"),
        ]
        med_rows = [
            ("Driver", drv.get("fullName", "")),
            ("Date of birth", drv.get("dob", "")),
            ("CDL number", f"{drv.get('licenseNumber', '')} ({state})"),
            ("Address", drv.get("fullAddress", "")),
            ("Examined", us_date(drv.get("medicalIssue", ""))),
            ("Expires", us_date(drv.get("medicalExpiration", ""))),
            ("Examiner", "Demo Medical Examiner (fictional)"),
        ]
        ins_rows = [
            ("Named insured", "Delta Advanced Trucking, Inc. (demo carrier)"),
            ("Driver", drv.get("fullName", "")),
            ("Insurer", "Sample Mutual Insurance (fictional)"),
            ("Policy", f"DEMO-TRK-{n}"),
            ("Coverage", "Commercial auto liability"),
            ("Valid through", us_date(drv.get("insuranceExpiration", ""))),
        ]
        targets = []
        for name in os.listdir(folder):
            low = name.lower()
            if not low.endswith((".png", ".jpg", ".jpeg")):
                continue
            if low == "cdl.png" or low.startswith("cdlnew-"):
                targets.append((name, "cdl"))
            elif low.startswith("medical-card-drv-") or low.startswith("medical card-"):
                targets.append((name, "medical"))
            elif low.startswith("icard-drv-") or low == "insurance-card.png":
                targets.append((name, "insurance"))
        for name, kind in sorted(targets):
            path = os.path.join(folder, name)
            try:
                with Image.open(path) as existing:
                    size, mode = existing.size, existing.mode
            except Exception:
                size, mode = (1536, 945), "RGB"  # empty or unreadable placeholder files get the default size
            if kind == "cdl":
                img = card(size, f"{STATE_NAMES.get(state, state)} CDL — SAMPLE", "Fictional demonstration commercial driver license", "#8c1d2c", driver_id, cdl_rows,
                           "Demonstration document. Not a government-issued license. All values are fictional.")
            elif kind == "medical":
                img = card(size, "Medical Examiner's Certificate — SAMPLE", "Fictional demonstration of an MCSA-5876 summary", "#1f4e79", driver_id, med_rows,
                           "Demonstration document. Not issued by a medical examiner. All values are fictional.")
            else:
                img = card(size, "Insurance ID Card — SAMPLE", "Fictional demonstration of a commercial auto ID card", "#1b5e20", driver_id, ins_rows,
                           "Demonstration document. Not issued by an insurer. All values are fictional.")
            save(img, path, mode)
            written += 1
    print(f"generate-demo-id-card-images: wrote {written} images")


if __name__ == "__main__":
    main()
