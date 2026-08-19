# Agent Checkpoint Feature Map — 2026-08-19

## Scope and safety

- Read-only forensic mapping across `refs/agents/*`, refs, and commit history.
- No application source restoration, no merge/reset/prune/deploy/push performed.
- Immutable recovered fork remained untouched at `C:\Users\syhol\BOF-Fork-Recovery\recovery-20260819-094803\fork`.

## 1) `refs/agents` inventory summary

- Total `refs/agents` refs discovered: **233**
- Span: `turn/0` (`77a8ba3f7a7271e6a0e46e60c23f05872426b709`) through `turn/232` (`86ce0e5dbe179a400c23f84af7650bdde049aca4`)
- Reachability from heads/remotes/tags: **0 reachable** (all detached from normal branch/tag refs)
- Unique commit signal: all 233 refs point into agent-only lineage (not reachable from heads/remotes/tags)
- Full per-ref inventory artifact (all 233 with ref/SHA/date/message/parent/reachability/uniqueness) generated in session state:
  - `C:/Users/syhol/.copilot/session-state/68eca229-2bef-43fe-9b39-ffd83101e3a3/files/agent-ref-inventory-2026-08-19.csv`

## 2) Significant agent refs and what they contain

| Ref | Commit | Date | Parent | Reachable from heads/remotes/tags | Unique count* | Feature signal |
|---|---|---|---|---|---:|---|
| `refs/agents/.../turn/0` | `77a8ba3f7a7271e6a0e46e60c23f05872426b709` | 2026-08-12 | _(root)_ | No | 1 | Largest BOF runtime baseline: [app/(bof)/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)) routes, portals, dispatch-v2, settlements-v2, command center, workspace components |
| `refs/agents/.../turn/7` | `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9` | 2026-08-13 | `9be0c6a8...` | No | 8 | Dashboard/dispatch/settlements/command-center refinement pass |
| `refs/agents/.../turn/19` | `3c5eecaf01927c86de71e30cb7856459400ec9da` | 2026-08-14 | `f1526c82...` | No | 20 | Navigation + presentation consolidation pass |
| `refs/agents/.../turn/98` | `878e056d2f9a622674525d2f408afd688b37ef53` | 2026-08-16 | `2a67168c...` | No | 99 | Route and static-surface adjustments |
| `refs/agents/.../turn/99` | `eb1183a511112a1c32ab387c3891edc74177af2e` | 2026-08-16 | `878e056d...` | No | 100 | Continued route/content adjustments |
| `refs/agents/.../turn/103` | `c41eea19a7f1c5847072149be36b4f0ecf0c50db` | 2026-08-16 | `76ed8b01...` | No | 104 | BOF marketing/runtime bridge updates |
| `refs/agents/.../turn/104` | `1228fab884526a56804a393629dc560586957ced` | 2026-08-16 | `c41eea19...` | No | 105 | Follow-up runtime edits |
| `refs/agents/.../turn/106` | `44cabd6a7195b41536971bf1bb6c80fe773eefaa` | 2026-08-16 | `3606b412...` | No | 107 | Operational flow updates |
| `refs/agents/.../turn/108` | `5978d8246fb4d683b820d325e6b0788c533a1489` | 2026-08-16 | `7ce6cf89...` | No | 109 | Workflow refinement |
| `refs/agents/.../turn/110` | `901096bac97f91b303473414141596d26c5260e1` | 2026-08-16 | `84ac72dd...` | No | 111 | Dispatch/load/pipeline changes |
| `refs/agents/.../turn/121` | `7547f07425d01b9efcd0a0bea4af31c93f342e8c` | 2026-08-16 | `21f02e2c...` | No | 122 | Portal/readiness updates |
| `refs/agents/.../turn/133` | `848d69065dc0730c5cdc46547fa72f63e77cfb4e` | 2026-08-17 | `213ae388...` | No | 134 | Driver/operations progression |
| `refs/agents/.../turn/139` | `0161e04dd98f3c11392cfc4da670d8f9dc71bb1a` | 2026-08-17 | `6b962046...` | No | 140 | Driver status/workflow updates |
| `refs/agents/.../turn/145` | `9b84cdcaab2c24eb6f85e5e2e16cd0c42bd042ac` | 2026-08-17 | `85584019...` | No | 146 | Dispatch + driver flow continuation |
| `refs/agents/.../turn/212` | `4fadb111f0acd3eaf324a3070ed6299c7868937b` | 2026-08-19 | `dde893cb...` | No | 213 | Late-stage runtime updates ([components/dispatch/DispatchBoardScreen.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/dispatch/DispatchBoardScreen.tsx), API/runtime surfaces) |
| `refs/agents/.../turn/213` | `33cb48375ed263c25ddc220ed7891add1c114c4a` | 2026-08-19 | `4fadb111...` | No | 214 | Investor runtime route + branding motion mark ([app/(marketing)/investors/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(marketing)/investors/page.tsx), [components/marketing/MarketingBrandMark.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/marketing/MarketingBrandMark.tsx)) |
| `refs/agents/.../turn/230` | `d7851353b2b43f0ceb2a5dcf9a3eb31881e1815d` | 2026-08-19 | `67bff620...` | No | 231 | Fork restore import into [recovered/fork-restored-20260819/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/recovered/fork-restored-20260819/) |
| `refs/agents/.../turn/232` | `86ce0e5dbe179a400c23f84af7650bdde049aca4` | 2026-08-19 | `83aa3167...` | No | 233 | Final forensic/reporting checkpoint |

\*Unique count field is cumulative in the generated inventory.

## 3) Dashboards discovered (agent lineage)

### Surviving dashboard-v2 work (key answer)

The missing named branch `codex/dashboard-v2-light-visual-refinement` is not present as a branch ref, but the **dashboard-v2 implementation survives in agent checkpoints**, primarily:

- `77a8ba3f7a7271e6a0e46e60c23f05872426b709` (`turn/0`)
- `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9` (`turn/7`)

Representative surviving files:
- [app/(bof)/dashboard/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/dashboard/page.tsx)
- [app/(bof)/dispatch-v2/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/dispatch-v2/page.tsx)
- [app/(bof)/settlements-v2/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/settlements-v2/page.tsx)
- [app/(bof)/command-center/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/command-center/page.tsx)
- [components/dispatch-v2/DispatchKpiRow.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/dispatch-v2/DispatchKpiRow.tsx)
- [components/dispatch-v2/DispatchV2Page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/dispatch-v2/DispatchV2Page.tsx)
- [components/settlements-v2/SettlementsV2Page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/settlements-v2/SettlementsV2Page.tsx)
- [components/command-center-v4/CommandCenterV4.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/command-center-v4/CommandCenterV4.tsx)

## 4) Portals discovered

Surviving Codex-era portal/runtime surfaces in agent checkpoints:

- [app/portals/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/portals/page.tsx)
- [app/portals/customer/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/portals/customer/page.tsx)
- [app/portals/driver/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/portals/driver/page.tsx)
- [app/portals/driver/[driverId]/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/portals/driver/[driverId]/page.tsx)
- [app/portals/manager/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/portals/manager/page.tsx)
- [app/(bof)/shipper-portal/[loadId]/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/shipper-portal/[loadId]/page.tsx)

Primary checkpoint anchors: `77a8ba3f` and `5d36a8b2`, with later flow updates in `7547f074`, `848d6906`, `0161e04d`, `9b84cdca`, `4fadb111`.

## 5) Workspaces discovered

Surviving workspace shell/components:

- [components/trip-packet/TripPacketWorkspace.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/trip-packet/TripPacketWorkspace.tsx)
- [components/dispatch/DispatchShell.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/dispatch/DispatchShell.tsx)
- [components/documents/BofTemplatePacksWorkspaceClient.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/documents/BofTemplatePacksWorkspaceClient.tsx)
- [components/documents/DriverVaultWorkspaceClient.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/documents/DriverVaultWorkspaceClient.tsx)
- [lib/trip-packet-workspace.ts](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/lib/trip-packet-workspace.ts)
- [lib/driver-vault-workspace.ts](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/lib/driver-vault-workspace.ts)

These runtime workspace constructs are later-generation app work (not part of recovered static fork architecture).

## 6) Investor work findings

### `origin/feature/private-investor-operating-plan` and `be4fa540`

`be4fa540d5b4a461c0216c74eccdbb56d2653597` is present and points to `origin/feature/private-investor-operating-plan`, containing:

- `M Website/assets/css/private-investor-plan.css`
- `M Website/private-investor-plan/index.html`

This is a static private investor operating plan implementation (gated HTML/CSS presentation model).

### Comparison against recovered fork and current runtime

- Recovered static investor pages:
  - [recovered/fork-restored-20260819/private-investor/index.html](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/recovered/fork-restored-20260819/private-investor/index.html)
  - [recovered/fork-restored-20260819/private-investor-plan/index.html](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/recovered/fork-restored-20260819/private-investor-plan/index.html)
- Current runtime investor route:
  - [app/(marketing)/investors/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(marketing)/investors/page.tsx)

Conclusion:
- `be4fa540` = older static investor-plan branch artifact
- recovered fork investor surfaces = richer static/cinematic fork generation
- `33cb4837` runtime investors route = newer Next.js implementation pattern (separate from fork static pages)

## 7) Branding/logo findings

Surviving newer branding-related runtime work:

- [components/marketing/MarketingBrandMark.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/marketing/MarketingBrandMark.tsx) in `33cb4837` (animated/motion treatment)
- [components/BofLogo.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/BofLogo.tsx) in `77a8ba3f`/`5d36a8b2`
- [public/logo/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/public/logo) assets (`boflogo-*-transparent.png`, light/dark variants)

No separate recovered ref explicitly naming a “slanted initials” asset family was found in refs/agents by filename; surviving branding is the above runtime + static logo set.

## 8) Best surviving version table

| Surface | Best surviving ref | Commit | Date | Implementation | Currently in Step 14? | In recovered fork? | Unique? |
|---|---|---|---|---|---|---|---|
| Dashboard | `refs/agents/.../turn/7` | `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9` | 2026-08-13 | Next.js runtime ([app/(bof)/dashboard/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/dashboard/page.tsx)) | Yes | Static analog only | Yes (agent lineage) |
| Dashboard V2 | `refs/agents/.../turn/7` | `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9` | 2026-08-13 | Next.js runtime ([app/(bof)/dispatch-v2/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/dispatch-v2/page.tsx), [components/dispatch-v2/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/dispatch-v2)) | Yes | No direct v2 runtime | Yes |
| Command Center | `refs/agents/.../turn/7` | `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9` | 2026-08-13 | Next.js runtime ([app/(bof)/command-center/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/command-center/page.tsx)) | Yes | Static command-center pages | Yes |
| Dispatch V2 | `refs/agents/.../turn/7` | `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9` | 2026-08-13 | Next.js runtime dispatch-v2 components | Yes | No | Yes |
| Settlements V2 | `refs/agents/.../turn/7` | `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9` | 2026-08-13 | Next.js runtime settlements-v2 components | Yes | No | Yes |
| Customer Portal | `refs/agents/.../turn/121` | `7547f07425d01b9efcd0a0bea4af31c93f342e8c` | 2026-08-16 | Next.js runtime portal flow | Yes | Yes (static) | Yes |
| Investor Portal | `refs/agents/.../turn/213` | `33cb48375ed263c25ddc220ed7891add1c114c4a` | 2026-08-19 | Next.js runtime marketing investor page | Yes | Yes (static private investor pages) | Yes |
| Private Investor Plan | `refs/agents/.../turn/230` (fork restore) / `origin/feature/private-investor-operating-plan` | `d7851353...` / `be4fa540...` | 2026-08-19 / 2026-06-24 | Static HTML/CSS plan and investor pages | Yes (runtime equivalent route exists, different impl) | Yes | Yes |
| Trip Packet Workspace | `refs/agents/.../turn/7` | `5d36a8b25ec5f86fb26c06ec8b74dfd361756fa9` | 2026-08-13 | Runtime workspace component | Yes | No | Yes |
| Driver Workspace | `refs/agents/.../turn/145` | `9b84cdcaab2c24eb6f85e5e2e16cd0c42bd042ac` | 2026-08-17 | Runtime driver/dispatch progression | Yes | Static drivers pages only | Yes |
| Operations Workspace | `refs/agents/.../turn/212` | `4fadb111f0acd3eaf324a3070ed6299c7868937b` | 2026-08-19 | Runtime dispatch operations flow | Yes | Static operations pages only | Yes |
| Business Operations | `refs/agents/.../turn/230` | `d7851353b2b43f0ceb2a5dcf9a3eb31881e1815d` | 2026-08-19 | Restored static fork pages ([recovered/fork-restored-20260819/business-operations/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/recovered/fork-restored-20260819/business-operations)) | Yes (content path present via recovered tree) | Yes | Yes |
| Safety | `refs/agents/.../turn/145` (runtime) / `turn/230` (static) | `9b84cdca...` / `d7851353...` | 2026-08-17 / 2026-08-19 | Runtime + static surfaces | Yes | Yes | Yes |
| Operational Intelligence | `refs/agents/.../turn/230` | `d7851353...` | 2026-08-19 | Static recovered fork page set | Yes (recovered tree present) | Yes | Yes |
| Capacity Intelligence | `refs/agents/.../turn/230` | `d7851353...` | 2026-08-19 | Static recovered fork page set | Yes (recovered tree present) | Yes | Yes |
| BOF Website | `refs/agents/.../turn/230` | `d7851353...` | 2026-08-19 | Full restored static BOF fork | Yes (as recovered tree) | Yes | Yes |
| BOF Branding / Logos | `refs/agents/.../turn/213` | `33cb48375ed263c25ddc220ed7891add1c114c4a` | 2026-08-19 | Runtime brand mark + logo variants | Yes | Yes (static logo assets also present) | Yes |

## 9) Newer-than-fork and newer-than-Step-14

- **Newer than recovered fork (static):**
  - Runtime investor route and brand animation in `33cb4837` (Next.js app implementation).
  - Runtime dispatch/driver operations progression through `4fadb111`.
- **Newer than current Step 14:** no separate newer branch/ref outside current available refs was found with clearly superior preserved runtime beyond what is already present in workspace paths; surviving novelty is mostly detached checkpoint provenance rather than unseen extra branch lineage.

## 10) Items believed lost vs recoverable

### BOF Workspaces / Dashboards / Portals Believed Lost but Still Recoverable

1. **Dashboard-v2 implementation**
   - Ref/commit: `refs/agents/.../turn/0` (`77a8ba3f...`), `turn/7` (`5d36a8b2...`)
   - Type: Next.js runtime dashboard/dispatch-v2/settlements-v2
   - Recovery status: recoverable via detached agent commits
   - Why it matters: contains KPI-heavy operational dashboard pass and v2 component set

2. **Portal/workspace shell suite**
   - Ref/commit: `77a8ba3f...` + follow-ons through `9b84cdca...` / `4fadb111...`
   - Type: runtime portals + workspace clients
   - Recovery status: recoverable
   - Why it matters: contains authenticated-style navigation/workspace architecture not present in static fork model

3. **Investor runtime narrative route**
   - Ref/commit: `33cb4837...`
   - Type: Next.js marketing runtime
   - Recovery status: recoverable
   - Why it matters: newer runtime investor positioning distinct from static private-investor pages

4. **Private investor operating-plan branch snapshot**
   - Ref/commit: `origin/feature/private-investor-operating-plan`, `be4fa540...`
   - Type: static gated investor-plan presentation
   - Recovery status: recoverable from remote ref
   - Why it matters: explicit private-plan framing lineage before later cinematic fork variant

### BOF Workspaces / Dashboards / Portals That Appear Genuinely Lost

- No high-confidence evidence of total loss for the major requested surfaces in the local clone.
- Missing branch labels (example: `codex/dashboard-v2-light-visual-refinement`) appear to be **naming loss**, not implementation loss, because equivalent work persists in detached agent refs.

## 11) Direct answers to priority questions

1. **Where is dashboard-v2 work?**  
   In `refs/agents/.../turn/0` (`77a8ba3f...`) and `turn/7` (`5d36a8b2...`) with [app/(bof)/dispatch-v2/page.tsx](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/dispatch-v2/page.tsx) and [components/dispatch-v2/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/components/dispatch-v2).

2. **Where are BOF dashboards created under Codex?**  
   Primarily in detached `refs/agents/...` checkpoint lineage (not in named `codex/dashboard-v2...` refs).

3. **Where are portals created under Codex?**  
   In agent lineage around `77a8ba3f`/`5d36a8b2` and later updates (`7547f074`, `848d6906`, `0161e04d`, `9b84cdca`, `4fadb111`) affecting [app/portals/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/portals) and [app/(bof)/shipper-portal/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/app/(bof)/shipper-portal).

4. **Is investor portal/workspace still recoverable?**  
   Yes: static investor-plan at `be4fa540...`, richer static fork investor pages in [recovered/fork-restored-20260819/private-investor/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/recovered/fork-restored-20260819/private-investor), and runtime investor page in `33cb4837...`.

5. **Is `be4fa540` still present and what does it contain?**  
   Yes. It modifies `Website/assets/css/private-investor-plan.css` and `Website/private-investor-plan/index.html` on `origin/feature/private-investor-operating-plan`.

6. **Are there newer versions of private-investor work than recovered fork?**  
   Yes in implementation style: `33cb4837...` adds newer Next.js runtime investor page, while recovered fork retains richer static cinematic private-investor pages.

7. **Are there Codex workspaces with functionality absent from both current Step 14 and recovered fork?**  
   No high-confidence missing-major-surface finding in this clone; key workspace/dashboard/portal surfaces are recoverable in agent refs and/or present in current paths and recovered fork copy.

8. **Are items sitting in detached/unreferenced commits?**  
   Yes. All 233 `refs/agents` checkpoint refs are detached from heads/remotes/tags and contain recoverable lineage.

9. **Is anything actually gone vs disconnected?**  
   Evidence indicates mostly disconnected/unlabeled (ref-name loss), not gone.

## 12) Recommended recovery candidates (for future controlled restore phase)

1. Preserve/export `refs/agents` commit chain (all 233 refs) before any ref cleanup.
2. Prioritize runtime extraction candidates:
   - `5d36a8b2` (dashboard-v2/dispatch-v2/settlements-v2 refinements)
   - `4fadb111` (late dispatch/runtime operations updates)
   - `33cb4837` (investor runtime + brand mark)
3. Keep static investor dual lineage:
   - `be4fa540` branch variant
   - recovered fork cinematic variant in [recovered/fork-restored-20260819/private-investor/](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web/recovered/fork-restored-20260819/private-investor)

