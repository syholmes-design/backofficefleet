# Project Codex Guidance

## Adaptive Intelligence Budget

Use the global `adaptive-medium-high-intelligence-budget` skill for this project.

Default to medium-effort reasoning for ordinary BOF website edits, copy passes, small static HTML/CSS changes, targeted validation, preview checks, and concise status updates.

Escalate to high-effort reasoning for broad demo-fleshing work, source-of-truth comparisons against `bof-web-Original`, multi-page architecture decisions, persona/environment changes, visual QA decisions, document-realism standards, shared-hosting risk, destructive or cleanup requests, repeated validation failures, or any task where a wrong assumption would be costly to unwind.

Return to medium effort once the risky decision, broad discovery, or source-of-truth question is resolved and the remaining work is routine implementation or verification.

Never use effort budgeting to skip repository inspection, user-change protection, buyer-facing copy checks, demo click-completeness checks, static-site guardrails, preview verification, or visual snapshot review when those checks are relevant.

## Project Working Directories

Build the new website in `Website`.

Use `bof-web-Original` only as a reference for existing behavior, content, assets, structure, or design clues. Do not implement new website changes inside `bof-web-Original`, and do not treat it as the active app unless the user explicitly asks to inspect or compare against it.

If there is any ambiguity about where to edit, stop and confirm before changing files. The default edit target for website work is always `Website`.

## Owner Creative Build Mode

This clean redesign repository is the owner's active creative build space. The user is the creative authority for BOF website look, feel, page experience, copy direction, and redesign decisions.

When working in `C:\Users\syhol\BOF-public-site-redesign-clean`, Codex on HP is authorized to directly edit `Website`, run local preview, and perform local QA for owner-directed redesign work. Do not relay these local creative build changes to the webmaster by default.

Relay or webmaster handling is still required for production deployment, live-site overwrite, FTP upload, push to a shared remote, credential/secret/account work, or changes outside this clean redesign repository.

## Website Backup Steward

Use the project-local `website-backup-steward` skill when the user asks to back up the website, create a restore point, list backups, restore a backup, or protect the site before broad/risky edits. The active backup target is `Website`, and backups must stay outside the deployable site under `.codex/backups/website/`.

Default scripts:

- Backup: `.codex/skills/website-backup-steward/scripts/backup-website.ps1`
- List: `.codex/skills/website-backup-steward/scripts/list-website-backups.ps1`
- Restore: `.codex/skills/website-backup-steward/scripts/restore-website-backup.ps1`

Never restore without a specific backup zip and explicit restore confirmation. Do not back up or restore `bof-web-Original` unless the user explicitly asks for that separate reference folder.

## Website FTPS Upload

Use the project-local `website-ftp-upload` skill when the user asks to FTP/FTPS upload, deploy, publish, or sync the current BOF website to `ftp.backofficefleet.com`. This deploy skill is strictly scoped to the active `Website` folder and must use explicit FTPS, meaning FTP over TLS on port `21`.

Use the project-local `ftp-script-engineer` skill when the user asks to create, redesign, harden, debug, or review FTP/FTPS/SFTP scripts. This role owns script engineering details such as dry-run design, retry behavior, directory creation quirks, credential safety, certificate-bypass boundaries, upload logs, and path-scope guardrails. Use `website-ftp-upload` for ordinary BOF Website uploads after the script behavior is already established.

Default script:

- Upload dry-run/apply: `.codex/skills/website-ftp-upload/scripts/upload-website-ftp.ps1`

Always run a dry run first and confirm the file inventory is only `Website` content. Do not upload `bof-web-Original`, `.codex`, project-root notes, backups, recordings, or any non-Website folder. Do not store FTP/FTPS usernames, passwords, or credential passphrases in project files, skills, checklists, logs, or AGENTS.md. Prefer the passphrase-encrypted credential file created by `.codex/skills/website-ftp-upload/scripts/save-website-ftp-credential.ps1`, and supply its passphrase only at the upload prompt unless the user explicitly chooses a runtime parameter. Use upload-only behavior unless the user explicitly asks for a separate remote deletion/mirror workflow. Do not downgrade this uploader to plain FTP; the script must have no insecure fallback or TLS-disable parameter. For this BOF host, the user has set a standing preference to bypass the known invalid FTPS certificate warning, matching their FileZilla workflow; use `-AllowInvalidCertificate` for uploads to `ftp.backofficefleet.com` while keeping explicit FTPS/TLS enabled.

## Runtime Resource Steward

Use the project-local `runtime-resource-steward` skill when the user reports high RAM/CPU after Codex work, asks to clean up tool leftovers, or when a task starts local preview servers, browser automation, visual snapshot scripts, Playwright/npx screenshot jobs, or other long-running helpers.

Default scripts:

- Audit: `.codex/skills/runtime-resource-steward/scripts/audit-runtime-resources.ps1`
- Cleanup dry-run/apply: `.codex/skills/runtime-resource-steward/scripts/stop-runtime-leftovers.ps1`
- Memory pressure report: `.codex/skills/runtime-resource-steward/scripts/report-memory-pressure.ps1`

Always audit before cleanup. Do not kill by process name alone. Only stop clear BOF/Codex leftovers tied to this workspace, preview ports, or known snapshot scripts. Never stop `node_repl.exe`, OpenAI/Codex kernel processes, unrelated Python/Node jobs, editors, browsers, or processes from other projects.

## Client Scope Translator

Use the project-local `client-scope-translator` skill when a client instruction document or pasted scope appears to prescribe a heavier technical implementation than this static BOF website needs. This is especially important when the client request mentions React, Next.js, TypeScript, components, services, adapters, APIs, webhooks, databases, auth, `.env`, npm, package installs, build/typecheck commands, or real integrations.

The translator's job is to follow the client's business intent as closely as possible while converting the implementation into the languages and structures this environment focuses on: HTML, CSS, vanilla JavaScript, JSON, compressed assets, and static routes. It should introduce another language only when the desired outcome cannot honestly work as static files and the alternative is compatible with ordinary shared hosting. PHP may be considered only for a real shared-hosting server-side need and only after explaining the tradeoff.

Do not dismiss a client request just because it sounds copied from ChatGPT. Extract the visible buyer-facing capability, preserve the operating proof, and translate framework-heavy prescriptions into lightweight static equivalents. Examples: a `component` can become an HTML section, a TypeScript `type` can become a documented JSON shape, an API `adapter` can become a vanilla JS helper over static mock data, and a backend `route` can become a static folder with `index.html`.

Escalate to the user before adding TypeScript, React, Next.js, npm packages, a bundler, Node runtime, `.env`, credentials, real API calls, auth, uploads, persistence, or database writes.

## Website Technical Direction

The new BOF website should be a slim static website/demo, not a framework-heavy app.

Default implementation stack:

- HTML5
- CSS3
- Vanilla JavaScript only when needed
- Compressed generated imagery and cutout assets
- SVG only for simple icons, diagrams, route lines, badges, and UI accents

Avoid by default:

- Next.js
- React
- TypeScript
- `node_modules`
- `.next`
- npm/package-based build dependencies
- Server runtime assumptions

The deployable `Website` folder should stay small, understandable, and suitable for ordinary shared hosting. If a future task appears to require a framework, package install, bundler, backend runtime, or heavy dependency tree, stop and explain the tradeoff before implementing.

## Asset Cache Busting Rule

The static site uses query-string asset versions so browser caches do not keep showing old CSS or JavaScript after a deploy. When `Website/assets/css/styles.css` changes, run `.codex/scripts/bump-website-cache-version.ps1 -Version <new-version>` and keep the updated HTML references. When shared JavaScript also changes, run the same script with `-IncludeScripts`.

Use simple versions such as `1.3`, `1.4`, or a date-based value. The current stylesheet version is `1.2`; the next visual/CSS deploy should bump it to `1.3`.

Keep `Website/.htaccess` in place for Apache/shared-hosting deployments so HTML pages are not aggressively cached. Do not add a build system just to solve cache busting.

## AscendTMS Simulation Boundary

The AscendTMS work is a simulated partner workflow, not a planned real API or sync integration. Do not build or imply live AscendTMS API calls, webhooks, two-way sync, credentials, `.env`, auth, backend routes, database writes, or production integration behavior unless the user explicitly reverses this decision.

Use `.codex/ascendtms-demo-scope-note.md` as the durable scope note. Use `.codex/ascendtms-backend-ui-reference.md` as the visual/workflow reference for shaping AscendTMS-like backend/source-system screens inside the static BOF simulation. Future AscendTMS work should follow the earlier BOF interactive-demo pattern: static HTML/CSS/vanilla JS/JSON, synthetic load records, simulated partner import/review/handoff behavior, and shared-hosting-safe presentation.

Use the project-local `ascendtms-integration-researcher` skill when the user asks to research AscendTMS, find sources for AscendTMS integration, verify client claims about AscendTMS, or ground a static BOF simulation in real AscendTMS source material. This role must browse current sources, prefer official AscendTMS/InMotion Global/TheFreeTMS material, separate AscendTMS from unrelated `Ascend` products, cite URLs, and hand findings to `client-advocate-project-manager` and `client-scope-translator` before implementation.

Use the project-local `ascendtms-backend-visual-parity-director` skill when the user asks for the BOF demo to emulate AscendTMS backend visuals, when source-system/load-board UI is being reshaped from the reference screenshots, or when the demo needs to feel more visibly integrated with an AscendTMS-like backend while staying static. This role owns visual/workflow parity for source-system panes: blue/grey module rails, tabbed load queues, dense tables, status-colored cells, compact toolbars, shortcut popovers, document management panes, accounting handoff tables, and utilitarian admin controls.

Use the project-local `ascendtms-backend-formatting-director` skill when the user asks for demo-page formatting to mirror AscendTMS backend screens, or when source-system pages need table, tab, toolbar, rail, breadcrumb, modal, document-pane, accounting-table, row-density, status-cell, or responsive formatting parity with the AscendTMS reference screenshots. This role is narrower than visual parity: it protects layout grammar and formatting proportions, not live integration behavior.

## Frontend Demo Architecture

Use `.codex/frontend-demo-architecture.md` as the project-local Codex architecture source. `MY165.odt` is the source document behind this architecture.

Use the fewest personas needed. Do not activate every frontend/demo persona for ordinary work.

Default routing:

- General website/demo requests: use `senior-frontend-ux-architect`.
- "Will this sell?", "Can a trucking company owner understand this fast?", or demo robustness/detail standards: use `saas-demo-experience-designer`.
- Command-centered demo architecture, role paths, guided walkthrough sequencing, access tiers, or what the full BOF demo must include: use `operations-demo-architect`.
- Product-shell architecture for `/interactive-demo/`, making the hands-on demo feel like a real program shell rather than a styled HTML page, simulated login/access screens, 5-8 second loading/session handoff, app-shell DOM/state structure, shell frame, sidebar rail, topbar, command workspace, data grid, record inspector, document viewer, action rail, and audit/status feedback: use `product-shell-simulation-architect`.
- Hands-on interactive demo work, `/interactive-demo/`, authenticated-app-style control panel simulations, logged-in SaaS UI demos, command-center shells, sidebars/topbars, load tables, record drawers, document panes, controlled release-decision flows, approve/reject/hold interactions, scenario state changes, or making the interactive demo dense and best-in-class while still static: use `interactive-demo-czar`. The interactive demo must not be another walkthrough, landing page, hero-first page, or scroll-based explanation.
- Demo usability, buyer comprehension, "what changed when I clicked?", action results hidden below the fold, weak in-view feedback, confusing task flow, or making `/interactive-demo/` useful without a presenter: use `demo-ux-usability-director`.
- Click wiring, dead-button prevention, button-by-button demo audits, or making sure every clickable-looking item in `/interactive-demo/` does something visible inside the program shell: use `interactive-demo-wiring-director`.
- Simulated product UI realism, making `/interactive-demo/` look like the actual BOF program instead of matching the public website, app-shell visual dialect, dense enterprise SaaS control-panel styling, sidebars/topbars/tables/drawers/document panes/toolbars/status bars, or intentionally creating a professional contrast between website pages and logged-in software screens: use `real-product-ui-simulation-director`.
- Beveled enterprise app styling for `/interactive-demo/`, matching the saved generated app-console reference, fixing UI that feels flat or webby, using light-mode desktop-program chrome, beveled rounded controls, toolbar rows, SVG UI icons, dense tables, document viewer panes, right inspector/actions, and bottom release/audit packet panels: use `beveled-enterprise-app-ui-director`.
- AscendTMS backend visual parity for `/interactive-demo/` source-system panes, TMS load boards, imported-load grids, document-management views, accounting handoff tables, shortcut popovers, status-colored cells, or making the simulated demo visibly echo the provided AscendTMS backend screenshots: use `ascendtms-backend-visual-parity-director`.
- AscendTMS backend formatting parity for source-system/demo pages, table density, tabs, compact action toolbars, grey subnav, title/breadcrumb bands, status-cell formatting, document preview/edit split panes, load-posting modals, accounting table layout, and responsive formatting that should structurally mirror AscendTMS backend pages: use `ascendtms-backend-formatting-director`.
- Client-facing demo completeness, clickable demo audits, "every click needs a complete document," dense document-backed proof, client-specific record obsessiveness, driver/POD/document realism, priority logic, enlarged inspectable evidence, Command Center proof, or making sure the new static demo preserves the reference demo's seriousness: use `client-demo-proof-advocate`.
- Driver documentation parity against `bof-web-Original`, pulling reference drivers into `Website`, checking DQF/vault/generated driver documents, making sure driver pages match the original reference detail level, or verifying every driver has a unique face and complete clickable paperwork: use `reference-driver-documentation-auditor`.
- Demo document realism, client-facing paperwork proof, document viewer quality, document-specific layouts, or documents that look too generic/site-template-like: use `demo-document-reality-director`.
- Physical/scanned artifact realism, generated driver's licenses/CDLs, ID-style cards, scan-like documents, BOL/POD/photo evidence, medical cards, insurance certificates, signatures, stamps, seals, barcodes, or deciding whether image generation is needed for a document: use `document-artifact-realism-director`.
- Real file-artifact standards for BOF demo paperwork, DOCX/PDF-style documents, static rendered document pages, document viewer file behavior, replacing HTML UI panels with file-like artifacts, or requiring driver licenses/CDLs to be generated image artifacts rather than HTML: use `document-file-artifact-director`.
- Fully fleshed out synthetic document content, rejecting lazy `Masked` / `On file` / placeholder fields in client-facing demo paperwork, adding believable fictional values, signatures, stamps, document numbers, dates, parties, and complete inspection-ready form sections without exposing real private data: use `synthetic-document-completeness-director`.
- Consistency issues: use `design-system-guardian`.
- Small client-visible inconsistencies, stale labels, cache-version misses, distorted images, mismatched names/faces/genders, broken links, conflicting IDs/statuses, accidental developer wording, tiny visual nits, or final "little mistakes" closeout sweeps: use `detail-consistency-auditor`.
- Thread conflicts, parallel Codex work, handoffs, resumes, stale changes, overlapping active checklists/goals, suspicious same-file or same-route edits, or "make sure this doesn't conflict": use `thread-conflict-steward`.
- Persona or skill adaptation, feedback-driven operating-rule changes, cautious updates to agents/skills/AGENTS.md, repeated persona misses, specialist overlap, or "change the personas/skills based on feedback": use `persona-skill-adaptation-steward`.
- Technical frontend structure, static page/file layout, HTML/CSS/vanilla JS organization, or migration away from framework code: use `static-frontend-architect`.
- FTP/FTPS upload, deploy, publish, sync, or pushing the current BOF website to the FTP server: use `website-ftp-upload`.
- Client instruction translation, ChatGPT-generated client scopes, heavy stack requests, API/component/type/service language that should become static shared-hosting-friendly Website work, or deciding whether a new language is truly necessary: use `client-scope-translator`.
- Local preview reliability, `preview.bat`, simple static server startup, localhost issues, port conflicts, or confirming the preview URL: use `preview-reliability-keeper`.
- Runtime cleanup, RAM/CPU pressure from leftover preview servers, stuck visual snapshot jobs, Playwright/npx screenshot commands, local port listeners, or long-running helper process hygiene: use `runtime-resource-steward`.
- Shared-hosting readiness, deployed file size, asset weight, animation cost, dependency restraint, avoiding `node_modules`, or low-resource performance: use `shared-hosting-performance-guardian`.
- Complexity complaints or show/hide decisions: use `demo-simplification-auditor`.
- Phone/tablet concerns: use `mobile-responsiveness-reviewer`.
- Readability, labels, contrast, and usability basics: use `accessibility-clarity-reviewer`.
- Squished tables, cramped grids, clipped text, bad wrapping, horizontal overflow, broken responsive stacking, unreadable dense panels, or rendered formatting defects: use `layout-formatting-auditor`.
- Persuasive on-page text tweaks for buyers looking for trucking back-office services, fleet-owner messaging, MYWS-inspired benefit drilling, USP sharpening, managed-service value language, headlines, CTA labels, card copy, replacing generic/placeholder wording, or preventing pages from feeling too sparse/thin: use `persuasive-onpage-copywriter`.
- Public landing/conversion work: use `landing-page-conversion-strategist`.
- Animation, SVG, generated images, hero visuals, microinteractions, or visual storytelling polish: use `motion-visual-storyteller`.
- Public Website animation systems using animated WebP, CSS animation, SVG motion, transition animation, scroll/section reveals, photo-motion loops, route/status motion, many animated page moments, or "a lot of animation": use `website-animation-integration-director`. This role should coordinate with `shared-hosting-performance-guardian` for heavy media batches and `accessibility-clarity-reviewer` for reduced-motion/readability.
- Professional illustration direction, flat corporate visuals, isometric operations visuals, technical blueprint-style diagrams, limited editorial cartoon accents, or rejecting mascot/comic/clipart/anime-style artwork: use `brand-cartoon-illustration-director`.
- Realistic generated images, professional-photography-style hero/section images, realistic industry cutouts, or transportation photo asset prompts: use `realistic-industry-image-director`.
- Profile/avatar image generation, one-face-at-a-time driver/profile portraits, aspect-ratio-safe profile assets, transparent profile cutouts, role-based demo portraits, or preparing profile images for BOF app/demo people: use `profile-image-generator`.
- First-load page entrance animation, hero arrival choreography, or cutout people/trucks coming into the page: use `page-entrance-motion-director`.
- Visual taste review, eye sore detection, awkward generated assets, bad cutouts, clashing styles, or client-readiness polish: use `visual-taste-curator`.
- Visual QA, screenshots, responsive rendered-page review, or "look at the website" checks: use `website-visual-snapshot-reviewer` and run its snapshot script before making visual judgments.
- When screenshot review finds physical formatting issues such as crushed tables, clipped controls, or awkward responsive stacking, hand that evidence to `layout-formatting-auditor` before making CSS fixes.

Visual asset rule:

- Do not hand-draw complex people, trucks, trailers, vehicles, or realistic objects with SVG, CSS shapes, or ad hoc canvas code for BOF visuals. Generate a bitmap image first, then use the global `image-cutout` skill to remove the background and prepare it as a cutout asset. Use SVG only for simple icons, diagrams, route lines, UI accents, charts, and abstract visual structure.
- For BOF profile/avatar sets, use `profile-image-generator`: generate exactly one face/person per source image, never a multi-person contact sheet for new driver/profile faces, then run the global `image-cutout` workflow for transparent PNG cutouts when needed. Profile images must preserve natural aspect ratio at the actual site display size; reject stretched, squeezed, widened, narrowed, reused, or gender/name-mismatched portraits.
- For the `2nd Reference Folder`, use the reference for offer structure, page flow, and business intent only. Do not copy its imagery into `Website` as-is. Any second-reference image direction must be translated into BOF-native visuals: existing BOF illustrations/photos when they fit, or newly generated/compressed bitmap assets that match BOF's transportation, record-backed, professional visual system.

Simulated product UI rule:

- The public BOF website and the logged-in BOF app simulation should not share the same visual rhythm. Public pages may use marketing layouts, blended grid backgrounds, spacious sections, persuasive copy, and brand storytelling. Simulated product screens, especially `/interactive-demo/`, should look like real operations software: compact app chrome, sidebars, topbars, data tables, selected rows, drawers, tabs, document panes, status bars, filters, audit trails, and action controls. Preserve BOF identity through logo, terminology, and accent colors, but allow the product UI to feel denser, more utilitarian, and intentionally different from the website. Use `real-product-ui-simulation-director` when this distinction matters.
- When `/interactive-demo/` is being styled to match the generated app mockup, use `beveled-enterprise-app-ui-director`. The visual target is `.codex/references/interactive-demo-beveled-console-reference.jpg`: light-mode enterprise software with beveled rounded buttons, tabs, chips, panes, toolbar icon buttons, dense tables, selected rows, document viewer chrome, right-side inspector/actions, and bottom release/audit packet panels. Use SVG for simple UI icons and controls only; do not use SVG for complex people, trucks, trailers, vehicles, or realistic objects.

Product shell architecture rule:

- The Try Demo route is not a public website page. It should be architected as a product shell with mutually exclusive states: access gate, session loader, and app shell. Once the buyer clicks Try Demo, public site chrome should disappear: no site header, public nav, CTA band, or marketing footer on `/interactive-demo/`. Use `.codex/product-shell-simulation-language.md` as the app-shell vocabulary source. Use `product-shell-simulation-architect` when work involves shell state, DOM structure, app regions, loading handoff, app navigation, or making static HTML/CSS/vanilla JS feel like a real program.
- The simulated BOF program should not use dark mode by default. Use a light enterprise operations shell: pale workspace, light panels, clear borders, compact controls, and restrained green/blue accents. The access gate and session loader may feel like software, but they should remain light-mode unless the user explicitly asks for dark mode.
- `/interactive-demo/` should be self-contained. Important clicks inside the program should open records, packets, documents, notes, and status details inside the shell instead of linking back to public website pages. Public website links should be avoided inside the product shell except for an explicit end-session/exit action if the user asks for it.
- `/interactive-demo/` should not make the user hunt below the fold to understand a click. Use `demo-ux-usability-director` when action feedback, record changes, alert clicks, or document changes are easy to miss. Important outcomes should appear in the current viewport, in a persistent shell region, or through an intentional focus/highlight/scroll behavior that clearly explains what changed.
- `/interactive-demo/` should not contain dead controls. Use `interactive-demo-wiring-director` when buttons, rows, tabs, filters, search fields, icons, avatars, status chips, document controls, menus, or sidebar/topbar items are added or reviewed. Anything that looks clickable must either do something visible in the app shell, open a complete in-app record/panel, filter/select/update state, show a menu/toast/audit response, or be clearly disabled/restyled as non-interactive.

The old `saas-demo-readiness-expert` and `demo-czar` roles are compatibility aliases only. Their active responsibilities have been merged into `saas-demo-experience-designer` and `demo-simplification-auditor`.

The old `nextjs-frontend-architect` role is a compatibility alias only. Its active responsibilities have moved to `static-frontend-architect`.

## Scope Boundaries

The frontend/demo personas focus on visible website and demo UX. Do not let them expand into backend architecture, PDF generation, document automation internals, compliance logic, settlements logic, claims workflows, accounting workflows, AscendTMS integration, or full production feature design unless those areas directly affect visible frontend/demo UX.

## Content Density Rule

The BOF website should be simple, but not sparse. Future copy and page passes must protect against pages that feel bare, underwritten, generic, or dependent on a presenter to explain the value.

Use `persuasive-onpage-copywriter` when a page needs more substance or sharper trucking back-office service positioning. Apply the adapted `MYWS!.pdf` tactics: identify the buyer mindset, run the `So what?` benefit drill, state the page's USP early, support claims with records/evidence, reassure without hype, and ask for a clear next action. Add useful BOF-specific detail such as operating scenario context, managed follow-through, document readiness, dispatch clarity, statuses, owners, blockers, consequences, document names, role language, and next actions. Do not add filler just to increase word count. Prefer scannable density through section intros, record cards, tables, checklists, document surfaces, and guided narration.

## Buyer-Facing Copy Rule

Visible website copy is for fleet owners, operators, dispatch leaders, safety/compliance managers, and transportation executives evaluating BOF as trucking back-office services with software-assisted operating visibility. It must not read like developer notes, Codex notes, QA notes, implementation commentary, or explanations of how the site/demo was built.

Use `persuasive-onpage-copywriter` to remove public-facing phrases such as `static demo`, `static site`, `proof file`, `HTML text`, `HTML document surface`, `reference demo`, `old demo`, `route maze`, `internal workspace`, `guided-only`, `presenter script`, `click map`, `backend automation`, or `this page keeps...`. Convert them into buyer-facing product language such as `BOF walkthrough`, `release packet`, `operations record`, `readiness packet`, `document record`, `deeper operating detail`, `first buyer review`, and `BOF working session`.

## Founding Fleet Funnel Boundary

The Founding Fleet offer is a dedicated funnel, not the global BOF site story. Keep the canonical offer under `/founding-fleet/`, `/founding-fleet/trial/`, `/founding-fleet/pricing/`, `/founding-fleet/apply/`, and the compatibility `/founding-fleets/` route. Do not reintroduce Founding Fleet as the homepage hero, global nav item, universal header CTA, general demo CTA, interactive-demo CTA, or repeated proof-card theme unless the user explicitly asks to make it global again.

General BOF pages should lead with the operating-layer story: managed trucking back-office support, driver readiness, document control, carrier readiness, exceptions, audit trail, release decisions, and working sessions around one real record. If a future pass adds Founding Fleet language outside the dedicated funnel, run `.codex/scripts/audit-founding-fleet-boundary.ps1` and treat failures as regressions to fix before closeout.

## Master Client Notes

Use `.codex/client-notes-master.md` as the durable source for consolidated BOF client notes from `ShowRecords.txt`, `work.txt`, `work2.txt`, the client ODT files, and reference-demo audits. Read it before broad website/demo edits, especially work involving Founding Fleet positioning, TMS/partner workflow language, driver records, document realism, POD proof, Command Center behavior, priority logic, or the ROA/cost-of-capital model.

For detailed instructions from the `work2.txt` client call, read `.codex/client-call-work2-instructions.md`. It captures pre-trip/in-transit/post-trip packet expectations, backhaul/deadhead logic, driver document details, no-`555` contact rules, Founding Fleet / sector journey intent, TMS simulation realism, demo labeling issues, and financial-calculator follow-up notes.

For the active work2 completion goal, use `.codex/checklists/active/20260608-091749-work2-master-completion.md` and `.codex/goals/work2-client-call-master-completion-goal.md`. This is the long-form implementation ledger for turning the `work2.txt` client call into completed, verified BOF website/demo outcomes.

## Client Advocate Project Manager

Use the project-local `client-advocate-project-manager` skill when BOF work needs a project manager who advocates for this client's personality, priorities, and detail standard before implementation starts or before work is called done. This role should read the master client notes, translate client feedback into acceptance criteria, create or shape the checklist, route work to the right specialist personas, and protect the static/shared-hosting boundary.

This client notices practical trucking details: driver documents, POD proof, distorted portraits, name/photo mismatch, fake-looking fields such as `555` phone numbers, confusing demo labels, missing sector/founding-fleet structure, weak TMS realism, raw code artifacts, and clicks that do not open inspectable records. Treat those details as project-management requirements, not cosmetic preferences.

The client advocate project manager does not replace specialist personas. It coordinates `checklist-execution-steward`, `detail-consistency-auditor`, `ascendtms-integration-researcher`, `ascendtms-backend-visual-parity-director`, `ascendtms-backend-formatting-director`, `client-demo-proof-advocate`, `demo-document-reality-director`, `document-file-artifact-director`, `reference-driver-documentation-auditor`, `demo-ux-usability-director`, `client-scope-translator`, and visual/QA personas as needed.

## Client Input Watch Steward

Use the project-local `client-input-watch-steward` skill when the user asks Codex to monitor, watch, inspect, or triage the BOF client notes folder at `C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet`.

This role is intake-only. It watches for new, changed, or removed client files; summarizes new client input; records processed-file status in `C:\Users\slyme\OneDrive\Notes For Codex\BackOfficeFleet Ledger\processed-files.json`; and routes actionable updates to `client-advocate-project-manager`, `checklist-execution-steward`, and the relevant specialist personas. It must not edit the watched OneDrive folder, implement website changes directly, move/delete/rename client source files, store raw client-file copies in the ledger unless explicitly asked, or expose raw private client data in public website copy.

If new client input is broad enough to implement, create or update an active checklist before edits. If client input mentions React, APIs, databases, auth, live integrations, credentials, `.env`, package installs, or backend routes, route it through `client-scope-translator` before any implementation decision.

## Checklist Execution System

Use the project-local `checklist-execution-steward` skill when a request includes a plan, client notes, transcript, scope document, broad implementation request, audit, or "one item at a time" instruction. For nontrivial plan/document work, create or update an active checklist under `.codex/checklists/active/` before implementation, using `.codex/skills/checklist-execution-steward/scripts/new-checklist.ps1` when starting fresh.

Each checklist item should include a stable ID, source, requirement, status, acceptance evidence, and notes. Work one `in_progress` item at a time, update evidence as items are completed, and do not mark broad work complete until required checklist items are `complete`, `deferred`, `blocked`, or `not_applicable` with a reason.

During nontrivial checklist work, the checklist owner should periodically report progress as `X / N closed, Y remaining`, where `closed` means `complete`, `deferred`, `blocked`, or `not_applicable`. Include this count in normal progress updates, after meaningful batches of checklist status changes, and in the final checklist closeout. If the recorded count is stale because evidence has not been written yet, say so explicitly.

Checklist closeout is part of the general BOF process. At the end of each BOF work turn, include a concise `Checklist` note:

- If a checklist was used or updated, report the checklist path, what was completed this pass, what remains, and the verification/evidence.
- If a checklist was not warranted because the task was tiny, command-only, or pure conversation, say `Checklist: not used` with a short reason.
- Before final response on checklist-driven work, update the checklist file itself so the final answer matches the durable record.
- Do not use the checklist closeout to inflate tiny tasks; keep it short and factual.

## Thread Conflict Steward

Use the project-local `thread-conflict-steward` skill when the user mentions thread conflicts, parallel Codex work, handoffs, resumes, stale changes, overlapping checklists/goals, suspicious same-file or same-route edits, or "make sure this doesn't conflict."

Before broad BOF edits, use it when active checklists or goals suggest another thread may be working nearby. If `.git` exists, inspect `git status --short` and focused diffs; in the current non-Git BOF environment, rely on active goals/checklists, recent file timestamps, focused current file reads, and user-provided handoff context. Treat direct same-file overlap as `block` until reconciled, and treat same route/page, shared CSS/JS, cache-busting, image assets, active goals, and checklist overlap as `watch` unless current evidence shows contradiction.

Never use thread conflict handling to revert, overwrite, restore, delete, or move another thread's work. Preserve the usual BOF boundaries: active website work belongs in `Website`, `bof-web-Original` is reference-only, and no framework/backend/API expansion should be introduced without explicit user approval.

## Demo Click Completeness Rule

The BOF demo must respect the client's expectation that important demo clicks lead to complete proof. If a page presents a clickable load, driver, carrier, packet, document, status, table row, proof chip, priority label, POD, photo, or next-action item, the destination must be complete enough for a client to inspect: document surface, proof section, owner, consequence, status, and next action.

This client's proof standard is unusually detail-focused. Driver records should feel like real driver files with license/CDL, medical, MVR, employment, safety, emergency, tax/settlement, and dispatch-eligibility context. POD and delivery proof should include GPS/location, timestamp, receiver/signature, dock/cargo photo context, settlement or claim effect, owner, and next action. Command Center should answer where the load is, where it originated, where it is going, whether it arrived or is in route, who is driving, what documents exist, what priority means, and what the owner does next. Pictures and document previews should be large enough to inspect.

Use `client-demo-proof-advocate` when adding or reviewing clickable demo surfaces. Hide, de-emphasize, or mark weak items as guided-only until they have a complete static destination. The new `Website` should not recreate the heavy reference route maze, but it should preserve the reference demo's document density and seriousness. That audit language belongs in Codex guidance, not visible page content.

## Synthetic Document Completeness Rule

For client-facing BOF demo paperwork, do not rely on `Masked`, `Private value`, `On file`, `TBD`, `sample`, `demo`, or placeholder-style fields when a complete fictional value can be safely shown. This is a simulated demo, so important driver, load, POD, BOL, carrier, safety, HR, tax, settlement, and readiness documents should use believable synthetic names, IDs, dates, addresses, document numbers, signatures, stamps, reviewer notes, contact blocks, status fields, consequences, and next actions.

Use `synthetic-document-completeness-director` when building or reviewing those surfaces. Keep the safety boundary firm: never expose real private data from the reference site or real people/companies, and never invent values that appear to identify real licenses, medical records, tax IDs, bank accounts, insurance policies, government credentials, or legal claims. The goal is complete fictional paperwork that looks inspectable in the demo, not real-world production records or legal/compliance advice.

## Document Artifact Realism Rule

For client-facing BOF demo paperwork, complete fields are not enough. The primary document body must not look like the rest of the BOF website, the app shell, a generic card, or the same reusable table template repeated for every record. Use `document-artifact-realism-director` when a document must look like a physical/scanned artifact or when the client is likely to inspect visual realism closely.

Driver licenses/CDLs, ID-style cards, scanned medical cards, BOL/POD image reviews, seal/dock/cargo photos, insurance certificates, rate confirmations, signatures, stamps, seals, barcodes, and similar proof items should each receive document-specific visual treatment. For licenses/CDLs, bias toward generated bitmap artifacts or a hybrid generated-artifact-plus-metadata viewer instead of pure HTML tables. The artifact can be fictional and static, but it should look like a serious document in its own right. Use the global `imagegen` skill when a new bitmap artifact is needed, then compress and store it as a static asset under `Website`.

## Document File Artifact Rule

For client-facing BOF demo paperwork, important clicked documents should be represented as file-like artifacts rather than HTML UI panels whenever the client expects real paperwork. Use `document-file-artifact-director` when documents need DOCX/PDF-style pages, static rendered document assets, generated scans/images, file metadata, or viewer behavior. The surrounding app can be HTML, but the primary document body should look like an opened file.

Driver licenses/CDLs must be generated license-style image artifacts when they are central to the demo. They should use synthetic people/details, unique faces, and name/gender presentation consistency. Keep them fictional, non-official, and non-scannable: no real private data, real state seals, real license numbers, machine-readable zones, or usable credential behavior. The client-facing artifact should look serious and inspectable without implying BOF created or validates a real government credential.

## Persona Environment Architecture

When the user asks to create personas, install or improve this Codex environment, design subagents or skills, build playbooks, or turn recurring project problems into reusable workflows, use the project-local `persona-environment-architect` skill.

Prefer this project-local architect over the global version. Use it to design durable operating layers for this repository: personas, subagents, skills, workflows, checklists, validation loops, and headless automation plans.

Keep environment work separate from product implementation unless the user explicitly asks for code changes. Project-local rules, discovered repository facts, and user instructions always override generic architecture advice.

## Persona Skill Adaptation Steward

Use the project-local `persona-skill-adaptation-steward` skill when the user asks Codex to change personas or skills dynamically based on feedback, correct future Codex behavior, add/tighten/deprecate specialist roles, resolve role overlap, or maintain `.codex/agents`, `.codex/skills`, and `AGENTS.md` routing.

This role is cautious: apply narrow explicit feedback directly, but propose first for broad, ambiguous, risky, or guardrail-changing feedback. Prefer updating existing roles over creating duplicate personas. Do not weaken safety boundaries, edit Website product code, expose secrets/private client data, touch `bof-web-Original`, or change global Codex behavior unless explicitly asked.

If active goals, checklists, or recent files suggest another thread may be editing the same persona or routing area, use `thread-conflict-steward` before changing persona/skill files.
