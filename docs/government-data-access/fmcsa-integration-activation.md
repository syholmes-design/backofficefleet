# FMCSA integrations: activation readiness (2026-10-17)

> **Phase 3 update:** R1–R3 below are now built on the development branch, and the Preview database will receive them on the next Preview build. Open-data schemas are validated live before results are trusted. See [`phase3-preview-implementation.md`](phase3-preview-implementation.md).

## 1. QCMobile (live carrier lookup): code verified, needs your key

**What exists** (`lib/services/fmcsa/`):
- **Provider and fallbacks:** the QCMobile provider sits behind a provider switch, with fixture and "unavailable" fallbacks.
- **Verification service and access:** role-gated (`FMCSA_VERIFY_ROLES`), with fleet tenancy, an audit event per lookup, and a CONFLICT result that opens an operating exception.
- **Storage:** results are persisted in `FmcsaRegulatoryVerification` (migration `20260919220000`), with cache and staleness handling.
- **Interfaces:**
  - UI panel: `components/carriers/FmcsaVerificationPanel.tsx`
  - API route: `app/api/carriers/fmcsa-verification`
  - The findings engine (`lib/services/samba/`) turns conflicts and stale evidence into findings.
- **Key handling:** the webKey is sent as a query parameter, as FMCSA requires. It is never stored, returned in results or written to audit records; only the path is recorded.

**Fixes made in this round** (unit tested):
- An unknown USDOT returns HTTP 200 with an empty `content`. BOF now records that as NOT_FOUND instead of a malformed-response error.
- HTTP 403 is now treated as a rejected key, like 401.
- The out-of-service date is now also read from `oosDate`, the documented QCMobile element name.
- New `qcMobileCarrierProfile()` reads the monitoring fields QCMobile provides:
  - USDOT status and authority status (common, contract, broker)
  - required BIPD insurance and BIPD on file (converted from thousands of dollars)
  - safety rating, power units, drivers, and the MCS-150 overdue flag

**To activate (Preview first; production only with your approval):**
1. You: sign in at mobile.fmcsa.dot.gov with Login.gov → My WebKeys → create a key. Do not paste it into chat.
2. You: in Vercel (bof-web), add these as **Sensitive** variables, Preview scope only:
   - `FMCSA_QCMOBILE_WEBKEY` = the key
   - `BOF_FMCSA_PROVIDER` = `qcmobile`
   - `BOF_FMCSA_CACHE_STALE_AFTER_MS` = `86400000` (24 h; recommended, because cached results never expire otherwise)
3. Check from any machine with network access:
   `npx --yes tsx scripts/fmcsa-activation-check.ts <USDOT>`. It reports whether each variable is set, without printing its value, and runs one lookup per source.

**Remaining technical requirements before QCMobile has real operational value:**
- **R1. No real carrier record to compare against.** Verification compares FMCSA against the static `DEMO_REFERENCE` carrier registry (`lib/carrier-registry.ts`). Affiliated carriers in the database (`Fleet` / `CarrierGroup`) have **no USDOT or MC field**. Fix: add a carrier identity (USDOT, MC/docket) to each fleet. This needs a migration, which needs your approval before it touches any database.
- **R2. Monitoring snapshots are not stored.** New table `FmcsaCarrierSnapshot` (one row per carrier per sync) plus `CarrierAlert` findings routed into the existing findings engine. Also a migration.
- **R3. Scheduled sync.** A daily job: a Vercel cron or the existing email-sync pattern, using a bearer-token route.
- **R4. QCMobile availability is unconfirmed.** There is an undated "service down" notice. Open data (section 2) is the fallback, and the monitoring rules work on either source.
- The sandbox cannot reach FMCSA hosts, so **no live call has been made**. Field names are from FMCSA's element list and must be confirmed with the activation check.

## 2. FMCSA open data (carrier safety & compliance monitoring): built, not yet scheduled

New: `lib/services/fmcsa/openData/` (read-only, public data, no carrier authorization needed).

| Dataset | Id | Use |
|---|---|---|
| Company Census File | `az4n-8mr2` | Identity, USDOT status, power units, drivers, MCS-150 date (daily) |
| Motus Carrier – All With History | `inys-ebih` | Authority status, BIPD required / on file (daily, post-Motus) |
| Motus Carrier – daily changes | `nakq-58th` | Incremental sync (configured; not yet used) |
| Out of Service Orders | `p2mt-9ige` | Active OOS orders (daily) |

- **Licensing and insurance moved to Motus on 2026-05-14.** The legacy L&I datasets (ActPendInsur `qh9u-swkp`, Revocation `sa6p-acbp`) are frozen and are deliberately not used.
- **`sodaClient.ts`:** read-only Socrata client.
  - The optional `FMCSA_SOCRATA_APP_TOKEN` is sent only as the `X-App-Token` header.
  - Lookup queries accept digits only, so they cannot be used to inject queries.
  - Timeouts and rate limits return clear error codes.
- **`carrierSync.ts`:** fetches by USDOT in batches of 100.
  - Merges census, Motus and OOS-order data into one `FmcsaCarrierProfile`.
  - Reports outages instead of hiding them.
  - Records the columns each dataset actually returned.
- **Unverified column names:** the dataset ids are confirmed, but the column names come from secondary sources, so they are read through alias lists. The activation check prints the real columns, and `datasets.ts` gets corrected from that output.
- **`carrierMonitoring.ts`:** rules that work the same on either source.
  - **Current-state alerts:**
    - not allowed to operate
    - active OOS order
    - inactive USDOT
    - inactive or revoked authority
    - BIPD insurance below required
    - Unsatisfactory or Conditional safety rating
    - MCS-150 more than 24 months old
  - **Change alerts:** permission to operate, authority status, safety rating, legal name, a ±50% change in power units.
  - **Missing data never raises an alert.**
- **Tests:** `npm run test:fmcsa-monitoring` (21 tests).

**Not yet built** (needs R1–R3 above): saved snapshots, the daily schedule, findings in the UI, and inspection or crash trends (SMS input datasets `rbkj-cgst`, `8mt8-2mdr`, `4wxs-vbns`).
