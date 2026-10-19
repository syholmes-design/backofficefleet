# Six-agent assignments

Date: 2026-10-19
Governing document: `docs/architecture/BOF-UNIFIED-ENGINEERING-CHARTER.md`. Its six roles are unchanged; amending the charter needs owner approval.

This file maps the owner's functional ownership (directive of 2026-10-19) onto those roles and records current work items. Every agent first reads `docs/architecture/BOF-CANONICAL-IMPLEMENTATION-REGISTER.md` and `docs/architecture/BOF-UOS-GAP-REGISTER.md`.

> This session's work was done by a single agent working through the phases in order. No parallel agents ran. The assignments below start the next round.

## Ownership

| Agent | Functional scope (owner directive) | Charter role it maps to | Current canonical home |
|---|---|---|---|
| 1. Recruiting and driver activation | Requisitions, intake, onboarding, qualification, activation | Operational Workflow Engineer | Register §1; `requisitionRecruitingBridge.ts`; `driver-activation-service.ts`; `workHistoryService.ts` |
| 2. Loads and shipment lifecycle | Load intake, validation, shipment records | Data & Integration Engineer | `lib/load-process-unified-read-model.ts`, `lib/services/loadService.ts`, `app/customer-portal/**` |
| 3. Dispatch and operational readiness | Driver, carrier and equipment eligibility; in-route execution | Operational Workflow Engineer | `dispatchAssignmentService.ts`, `dispatchReleaseService.ts`, `readinessService.ts` |
| 4. Documents and compliance | Document control, evidence, qualification, exceptions | Security & Reliability Engineer, with the Document Control owner | `qualificationService.ts`, `readinessReevaluationService.ts`, `lib/document-control/**` (adoption gates apply) |
| 5. Settlements and financial operations | Eligibility, holds, reconciliation | Data & Integration Engineer | `lib/load-finance-handoff.ts`, `proofSettlementHoldService`, `settlementReadService` |
| 6. Integration, architecture and QA | Canonical enforcement, regression, release readiness | Chief Systems Architect + Production Engineering & QA | This file, the canonical register, `npm run preflight`, `scripts/release/verify-public-routes.mjs` |

The charter's Conversational Intelligence role (Operational Chat and Copilot; GAP-004 and GAP-007) is kept. Agent 6 coordinates it until it is assigned.

## Next work items (from the gap register)

| Agent | Item | Gap |
|---|---|---|
| 1 | After owner approval, apply `20261019120000` with the release, then verify the signed-in recruiting pages in production | GAP-016 |
| 1 | Have a verified employment-verification document propose its employer for the work-history panel (convenience only; staff still confirm) | Follows GAP-011 |
| 2 | Consolidate `/api/load-process-intelligence` and `/api/operating-process/loads/*` into one read model, then delete the loser | GAP-005 |
| 2 | Decide on "request shipment", which exists only on `main`: port it or record it as superseded | GAP-017 |
| 3 | Fix sparse `OperatingProcessEvent` emission | GAP-006 |
| 3 | Carrier packet evidence pages (`main` only): port or supersede | GAP-017 |
| 4 | Canonical insurance-notice and MSA routing (`main` only): port into `lib/document-control` | GAP-017 |
| 4 | Re-verify the employer-controlled vs driver-controlled record separation | Status report §3 |
| 5 | Browser-verify that settlement holds release only when their release conditions are met; payroll stays preview-only | GAP-008 |
| 6 | Get the owner to name the production release path, then run the release checklist | GAP-016 |
| 6 | Make the canonical-register check part of review for every change touching a listed function | Ongoing |

## Shared contracts (coordinate before changing)

- `prisma/schema.prisma` and new migrations: Agent 6 reviews. Additive only without owner approval.
- `lib/services/requisitionRecruitingBridge.ts`: owned by Agent 1. Careers intake and the workspace both depend on it.
- `lib/services/qualificationService.ts` and `readinessService.ts`: shared by Agents 1, 3 and 4. Dispatch assignment enforces readiness.
- `lib/services/dispatchAssignmentService.ts`: owned by Agent 3. The readiness gate must stay server-side.
- `lib/security/route-access.ts`: owned by Agent 6. Every new public route or method needs a test in `route-access.test.ts`.
- `docs/architecture/BOF-CANONICAL-IMPLEMENTATION-REGISTER.md`: every agent updates it when it consolidates a function.

## Conflicts resolved this round

| Conflict | Resolution |
|---|---|
| Two recruiting UIs (`/recruiting-v2` and the workspace) | The workspace is canonical. V2's unique capabilities were ported, then its screens deleted. |
| Careers intake ran on a browser store; the workspace ran on the database | Both now use the single intake service on the database. |
| `candidate-access` pulled Next.js into services and tests | Scope rules were split into `candidate-scope.ts`. |
| Route map marked unused heroes "LEGACY_DO_NOT_EDIT" but kept them | The heroes and their rows were deleted. |
| Requisition tests assumed approval created nothing | Tests now assert exactly one position, idempotently. |
