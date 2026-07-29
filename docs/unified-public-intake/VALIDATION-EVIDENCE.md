# Validation Evidence

## Automated Checks

- `node --check Website/assets/js/public-intake.js`
- `node --check Website/assets/js/wave3-assessment.js`
- `git diff --check`
- Playwright route and interaction pass against `http://127.0.0.1:8820`

## Browser Routes Checked

- `/contact/`
- `/book-a-demo/`
- `/priority-fleet-program/`
- `/assessment/?type=government`
- `/government/`
- `/aggregators/`
- `/drivers/`
- `/bof-vault/`
- `/privacy/`
- `/internal-intake-review/`

## Interaction States Checked

- Required-field validation.
- Markup/script-like input rejection.
- Privacy acknowledgment requirement.
- Backend-disabled submission message.
- Assessment-roadmap request with assessment summary context.
- Internal review prototype `noindex,nofollow` meta.
- Desktop and mobile rendering.

## Screenshots

Stored in `docs/unified-public-intake/screenshots/owner-review/`.

- `contact-unified-intake.png`
- `demo-request-unified-intake.png`
- `priority-fleet-unified-intake.png`
- `assessment-roadmap-intake.png`
- `government-intake.png`
- `aggregator-intake.png`
- `driver-intake.png`
- `bof-vault-intake.png`
- `privacy-disclosure.png`
- `validation-error.png`
- `submission-unavailable.png`
- `mobile-intake.png`
- `internal-intake-queue-prototype.png`

No submission-success screenshot exists because the backend is intentionally disabled.
