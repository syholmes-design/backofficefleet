# Phase 3: carrier identity, FMCSA monitoring and the Preview (2026-10-17)

**Scope:** branch `claude/loving-allen-zr8loh` and its isolated Preview database only (Neon branch `bof-email-preview`). Nothing here touches production. No production migration, production environment variable or production schedule is changed.

## 1. Data model (reuses BOF's carrier structure)

BOF already models carriers as **Aggregator → CarrierGroup → Fleet**, where a fleet is the operating motor carrier BOF serves. Phase 3 adds FMCSA identity **to `Fleet`**, so there is no second carrier table. The demo carrier registry (`lib/carrier-registry.ts`) is left untouched.

| Object | Change | Purpose |
|---|---|---|
| `Fleet.usdotNumber` | new nullable column, indexed, CHECK `^[1-9][0-9]{0,7}$` | FMCSA USDOT number of the fleet's carrier |
| `Fleet.mcNumber` | new nullable column, CHECK `^(MC\|MX\|FF)[0-9]{1,8}$` | Operating-authority docket |
| `Fleet.carrierIdentityUpdatedAt` | new nullable column | When identity last changed (who/what: AuditEvent) |
| `FmcsaMonitoringRun` | new table | One row per run: trigger, status, counts, schema validation, source errors, exception list |
| `FmcsaCarrierSnapshot` | new table, append-only | **Historical FMCSA evidence** per fleet, source and run: profile, completeness, schema-validated flag, data-as-of |
| `FmcsaMonitoringResult` | new table, unique per (run, fleet) | **Monitoring result**: CLEAR / ATTENTION / CRITICAL / UNVERIFIED / NOT_CONFIGURED, with reasons, current alerts, change alerts and snapshot links. CHECK: CLEAR requires no alerts, a USDOT and at least one snapshot |
| `AuditEvent` | reused | `fleet.carrier_identity_updated`, `fmcsa.monitoring_run_started` / `_completed` / `_failed`, `fmcsa.monitoring_result`, `fmcsa.monitoring_finding_opened` |
| `SambaFinding` (findings engine) | reused | Exceptions become findings `FMCSA_MONITOR_<ALERT>` and `FMCSA_MONITOR_UNVERIFIED`, de-duplicated while open |
| `FmcsaRegulatoryVerification` | unchanged | The existing on-demand verification keeps working |

**Migration:** `prisma/migrations/20261017120000_fmcsa_carrier_monitoring/migration.sql`.
- **Purely additive:** four enums, three nullable columns on `Fleet`, three tables, indexes, foreign keys (all `ON DELETE RESTRICT`) and four CHECK constraints. There are no drops, renames, type changes or backfills, and existing rows are unaffected.
- **Verified locally** on an empty `bof_dev` database: `prisma migrate deploy` applies all 26 migrations, and `prisma migrate diff` reports no drift.

**Rollback** (Preview only, if ever needed; run in a transaction):
```sql
DROP TABLE "FmcsaMonitoringResult"; DROP TABLE "FmcsaCarrierSnapshot"; DROP TABLE "FmcsaMonitoringRun";
ALTER TABLE "Fleet" DROP CONSTRAINT "Fleet_usdotNumber_format_check", DROP CONSTRAINT "Fleet_mcNumber_format_check",
  DROP COLUMN "usdotNumber", DROP COLUMN "mcNumber", DROP COLUMN "carrierIdentityUpdatedAt";
DROP TYPE "FmcsaComplianceStatus"; DROP TYPE "FmcsaMonitoringRunStatus"; DROP TYPE "FmcsaMonitoringTrigger"; DROP TYPE "FmcsaSnapshotSource";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261017120000_fmcsa_carrier_monitoring';
```

**How it reaches the Preview database:**
- The existing guarded Preview init runs during every Preview build of this branch, and only this branch: `scripts/vercel-email-preview-init.*`.
- It refuses the production database endpoint and checks that the database holds only preview data. Then it runs `migrate deploy`, verifies there is no drift, and now also verifies the four FMCSA CHECK constraints.
- The new monitoring tables (and `SambaFinding` / `FmcsaRegulatoryVerification`) were added to its allowlist, so using the Preview doesn't block the next build.

**Production:** not applied. Before any production migration: get your approval, take a backup or a Neon branch, and remove the Preview init hook. The production steps are in §5.

## 2. Monitoring workflow

`lib/services/fmcsa/monitoringService.ts`, `runFmcsaMonitoring()`:

1. **Scope.** A **manual** run covers the fleets where the user holds `BOF_OPERATIONS`, `BOF_COMPLIANCE_REVIEW` or `FLEET_ADMIN`. A **scheduled** run covers every active fleet.
2. **Schema validation.** It probes each dataset (Company Census `az4n-8mr2`, Motus Carrier `inys-ebih`, OOS Orders `p2mt-9ige`) and reads the live field list (`X-SODA2-Fields`) and the data age (`Last-Modified`). Every field BOF uses must resolve to exactly one live column, and the data must be at most 72 h old. Otherwise the dataset is **not trusted**.
3. **Open-data fetch.** It reads only the validated columns. It records per-carrier coverage: census FOUND / NOT_FOUND / ERROR, Motus FOUND / NOT_FOUND / ERROR, and whether the OOS query succeeded.
4. **QCMobile**, when configured. It looks up the live carrier and checks for six required elements.
5. **Snapshots** are stored for each source.
6. **Status rules** (`complianceStatus.ts`, fail-closed):
   - Alerts from **any** source set the status: CRITICAL, or ATTENTION for HIGH/MEDIUM alerts. Alerts are never suppressed, even when the evidence is incomplete.
   - **CLEAR only if** at least one source is complete, meaning one of:
     - QCMobile found the carrier and returned all required elements; or
     - open data has trusted schemas, census and Motus found, the OOS query succeeded, USDOT status "A", and authority and insurance reported.
   - **Everything else is UNVERIFIED**, with the reasons listed: no key, carrier not found, query failed, schema unresolved, stale or unknown freshness, missing fields.
   - No USDOT gives NOT_CONFIGURED.
   - Change detection compares against the last *complete* snapshot.
7. **Exceptions.** Every non-CLEAR fleet goes on the run's exception list. Alerts above LOW and UNVERIFIED results open findings, and everything is audited.
8. **Display-time guards.**
   - A CLEAR older than 36 h (`FMCSA_MONITORING_MAX_RESULT_AGE_HOURS`) is shown as UNVERIFIED.
   - A result recorded for a previous USDOT is never shown for a new one.

**Scheduling (built, not activated):**
- `POST /api/fmcsa/monitoring/run` with `Authorization: Bearer <FMCSA_MONITORING_TOKEN or CRON_SECRET>` runs a SCHEDULED pass.
- It is accepted only when `FMCSA_MONITORING_SCHEDULE_ENABLED=true`, and **refused in code whenever `VERCEL_ENV=production`**. Enabling production scheduling will take a deliberate code change.
- No cron entry was added to `vercel.json`.

## 3. Interfaces

| Path | Who | What |
|---|---|---|
| `/carrier-monitoring` (nav: Carrier Monitoring) | signed-in users | Fleets with USDOT/MC, status, alerts and reasons; schema validation; source errors; "Run check now"; identity editing |
| `GET /api/fmcsa/monitoring` | signed-in | Overview of the user's fleets plus the latest run report |
| `POST /api/fmcsa/monitoring/run` | run roles, or token (scheduled) | Start a run |
| `GET /api/fmcsa/monitoring/runs/:id` | signed-in | Exception report for the user's fleets |
| `PUT /api/fmcsa/carrier-identity` | `FLEET_ADMIN`, `BOF_OPERATIONS`, `BOF_COMPLIANCE_REVIEW` on that fleet | Set USDOT/MC (validated, audited) |
| `GET /api/fmcsa/schema` | admin or ops roles | Probe live dataset schemas without a run |
| `scripts/fmcsa-activation-check.ts <USDOT>` | anyone with network | Configuration (presence only), live schema report, QCMobile elements returned, coverage, decision |

## 4. Testing on the Preview (after the build succeeds)

1. Sign in as `fleet-a-admin@preview.bof.invalid` and open **Carrier Monitoring**.
2. Enter a USDOT number for "Fleet A". Any real carrier's public USDOT works, because the data is public, but the Preview fleet is not that carrier.
3. Click **Run check now**. Expected without a QCMobile key: either a CLEAR from open data (if the live schemas validate) or UNVERIFIED with the exact schema or freshness issues listed. **This is the real schema validation against the live datasets.**
4. Optional: add the QCMobile key (Preview scope, Sensitive) with `BOF_FMCSA_PROVIDER=qcmobile`, redeploy, and re-run.
5. If schema validation fails, the page lists the live fields. Update the alias lists in `lib/services/fmcsa/openData/datasets.ts` to match.

Network note: this sandbox cannot reach FMCSA or Vercel hosts, so the **live** schema check has not been executed yet. Vercel can reach them.

## 5. Before any production use (each needs your approval)

1. Validate the live schemas on the Preview (step 3) and fix any aliases.
2. Remove the Preview init hook from `package.json` `build` and delete `scripts/vercel-email-preview-init.*`.
3. Merge.
4. Back up production (Neon branch), then run `prisma migrate deploy`. The migration is additive; review it first.
5. Enter real fleets' USDOT/MC numbers.
6. Decide on scheduling. Production scheduling needs a code change to `schedulingState()` and a cron entry.

## 6. Preview remediation (2026-10-17): Motus schema

**Live finding** (Preview test, J.B. Hunt USDOT 80806 / MC135797): Motus Carrier – All With History (`inys-ebih`) failed validation. The fields BOF expected (`commonAuthority`, `bipdRequired`) were missing; Census and OOS passed; QCMobile was not configured. The carrier was correctly shown as Unverified.

**Cause.** BOF mapped Motus to the legacy Licensing & Insurance layout, which had one column per authority type (`COMMON_STAT`, `BIPD_REQ`). Motus has a different model:
- **One row per operating authority**, with `OP_AUTH_TYPE` and `OP_AUTH_STATUS`.
- Insurance as `MIN_COV_AMOUNT` (minimum BI&PD coverage required) and `BIPD_FILE` (BI&PD coverage on file).

These column names come from FMCSA's dataset pages on data.transportation.gov. This environment could not read FMCSA's metadata directly: the sandbox is blocked, and GitHub Actions is unavailable because of an account billing lock.

**Fix: field names are no longer guessed.**
- **Mapping from official metadata.** Schema validation reads FMCSA's official column metadata (`/api/views/<id>.json`). It matches each authority and insurance field by its official column name, then uses the API field name FMCSA assigned. Socrata API names can differ from display names; one Motus dataset exposes `OP_AUTH_TYPE` as `mod_col_1`.
- **No fallback for authority and insurance fields.** They need this metadata confirmation. A field-name match alone is not accepted, and the API must also serve the column.
- **Authority from the per-authority rows.** Common, contract and broker authority are derived from those rows. Only plainly worded values are accepted (e.g. COMMON, BROKER, ACTIVE, INACTIVE). Any other value stays **unrecognized**: the carrier remains Unverified, and the run lists the values it saw. This works without FMCSA's data dictionary PDF, which could not be read from here.
- **Insurance comparison.** Insurance is taken from active authority rows and compared only with itself, in FMCSA's published units. If the two figures differ by about 1000×, they are treated as different units: Unverified, not an alert.
- **Inactive authority alert.** It now fires only when the carrier has **no** active for-hire authority. Old inactive authorities sitting beside an active one were producing false alerts.
- **Fallback if Motus cannot supply the evidence:** QCMobile (authority and insurance elements), which needs the free webKey.
- **Identity form.** Validation errors now appear beside the affected field. The same rules run in the browser and the API, and the API returns the `field` with a 422.
- **Regression tests.** `lib/services/fmcsa/openData/motusSchema.test.ts`, plus updated suites.
