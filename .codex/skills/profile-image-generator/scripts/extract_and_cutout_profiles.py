#!/usr/bin/env python3
"""Split a generated profile contact sheet and optionally run the global cutout helper."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crop a profile contact sheet into individual PNGs and optionally run image-cutout."
    )
    parser.add_argument("--input", required=True, help="Contact-sheet image path.")
    parser.add_argument("--output-dir", required=True, help="Folder for cropped profiles and cutouts.")
    parser.add_argument("--rows", type=int, required=True, help="Number of portrait rows in the sheet.")
    parser.add_argument("--cols", type=int, required=True, help="Number of portrait columns in the sheet.")
    parser.add_argument("--names", help="Comma-separated output base names. Defaults to profile-01, profile-02, etc.")
    parser.add_argument("--prefix", default="profile", help="Default filename prefix when --names is omitted.")
    parser.add_argument(
        "--cell-inset",
        type=float,
        default=0.03,
        help="Crop inset per cell as a fraction of cell size. Use 0 for exact grid crops.",
    )
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing crops/cutouts.")
    parser.add_argument("--run-cutout", action="store_true", help="Run the global image-cutout helper on the crops.")
    parser.add_argument(
        "--cutout-preset",
        choices=["balanced", "detail", "clean"],
        default="detail",
        help="Preset passed to image-cutout when --run-cutout is used.",
    )
    parser.add_argument(
        "--inference-size",
        choices=["1024", "1280", "1536"],
        default="1280",
        help="Inference size passed to image-cutout when --run-cutout is used.",
    )
    parser.add_argument("--save-mask", action="store_true", help="Ask image-cutout to save masks.")
    parser.add_argument("--save-white-preview", action="store_true", help="Ask image-cutout to save white previews.")
    parser.add_argument("--save-black-preview", action="store_true", help="Ask image-cutout to save black previews.")
    parser.add_argument(
        "--save-comparison-preview",
        action="store_true",
        help="Ask image-cutout to save comparison previews.",
    )
    parser.add_argument("--json-output", help="Write a JSON report to this path.")
    return parser.parse_args()


def safe_name(value: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in value.strip())
    cleaned = "-".join(part for part in cleaned.split("-") if part)
    return cleaned or "profile"


def unique_path(path: Path, overwrite: bool) -> Path:
    if overwrite or not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    for index in range(2, 1000):
        candidate = path.with_name(f"{stem}-{index}{suffix}")
        if not candidate.exists():
            return candidate
    raise RuntimeError(f"Could not create unique path for {path}")


def crop_sheet(args: argparse.Namespace) -> list[Path]:
    try:
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("Pillow is required to split profile sheets. Install or use an environment with PIL.") from exc

    source = Path(args.input)
    if not source.exists():
        raise FileNotFoundError(source)
    if source.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise RuntimeError(f"Unsupported input extension: {source.suffix}")
    if args.rows < 1 or args.cols < 1:
        raise RuntimeError("--rows and --cols must be positive.")
    if args.cell_inset < 0 or args.cell_inset >= 0.4:
        raise RuntimeError("--cell-inset must be between 0 and 0.4.")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    names = [safe_name(name) for name in args.names.split(",")] if args.names else []
    total = args.rows * args.cols
    if names and len(names) != total:
        raise RuntimeError(f"--names provided {len(names)} names, but rows*cols is {total}.")
    if not names:
        names = [f"{safe_name(args.prefix)}-{index:02d}" for index in range(1, total + 1)]

    crops: list[Path] = []
    with Image.open(source) as image:
        image = image.convert("RGBA")
        width, height = image.size
        cell_w = width / args.cols
        cell_h = height / args.rows
        inset_x = cell_w * args.cell_inset
        inset_y = cell_h * args.cell_inset

        for row in range(args.rows):
            for col in range(args.cols):
                index = row * args.cols + col
                left = round(col * cell_w + inset_x)
                top = round(row * cell_h + inset_y)
                right = round((col + 1) * cell_w - inset_x)
                bottom = round((row + 1) * cell_h - inset_y)
                crop = image.crop((left, top, right, bottom))
                crop_path = unique_path(output_dir / f"{names[index]}.png", args.overwrite)
                crop.save(crop_path)
                crops.append(crop_path)

    return crops


def run_cutout(args: argparse.Namespace, crop_dir: Path) -> dict[str, object]:
    cutout_script = Path(os.environ.get("USERPROFILE", str(Path.home()))) / ".codex" / "skills" / "image-cutout" / "scripts" / "cutout_images.py"
    if not cutout_script.exists():
        raise FileNotFoundError(f"Global image-cutout script not found: {cutout_script}")

    output_dir = crop_dir / "cutouts"
    command = [
        sys.executable,
        str(cutout_script),
        "--input",
        str(crop_dir),
        "--output",
        str(output_dir),
        "--preset",
        args.cutout_preset,
        "--inference-size",
        args.inference_size,
        "--overwrite",
        "--json-output",
        str(output_dir / "cutout-report.json"),
    ]
    if args.save_mask:
        command.append("--save-mask")
    if args.save_white_preview:
        command.append("--save-white-preview")
    if args.save_black_preview:
        command.append("--save-black-preview")
    if args.save_comparison_preview:
        command.append("--save-comparison-preview")

    output_dir.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(command, text=True, capture_output=True)
    return {
        "command": command,
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "output_dir": str(output_dir),
        "report": str(output_dir / "cutout-report.json"),
    }


def main() -> int:
    args = parse_args()
    report: dict[str, object] = {
        "input": str(Path(args.input)),
        "output_dir": str(Path(args.output_dir)),
        "rows": args.rows,
        "cols": args.cols,
        "run_cutout": args.run_cutout,
        "crops": [],
    }
    try:
        crops = crop_sheet(args)
        report["crops"] = [str(path) for path in crops]
        if args.run_cutout:
            report["cutout"] = run_cutout(args, Path(args.output_dir))
            if report["cutout"]["returncode"] != 0:
                report["status"] = "cutout_failed"
                print(json.dumps(report, indent=2))
                return int(report["cutout"]["returncode"])
        report["status"] = "ok"
        print(json.dumps(report, indent=2))
        return 0
    except Exception as exc:  # noqa: BLE001 - CLI should report all failures.
        report["status"] = "error"
        report["error"] = str(exc)
        print(json.dumps(report, indent=2), file=sys.stderr)
        return 1
    finally:
        if args.json_output:
            output_path = Path(args.json_output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
