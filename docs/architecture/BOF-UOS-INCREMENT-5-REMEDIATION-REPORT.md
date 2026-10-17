# BOF UOS Increment 5 — Security Remediation Completion Report

## Security vulnerabilities corrected

| Issue | Remediation |
|-------|-------------|
| Global `FLEET_VISIBILITY_INGEST_SECRET` allowed cross-fleet writes | Removed; **`TelematicsIngestCredential`** per fleet + provider with bcrypt `secretHash` |
| Route `fleetId` trusted without credential binding | Credential row **`fleetId` must match route**; mismatch → `403 INTEGRATION_FLEET_MISMATCH` |
| Spoofed `equipmentId` / `loadId` / `driverId` | **`resolveIngestAssociations`**: integration ignores caller IDs; session LIVE requires **TelematicsDeviceLink**; tenant checks on all IDs |
| Unknown devices ingested | Integration → **`DEVICE_NOT_REGISTERED`** without active link |
| Synthetic GPS as live by dispatch users | **`SYNTHETIC_TEST`** requires **`BOF_OPERATIONS` / `BOF_COMPLIANCE_REVIEW`**; integration always **LIVE**; synthetic skips operating events |
| GPS tables missing → HTTP 500 | **`withGpsStorage` / `GpsStorageUnavailableError`** → **503 `GPS_STORAGE_UNAVAILABLE`** on map/ingest/stops/OI TELEMATICS |
| Weak cross-table integrity | **FK** `VehicleLocationObservation.loadId` → `Load`, `driverId` → `Driver` |

## Files and services modified

- `lib/fleet-visibility/` — `errors.ts`, `ingest-auth.ts`, `ingest-credentials.ts`, `association-validation.ts`, `gps-storage.ts`, `fleet-api-response.ts`, `fleet-visibility-service.ts`, `telematics-intelligence.ts`, `fleet-visibility-ingest.security.test.ts`
- `app/api/fleet-visibility/*`, `app/api/operational-intelligence/query/route.ts`
- `lib/operational-facts/operationalFactsService.ts`
- `prisma/schema.prisma`, migrations `20261017210000_fleet_visibility_ingest_security`
- `scripts/provision-telematics-ingest-credential.ts`

## Authorization architecture

- **Integration:** `Authorization: Bearer <credentialId>.<secret>` + optional **`x-bof-telematics-signature`** (HMAC-SHA256 of raw body when `webhookSigningSecretHash` set).
- **Operator session:** Auth.js session + **`requireFleetAccess`**; LIVE ingest requires registered device link; synthetic fixtures restricted to BOF operations roles.
- **Rotation / revocation:** create new credential row; set **`revokedAt`** on old; secrets never returned from APIs (one-time provision script output only).

## Database constraints

- New table **`TelematicsIngestCredential`**
- **FK** on `VehicleLocationObservation.loadId`, `driverId`
- Prior migration **`20261017180000_fleet_visibility_gps`** unchanged (additive GPS foundation)

## Production migration status

**Not confirmed in this remediation.** Requirements:

- Read-only: `DATABASE_URL=<production> npx prisma migrate status`
- Compare `_prisma_migrations` to repo folders (especially `20261010220000`, `20261016140000`, `20261017160000`, `20261017180000`, `20261017210000`)

**Missing access in engineer workspace:** no production or local `DATABASE_URL` / `BOF_TEST_DATABASE_URL` configured (`.env.local` has no `DATABASE_URL`). Status was **not invented**.

## Isolated database test results

| Test | Result |
|------|--------|
| Unit: geofence, delivery-risk, intent, finance, requisition | **Pass** (no DB) |
| `fleet-visibility-ingest.security.test.ts` | **Skipped** (no isolated `bof_dev` URL in CI/workspace) |
| Full migrate apply on isolated DB | **Not run** (no database target) |

When `BOF_TEST_DATABASE_URL` points to localhost **`bof_dev`**, run:

```bash
npx prisma migrate deploy
node --import ./scripts/lib/ts-alias-loader.mjs --test lib/fleet-visibility/fleet-visibility-ingest.security.test.ts
```

## Cross-carrier security test evidence

Covered in `fleet-visibility-ingest.security.test.ts` (requires DB):

- Integration ingest succeeds only with device link in fleet
- `integrationFleetId` ≠ payload fleet → rejected
- Unknown device → `DEVICE_NOT_REGISTERED`
- Dispatch user cannot submit `SYNTHETIC_TEST`
- Cross-fleet equipment on synthetic path → `403`
- Credential route fleet mismatch → `403`
- HMAC signature when signing configured

## Remaining blockers

1. **Production migration ledger unverified** (needs authorized read-only URL).
2. **Isolated DB migration + security tests not executed** in this environment.
3. **Provider OAuth/polling** still out of scope (credentials are inbound webhook only).

## Proposed production migration sequence

1. Owner runs **`prisma migrate status`** on production; approves **each pending** migration by name (do not assume docs).
2. Typical order if all pending since `20260909180000`:
   - `20261010220000_epod_evidence_role_uniqueness` (index only; does not enable ePOD)
   - `20261016140000_contact_inquiry`
   - `20261017160000_contact_inquiry_management`
   - `20261017180000_fleet_visibility_gps`
   - `20261017210000_fleet_visibility_ingest_security`
3. **`prisma migrate deploy`** on production in maintenance window (or approved manual `db execute` + `migrate resolve` per runbook).
4. Provision **`TelematicsDeviceLink`** + **`TelematicsIngestCredential`** per pilot fleet (`scripts/provision-telematics-ingest-credential.ts`).
5. Deploy application commit; verify `/fleet-map`, TELEMATICS OI, dispatch unchanged.
6. **Do not** reintroduce global ingest env vars.

## Final recommendation: **CONDITIONAL GO**

**GO** to deploy **after**:

- Owner confirms production **`migrate status`**
- Isolated **`bof_dev`** runs full pending migrations + security test file green
- Owner approves exact migration list and deployment window

**Owner approval required:** production migration apply, Vercel deploy, pilot credential issuance, optional contact-inquiry migrations if still pending.
