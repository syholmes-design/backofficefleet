# Prompt 017 Path A — Binding Product-Owner Decision

**Status:** BINDING  
**Date:** 2026-09-09  
**Recorded on:** `orchestrator/prompt-019-authority-assignment`  
**Does not modify Prompt 014.** Does not rerun Prompt 014. Does not implement payment or Safety writes.

---

The product owner formally selected:

**PATH A — ALIGN BOF TO THE EXISTING PROMPT 014 / UOS STANDARD**

This supersedes Prompt 017 final status `DECISION BLOCKED — PRODUCT OWNER DECISION REQUIRED` for the *choice of path*. Prompt 017 analysis of both paths remains historical evidence.

## Approved principles

1. LIVE is the authoritative production source for operational decisions.  
2. DEMO must be isolated from LIVE operational authority.  
3. WORKBOOK surfaces are subordinate planning artifacts.  
4. REFERENCE surfaces are documentation only.  
5. DEPRECATED surfaces must follow the formal retirement process (not executed in this recording).  
6. Command Center production feeds must ultimately be LIVE-only.  
7. Cross-domain workflows must consume authoritative LIVE state.  
8. Competing operational representations must be isolated, subordinated, or retired per Product Authority governance.  
9. Existing BOF architecture must be reused wherever possible.  
10. No duplicate engines, sources of truth, or operating systems may be created.

## Effect on prior product decisions

| Prior code | Prior meaning | Path A effect |
|---|---|---|
| **C2 / ADR-009-001** | DEMO JSON operator shell is the intentional operator production dataset | **Superseded for production authority.** DEMO shell may remain only as an isolated DEMO/sandbox experience. It must not govern LIVE decisions or Command Center production feeds. |
| **A2** | Payment/cash UNSUPPORTED | **Opened for Path A implementation review.** Minimum legitimate capability must be designed from existing architecture **before** any implementation. Not implemented in this recording. |
| **B2** | Durable Safety create/remove out of production capability | **Opened for Path A implementation review.** Same: evaluate minimum from existing architecture; do not implement merely for 014. Not implemented in this recording. |
| **ADR-009-003** | `/settlements` payroll workbook identity | **Subordinate.** Payroll workbook remains REFERENCE/WORKBOOK for driver-week pay identity. Load-level proof holds remain Prisma LIVE. Workbook must not govern LIVE dispatch/release. |

## What this decision does *not* do

- Does not CERTIFY BOF.  
- Does not change Prompt 014 text.  
- Does not authorize fabricating L001/T-102 into Prisma.  
- Does not authorize a new TMS, payment platform, Safety platform, or UOS software registry.  
- Does not retire DEMO/workbook files in this commit.

## Next authorized consolidation phase

UOS **Phase 2 — Authority Assignment** (recorded in `BOF-UOS-019-AUTHORITY-ASSIGNMENT.md` and `BOF-PRODUCTION-READINESS-019.md`).

Implementation of DEMO firewall / CC LIVE-only KPIs is **Phase 5/7 work** and is **not** started in the decision-recording commit except as assigned targets.
