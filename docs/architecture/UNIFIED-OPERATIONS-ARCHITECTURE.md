# BOF Unified Operations Architecture (UOS)

BackOfficeFleet is an outsourced transportation back-office **service organization**. Software exists so BOF personnel can execute recruiting, qualification, dispatch administration, documentation, settlements support, and exception resolution across **multiple fleets** with tenant isolation.

## Integration spine

```text
Tenant (Fleet)
  ├── Personnel: Recruiting V2 → Driver → DriverIntake → Documents / Requirements
  ├── Dispatch: Load → Assignment → Readiness → Release → Delivery / Proof
  ├── Finance: Settlement (LIVE Prisma) ← proof / load-to-cash events
  ├── Equipment: ConditionThread (open exceptions)
  ├── Process intelligence: OperatingProcessEvent timeline per load
  ├── Operating records: authorized lookup + citations (chat, intelligence)
  └── Conversations: OperationalChatThread + Operational Intelligence queries
```

## Authoritative vs reference data

| Domain | LIVE authority (when present) | Reference / demo (do not use for intelligence) |
|--------|------------------------------|------------------------------------------------|
| Loads, assignments | Prisma `Load`, dispatch services | `demo-data.json` load cards |
| Driver readiness | `DriverReadinessScore`, readiness service | `getDriverDispatchEligibility(BofData)` |
| Settlement holds | Prisma `Settlement.status`, `holdReason` | Workbook STL-* / load `settlementHold` flag |
| Documents | `DriverDocument`, intake requirements | Generated HTML vault only |
| Exceptions | `ConditionThread` (equipment) | Static dispatch thread cards |
| Lifecycle timeline | `OperatingProcessEvent` via `getTenantLoadProcess` | Marketing intelligence copy |

Capability matrix: `docs/production-readiness/BOF-UOS-018-SOURCE-OF-TRUTH-MATRIX.md`.

## Unified communications + intelligence (Increment 1)

**Operational Chat** (`/operational-chat`) — human messaging, fleet-scoped, record citations.

**Operational Intelligence** (`POST /api/operational-intelligence/query`) — structured, **grounded** answers from authorized Prisma queries. No LLM in this increment; answers cite routes and state limitations when data is missing.

Shared services:

- `lib/services/operatingRecordService.ts` — tenant-scoped record resolution (includes `SETTLEMENT` as of UOS increment 1).
- `lib/operational-intelligence/operationalIntelligenceService.ts` — intent classification + LIVE queries.

## Target shared abstractions (roadmap)

1. **TenantOperatingAnchor** — `{ fleetId, recordType, recordId }` for chat, audit, intelligence.
2. **LoadProcessReadModel** — merge `load-process-intelligence` and `operating-process` APIs.
3. **DispatchEligibilityDecision** — single gate for assignment + intelligence + roster.
4. **CopilotAuthorityResolver** — LIVE facts for Copilot panels where Prisma exists.

## Security

All intelligence and chat APIs require session auth and `requireFleetAccess(fleetId)`. Cross-tenant IDs return 404/403, not foreign fleet data.

## Remaining integration gaps (prioritized)

1. Recruiting V2 activation → Prisma `Driver` (501 today).
2. Copilot still composed from demo JSON on many surfaces.
3. Payroll week processing lacks single LIVE feed.
4. GPS/telematics not connected.
5. Chat notifications written but not listed in UI.
6. Realtime sync for multi-user chat.
