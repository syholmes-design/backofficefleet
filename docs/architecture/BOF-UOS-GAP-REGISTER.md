# BOF UOS Architectural Gap Register

Living register for integration gaps. Updated with UOS Increment 5.

| ID | Severity | Workflow | Gap | Owner | Status | Verification |
|----|----------|----------|-----|-------|--------|--------------|
| GAP-001 | High | Driver lifecycle | Recruiting activation GET returned `READY` after Prisma handoff (`activationReadiness` ignored stored `ACTIVE`) | Data & Integration | **Corrected Inc 4** | `activation-presentation.test.ts`; GET `/api/recruiting-v2/activation/CAND-001` shows `activationStatus: ACTIVE` |
| GAP-002 | High | Driver lifecycle | Document verify/reject did not re-run readiness projection | Operational Workflow | **Corrected Inc 4** | `readinessReevaluationService` on document status change |
| GAP-003 | Medium | Load-to-settlement | Settlement eligibility not explicit in finance handoff / intelligence | Data & Integration | **Corrected Inc 4** | `settlementEligibility` on `buildLoadFinanceHandoff`; LOAD_FINANCE answer line |
| GAP-004 | Medium | Operational intelligence | Chat/Copilot/load PI used parallel logic for finance facts | Conversational Intel | **Partial Inc 4** | Shared `buildLoadFinanceHandoff`; `operationalFactsService` for loads/drivers |
| GAP-005 | Medium | Load process | Dual APIs: `/api/load-process-intelligence` vs `/api/operating-process/loads/*` | Chief Architect | **Partial Inc 5** | Both routes now expose `unifiedProcess`; full deprecation TBD |
| GAP-006 | Medium | Load lifecycle | Sparse `OperatingProcessEvent` emission on some fixture loads | Operational Workflow | **Partial Inc 5** | GPS/geofence/risk events emit on ingestion; legacy loads still sparse |
| GAP-011 | High | Fleet visibility | No authoritative GPS / fleet map layer | Data & Integration | **Foundation Inc 5** | Prisma observations + `/fleet-map` + fleet-scoped ingest credentials |
| GAP-012 | Medium | Telematics intel | Chat/Copilot telematics intent returned UNAVAILABLE | Conversational Intel | **Partial Inc 5** | `answerTelematicsQuestion` + graceful GPS storage unavailable |
| GAP-013 | High | Fleet visibility security | Global ingest secret / cross-fleet spoofing | Security | **Corrected Inc 5 remediation** | `TelematicsIngestCredential` + device link enforcement + association validation |
| GAP-007 | Low | Messaging | Multi-user operational chat sync / read receipts incomplete | Conversational Intel | Open | Single-session prod verification only |
| GAP-008 | Blocked | Finance | Authoritative payroll / GL not integrated | Data & Integration | Blocked external | Paylocity preview only; Prisma Settlement LIVE for holds |
| GAP-009 | Blocked | Delivery | ePOD disabled by policy | Operational Workflow | Not implemented | Do not enable without authorization |
| GAP-010 | Low | Demo firewall | Demo load keys (L00x) 404 in LIVE APIs | Security | By design | Verified on production |

**Severity:** Critical / High / Medium / Low  
**Status:** Open | Partial | Corrected | By design | Blocked external | Demonstration-only
