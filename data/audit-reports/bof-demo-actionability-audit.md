# BOF Demo Actionability Audit

## Scope

Audit targets: dashboard, command center, drivers, dispatch/loads, documents, settlements, safety, and intake/request routes.

## Findings

| Page/Route | Component/File | Current Text / Behavior | Why Not Actionable | Data Source | Recommended Replacement | Action |
|---|---|---|---|---|---|---|
| `/dashboard` | `components/dashboard/DashboardPageClient.tsx` | "What needs attention" with implementation copy (`buildCommandCenterItems`, canonical queue) | Describes plumbing, not operator action | `buildExecutiveDashboardModel` | "Highest-severity issues blocking dispatch/payment/compliance. Expand to resolve." | Replace copy |
| `/dashboard` | `components/dashboard/DashboardPageClient.tsx` | Queue cards show "No direct amount" | No distinction between zero and unknown | `ownerAttentionQueue.financialImpact` | "Impact not yet quantified - verify in Money at Risk" with link | Replace copy/link |
| `/dashboard` | `components/dashboard/DashboardPageClient.tsx` | Generic links/buttons (`Open Dispatch Board`, `Review Attention Queue`, `Open full queue`) | Similar destinations with inconsistent labels | Route map + queue links | Normalize to specific intent labels | Replace labels |
| `/command-center` | `components/CommandCenterImmediateActions.tsx` | Resolve button label always "Resolve" | Does not state what will happen | `buildImmediateActionsRequired` | Use row-specific labels (upload proof, clear hold, review driver) | Replace CTA labels |
| `/command-center` | `lib/command-center/command-center-issue-view-model.ts` | Fallback action "Open command issue" -> `/command-center` | Self-referential and non-resolving | Enriched command center rows | Issue-type fallback to exact route/hash | Replace fallback |
| `/command-center` | `components/CommandCenterKpiStrip.tsx` | Static KPI cards | Not drillable to affected records | command center KPI model | Make each card link to filtered records | Convert to actionable |
| `/drivers/:id/vault` | `components/drivers/DriverVaultDqfPageClient.tsx` | "What needs review?" opened generic review drawer | Vague, duplicated, not inline | `getDriverDqfReadinessSummary` | Inline issue panel with issue/why/fix/actions | Replaced |
| `/drivers/:id/vault` | `lib/driver-dqf-readiness.ts` | Generic wording ("document slot", "strongly recommended") | Internal wording, no clear task | DQF summary rows | Plain-English issue/fix wording | Replaced |
| `/dispatch` | `components/dispatch/LoadCanonicalEvidencePanel.tsx` | Generic "Open" for evidence files | Does not indicate file/problem | canonical load evidence rows | "Open BOL file", "Open POD file", etc. | Replace labels |
| `/dispatch` | `components/dispatch/DocumentationReadinessPanel.tsx` | "Missing / Needs review" rows | No concrete missing artifact in message | readiness/proof rows | Include exact missing artifact and direct action | Replace copy |
| `/loads/:id` | `app/(bof)/loads/[id]/page.tsx` | Breadcrumb text "Loads / dispatch" | Ambiguous destination | route and load detail | "Loads queue" / explicit split crumb | Replace copy |
| `/documents` | `components/documents/BofTemplateUsageSurface.tsx` | Generic "Open Draft" / "Open Final" | No template context in CTA | template rows | Include template name in label | Replace labels |
| `/settlements` | `components/settlements-payroll/SettlementsDashboardScreen.tsx` | "Hold / Review" bucket | Merges distinct hold reasons | settlement rows/status | Split hold reasons (proof/exception/compliance/manual) | Convert |
| `/settlements` | `components/settlements-payroll/SettlementDetailDrawer.tsx` | Generic hold prompt default | Allows non-specific hold reason | settlement detail editor | Structured hold reason template | Replace prompt |
| `/safety` | `components/safety/SafetyCommandHero.tsx` | Static safety counts | Not expandable to affected drivers/events | safety command data | Click/expand to filtered issue list | Convert |
| `/safety` | `components/safety/SafetyCommandEventList.tsx` | Generic links ("Open driver", "Review evidence") | Destination not outcome | safety event rows | Specific action labels by issue | Replace labels |
| `/load-requests` | `components/BofHeader.tsx` | Top nav includes Load Requests | Can pull users into intake/request path from issue contexts | nav config | Remove from primary demo nav; keep route reachable directly | Disconnect nav |
| `/load-requirements`, `/load-intake` | redirect routes + docs | Legacy aliases still present | Can confuse active issue flow | route map | Mark as legacy do not use and route to `/dispatch/intake` only | Document legacy |

## Intake/Request Route Notes

- `/load-requirements` and `/load-intake` are redirects to `/dispatch/intake`.
- `/load-request` and `/load-requests` remain active but should not be default destination for operational issue links.

## Priority

- **P0:** generic review drawers; generic "Resolve"/"Open" labels on issue workflows; self-referential queue actions.
- **P1:** non-expandable KPI/count summaries on dashboard, command center, safety, settlements.
- **P2:** copy normalization and label consistency across secondary panels.

