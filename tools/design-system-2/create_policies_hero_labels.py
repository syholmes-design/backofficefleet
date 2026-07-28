"""Create the labeled Policies & Procedures Wave 2 hero asset.

The clean source image remains the canonical asset. This script creates a
derived production image with restrained trucking-policy labels on selected
book spines only.
"""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Website/assets/images/design-system-2/wave-2/ds2-policies-governance-hero-clean.png"
OUTPUT = ROOT / "Website/assets/images/design-system-2/wave-2/ds2-policies-governance-hero-labeled.png"
FONT_PATH = Path("C:/Windows/Fonts/segoeuib.ttf")


LABELS = [
    {
        "title": "Safety & Compliance Manual",
        "xy": (930, 354),
        "angle": 1.0,
        "size": 28,
        "max_width": 570,
    },
    {
        "title": "Driver Qualification Policy",
        "xy": (875, 488),
        "angle": 1.0,
        "size": 29,
        "max_width": 570,
    },
    {
        "title": "Hours-of-Service Procedures",
        "xy": (815, 607),
        "angle": 1.0,
        "size": 29,
        "max_width": 610,
    },
    {
        "title": "Cargo Securement Policy",
        "xy": (805, 724),
        "angle": 1.0,
        "size": 29,
        "max_width": 560,
    }
]


def fitted_font(title: str, size: int, max_width: int) -> ImageFont.FreeTypeFont:
    """Return the largest configured font that fits the desired spine width."""
    current_size = size
    while current_size >= 22:
        font = ImageFont.truetype(str(FONT_PATH), current_size)
        bbox = ImageDraw.Draw(Image.new("RGBA", (10, 10))).textbbox((0, 0), title, font=font)
        if bbox[2] - bbox[0] <= max_width:
            return font
        current_size -= 1
    return ImageFont.truetype(str(FONT_PATH), 22)


def text_layer(title: str, font: ImageFont.FreeTypeFont) -> Image.Image:
    dummy = Image.new("RGBA", (10, 10))
    draw = ImageDraw.Draw(dummy)
    bbox = draw.textbbox((0, 0), title, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    pad_x = 18
    pad_y = 12
    layer = Image.new("RGBA", (width + pad_x * 2, height + pad_y * 2), (0, 0, 0, 0))
    layer_draw = ImageDraw.Draw(layer)
    x = pad_x - bbox[0]
    y = pad_y - bbox[1]

    # Emboss restraint: a dark press-shadow plus a soft silver-blue top edge.
    layer_draw.text((x + 1, y + 1), title, font=font, fill=(9, 20, 35, 64))
    layer_draw.text((x - 1, y - 1), title, font=font, fill=(196, 211, 226, 26))
    layer_draw.text((x, y), title, font=font, fill=(164, 178, 194, 68))

    return layer.filter(ImageFilter.GaussianBlur(0.18))


def paste_rotated(base: Image.Image, label: dict) -> None:
    font = fitted_font(label["title"], label["size"], label["max_width"])
    layer = text_layer(label["title"], font)
    rotated = layer.rotate(label["angle"], expand=True, resample=Image.Resampling.BICUBIC)
    base.alpha_composite(rotated, dest=label["xy"])


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    for label in LABELS:
        paste_rotated(image, label)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(OUTPUT, optimize=True, quality=94)
    print(f"source={SOURCE}")
    print(f"output={OUTPUT}")
    print(f"dimensions={image.size[0]}x{image.size[1]}")
    print(f"labels={len(LABELS)}")
    print(f"bytes={OUTPUT.stat().st_size}")


if __name__ == "__main__":
    main()
