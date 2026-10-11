# BOF Electronic POD Fail-Closed Certification

Date: October 11, 2026

Branch: `release/document-control-batch2-control-plane`

Base commit: `9b4436183a86619fed37d95cad566d683ed61ceb`

Certification: **FAIL-CLOSED POD CERTIFICATION PASS**

This change is unstaged. No commit, push, deployment, or migration was performed.

## Previous behavior

`isEpodEnabled()` treated electronic POD as enabled unless `BOF_EPOD_ENABLED` was the exact string `false`.

- `false` disabled POD.
- `true` enabled POD.
- `FALSE`, an empty value, any other value, and an unset variable enabled POD.

## New behavior

Only the exact value `true` enables electronic POD. Every other value disables it, including `false`, `FALSE`, an empty value, `1`, `yes`, `TRUE`, and an unset variable.

The decision lives in `isEpodEnabled()` in `lib/services/epod/deliveryLifecycle.ts`. `assertEpodEnabled()` throws HTTP 503, `Electronic POD is disabled.`, when that helper is false. Delivery routes, photo, signature, generated POD, evidence read, proof submit, proof list, proof verify, and proof reject call that helper before a database mutation. The operational layout uses the same helper for the delivery tab. The client default, when the layout has not supplied a value, is disabled.

No POD records, historical evidence, proof rows, or settlement amounts were modified. No migration was added.

## Files modified

- `lib/services/epod/deliveryLifecycle.ts`
- `components/dispatch/EpodAvailability.tsx`
- `lib/services/epod/epodFeatureFlag.test.ts`
- `lib/services/dispatchAssignment.safety.test.ts`
- `lib/services/epod/epod.database.certification.test.ts`
- `docs/recovery/BOF_EPOD_FAIL_CLOSED_CERTIFICATION.md`

The enabled-mode database test sets `BOF_EPOD_ENABLED=true` for its own run and restores the previous value. That is required so an explicit opt-in still exercises authorization and fleet isolation.

## Tests executed

TypeScript typecheck: exit 0.

Focused tests on disposable Postgres `bof_dev` at `127.0.0.1:54329`: 27 executed, 27 passed, 0 failed. The runner did not load `.env.local`. Production Neon was not contacted.

Passed coverage:

1. Exact `true` enables POD.
2. Exact `false` disables POD and returns HTTP 503.
3. `FALSE` disables POD.
4. An unset variable disables POD.
5. An empty value disables POD.
6. `1`, `yes`, and `TRUE` disable POD.
7. Disabled delivery route returns HTTP 503.
8. Disabled photo route returns HTTP 503.
9. Disabled signature route returns HTTP 503.
10. Disabled generated POD route returns HTTP 503.
11. Disabled evidence read returns HTTP 503.
12. Disabled proof submit returns HTTP 503.
13. Disabled proof verify returns HTTP 503.
14. Disabled proof reject returns HTTP 503.
15. Disabled submit, verify, and reject return before a settlement write. Settlement status stayed `CREATED` and the stored gross amount stayed `125`.
16. With `true`, proof submit for a missing load still returns HTTP 404, and the isolated POD certification still enforces driver, fleet-admin, and outsider authorization. A duplicate photo write stored one evidence row. The settlement hold stayed in place.
17. Dispatch readiness, the driver-scoped lock, and cross-fleet assignment rejection still passed.
18. Samba observation boundary tests passed. Samba source was not modified.

Prisma validation ran in an isolated copy with no `.env.local`. Prisma reported `injected env (0) from .env.local` and a valid schema. No migration was applied.

Isolated production build in `%TEMP%\bof-safety-cert-build`: exit 0. Next.js 15.5.15 compiled and generated 262 static pages. The operational worktree was not the build output directory. Existing ESLint warnings in `LoadDeliveryScreen.tsx` were reported and were not part of this change.

## Remaining deployment blockers

This certification does not authorize deployment. Production evidence storage is still not durable. The production environment must set `BOF_EPOD_ENABLED` to the exact value `true` only when POD is intentionally turned on. Any other production value, including unset, now keeps POD off. The disabled delivery tab was not opened in a browser.

## Proposed commit file list

- `lib/services/epod/deliveryLifecycle.ts`
- `components/dispatch/EpodAvailability.tsx`
- `lib/services/epod/epodFeatureFlag.test.ts`
- `lib/services/dispatchAssignment.safety.test.ts`
- `lib/services/epod/epod.database.certification.test.ts`
- `docs/recovery/BOF_EPOD_FAIL_CLOSED_CERTIFICATION.md`
