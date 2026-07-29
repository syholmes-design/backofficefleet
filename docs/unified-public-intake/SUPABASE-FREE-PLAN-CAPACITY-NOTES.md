# Supabase Free Plan Capacity Notes

## Design Choices

The intake schema is intentionally small:

- No file storage.
- No raw request body storage.
- No full browser fingerprint.
- No full assessment-answer storage.
- Minimal event rows.
- A small set of workflow indexes.
- No polling-heavy dashboard.
- No scheduled jobs.

## Approximate Row Sizes

These are planning estimates only and should be measured after local or development-project testing.

- Average `public_intakes` row: 3 KB to 8 KB depending on request summary and assessment context.
- Average `intake_events` row: 0.5 KB to 1.5 KB.
- Typical successful intake: one intake row plus two event rows, approximately 4 KB to 11 KB.
- Test-only records marked `metadata.test_submission = true` can be removed manually with the cleanup script after owner approval.

## Upgrade Signals

Consider upgrading only if:

- Intake volume becomes materially higher than manual review can support.
- Authenticated internal review needs more users or audit depth.
- Notification logging grows beyond lightweight events.
- Storage needs expand into uploads, which is outside this public-intake scope.
- Production monitoring shows database, function, or egress limits being approached.

Do not claim exact capacity until actual test rows are measured in the approved development project.
