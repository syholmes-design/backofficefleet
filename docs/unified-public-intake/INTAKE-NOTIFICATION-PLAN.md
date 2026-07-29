# Public Intake Notification Plan

Status: adapter prepared but no provider active.

## Routing

- Contact inquiry: BOF business review.
- Demo request: demo owner.
- Priority Fleet consideration: program review.
- Assessment roadmap request: readiness review.
- Government inquiry: preparedness review.
- Aggregator inquiry: network readiness review.
- Driver or BOF Vault inquiry: support routing with protected-record screening.

## Notification Requirements

- Send internal notification only after the record is accepted by the server.
- Keep sensitive content out of subject lines and URLs.
- Include intake type, source page, organization, requested next step, and reviewer link.
- Redact or summarize request details if notification goes to email.
- Add retry handling and dead-letter review for notification failures.
- If no provider is configured, the Edge Function stores the intake and records `notification_unconfigured`.

## Visitor Confirmation

Visitor confirmation must only appear after the backend has stored the request and queued the notification. The current front-end intentionally has no success state.
