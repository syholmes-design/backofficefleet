# Reference Demo Robustness Gap Note

Date: 2026-06-07

## Purpose

Document what the reference BOF website/demo in `bof-web-Original/bof-web` did that is missing, weaker, or only lightly represented in the current static `Website/interactive-demo/`.

This is an audit note only. Do not treat it as approval to rebuild the old route maze, add Next.js/React/TypeScript, add API routes, restore `node_modules`, or create a real AscendTMS integration. The current website remains static/shared-hosting safe.

## Current Direction To Preserve

- `Website` is the active site.
- `bof-web-Original` is reference-only.
- The current demo story is AscendTMS partner import -> BOF readiness review -> release outcome -> simulated handoff.
- The current hands-on demo should stay static: HTML, CSS, vanilla JS, JSON.
- The right goal is not to copy the old app. The right goal is to preserve the old demo's seriousness, proof depth, and interaction usefulness in a lighter static shell.

## Evidence Reviewed

Reference evidence:

- `bof-web-Original/bof-web/docs/BOF_ROUTE_MAP.md`
- `bof-web-Original/bof-web/lib/demo-access.ts`
- `bof-web-Original/bof-web/docs/project-environment-assessment.md`
- `bof-web-Original/bof-web/components/LoadProofPanel.tsx`
- `bof-web-Original/bof-web/components/load-artifacts/LoadArtifactPacketPanel.tsx`
- `bof-web-Original/bof-web/components/drivers/DriverVaultDqfPageClient.tsx`
- Route inventory from `bof-web-Original/bof-web/app/**/page.tsx`

Current evidence:

- `Website/interactive-demo/index.html`
- `Website/interactive-demo/start/index.html`
- `Website/interactive-demo/loading/index.html`
- `Website/assets/js/site.js`
- `Website/operations-record/index.html`
- `Website/integrations/ascendtms/release-review/index.html`

Measured difference:

- Reference app route count inspected from filesystem: 79 `page.tsx` routes and 13 API route handlers.
- Current static site route count inspected from filesystem: 21 `index.html` routes, with 3 interactive-demo routes.
- Current `/interactive-demo/` has a strong shell with 137 buttons, 59 `data-record-open` elements, 14 document-tab buttons, 5 demo actions, 6 visible load rows, and 5 static workspace-open controls.

## What The Reference Demo Did That Felt More Robust

### 1. It Had Role-Based Demo Entry, Not One Generic Demo Path

Reference:

- `lib/demo-access.ts` defined access tiers: public, self-guided, guided demo, trusted access, internal.
- It defined personas for fleet owner, dispatcher, carrier operations, safety/compliance, and investor.
- Each persona had primary route, secondary route, focus areas, and a guided prompt.
- The old demo could say, "You are a dispatcher, go here," or "You are safety/compliance, inspect this proof path."

Current gap:

- `/interactive-demo/` is one main control-panel scenario.
- The AscendTMS flow is clearer now, but all visitors get essentially the same task, same queue, same record hierarchy, and same decision path.
- The current shell does not offer role framing such as fleet owner view, dispatcher view, safety view, carrier packet view, or finance/settlement view.

Why it matters:

- "Robust" often means the client can imagine several departments using the product.
- The current demo proves one operating decision, but the reference proved a multi-role operating system.

Static-safe takeaway:

- Do not rebuild all roles as routes unless needed.
- Consider a compact in-app "role lens" or "guided path" switcher that changes visible priorities and suggested next clicks without adding real backend scope.

### 2. It Had Deep Operational Route Coverage

Reference:

- The route map listed separate active routes for command center, dashboard, demo walkthrough, dispatch, dispatch intake, loads, load details, load readiness summary, trip release, shipper portal, drivers, driver detail, driver vault, documents, document vault, carrier packet, safety, settlements, maintenance, money at risk, source of truth, and more.
- Important concepts usually had their own route or route-backed surface.

Current gap:

- The static site has supporting pages, but `/interactive-demo/` itself is mostly a single app shell with records rendered into one lower record panel and one document pane.
- It does not yet feel like every major object has an inspectable destination with the same depth as the old app.

Why it matters:

- The client likely expects important clicks to lead to complete, inspectable proof.
- A single-page shell can feel less robust if it only swaps summaries instead of opening convincing packet/detail surfaces.

Static-safe takeaway:

- Preserve the single app shell, but important objects should open in-view drawers/panels that feel like complete destinations: load file, driver file, carrier packet, document gate, release/handoff note, audit history.

### 3. It Had Proof Packets With Required Documents, Sources, Statuses, And Links

Reference:

- `LoadProofPanel.tsx` grouped evidence into Core Trip Documents, Proof & Media, Exceptions / Claims, and Reference Documents.
- It showed document status, link/action, filename, source, notes, and required-for-settlement-release status.
- It explicitly surfaced settlement hold messaging when required proof was missing.
- It had proof-gap links to driver/load review destinations.

Current gap:

- `/interactive-demo/` has a document pane and multiple document tabs, but they are mostly static paper-style summaries.
- It does not fully reproduce a proof packet table with required/not-required flags, filename/source, media/photo preview, missing proof reason, and release/settlement/claim consequence.
- The current document viewer is visually good, but not yet as operationally forensic as the reference proof packet.

Why it matters:

- "Robust" in this client context likely means "when I click a document, I can inspect enough detail to believe it."
- Document realism is not only visual; it is status, source, requiredness, consequence, owner, and next action.

Static-safe takeaway:

- The next improvement should not add many documents. It should upgrade the existing BOF-RR-10482 document gate into a more complete proof packet with grouped rows, required flags, source/filename, status, release effect, and owner.

### 4. It Had A Load Artifact Registry

Reference:

- `LoadArtifactPacketPanel.tsx` presented a load packet registry.
- It grouped registered documents/photos by packet group.
- Each artifact had label, source label, readiness status, thumbnail/preview when image-like, action link, note, settlement gate, and claim gate.
- The text made clear that dispatch, pre-trip, release, settlement, and customer views all resolve to the same records.

Current gap:

- Current `/interactive-demo/` mentions pickup instructions, BOL, seal photo, delivery proof, claim evidence, rate confirmation, driver file, carrier packet, release note.
- It does not yet show those as a registry of artifacts that multiple views resolve to.
- The "same source across views" idea is present in copy, but not strongly proven through the UI.

Why it matters:

- A registry makes the demo feel like a system of record rather than a set of cards.
- It also helps prevent the "button changed something below the fold" problem because the user can see the selected artifact and its current status.

Static-safe takeaway:

- Add an in-view artifact registry panel or transform the current document list into a registry with visible selected artifact details.

### 5. It Had Driver Vault Depth

Reference:

- `DriverVaultDqfPageClient.tsx` showed a driver DQF readiness page.
- It grouped driver documents, counted ready/missing/expired/needs-review items, selected a document row, showed issue explanation, why it matters, recommended fix, and action links.
- The selected document had a side preview/action panel.

Current gap:

- Current `/interactive-demo/` has driver records and driver document tabs, but the driver proof is much shallower.
- It does not show a grouped driver vault, document counts, expired/missing logic, selected document explanation, or recommended fix.
- It shows the assigned driver as ready, but not enough driver-document machinery to satisfy a client expecting compliance proof.

Why it matters:

- If AscendTMS supplies the assigned driver and BOF owns driver readiness, BOF needs a convincing driver-record ownership surface.

Static-safe takeaway:

- Add a focused driver-readiness drawer/table for DRV-2048 and one comparison blocked driver. Include grouped document statuses and "why this matters / recommended fix."

### 6. It Had Dispatch Lifecycle And Status Timelines

Reference:

- Components such as `LoadStatusTimeline.tsx`, `LoadLifecyclePacket.tsx`, dispatch shell screens, pre-trip routes, trip-release routes, and dispatch readiness components showed load progression over time.
- The old app tied dispatch gating to lifecycle stage, proof, pre-trip, release, settlement, and customer/shipper views.

Current gap:

- Current `/interactive-demo/` has audit events and selected load details, but no strong lifecycle timeline visible in the main task flow.
- The user can choose a release outcome, but the before/after sequence is not as obvious as in a lifecycle model.

Why it matters:

- A client asking for robustness may expect the demo to show how a load moves through stages, not only how one decision changes status.

Static-safe takeaway:

- Add a compact in-view lifecycle strip: Imported -> BOF readiness -> document gate -> decision -> simulated handoff. Show where the selected load currently sits and update it on Ready/Hold/Conditional.

### 7. It Had Claim, Settlement, And Finance Consequence Surfaces

Reference:

- `ClaimPacketPanel.tsx` handled claim packet workspace, evidence summary, insurance, dispute letter, and related generated outputs.
- `SettlementReadinessScreen.tsx` highlighted proof gaps and settlement holds.
- Route map included settlements, settlements workbook, money at risk, fleet financials, maintenance costs, etc.

Current gap:

- Current `/interactive-demo/` includes claim evidence state and simulated handoff, but claim/settlement consequences are mostly labels.
- There is no convincing "if this document is missing, settlement/claim/customer release changes this way" panel inside the interactive shell.

Why it matters:

- The old demo made documents financially and operationally consequential.
- The current demo can feel more like status review than business consequence.

Static-safe takeaway:

- Add a compact consequence panel that ties the release decision to dispatch, settlement hold, claim packet, and audit handoff. Keep it static and synthetic.

### 8. It Had Customer/Driver Portal Context

Reference:

- Route map included `/portals/customer`, `/portals/driver/:driverId`, `/portals/manager`, `/shipper-portal/:loadId`, and `/trip-release/:loadId`.
- This made BOF feel like an ecosystem where different audiences see appropriate surfaces.

Current gap:

- Current `/interactive-demo/` is internal-operations only.
- It does not show what dispatch/customer/driver/carrier sees after BOF makes the readiness decision.

Why it matters:

- A robust demo can show not only internal decision-making, but downstream communication.

Static-safe takeaway:

- Do not add full portals now.
- Consider one "handoff preview" drawer showing what the simulated partner/customer/dispatch note would contain after each decision.

### 9. It Had Local Demo State And Editable Workflow Behavior

Reference:

- The environment assessment describes browser `localStorage` demo editing, driver/document medical details, review status, credential overrides, dispatch blockers, and risk-resolution markers.
- This let the old demo feel stateful across pages.

Current gap:

- Current `/interactive-demo/` updates state in memory only.
- Refresh intentionally resets the app to the control panel review state.
- That is good for simplicity, but weaker as a "robust system" signal.

Why it matters:

- Stateful demos can feel more real because decisions persist across surfaces.
- But persistence can also complicate static hosting and cache behavior.

Static-safe takeaway:

- Do not add persistence unless explicitly requested.
- If needed, add a visible "session only" audit trail inside the shell rather than storage.

### 10. It Had More Complete Guided Demo Framing

Reference:

- `demo-access.ts` had guided prompts and access boundaries.
- The old walkthrough was framed around triage -> dispatch -> carrier readiness -> packet verification -> finance release -> safety proof.

Current gap:

- Current `/interactive-demo/start/` starts the scenario, but the app shell does not yet show a step-by-step guided path inside the shell.
- Users can click many things, but the intended order is not always obvious.

Why it matters:

- A robust demo must support both free clicking and "show me what to do next."

Static-safe takeaway:

- Add a small persistent "scenario steps" rail or action checklist inside `/interactive-demo/`: Select import -> inspect BOF-RR -> review driver/carrier -> choose outcome -> inspect simulated handoff.

## Current Demo Strengths To Keep

- The new app shell visuals are strong and much more appropriate than a marketing-page demo.
- The shell is static, fast, and shared-hosting safe.
- The AscendTMS partner-import scope is now clearer than the old BOF-first storyline.
- Existing click wiring is broad: alerts, records, documents, filters, search, rows, and release actions respond.
- The current demo already has a focused operating decision and avoids the heavy old stack.

## Biggest Robustness Gaps In Priority Order

### Priority 1: In-View Feedback And Task Flow

Problem:

- Some important clicks and decisions still depend on lower panels or below-the-fold areas.
- This makes the demo feel less useful even when the data changes correctly.

Better static approach:

- Keep primary action results visible in the current viewport.
- Use right inspector, sticky outcome strip, modal/drawer, or highlighted top-panel feedback.
- Add a visible scenario stepper/checklist.

### Priority 2: Complete BOF-RR-10482 Proof Packet

Problem:

- Current document tabs are good visually but not as proof-dense as the reference `LoadProofPanel` and artifact registry.

Better static approach:

- Upgrade the existing document gate into a grouped proof packet:
  - Core trip docs
  - Proof/media
  - Exceptions/claims
  - Reference docs
  - status, source, filename, required flag, owner, release effect

### Priority 3: Driver/Carrier Readiness Depth

Problem:

- BOF claims ownership of readiness, but the current driver/carrier panels are shallower than the old driver vault and carrier packet routes.

Better static approach:

- Add compact readiness detail inside the shell:
  - driver document counts and selected document explanation
  - carrier packet checklist with authority, insurance, agreement, W-9, contact, release effect

### Priority 4: Lifecycle And Consequence Model

Problem:

- The release outcome changes status, but the lifecycle and downstream consequence are not as strong as the old dispatch/trip-release/settlement surfaces.

Better static approach:

- Add an in-view lifecycle strip and consequence panel:
  - AscendTMS import
  - BOF readiness
  - document gate
  - decision
  - simulated handoff
  - dispatch/settlement/claim consequence

### Priority 5: Role/Persona Framing

Problem:

- Current shell is one-size-fits-all.

Better static approach:

- Add a lightweight role lens or guided path selector, not a new route maze:
  - Operations lead
  - Dispatcher
  - Safety/compliance
  - Carrier/document desk

## What Not To Rebuild

Do not copy these from the reference app unless the user explicitly changes scope:

- Next.js/React/TypeScript architecture
- API routes
- `node_modules`
- generated document backends
- localStorage editing
- PDF/document generation internals
- full portal routes
- full settlements/claims/maintenance route maze
- real AscendTMS API/sync/auth/storage

## Recommended Next Goal If The Demo Must Be Improved

Refit `/interactive-demo/` interaction and proof depth around in-view usefulness:

1. Add persistent visible outcome/next-step feedback near the action controls.
2. Add a scenario stepper/lifecycle strip visible in the first screen.
3. Convert the BOF-RR-10482 document area into a proof packet registry with required/source/status/release-effect details.
4. Add compact driver/carrier readiness detail that opens in the current viewport.
5. Add a simulated handoff preview that changes with Ready, Conditional, or Hold.

Stop there unless a new client requirement demands more. This would address the "not robust enough" complaint while staying aligned with the static-site constraint.
