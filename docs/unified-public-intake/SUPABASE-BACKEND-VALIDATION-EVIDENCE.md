# Supabase Backend Validation Evidence

## Automated Checks Run

- `node --check Website/assets/js/public-intake.js`
- `node Website/tools/validate-public-intake-backend.js`
- `git diff --check`
- Changed-file secret scan excluding validator regex literals
- Playwright screenshot and frontend interaction pass against `http://127.0.0.1:8830`

## Unavailable Checks

- Supabase local migration apply: unavailable because the installed Supabase CLI shim cannot find `supabase-go`.
- Supabase database lint: unavailable for the same CLI reason.
- Edge Function type check: unavailable because `deno` is not installed.
- SQL parser validation with `psql`: unavailable because `psql` is not installed.
- Remote end-to-end proof: not attempted because project link, CLI auth, secrets, allowed origins, and owner approval are not all confirmed.

## Frontend States Checked

- Configured endpoint ready state on contact, demo, Priority Fleet, assessment roadmap, government, aggregator, and driver routes.
- Required-field validation error.
- Submission pending state.
- Backend unavailable state.
- Mobile configured state.
- Noindex internal review/auth-required prototype.

## Screenshots

Stored in `docs/unified-public-intake/screenshots/supabase-backend-review/`.

- `contact-submission-ready.png`
- `demo-request-submission-ready.png`
- `priority-fleet-submission-ready.png`
- `assessment-roadmap-submission-ready.png`
- `government-submission-ready.png`
- `aggregator-submission-ready.png`
- `driver-submission-ready.png`
- `submission-pending.png`
- `validation-error.png`
- `backend-unavailable.png`
- `mobile-submission.png`
- `internal-review-auth-required.png`

No `submission-success-reference.png`, `rate-limit-error.png`, or `internal-intake-record.png` screenshot was created because no real Supabase insert or live backend runtime occurred in this worktree.
