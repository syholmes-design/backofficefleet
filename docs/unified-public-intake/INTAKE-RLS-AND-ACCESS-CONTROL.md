# Intake RLS And Access Control

## Policy Matrix

| Actor | `public_intakes` | `intake_events` | `intake_notes` | `intake_assignments` |
| --- | --- | --- | --- | --- |
| Anonymous browser user | No direct access | No direct access | No direct access | No direct access |
| Public form | Edge Function only | Edge Function only | No access | No access |
| Edge Function service role | Insert/read as needed | Insert/read as needed | No routine use | No routine use |
| Authenticated non-reviewer | Denied by RLS | Denied by RLS | Denied by RLS | Denied by RLS |
| Authenticated BOF reviewer role | Read | Read | Read/insert | Read |
| Authenticated BOF admin role | Read | Read | Read/insert | Read |

## Implemented Migration Rules

- RLS is enabled on every `intake` table.
- Public grants are revoked from the `intake` schema, tables, and functions.
- `service_role` receives schema usage, table access, and function execution for server-side function use.
- Authenticated read policies are limited to JWT `app_metadata.roles` containing `bof_intake_reviewer` or `bof_admin`.
- Public anonymous users have no table policies and no direct table grants.

## Current Internal Review Status

The repository does not yet prove an approved BOF internal auth role model. The internal review page remains a noindex prototype and is not connected to real intake data.

## Service Role Boundary

The service-role key must exist only as a Supabase function secret or equivalent server-side secret. It must never appear in browser code, static files, screenshots, logs, or committed docs.
