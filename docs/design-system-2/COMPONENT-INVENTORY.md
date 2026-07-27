# Component Inventory

Status: Wave 0 foundation components.

## Added In This Package

### DS2 Header

Files:

- `Website/assets/css/bof-design-system-2-components.css`
- `Website/design-system-2-preview/index.html`
- `Website/assets/js/bof-design-system-2-preview.js`

Features:

- Dark enterprise single-row desktop header.
- Gold hover underline.
- BOF Vault and Documents as first-class navigation items.
- Gold-outline Sign In button.
- Contact icon.
- Tablet/mobile hamburger behavior.

### DS2 Footer

Features:

- Dark navy footer.
- Logo treatment.
- Short environment label.

### Buttons

Variants:

- Primary blue action.
- White secondary action.
- Gold outline action.
- Circular icon action.

Rules:

- Use navigation labels for navigation.
- Do not use persistent verbs without secure write implementation.

### Cards

Variants:

- Record tile.
- Standard content card.
- Brand asset card.
- Dark hero record panel.

Rules:

- Cards should show record, evidence, module, action, or policy value.
- Avoid decorative cards that only repeat surrounding copy.

### Logo Assets

Location:

- `Website/assets/brand/bof-design-system-2/`

Variants:

- Horizontal light.
- Horizontal reversed.
- Compact.
- Stacked.
- Symbol-only.
- Monochrome.
- Mobile header.
- Favicon/app icon.

## Not Added Yet

- Production replacement of current site header.
- Shared include/build system for applying header/footer across all static pages.
- Issue-specific secondary page template.
- Assessment hub template.
- Video module template.
- Dashboard-v2 component bridge.

## Conversion Note

The current public site is static HTML. A broad header replacement still requires a controlled static-page update pass or a build/includes strategy. This Wave 0 package intentionally avoids rewriting all pages.
