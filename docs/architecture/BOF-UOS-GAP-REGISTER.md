# BOF UOS Architectural Gap Register

Living register for integration gaps. Updated with UOS Increment 4.

| ID | Severity | Workflow | Gap | Owner | Status | Verification |
|----|----------|----------|-----|-------|--------|--------------|
| GAP-001 | High | Driver lifecycle | Recruiting activation GET returned `READY` after Prisma handoff (`activationReadiness` ignored stored `ACTIVE`) | Data & Integration | **Corrected Inc 4** | `activation-presentation.test.ts`; GET `/api/recruiting-v2/activation/CAND-001` shows `activationStatus: ACTIVE` |
| GAP-002 | High | Driver lifecycle | Document verify/reject did not re-run readiness projection | Operational Workflow | **Corrected Inc 4** | `readinessReevaluationService` on document status change |
| GAP-003 | Medium | Load-to-settlement | Settlement eligibility not explicit in finance handoff / intelligence | Data & Integration | **Corrected Inc 4** | `settlementEligibility` on `buildLoadFinanceHandoff`; LOAD_FINANCE answer line |
| GAP-004 | Medium | Operational intelligence | Chat/Copilot/load PI used parallel logic for finance facts | Conversational Intel | **Partial Inc 4** | Shared `buildLoadFinanceHandoff`; `operationalFactsService` for loads/drivers |
| GAP-005 | Medium | Load process | Dual APIs: `/api/load-process-intelligence` vs `/api/operating-process/loads/*` | Chief Architect | Open | Unified read model on PI route; operating-process not fully consolidated |
| GAP-006 | Medium | Load lifecycle | Sparse `OperatingProcessEvent` emission on some fixture loads | Operational Workflow | Open | E2E workflow B — event count may be zero |
| GAP-007 | Low | Messaging | Multi-user operational chat sync / read receipts incomplete | Conversational Intel | Open | Single-session prod verification only |
| GAP-008 | Blocked | Finance | Authoritative payroll / GL not integrated | Data & Integration | Blocked external | Paylocity preview only; Prisma Settlement LIVE for holds |
| GAP-009 | Blocked | Delivery | ePOD disabled by policy | Operational Workflow | Not implemented | Do not enable without authorization |
| GAP-010 | Low | Demo firewall | Demo load keys (L00x) 404 in LIVE APIs | Security | By design | Verified on production |

**Severity:** Critical / High / Medium / Low  
**Status:** Open | Partial | Corrected | By design | Blocked external | Demonstration-only
