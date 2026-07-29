# Public Intake API Contract Proposal

Status: local implementation created. Remote deployment is not applied.

## Endpoint

Supabase Edge Function: `submit-public-intake`

Expected browser endpoint after deployment:

`https://<project-ref>.functions.supabase.co/submit-public-intake`

## Request Body

- `intake_type`: one of `contact`, `demo_request`, `priority_fleet`, `assessment_roadmap`, `government_inquiry`, `aggregator_inquiry`, `driver_inquiry`
- `source_page`: public path where the request originated
- `contact`: first name, last name, email, optional phone, preferred contact method
- `organization`: organization name, role/title, audience type, fleet/network type, fleet/network size, operating regions
- `request`: requested next step, request summary, page-specific fields
- `assessment_context`: optional assessment summary for roadmap requests
- `privacy_acknowledgment`: required

## Server Requirements

- Reject protected-record language and uploads; this endpoint must accept JSON only.
- Revalidate field lengths, required fields, email format, enum values, and privacy acknowledgment.
- Apply rate limiting, honeypot/timing checks, IP/user-agent abuse controls, and alerting for spikes.
- Write to an isolated public-intake table with least-privilege access.
- Send internal notifications without exposing sensitive values in logs or URLs.
- Return a generic accepted response only after persistence and notification handling succeed.

## Response States

- `202 accepted`: stored and queued for internal review.
- `400 invalid_request`: validation failed.
- `429 rate_limited`: abuse or rate limit triggered.
- `503 unavailable`: backend temporarily unavailable.

The front-end calls this contract only when `window.BOFPublicIntakeConfig.endpoint` or `data-intake-endpoint` is configured. With no endpoint, the form remains disabled and does not transmit.
