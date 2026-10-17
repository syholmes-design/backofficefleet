# BOF Unified Engineering Charter

**Version:** 1.0 (UOS Increment 4)  
**Status:** Governing document for all BackOfficeFleet engineering work  
**Owner approval required for:** changes to governing principles below

## Purpose

BackOfficeFleet (BOF) is an outsourced transportation back-office operations platform. Engineering must deliver a **unified enterprise operating environment**—not isolated features—where recruiting, dispatch, documents, exceptions, delivery evidence, and financial administration connect through **authoritative records** and **verifiable workflows**.

This charter preserves architectural continuity across releases, agents, and development sessions.

## Business model (non-negotiable context)

- BOF serves transportation aggregators, affiliated carriers, and fleet operators.
- BOF personnel perform centralized services across assigned customers.
- The platform must preserve **organizational boundaries** while enabling authorized centralized operations.
- BOF is **not primarily a SaaS vendor**; demonstration surfaces must not be represented as live payroll, accounting, GPS, or ePOD unless explicitly authorized and wired to authoritative systems.

## Overriding engineering principle — independent judgment

Engineers (human and AI) are expected to act as senior specialists:

- Challenge weak architecture when evidence supports a better design.
- Fix **root causes**, not recurring symptoms.
- Simplify redundant or conflicting implementations.
- Collaborate on shared interfaces, data models, and services.
- Require **independent peer review** before production deployment of significant changes.

Autonomy does **not** authorize: destructive production changes, weakened security, disabled tenant isolation, unauthorized infrastructure spend, or enabling restricted capabilities (e.g. ePOD) without explicit approval.

## Six-agent collaboration model

| Role | Primary responsibility |
|------|------------------------|
| Chief Systems Architect | Unified architecture, integration coordination, conflict resolution |
| Data & Integration Engineer | Authoritative records, APIs, events, consistency |
| Operational Workflow Engineer | Recruiting-to-settlement lifecycle and controls |
| Conversational Intelligence Engineer | Operational Chat, Copilot, grounded intelligence |
| Security & Reliability Engineer | Tenant isolation, permissions, integrity, audit |
| Production Engineering & QA | E2E verification, regression, safe deployment |

Agents may cross boundaries; the Chief Architect prevents competing implementations.

## Architectural standards

1. **Authoritative data first** — Prisma LIVE rows and designated services win over demo/workbook UI state.
2. **End-to-end workflow integrity** — A successful build or isolated API response does not prove operational correctness.
3. **Distinct lifecycle states** — Recruiting approval, administrative activation, driver qualification, and dispatch readiness must remain **separate**; activation must never imply legal qualification or dispatch eligibility.
4. **Server-side enforcement** — Dispatch assignment, tenant access, and financial eligibility use server gates; UI warnings are supplemental.
5. **Shared read models** — Prefer consolidated services (e.g. unified load process view, finance handoff projection) over duplicated business logic in Chat, Copilot, and UI panels.
6. **Evidence-based intelligence** — Operational Chat and Copilot cite records; distinguish facts, interpretations, and recommendations; do not fabricate unavailable telemetry or payroll results.
7. **Safe assisted actions** — AI and chat may recommend actions; consequential mutations require authorization and explicit confirmation.
8. **Gap register** — Material integration defects are tracked with severity, workflow impact, owner, status, and verification evidence (`docs/architecture/BOF-UOS-GAP-REGISTER.md`).

## Production and deployment

- Verify **deployed commit and deployment ID** before and after release.
- Preserve completed functionality unless intentionally superseded.
- Do not apply unrelated migrations; scope migrations explicitly and obtain approval.
- Use controlled production releases; preserve existing production data.
- **Authenticated production verification** is mandatory for integration increments.

## Definition of done (integration work)

Integration increments succeed when **complete operational workflows** improve measurably:

- Recruiting records reliably become operational driver records without contradictory status.
- Qualification and readiness govern dispatch eligibility.
- Loads maintain consistent operational and financial handoff projections.
- Delivery evidence and exceptions influence settlement eligibility representations.
- Operational intelligence surfaces align on the same authoritative facts.

## Related documents

- `docs/architecture/UNIFIED-OPERATIONS-ARCHITECTURE.md` — UOS integration architecture (Increments 1–3+)
- `docs/architecture/BOF-UOS-GAP-REGISTER.md` — living gap register
- `AGENTS.md` — agent discovery entry point

## Amendment process

Substantive changes to this charter require explicit project owner approval and a versioned commit to this file.
