# BOF Design System 2.0

Status: Wave 0 foundation for owner review.

## Purpose

BOF Design System 2.0 creates a controlled visual and interaction foundation for BackOfficeFleet public pages before broad redesign work continues.

The system is built around one product principle: every page should help the buyer see the operating record, the reason something is ready or blocked, the owner, and the path to clearance.

## Foundation Files

- Logo assets: `Website/assets/brand/bof-design-system-2/`
- Tokens: `Website/assets/css/bof-design-system-2-tokens.css`
- Components: `Website/assets/css/bof-design-system-2-components.css`
- Preview route: `Website/design-system-2-preview/index.html`

The preview route is marked `noindex,nofollow` and is not intended as a production marketing page.

## Visual Direction

- Dark enterprise navigation with gold interaction accents.
- Light operational workspaces with restrained grids and high information density.
- Cards used for records, evidence, status, and module summaries rather than decorative story blocks.
- Larger logo treatment than the current compressed header implementation.
- Strong separation between live/read-only actions, simulated demo actions, and unavailable future actions.

## Typography

Primary font stack:

`Inter, Segoe UI, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

Headlines should be strong but controlled. Avoid excessive oversized headings inside compact dashboards, tables, rosters, or workflow cards.

## Color Tokens

Core tokens are defined in `bof-design-system-2-tokens.css`.

- Navy: `#0A1224`, `#0A2342`
- Near black: `#05070D`
- BOF blue: `#0078D4`
- Teal accent: `#22C7B8`
- Gold accent: `#FFB300`
- Off-road brown: `#8A4F08`
- Light surface: `#F6F9FC`

## Interaction Rules

- Navigation hover states use gold underlines.
- Active navigation uses brighter white text plus the same gold underline.
- Buttons must have clear intent and should not imply persistent writes unless the route actually supports secure writes.
- Keyboard focus must remain visible.
- Mobile navigation starts closed by default.

## Page Conversion Rule

Do not redesign every page in one pass. Convert public pages in waves:

1. Apply shared header/footer and logo behavior.
2. Remove duplicate CTA bands and internal design-note language.
3. Replace broad story cards with record-first sections.
4. Add issue-specific secondary pages only where the link answers a specific operational question.
5. Validate desktop, tablet, and mobile before deployment.
