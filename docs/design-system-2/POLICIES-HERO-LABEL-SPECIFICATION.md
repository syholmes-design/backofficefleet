# Policies Hero Label Specification

## Source And Output

- Canonical clean source: `Website/assets/images/design-system-2/wave-2/ds2-policies-governance-hero-clean.png`
- Derived production asset: `Website/assets/images/design-system-2/wave-2/ds2-policies-governance-hero-labeled.png`
- Reproducible script: `tools/design-system-2/create_policies_hero_labels.py`
- Image dimensions: `1763 x 892`
- Output file size: `1,590,016 bytes`

The clean source asset remains preserved and is not edited destructively.

## Labels Used

| Label | Coordinates | Rotation | Font size | Treatment |
| --- | ---: | ---: | ---: | --- |
| Safety & Compliance Manual | `(930, 354)` | `1.0deg` | `28px` | Segoe UI Bold, low-contrast silver-blue, soft embossed shadow/highlight |
| Driver Qualification Policy | `(875, 488)` | `1.0deg` | `29px` | Segoe UI Bold, low-contrast silver-blue, soft embossed shadow/highlight |
| Hours-of-Service Procedures | `(815, 607)` | `1.0deg` | `29px` | Segoe UI Bold, low-contrast silver-blue, soft embossed shadow/highlight |
| Cargo Securement Policy | `(805, 724)` | `1.0deg` | `29px` | Segoe UI Bold, low-contrast silver-blue, soft embossed shadow/highlight |

## Visual Rules

- Labels are placed only on visible book spines.
- No label is placed on the open notebook.
- No main hero headline, BOF logo, navigation, button, or dashboard element is baked into the image.
- The label color is intentionally restrained so the live HTML hero headline remains the primary text.
- The slight rotation follows the spine perspective without introducing artificial glow.
- The live Policies page references the derived labeled asset.

## Mobile Treatment

The labeled asset uses the existing Wave 2 mobile crop position: `70% top`. If owner review finds the labels too subtle or too cropped on narrow screens, the preserved clean source can be reintroduced for mobile through a dedicated mobile-image CSS variable or media-query override.

