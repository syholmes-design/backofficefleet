# Accessibility Checklist

Status: Wave 0 checklist for DS2 adoption.

## Header

- Logo link has an accessible name.
- Primary navigation has `aria-label="Primary"`.
- Mobile menu button exposes `aria-expanded`.
- Escape closes mobile navigation in the preview.
- Keyboard focus remains visible.
- Navigation text remains readable against the dark header.

## Buttons And Links

- Button labels describe the destination or action.
- Read-only and navigation actions must not imply approval, release, upload, payment, deletion, or record mutation.
- Simulated actions must be labeled as simulated when used.
- Link targets should not be placeholder pages.

## Layout

- No horizontal scrolling at 1440, 1366, 1280, 768, or 390 px.
- Text does not overlap hero images.
- Cards do not contain nested decorative cards.
- Large headings are reserved for heroes and section leads.

## Motion

- Hover and lift effects are subtle.
- Reduced-motion users should not lose meaning.
- Animation should not be required to understand a record state.

## Record States

- Color is not the only signal.
- Ready, review, at-risk, blocked, held, and exception states include text labels.
- Blocked or review records include reason, owner, affected record, and clearance path.

## Media

- Hero images should retain subject visibility and not rely on dark overlays that erase context.
- Videos require controls and useful poster images.
- Decorative images should not be inserted into issue cards unless they directly support the issue.
