# Policies Hero Label Specification

## Source And Output

- Canonical clean source: `Website/assets/images/design-system-2/wave-2/ds2-policies-governance-hero-clean.png`
- Live implementation: HTML in `Website/policies-procedures/index.html`
- Live styling: CSS in `Website/assets/css/bof-design-system-2-wave-1.css`

The clean source asset remains preserved and is not edited destructively. The previous derived labeled image remains in the repository history/assets for reference, but the live public Policies hero uses editable HTML/CSS overlay labels instead of baked raster text.

## Labels Used

| Label | CSS selector | Treatment |
| --- | --- | --- |
| HR Manual | `.policy-hero-spine-label--hr` | Low-contrast silver-blue, centered horizontal placement, soft shadow |
| Accounting Policies | `.policy-hero-spine-label--accounting` | Low-contrast silver-blue, centered horizontal placement, soft shadow |
| Safety & Compliance | `.policy-hero-spine-label--safety` | Low-contrast silver-blue, centered horizontal placement, soft shadow |
| IT Governance | `.policy-hero-spine-label--it` | Low-contrast silver-blue, centered horizontal placement, soft shadow |

## Visual Rules

- Labels are placed only on visible book spines.
- No label is placed on the open notebook.
- No main hero headline, BOF logo, navigation, button, or dashboard element is baked into the image.
- The label color is intentionally restrained so the live HTML hero headline remains the primary text.
- Labels are centered horizontally on the book sides without a skewed or angled treatment.
- The live Policies page references the clean hero image and renders labels as an overlay.

## Mobile Treatment

The label overlay is hidden below the 920px breakpoint. The mobile hero keeps the existing Wave 2 mobile crop position: `70% top`, avoiding cropped or floating labels on narrow screens.
