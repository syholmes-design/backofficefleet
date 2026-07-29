# Public Intake Security Review

Status: local implementation review only. This is not penetration testing.

## Anonymous Access

Anonymous users have no direct table access. Public writes are designed to go through `submit-public-intake` only.

## RLS And Grants

The migration enables RLS on `intake.public_intakes`, `intake.intake_events`, `intake.intake_notes`, and `intake.intake_assignments`. Public grants are revoked. Authenticated reviewer policies require future BOF role claims.

## Edge Function Authorization

`submit-public-intake` is configured with `verify_jwt = false` because it is a public lead-intake endpoint. It must enforce origin, validation, spam controls, and service-role server-side writes.

## Validation

The function validates submission type, required fields, email format, field lengths, per-type fields, privacy acknowledgment, assessment-summary shape, source path, and unsafe markup/script patterns.

## Origin And CORS

Requests are allowed only when the request origin matches `ALLOWED_ORIGINS`. No wildcard production origin is committed.

## Spam And Abuse Controls

- Honeypot field.
- Minimum form-completion time.
- In-memory per-IP rate limit.
- Request fingerprint duplicate suppression.
- Server-side field length limits.
- Optional Turnstile verification when `TURNSTILE_SECRET_KEY` is configured.

## Logging And Error Leakage

Responses do not include database IDs, SQL errors, stack traces, internal queue details, recipient addresses, or existing-contact information.

## Notification Failure

Notification is not treated as the system of record. If no provider is configured, the function records a `notification_unconfigured` event after storing the intake.

## Internal Access

The internal prototype remains synthetic/noindex until BOF auth roles are approved and tested.

## Retention And Cleanup

No destructive automated deletion is implemented. A local cleanup script proposal is included for records explicitly marked `metadata.test_submission = true`.

## Open Security Prerequisites

- Confirm development Supabase project.
- Repair or reinstall local Supabase CLI.
- Provide function secrets through Supabase secret management.
- Review RLS with owner/backend reviewer.
- Approve allowed production and development origins.
- Approve notification provider and recipient.
- Approve retention period.
