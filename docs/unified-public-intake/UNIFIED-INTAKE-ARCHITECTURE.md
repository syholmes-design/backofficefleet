# Unified Intake Architecture

## Decision

This implementation prepares a shared front-end public intake system and a disabled/mock-safe backend adapter. Real persistence is not enabled because no approved secure public-intake backend, credentials, environment variables, RLS policy, or deployment target is confirmed in this worktree.

## Front-End

- `Website/assets/js/public-intake.js` renders configuration-driven public intake forms.
- Shared field logic covers contact, organization, fleet profile, audience, request details, preferred contact method, privacy acknowledgment, validation, and submission feedback.
- Page-specific configurations preserve route context.
- Personal information is not placed in URL parameters.
- Assessment integration passes only summary context after the visitor opts into follow-up.

## Adapter

The adapter validates locally and then reports that online submission is not enabled. It does not fake success and does not transmit data.

Future adapter contract: `POST /api/public-intake`

## Backend Recommendation

Preferred future backend: a server-side endpoint that performs validation, rate limiting, spam checks, RLS-protected insert, internal notification, and safe visitor confirmation. Supabase can be considered only after target project, environment, schema isolation, and RLS are approved.
