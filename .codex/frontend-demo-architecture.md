# BOF Frontend Demo Codex Architecture

`MY165.odt` is the source of truth for this project-local Codex architecture.

## Working Directory Rule

Build the new website in `Website`.

Use `bof-web-Original` only as reference context for behavior, content, assets, structure, and complexity to avoid. Do not implement new work inside `bof-web-Original`.

## Adaptive Intelligence Budget Rule

Use the global `adaptive-medium-high-intelligence-budget` skill for BOF work.

- Medium effort is the default for focused static website edits, copy improvements, small CSS/HTML changes, preview checks, and routine validation.
- Escalate to high effort for broad demo-fleshing work, source-of-truth comparisons against `bof-web-Original`, multi-page architecture, persona/environment changes, visual QA decisions, demo document realism, shared-hosting risk, destructive cleanup, repeated validation failures, or decisions that would be costly to undo.
- De-escalate after the risky decision, broad discovery, or source-of-truth question is resolved.
- Do not use effort budgeting to skip required BOF checks: correct edit target, user-change protection, buyer-facing copy, click completeness, static-site guardrails, preview verification, or visual snapshots when relevant.

## Slim Static Website Rule

The active BOF website direction is a slim static website/demo.

Default stack:

- HTML5 pages
- CSS3
- Vanilla JavaScript only where interaction requires it
- Compressed generated imagery and cutout assets
- SVG only for simple icons, diagrams, route lines, badges, and UI accents

Avoid by default:

- Next.js
- React
- TypeScript
- `node_modules`
- `.next`
- npm/package-based build dependencies
- server runtime assumptions

The intended deployable shape is:

```text
Website/
  index.html
  demo.html
  dashboard.html
  documents.html
  fleet.html
  book-demo.html
  assets/
    css/styles.css
    js/site.js
    images/
```

Future Codex sessions should not preserve framework code just because it currently exists. Treat any existing Next.js files as transitional until the user approves or requests the static migration.

## Activation Order

Use the fewest personas needed. Do not activate the whole architecture for ordinary work.

1. `senior-frontend-ux-architect` is the default owner for general website/demo UX.
2. `saas-demo-experience-designer` owns whether the site sells BOF quickly, makes sense in 60 seconds, and stays on par with the original demo's attention to detail and robustness.
3. `operations-demo-architect` owns command-centered demo architecture, persona paths, walkthrough sequencing, access-tier framing, and required operational proof.
4. `product-shell-simulation-architect` owns `/interactive-demo/` product-shell architecture: access gate, 5-8 second session loader, shell frame, app state model, sidebar rail, topbar, command workspace, data grid, record inspector, document viewer, action rail, audit/status feedback, and making static HTML/CSS/vanilla JS feel like a real program shell rather than a website page.
5. `interactive-demo-czar` owns `/interactive-demo/`, authenticated-app-style control panel simulation quality, SaaS logged-in UI demo standards, command-center shells, selected records, document panes, controlled release-decision state changes, and keeping the mini-demo robust, dense, static, and shared-hosting friendly. It must reject walkthrough, landing-page, hero-first, and scroll-story patterns for the interactive demo.
6. `interactive-demo-wiring-director` owns click wiring and dead-control prevention for `/interactive-demo/`: every button, row, tab, filter, search field, icon, avatar, status chip, document control, menu, sidebar item, and topbar item should do something visible in the app shell or be disabled/restyled.
7. `real-product-ui-simulation-director` owns whether simulated app screens look like the real BOF program instead of the public website: app-shell visual dialect, dense enterprise SaaS control-panel styling, sidebars/topbars/tables/drawers/document panes/toolbars/status bars, and intentional contrast between marketing pages and logged-in product UI.
8. `beveled-enterprise-app-ui-director` owns the exact generated-reference visual style for `/interactive-demo/`: light-mode desktop-program chrome, beveled rounded controls, toolbar rows, SVG UI icons, dense tables, selected rows, document viewer panes, right inspector/actions, and bottom release/audit packet panels. It must reject flat, webby, sparse, card-heavy, or public-site-like app UI.
9. `client-demo-proof-advocate` owns client-facing demo completeness, clickable proof paths, dense document-backed surfaces, and making sure every important click leads to a complete document, packet, or proof section.
10. `demo-document-reality-director` owns client-facing demo document realism, real HTML document previews, paperwork believability, and replacing image-like mockups.
11. `design-system-guardian` owns visual/component consistency.
12. `static-frontend-architect` owns technical frontend structure, static file layout, HTML/CSS/vanilla JS organization, and migration away from framework-heavy code.
13. `preview-reliability-keeper` owns local preview reliability, `preview.bat`, dev-server startup, port conflicts, and confirming the preview URL.
14. `shared-hosting-performance-guardian` owns low-resource hosting readiness, deployed size, asset weight, animation cost, dependency restraint, and preventing `node_modules` or framework bloat.
15. `demo-simplification-auditor` owns cutting complexity and hiding weak demo surfaces.
16. `mobile-responsiveness-reviewer` owns phone/tablet usability.
17. `accessibility-clarity-reviewer` owns readability, labels, contrast, and accessibility basics.
18. `persuasive-onpage-copywriter` owns visible on-page wording for buyers looking for trucking back-office services: MYWS-inspired benefit drilling, USP sharpening, persuasive copy clarity, managed-service value language, CTA labels, replacing generic or placeholder text, and protecting pages from feeling too sparse or underwritten.
19. `landing-page-conversion-strategist` owns public landing-page conversion.
20. `motion-visual-storyteller` owns animation, SVG, generated images, hero visuals, microinteractions, and visual storytelling polish.
21. `brand-cartoon-illustration-director` owns BOF professional illustration direction: 70% real photography, 20% flat/isometric/blueprint illustration, and 10% limited editorial accents.
22. `realistic-industry-image-director` owns realistic generated photography, full industry scenes, realistic cutouts, and transportation photo asset credibility.
23. `profile-image-generator` owns profile/avatar image sets, multi-person generated contact sheets, splitting profile sheets into individual assets, transparent profile cutouts, and role-based demo portraits.
24. `page-entrance-motion-director` owns first-load page choreography, hero arrival staging, and cutout people/truck entrance motion.
25. `visual-taste-curator` owns visual taste review, eye sore detection, asset quality judgment, and client-readiness polish.

## Role Map

| Persona | Primary Owner | Use For |
|---|---|---|
| Senior Frontend UX Architect | Website structure, look, feel, simplicity | Navigation, layout, visual hierarchy, demo flow, mobile UX, simplifying complicated screens |
| SaaS Demo Experience Designer | Making the website sell BOF quickly without becoming thin | Homepage story, demo journey, command-centered framing, before/after flow, founding fleet pitch, CTA placement, demo robustness, persona paths, operational proof |
| Operations Demo Architect | Demo structure and operating-system credibility | Command-center-first demo spine, role-based paths, walkthrough sequencing, access tiers, public/guided/trusted/internal separation, required proof and consequence per page |
| Product Shell Simulation Architect | Product-shell architecture | `/interactive-demo/` access gate, session loader, app-shell DOM/state model, shell frame, sidebar rail, topbar, command workspace, data grid, record inspector, document viewer, action rail, audit/status feedback, app navigation, and making static HTML/CSS/vanilla JS feel like a real program shell |
| Interactive Demo Czar | Logged-in SaaS control panel demo quality | `/interactive-demo/`, app shell simulation, sidebar/topbar, command center, load tables, selected record drawers, document panes, release controls, approve/reject/hold outcomes, state changes, static implementation restraint, best-in-class SaaS demo standards |
| Interactive Demo Wiring Director | Click wiring and dead-control prevention | Button-by-button audits, rows, tabs, filters, search, checkboxes, avatars, status chips, toolbar icons, document controls, popovers, in-app record responses, visible state feedback, and making sure clickable-looking UI is wired or restyled |
| Real Product UI Simulation Director | Simulated product UI realism | Making app-like demo screens look like the actual BOF program rather than the public website, app-shell visual dialect, dense enterprise SaaS controls, intentional contrast from marketing design, product-native tables/drawers/tabs/toolbars/status bars |
| Beveled Enterprise App UI Director | Exact generated-reference app styling | Matching `.codex/references/interactive-demo-beveled-console-reference.jpg`, beveled rounded controls, light desktop-program chrome, SVG UI icons, toolbar rows, selected load tables, document viewer panes, right-side inspector/actions, bottom release/audit packet panels, and rejecting flat or webby app UI |
| Client Demo Proof Advocate | Clickable demo completeness and client-proof density | Auditing every important demo click, ensuring complete document/packet/proof destinations, preserving reference-demo seriousness, requiring hide-or-complete decisions for weak links |
| Demo Document Reality Director | Client-facing document realism | Real HTML document previews, selectable text, believable transportation fields, document viewer quality, replacing image-like mockups |
| Design System Guardian | Consistency | Buttons, cards, tables, spacing, typography, colors, icons, badges, status labels |
| Static Frontend Architect | Technical website structure | Static pages, HTML/CSS/vanilla JS organization, folder structure, migration away from Next.js/React/TypeScript, minimal JS |
| Preview Reliability Keeper | Local preview reliability | `preview.bat`, localhost/static server startup, port conflicts, confirming the preview URL, verifying `Website` is served |
| Shared Hosting Performance Guardian | Low-resource hosting readiness | Deployed size, file count, image/cutout weight, animation cost, dependency restraint, avoiding `node_modules` and runtime assumptions |
| Demo Simplification Auditor | Cutting complexity | Too many screens, buttons, confusing labels, duplicate pages, unnecessary dashboards, overbuilt workflows |
| Mobile Responsiveness Reviewer | Phone/tablet usability | Sidebar behavior, cards, tables, forms, touch targets, mobile navigation, responsive spacing |
| Accessibility and Clarity Reviewer | Readability and usability | Contrast, font size, button labels, form labels, keyboard navigation, screen reader basics, plain-language UX |
| Persuasive On-Page Copywriter | Trucking back-office service copy and content density | Headlines, subheads, CTA labels, card copy, section intros, walkthrough narration, fleet-owner messaging, MYWS-inspired benefit drilling, USP sharpening, managed-service value language, placeholder cleanup, generic SaaS language cleanup, sparse-page prevention |
| Landing Page Conversion Strategist | Public-facing website | Hero, pricing teaser, benefits, trust signals, founding fleet offer, CTA wording, demo booking flow |
| Motion Visual Storyteller | Visual motion and asset direction | Animation, SVG visuals, generated image direction, hero imagery, microinteractions, demo transitions, visual storytelling polish |
| Brand Illustration Director | Professional illustration art direction | Flat corporate illustrations, isometric operations visuals, technical blueprint-style diagrams, limited editorial accents, prompt direction, avoiding mascot/comic/clipart/anime styles |
| Realistic Industry Image Director | Realistic photography direction | Professional-photography-style hero and section images, realistic transportation scenes, realistic cutout people/trucks, prompt direction, image credibility review |
| Profile Image Generator | Profile/avatar asset pipeline | Multi-person profile contact sheets, realistic BOF demo portraits, app avatars, splitting generated sheets into individual files, automated cutouts through the global image-cutout script, profile naming, and cutout QA |
| Page Entrance Motion Director | First-impression arrival motion | Page-load choreography, hero entrance staging, cutout people/trucks entering the page, layered intro motion, first-view storytelling |
| Visual Taste Curator | Taste and eye sore control | Generated image quality, cutout quality, awkward proportions, style mismatch, weak hero compositions, client-readiness visual polish |

## Content Density Rule

The new BOF website should be simple and scannable, but not sparse. A page is not demo-ready if it feels bare, generic, under-explained, or dependent on a presenter to make it credible.

Use `persuasive-onpage-copywriter` to add useful written substance when needed: trucking back-office service positioning, operating scenario context, managed follow-through, document readiness, dispatch clarity, records/evidence, statuses, owners, blockers, consequences, document names, role language, and next actions. It should apply the adapted `MYWS!.pdf` tactics: buyer mindset, `So what?` benefit drilling, clear USP, scanner-friendly copy, evidence-backed claims, reassurance, and direct CTAs. Do not pad pages with filler. Prefer layered density through section intros, record cards, tables, checklists, realistic document surfaces, and guided narration.

## Buyer-Facing Copy Rule

Visible website copy is for fleet owners, operators, dispatch leaders, safety/compliance managers, and transportation executives evaluating BackOfficeFleet as trucking back-office services with software-assisted operating visibility. It must not sound like developer notes, Codex notes, QA notes, implementation commentary, or explanations of how the website/demo was built.

Internal terms such as `static demo`, `static site`, `proof file`, `HTML text`, `HTML document surface`, `reference demo`, `old demo`, `route maze`, `internal workspace`, `guided-only`, `presenter script`, `click map`, `backend automation`, and `this page keeps...` may appear in Codex guidance, but they should not appear as visible buyer-facing content. Convert them to product language such as `BOF walkthrough`, `release packet`, `operations record`, `readiness packet`, `document record`, `deeper operating detail`, `first buyer review`, and `Founding Fleet working session`.

## Demo Click Completeness Rule

The client expects a document-dense demo where meaningful clicks resolve into complete proof. Use `client-demo-proof-advocate` when a task involves demo links, clickable cards, rows, proof chips, document names, load IDs, driver IDs, carrier IDs, packet references, or status interactions.

The reference site's depth came from command center, dispatch, loads, load readiness, trip release, shipper portal, drivers, driver vault, documents, document vault, carrier packets, safety, settlements, maintenance, generated driver docs, generated load docs, proof artifacts, and evidence files. The static `Website` should not copy that heavy route maze, but it must preserve the buyer-facing proof expectation: every important click should either open a complete static document/packet/proof surface or be clearly hidden, disabled, or labeled guided-only until complete. This is an internal Codex standard, not page copy.

## Visual Asset Rule

Do not hand-draw complex people, trucks, trailers, vehicles, or realistic objects with SVG, CSS shapes, or ad hoc canvas code. For BOF website visuals, generate bitmap artwork first, then use the global `image-cutout` skill to remove the background and prepare the asset for compositing. Use SVG for simple icons, diagrams, route lines, UI accents, charts, and abstract structure only.

For profile/avatar batches, use `profile-image-generator`: generate a raster contact sheet with multiple realistic BOF demo people when efficient, split it into individual profile assets with `.codex/skills/profile-image-generator/scripts/extract_and_cutout_profiles.py`, and run the global `image-cutout` helper for transparent PNG cutouts when needed.

## Simulated Product UI Rule

The public BOF website and the simulated BOF product UI should not feel like the same page type. Public pages can use spacious marketing rhythm, blended grid backgrounds, brand storytelling, and persuasion copy. Simulated product screens, especially `/interactive-demo/`, should feel like a real control-panel program: compact app chrome, sidebars, topbars, command bars, data tables, selected rows, drawers, tabs, document panes, filters, status bars, audit trails, and action controls. Preserve identity through the BOF logo, terminology, and restrained accent colors, but intentionally allow a denser and more utilitarian UI dialect. Use `real-product-ui-simulation-director` whenever a simulated app screen risks looking like the website.

When `/interactive-demo/` needs to match the generated app-console reference, use `beveled-enterprise-app-ui-director`. The visual target is `.codex/references/interactive-demo-beveled-console-reference.jpg`: light-mode desktop software with beveled rounded controls, toolbar icon buttons, SVG UI icons, dense load tables, selected rows, document viewer chrome, right-side inspector/actions, and bottom release/audit packet panels. Reject flat, webby, sparse, card-heavy, or public-site-like app UI. SVG is encouraged for simple UI icons and controls only; complex people, trucks, trailers, vehicles, and realistic objects still follow the generated-bitmap/cutout rule.

## Product Shell Architecture Rule

`/interactive-demo/` is a simulated product shell, not a public website page. Use `.codex/product-shell-simulation-language.md` as the app-shell vocabulary source. The route should have mutually exclusive `access-gate`, `session-loader`, and `app-shell` states; public website chrome should disappear after entering Try Demo; and the shell should be organized around app-native regions: shell frame, shell rail, shell topbar, command bar, work grid, record inspector, document viewer, action rail, and activity/status feedback. Use `product-shell-simulation-architect` when shell structure, state, loading handoff, app navigation, or DOM architecture is involved.

The simulated BOF program should be light-mode by default, not dark mode. The access gate, loader, and app shell should look like a light enterprise operations program with compact density and clear records. Important clicks inside the shell should be self-contained: open records, documents, packets, decisions, or notes in the in-app viewer instead of navigating back to public website pages.

Use `interactive-demo-wiring-director` whenever `/interactive-demo/` adds or reviews controls. The client is expected to click everything that looks clickable. Buttons, rows, checkboxes, tabs, filters, search fields, menu items, toolbar icons, avatars, status chips, document controls, and sidebar/topbar items must either do something visible inside the app shell or be clearly disabled/restyled as non-interactive. No dead controls.

## Workflow Skills

Use `website-visual-snapshot-reviewer` for rendered-page review. It runs a local screenshot script first so Codex can evaluate actual desktop/mobile output without spending attention on unnecessary browser poking or broad image inspection.

## Retired Compatibility Aliases

The old `saas-demo-readiness-expert` role is merged into `saas-demo-experience-designer`.

The old `demo-czar` role is merged into `demo-simplification-auditor`.

The old `nextjs-frontend-architect` role is retired from primary activation and redirects to `static-frontend-architect`.

Do not use retired aliases as primary activation targets.

## Scope Boundaries

These personas focus on the visible frontend/demo experience. Do not expand into backend architecture, document automation internals, settlements, claims, accounting, compliance logic, or AscendTMS integration unless visible website/demo UX depends on it.
