# BOF Product Shell Simulation Language

Use this as the project-local language guide for simulated BOF app screens, especially `/interactive-demo/`.

## Shell Modes

- `access-gate`: the entry screen before the buyer enters the simulated app.
- `session-loader`: the 5-8 second loading state that makes the transition feel like a real system opening.
- `app-shell`: the logged-in product environment.
- `workspace-view`: the main working region inside the shell.
- `record-focus`: the selected load, driver, carrier, document, or release decision.

## Required Shell Regions

- `shell-frame`: full product container, independent from the website template.
- `shell-rail`: persistent app navigation, usually left-side on desktop and compact on mobile.
- `shell-topbar`: fleet, role, queue, status, and exit context.
- `command-bar`: filters, view controls, queue labels, and command context.
- `work-grid`: load queue, readiness table, or operational list.
- `record-inspector`: selected record drawer/panel with owner, blocker, consequence, and next action.
- `document-viewer`: tabbed document pane with selectable text and record links.
- `action-rail`: approve/reject/hold/retry/reset controls.
- `activity-log`: compact status/audit trail when needed.

## Visual Language

- Product screens should look denser, squarer, and more utilitarian than the public website.
- Use light enterprise software styling by default: pale workspace, white panels, clear borders, compact tables, and restrained green/blue accents.
- Do not use dark mode for the simulated BOF program unless the user explicitly asks for it.
- Use compact type, small status chips, grid/table density, thin borders, and restrained shadows.
- Avoid public-page rhythm: hero sections, marketing cards, CTA bands, decorative background sections, and spacious scroll storytelling.
- Preserve BOF identity through logo, data, terminology, and small accent colors, not through copying the whole website design.

## Interaction Language

- Every major click must either change app state or open a complete record.
- Records, packets, document details, release notes, and status details should open inside the product shell, not by linking to public website pages.
- Required state vocabulary: `entry`, `loading`, `review`, `ready`, `blocked`, `watch`, `approved`, `rejected`, `early`, `reset`.
- Use selected-row states, active tabs, disabled controls, status chips, and inspector updates to show the shell responding.
- Avoid decorative buttons. If an item looks clickable, it should be complete or disabled with a clear app-native reason.

## Data Language

- Use real-feeling operating objects: load ID, lane, driver ID, carrier ID, document ID, packet, owner, blocker, consequence, next action, release note.
- Keep IDs consistent with `/operations-record/`.
- Avoid visible implementation terms: `mockup`, `HTML`, `static demo`, `prototype`, `click map`, `proof file`, or `demo-builder`.

## Mobile Shell Language

- Mobile may collapse the shell rail into compact horizontal tabs.
- Tables may scroll horizontally if needed, but the selected record, document viewer, and action rail must remain readable.
- Do not pretend mobile is the full desktop app. Provide a compact product view that still feels authenticated and operational.

## Validation Language

A product shell pass is not complete until:

- The public website chrome is absent from `/interactive-demo/`.
- The access gate, session loader, and app shell are mutually exclusive states.
- The shell is light-mode unless the user explicitly requests dark mode.
- Important clicks open in-app records or switch in-app panes instead of navigating to public website routes.
- The first app viewport shows shell chrome and operational content.
- The state model can be tested in a browser.
- Visual screenshots confirm the shell does not look like the website.
