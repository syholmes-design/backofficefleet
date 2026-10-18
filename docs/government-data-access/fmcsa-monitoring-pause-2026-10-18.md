# FMCSA Carrier Monitoring: development paused (2026-10-18)

**Status:** paused by owner decision to prioritize another BOF assignment. No further FMCSA changes, no production deployment, scheduled monitoring stays disabled, and no authentication credentials were changed.

## Preserved state
| Item | Value |
|---|---|
| Branch | `claude/loving-allen-zr8loh` (pushed) |
| Last FMCSA commit | `1d4830a11b42c535ea3de8849339e0e3e230ac32`: "map Motus authority/insurance from official metadata" (on `origin`) |
| Preview deployment of that commit | Vercel `dpl_ZYzc2u5sYZuGEWnMvXMtUQdDR3wE` (bof-web, Preview), GitHub deployment 7141572682, build **success**, https://bof-ql1t9gnpo-syholmes-5004s-projects.vercel.app |
| Preview database | Neon branch `bof-email-preview` (isolated). Migration `20261017120000_fmcsa_carrier_monitoring` applied by the guarded Preview init in an earlier build |
| Production | Untouched: no merge, no migration, no environment variable changes |
| Scheduling | Off. `FMCSA_MONITORING_SCHEDULE_ENABLED` unset; scheduled runs are refused in production by code; no cron entry |

## Known open issues

### 1. Preview login rejected (owner-observed, 2026-10-17/18)
- **What happens:** the updated Preview rejects `fleet-a-admin@preview.bof.invalid`. That login worked on earlier Preview deployments of this branch.
- **Status:** **not investigated.** Diagnosis was deferred by the pause, and no auth code or credentials were changed in response.
- **Commits since login last worked:** `1d4830a1` changed FMCSA monitoring files, the carrier identity form, CSS and tests only. It did not touch `auth.ts`, `lib/auth/*`, the Preview init or the seed. This suggests the cause is outside that commit, but **this is not verified.**
- **Candidates to check on resume (unverified):**
  - which Preview URL was used: each deployment has its own URL, and sign-in redirects depend on the host;
  - whether `EMAIL_PREVIEW_LOGIN_PASSWORD` is still set and branch-scoped for this deployment. The Preview init seeds the password from it at build time; if it is absent, the accounts get random passwords;
  - the Vercel runtime logs for the `POST /api/auth/callback/credentials` request;
  - the build log for the `[email-preview-init]` lines (seeded accounts; password set or not).

### 2. Live FMCSA Motus schema verification: incomplete
- **First live Preview run** (J.B. Hunt, USDOT 80806 / MC135797): Census `az4n-8mr2` PASS, OOS Orders `p2mt-9ige` PASS. Motus Carrier `inys-ebih` FAIL, because the legacy fields `commonAuthority` / `bipdRequired` do not exist in the Motus layout. QCMobile not configured. The carrier was correctly classified **Unverified**.
- **Fix in `1d4830a1`:**
  - resolves Motus fields from FMCSA's official column metadata (`OP_AUTH_TYPE`, `OP_AUTH_STATUS`, `MIN_COV_AMOUNT`, `BIPD_FILE`);
  - derives authority from the per-authority rows;
  - stays fail-closed on unrecognized values and on insurance figures in inconsistent units.
- **Not yet verified against live data.** The build environment cannot reach data.transportation.gov. GitHub Actions is unavailable (account billing lock). The post-fix Preview run did not happen because of the login issue.
- **Still unconfirmed:**
  - that the official column names match the live metadata;
  - the actual value vocabulary of `OP_AUTH_TYPE` / `OP_AUTH_STATUS` (FMCSA's Motus data dictionary PDF was not readable);
  - the units of `MIN_COV_AMOUNT` and `BIPD_FILE`.

## Steps to resume testing (in order)
1. **Restore Preview sign-in** (needs owner approval before any auth change):
   1. Confirm the Preview URL in use.
   2. Confirm `EMAIL_PREVIEW_LOGIN_PASSWORD` (Preview, branch `claude/loving-allen-zr8loh`) is present.
   3. Read the build log `[email-preview-init]` lines and the runtime log for the credentials POST.
   4. Fix only the identified cause.
2. **Run a live check:** sign in as `fleet-a-admin@preview.bof.invalid` → **Carrier Monitoring** → confirm Fleet A identity USDOT 80806 / MC135797 → **Run check now**.
3. **Record the schema panel results:**
   - for Motus `inys-ebih`: OK/FAIL, the "Mapped:" line (which column each field resolved to, and whether by official metadata);
   - if it fails, the "FMCSA official columns" list;
   - the freshness (age) of all three datasets.
4. **Record the Findings column:** any "Unrecognized OP_AUTH_TYPE / OP_AUTH_STATUS value(s)" and any "different units" insurance note. Optionally download FMCSA's "Motus Operating Authority Data Dictionary" PDF from the dataset page.
5. **Code change if needed:** add only values or units confirmed by step 3/4 or the dictionary to `lib/services/fmcsa/openData/carrierSync.ts` (`classifyAuthorityType` / `classifyAuthorityStatus`) or to `datasets.ts`, with regression tests. Then `npm run test:fmcsa-monitoring`, `npm run test:fmcsa-monitoring:db` (local `bof_dev`), typecheck, lint and build. Push to the branch for a Preview build only.
6. **Re-run step 2:** expect CLEAR for J.B. Hunt only if every dataset is trusted and every value is recognized; otherwise Unverified with reasons.
7. **Optional:** obtain the free QCMobile webKey and add `FMCSA_QCMOBILE_WEBKEY` + `BOF_FMCSA_PROVIDER=qcmobile` (Preview scope, Sensitive) as a second source.
8. **Still out of scope until approved:** production migration and merge, removing the Preview init hook, scheduled monitoring.

## Reference
- Implementation and migration notes: [`phase3-preview-implementation.md`](phase3-preview-implementation.md) (§6 covers the Motus remediation)
- Activation script: `scripts/fmcsa-activation-check.ts <USDOT>` (prints the live schema, official columns, Motus rows and the decision)
