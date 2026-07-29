# Public Intake Security Controls

## Current Controls

- Backend submission is disabled; no request is transmitted.
- Public forms include required field validation, email type validation, field length limits, privacy acknowledgment, and a honeypot.
- Markup/script-like input is rejected before the disabled adapter state is shown.
- No personal data is placed in URLs.
- Public intake copy excludes document uploads, CDL and medical-card data, authenticated portal records, production chat, payments, financial information, and protected government records.
- Assessment context is only added after the visitor clicks the detailed roadmap request.

## Backend Controls Required Before Launch

- Server-side validation matching or exceeding front-end validation.
- Rate limiting, bot controls, abuse monitoring, and safe error responses.
- Isolated persistence with least-privilege access and row-level controls.
- Internal notification rules with no sensitive values in subject lines, URLs, or logs.
- Reviewer role model and audit trail for status changes.
- Retention, deletion, and export process.
- Incident response owner and escalation plan.

## Explicit Non-Goals

The public intake channel is not BOF Vault, not a secure upload channel, not driver credential storage, not payment processing, not production chat, and not an authenticated portal.
