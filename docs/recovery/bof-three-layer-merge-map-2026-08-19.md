# BOF Three-Layer Merge Map — 2026-08-19

Integration branch: `integration/bof-substance-visual-codex-20260819`  
Base commit (Source A): `413d7f0ee60fa9466c7f62dc8a12858a1a143679`

| Surface | Source A substance | Source B visual | Codex source | Merge action |
|---|---|---|---|---|
| Homepage | Marketing narrative + route/app shell | Cinematic hero/media language from recovered fork | Marketing refinements and brand mark integration | Keep runtime foundation; preserve recovered visual assets and styling vocabulary where applicable |
| Dashboard | BOF operational KPIs and readiness signals | Visual hierarchy references from fork tiles/cards | `recovery/codex-dashboard-v2` | Keep Source A operational logic; use Codex dashboard runtime surface |
| Dashboard V2 | Load/driver/ops signal model | Strong visual card system reference | `recovery/codex-dashboard-v2` | Use Codex v2 runtime implementation; keep Source A data semantics |
| Command Center | Exception + actionability substrate | Cinematic presentation/hero references | `recovery/codex-dashboard-v2` | Preserve Source A command logic; keep Codex command center runtime UX |
| Drivers | Driver qualification, docs, compliance, status | Fork visual references for card composition | `recovery/codex-driver-workspace` | Preserve Source A depth, integrate Codex driver workspace and vault interactions |
| Driver Workspace | Driver readiness and operational state | N/A (fork is static) | `recovery/codex-driver-workspace` | Keep Codex runtime workspace and bind to Source A demo dataset |
| Driver Portal | Driver-specific document/action routes | Static route references from fork | `recovery/codex-driver-workspace` + `recovery/codex-customer-portal` | Keep Codex portal runtime, preserve Source A document/readiness state |
| Documents | Requirements, packeting, statuses, expiration, readiness | Fork visual storytelling around documentation | `recovery/codex-operations-workspace` | Preserve Source A document models/rules/APIs; retain Codex operational UX |
| Document Readiness | Qualification/readiness gating rules | Fork readiness narrative visuals | `recovery/codex-operations-workspace` | Keep Source A readiness logic and blockers; apply Codex runtime surfaces |
| Exceptions | Severity, ownership, blockers, evidence, resolution | Fork visual framing of risk | `recovery/codex-operations-workspace` | Preserve Source A exception semantics; retain Codex workflows and UI |
| Loads | Canonical load records and lifecycle | Fork operational visuals | `recovery/codex-operations-workspace` | Keep Source A load substance and dataset; use Codex runtime boards/workflows |
| Dispatch | Dispatch state, assignments, readiness dependencies | Fork dispatch visual references | `recovery/codex-operations-workspace` | Preserve Source A operational depth + Codex runtime interactions |
| Dispatch V2 | Dispatch domain semantics | N/A (runtime-specific) | `recovery/codex-dispatch-v2` | Adopt Codex Dispatch V2 runtime implementation |
| Trip Packet | Document/evidence packet semantics | Fork packet/story visuals | `recovery/codex-trip-packet-workspace` | Keep Source A packet substance with Codex workspace UI |
| Trip Release | Release checks/history/readiness gating | Fork trip-flow visual references | `recovery/codex-operations-workspace` | Preserve Source A release logic and Codex release/runtime UX |
| Safety | Compliance/safety state and workflows | Fork safety page visual design references | `recovery/codex-safety` | Use Codex runtime safety surface, keep Source A operational signal integrity |
| Settlements | Settlement state and document ties | Fork financial storytelling visuals | `recovery/codex-settlements-v2` | Preserve Source A settlement data consistency; integrate Codex settlement surfaces |
| Settlements V2 | Settlement calculations/presentation | N/A (runtime-specific) | `recovery/codex-settlements-v2` | Adopt Codex Settlements V2 runtime implementation |
| Business Operations | Source A operations logic + data tie points | Recovered fork business-operations cinematic/static surface | `recovery/codex-business-operations` | Mount Source B visual surface without replacing Source A runtime core |
| Customer Portal | Customer visibility workflows tied to loads/docs | Recovered fork customer-portal visual continuity | `recovery/codex-customer-portal` | Keep Codex runtime portal + mount Source B static portal surface paths |
| Investor Portal | Runtime investor route + narrative discipline | Recovered fork private-investor cinematic presentation | `recovery/codex-investor-portal` | Retain Codex runtime investor portal and mount Source B investor visual pages |
| Private Investor Plan | Source A repo hosts route infrastructure only | Recovered private-investor-plan full static experience | `recovery/codex-private-investor-plan` + Source B recovered pages | Serve recovered visual plan through runtime rewrites/static bridge |
| Operations Workspace | Dispatch/loads/documents/readiness/exception execution | Fork visual references only | `recovery/codex-operations-workspace` | Keep Codex runtime workspace; tie to Source A data/workflow semantics |
| Operational Intelligence | Source A operational signals and risk semantics | Recovered fork visual page + media | `recovery/codex-operational-intelligence` | Preserve runtime core and mount recovered visual/intelligence surface |
| Capacity Intelligence | Source A load/capacity substrate | Recovered fork visual page + media | `recovery/codex-capacity-intelligence` | Preserve runtime data model and mount recovered capacity surface |

## Data unification rule

All runtime surfaces use the existing BOF dataset at [demo-data.json](C:/Users/syhol/OneDrive/Documents/GitHub/backofficefleet/bof-web-integration-20260819/lib/demo-data.json), avoiding parallel/demo-duplicate datasets.

