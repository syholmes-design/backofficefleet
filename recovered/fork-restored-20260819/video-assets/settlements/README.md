# BOF Settlements Explainer Storyboard

This is a local-only visual asset package for a short BackOfficeFleet settlements explainer video. It is meant for screenshots, screen recordings, and Pictory-style visual production around settlement readiness, driver pay clarity, billing packets, and factoring packet support.

## Files

- `index.html` - local storyboard page with eight video-ready scenes.
- `settlements-storyboard.css` - dashboard-style visual system and responsive layout.
- `settlements-storyboard.js` - lightweight scene rendering and animation.
- `settlements-scenes.json` - scene content, sample load, and business wording constraints.
- `README.md` - usage notes for this local-only package.

## How To Open Locally

Open `Website/video-assets/settlements/index.html` in a browser, or serve the `Website` folder with any simple local static server and visit `/video-assets/settlements/`.

The JavaScript tries to load `settlements-scenes.json`. If a browser blocks local JSON loading from a direct file open, the page falls back to the same built-in scene data.

## Screenshot Or Screen Record

Use the scene number buttons at the top to jump between scenes. Each scene is designed as a clean dashboard-style frame with large on-screen copy, status cards, settlement packet visuals, and readable mobile stacking.

Suggested capture flow:

1. Open the storyboard at desktop width for widescreen video frames.
2. Capture each scene after the reveal animation settles.
3. Use the visual cards as screenshots, short screen recordings, or Pictory source images.
4. Keep the sample load visible where useful: `BOF-L008`, `Delivered / Settlement Review`, `POD received, lumper receipt pending`.

## Local-Only Notes

No deploy was performed.
No push was performed.
No commit was performed.
No staging was performed.

This package intentionally avoids unsupported claims. It does not say BOF guarantees faster payment, acts as a factoring company, directly pays drivers, or automatically solves every issue.
