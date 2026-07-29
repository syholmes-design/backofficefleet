# Public Intake Privacy and Retention Notes

## Current State

The front-end validates public-intake fields and shows a backend-required message. No public intake is sent to BOF from this worktree.

## Session Draft Behavior

The front-end may use same-browser session storage to remember basic contact, organization, and fleet context during the visitor's current browser session. This reduces repeated typing across intake routes. It is local to the visitor's device and should not be used for sensitive information.

## Future Retention Decision

Before enabling a backend, BOF should approve:

- How long public-intake records are retained.
- Who may review, route, export, close, delete, or annotate records.
- Whether assessment summaries have a different retention period.
- Whether spam/rejected records are retained or immediately purged.
- How visitor access, deletion, or correction requests are handled.

## Privacy Copy Updated

`Website/privacy/index.html` now describes the unified public-intake fields, assessment roadmap context, local session draft behavior, backend-disabled state, protected-record exclusions, and retention proposal.
