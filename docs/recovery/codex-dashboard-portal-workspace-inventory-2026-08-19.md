# Codex Dashboard / Portal / Workspace Inventory — 2026-08-19

Scope: read-only forensic search of Git refs/history for BOF dashboards, portals, workspaces, and investor surfaces.

Repository: `C:\Users\syhol\OneDrive\Documents\GitHub\backofficefleet\bof-web`
Recovered fork (immutable): `C:\Users\syhol\BOF-Fork-Recovery\recovery-20260819-094803\fork`
Recovered fork copy: `recovered/fork-restored-20260819/`

---

## TOP-PRIORITY ANSWERS

1. **Where is the dashboard-v2 work?**  
   There is no ref named `codex/dashboard-v2-light-visual-refinement` in this local clone.  
   Actual v2 dashboard implementation is present as runtime code:
   - `app/(bof)/dispatch-v2/page.tsx`
   - `components/dispatch-v2/*`
   - `app/(bof)/settlements-v2/page.tsx`
   - `components/settlements-v2/*`
   Historical recoverable commits include:
   - `77a8ba3f7a7271e6a0e46e60c23f05872426b709` (baseline checkpoint)
   - `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9`

2. **Where are the BOF dashboards created under Codex?**  
   They are recoverable in:
   - runtime paths currently in working tree (`app/(bof)/*`, `components/*`)
   - **agent checkpoint refs** (`refs/agents/68eca229-.../checkpoints/turn/*`) containing August 2026 “Agent host session” commits
   - `origin/codex/public-site-deployment-candidate` for static Website generation.

3. **Where are the portals created under Codex?**  
   Runtime portals are in:
   - `app/portals/page.tsx`
   - `app/portals/customer/page.tsx`
   - `app/portals/driver/page.tsx`
   - `app/portals/driver/[driverId]/page.tsx`
   - `app/portals/manager/page.tsx`
   Static portal equivalent exists in recovered fork as `customer-portal/` (not `/portals/`).

4. **Is the investor portal/workspace still recoverable?**  
   Yes.
   - Static investor lineage: `origin/feature/private-investor-operating-plan` (`be4fa540...`)
   - Later static investor commits: `4331fa0e...`, `e7a6c7b8...`
   - Runtime investor page also appears in codex checkpoint commit `33cb4837...` (`app/(marketing)/investors/page.tsx`).

5. **Is `be4fa540` still present and what does it contain?**  
   Yes, present: `be4fa540d5b4a461c0216c74eccdbb56d2653597`.  
   It modifies:
   - `Website/private-investor-plan/index.html`
   - `Website/assets/css/private-investor-plan.css`

6. **Are there newer versions of private-investor work than recovered fork?**  
   Newer than `be4fa540`: yes (`4331fa0e`, `e7a6c7b8`).  
   Recovered fork `private-investor-plan/index.html` blob hash does **not** match any tracked Git blob in this clone, indicating a deployed/artifact variant beyond currently connected Git file versions.

7. **Are there Codex workspaces not present in current Step 14 or recovered fork?**  
   Yes, some historical runtime surfaces are only in codex checkpoint commits (especially `77a8ba3f...`) and not in current tree, e.g.:
   - `app/(bof)/demo/page.tsx`
   - `app/(bof)/demo/walkthrough/page.tsx`
   - `app/(marketing)/compliance/page.tsx`
   Recovered fork has static `demo/` and `walkthrough/` pages, but not these Next runtime route implementations.

8. **Are items sitting in detached/unreferenced commits?**  
   Yes and no:
   - **Yes (branch-detached but still recoverable):** many codex commits are not in local/remote branches/tags but are referenced by `refs/agents/...`.
   - **Yes (truly unreachable):** one `fsck` unreachable commit `25f35cc9...`, but it does not contain dashboard/portal file deltas.

9. **Is anything actually gone, or just disconnected?**  
   Most discovered codex dashboard/portal/workspace work is disconnected from normal branch heads but still recoverable via remote feature refs and/or `refs/agents`.  
   The specific named refs `codex/dashboard-v2-light-visual-refinement`, `codex/backend-schema-specification`, and `codex/migration-group-2-disposable-testing` were not found in refs/logs in this clone.

---

## 1) Codex branches discovered

- `origin/codex/public-site-deployment-candidate` -> `66929e67...`

No additional `codex/*` branch names were found in current refs.

---

## 2) Relevant commits

### Static Website / fork-generation lineage
- `44d020b3` (2026-06-21) Add Aggregator Command Center
- `9a91811b` (2026-06-18) Add customer load intake workflow
- `4a43cdac` (2026-06-25) Add document readiness engine page
- `be4fa540` (2026-06-24) private-investor-plan update
- `4331fa0e` (2026-07-28) ungated hidden investor presentation
- `e7a6c7b8` (2026-07-28) deployment-candidate logo pass
- `38b896fc` (2026-07-29) operational depth restore
- `66929e67` (2026-07-29) canonical production baseline

### Runtime (Next.js) codex-era checkpoints
- `77a8ba3f` (2026-08-12) baseline checkpoint creating broad app/runtime tree
- `5d36a8b2` (2026-08-13) refactor/deletion pass over parts of baseline
- `901096ba` (2026-08-16) drivers + dispatch + portal progression
- `9b84cdca` (2026-08-17) pretrip/portal/dispatch workflow updates
- `4fadb111` (2026-08-19) dispatch board + driver vault API changes
- `33cb4837` (2026-08-19) marketing runtime additions incl investors page

---

## 3) Detached / unreferenced recoverable commits

- `git fsck --full --no-reflogs --unreachable` reported one unreachable commit:
  - `25f35cc95e7809648b30087544753fbc538ba28e` (no dashboard/portal file changes observed)
- Many codex-era commits are not on branch heads/tags but are retained under:
  - `refs/agents/68eca229-2bef-43fe-9b39-ffd83101e3a3/checkpoints/turn/*`
  - Agent refs count observed: 232

---

## 4) Dashboards discovered

### Runtime dashboards (Next.js)
- `/dashboard` -> `app/(bof)/dashboard/page.tsx` -> `components/dashboard/DashboardPageClient.tsx`
- `/command-center` -> `app/(bof)/command-center/page.tsx` -> `components/command-center-v4/CommandCenterV4.tsx`
- `/dispatch-v2` -> `app/(bof)/dispatch-v2/page.tsx` -> `components/dispatch-v2/DispatchV2Page.tsx`
- `/settlements-v2` -> `app/(bof)/settlements-v2/page.tsx` -> `components/settlements-v2/SettlementsV2Page.tsx`
- `/dispatch`, `/settlements`, `/safety`, `/loads`, `/money-at-risk` as runtime operational dashboards/workspaces.

### Static dashboards (Website/fork lineage)
- `Website/dashboard/index.html`
- `Website/dispatch/index.html`
- `Website/command-center/index.html`
- `Website/business-operations/index.html`
- `Website/capacity-intelligence/index.html`
- `Website/operational-intelligence/index.html`

---

## 5) Portals discovered

### Runtime portals
- `app/portals/page.tsx` (portal hub)
- `app/portals/customer/page.tsx`
- `app/portals/driver/page.tsx`
- `app/portals/driver/[driverId]/page.tsx`
- `app/portals/manager/page.tsx`
- `app/(bof)/shipper-portal/[loadId]/page.tsx`

### Static portal surfaces
- `recovered/fork-restored-20260819/customer-portal/*`
- `Website/customer-portal/*` in static history

---

## 6) Workspaces discovered

Runtime workspace-oriented components:
- `components/trip-packet/TripPacketWorkspace.tsx`
- `components/documents/DriverVaultWorkspaceClient.tsx`
- `components/documents/BofTemplatePacksWorkspaceClient.tsx`
- Dispatch and settlement workspace shells in `components/dispatch*`, `components/settlements*`, `components/command-center-v4/*`.

Static workspace-like pages:
- `Website/interactive-demo/*`
- `recovered/fork-restored-20260819/interactive-demo/*`

---

## 7) Investor-related discoveries

### Static investor line
- Branch: `origin/feature/private-investor-operating-plan`
- Commit: `be4fa540...` updates `Website/private-investor-plan/index.html` + CSS
- Additional investor commits:
  - `ec4cba92...`
  - `4331fa0e...`
  - `e7a6c7b8...`

### Runtime investor line
- `app/(marketing)/investors/page.tsx` appears in codex checkpoint commit `33cb4837...`
- In current checkout this file exists as working-tree content but is not in current tracked index state.

### Recovered fork comparison
- Recovered static contains:
  - `private-investor/index.html`
  - `private-investor-plan/index.html`
- `private-investor/index.html` has no matching tracked `Website/private-investor/index.html` path in local Git history.
- Recovered `private-investor-plan/index.html` blob is not identical to known tracked private-investor-plan blobs from the commit chain.

---

## 8) Current Step 14 equivalents

Exists in current runtime:
- `/dashboard`, `/command-center`, `/dispatch`, `/settlements`, `/safety`, `/loads`
- `/dispatch-v2`, `/settlements-v2`
- `/portals` + customer/driver/manager portal routes
- `/shipper-portal/[loadId]`

---

## 9) Recovered-fork equivalents

Exists in restored fork static tree:
- `/dashboard/`, `/command-center/`, `/dispatch/`, `/settlements/`, `/safety/`
- `/customer-portal/` (+ load-intake, tracking, docs, quotes, shipments)
- `/business-operations/`, `/capacity-intelligence/`, `/operational-intelligence/`
- `/interactive-demo/`, `/operations-record/`, `/document-readiness-engine/`
- `/private-investor/`, `/private-investor-plan/`

Not present in recovered fork:
- `/dispatch-v2/`
- `/settlements-v2/`
- `/portals/` runtime hub pattern

---

## 10) Items unique to Codex (in this clone evidence)

Unique/advanced runtime surfaces (not represented as same route in recovered static fork):
- `app/(bof)/dispatch-v2/*` + `components/dispatch-v2/*`
- `app/(bof)/settlements-v2/*` + `components/settlements-v2/*`
- `app/portals/*` runtime portal hub model
- `components/trip-packet/TripPacketWorkspace.tsx` runtime workspace behavior
- `app/api/dispatch/*` workflow APIs (runtime)

---

## 11) Items believed lost

### BOF Workspaces / Dashboards / Portals Believed Lost but Still Recoverable

1. Dispatch Board v2 runtime
   - Location/ref: `refs/agents/...` commits incl `77a8ba3f`, `5d36a8b2`
   - Type: Next.js runtime
   - Status: Recoverable
   - Why it matters: newer dispatch workflow UI/logic than static fork.

2. Settlements v2 runtime
   - Location/ref: `refs/agents/...` commits incl `77a8ba3f`, `5d36a8b2`
   - Type: Next.js runtime
   - Status: Recoverable
   - Why it matters: advanced settlement templates/sidebar and review flows.

3. Portal hub runtime (`/portals`)
   - Location/ref: `refs/agents/...` and current working tree
   - Type: Next.js runtime
   - Status: Recoverable
   - Why it matters: manager/driver/customer role-centric operating views.

4. Runtime investor page (`app/(marketing)/investors/page.tsx`)
   - Location/ref: commit `33cb4837...` in `refs/agents/...`
   - Type: Next.js runtime
   - Status: Recoverable
   - Why it matters: internal investor narrative in runtime shell.

5. Static private-investor-plan lineage
   - Location/ref: `origin/feature/private-investor-operating-plan`, commits `53f38a60`, `ec4cba92`, `be4fa540`, `4331fa0e`, `e7a6c7b8`
   - Type: static Website page
   - Status: Recoverable
   - Why it matters: investor strategy narrative evolution.

### BOF Workspaces / Dashboards / Portals That Appear Genuinely Lost

1. Ref names:
   - `codex/dashboard-v2-light-visual-refinement`
   - `codex/backend-schema-specification`
   - `codex/migration-group-2-disposable-testing`
   No matching refs/reflog entries were found in this local clone.

2. Tracked-source provenance for `Website/private-investor/index.html`
   - Static page exists in recovered fork artifact copy.
   - Matching tracked `Website/private-investor/index.html` history is not present in this local Git history.
   - Asset is preserved via recovered fork copy, but source commit lineage appears absent here.

---

## 12) Exact commit hashes (important discoveries)

- `be4fa540d5b4a461c0216c74eccdbb56d2653597`
- `e7a6c7b8f20c939622bf7ca25a8d5f67f4d37332`
- `38b896fcd5f54547aac4d70bac883174a275dc66`
- `66929e67a1ce758fc8859ff71a0acc0645b5c580`
- `77a8ba3f7a7271e6a0e46e60c23f05872426b709`
- `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9`
- `901096bac97f91b303473414141596d26c5260e1`
- `9b84cdcaab2c24eb6f85e5e2e16cd0c42bd042ac`
- `4fadb111f0acd3eaf324a3070ed6299c7868937b`
- `33cb48375ed263c25ddc220ed7891add1c114c4a`
- `25f35cc95e7809648b30087544753fbc538ba28e` (unreachable commit from fsck)

---

## 13) Recommended recovery candidates (read-only recommendation)

1. Preserve and index `refs/agents/...` commit range as first-class recovery input (contains runtime codex dashboard/portal/workspace evolution).
2. Preserve `origin/feature/private-investor-operating-plan` and `origin/codex/public-site-deployment-candidate` static lineages.
3. Snapshot and map runtime v2 surfaces:
   - `dispatch-v2`, `settlements-v2`, `portals`, `trip-packet workspace`.
4. Treat recovered fork `private-investor/index.html` and `private-investor-plan/index.html` as production artifacts requiring explicit provenance mapping, since at least one recovered variant does not match tracked blobs.
5. Do not declare broad loss yet; evidence indicates most “lost” codex work is disconnected from branch heads rather than deleted beyond recovery.

