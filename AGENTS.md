# BackOfficeFleet — AI Engineering Agents

## Governing charter (required reading)

All BOF engineering work must comply with:

**[docs/architecture/BOF-UNIFIED-ENGINEERING-CHARTER.md](docs/architecture/BOF-UNIFIED-ENGINEERING-CHARTER.md)**

That document defines the business model, six-agent collaboration model, authoritative-data standards, security boundaries, production verification requirements, and independent engineering judgment expectations.

## Quick pointers

| Topic | Document / location |
|-------|---------------------|
| UOS architecture | `docs/architecture/UNIFIED-OPERATIONS-ARCHITECTURE.md` |
| Integration gaps | `docs/architecture/BOF-UOS-GAP-REGISTER.md` |
| Recruiting → driver handoff | `lib/recruiting-v2/driver-activation-service.ts` |
| Activation API presentation | `lib/recruiting-v2/activation-presentation.ts` |
| Unified load process | `lib/load-process-unified-read-model.ts` |
| Load finance / settlement eligibility | `lib/load-finance-handoff.ts` |
| Operational intelligence | `lib/operational-intelligence/operationalIntelligenceService.ts` |
| Shared operational facts | `lib/operational-facts/operationalFactsService.ts` |

## Production release discipline

- Verify deployed commit and Vercel deployment ID after release.
- Run authenticated end-to-end checks; do not treat green builds as workflow proof.
- Do not enable ePOD or run unrelated migrations without explicit approval.

## Repository conventions

Follow existing patterns in adjacent files. Minimize scope. Prefer shared services over duplicated business logic in UI, Chat, and Copilot.
