# Supabase Environment Audit

## Repository State

- Approved source commit: `ec17c3084136a6e5b865a6872036052cad545639`.
- Backend worktree: `C:\Users\syhol\BOF-public-intake-supabase`.
- Branch: `codex/public-intake-supabase`.
- Existing Supabase folder existed before this task with a public demo dataset SQL file, seed file, README, and export script.
- No existing `supabase/config.toml`, `supabase/migrations`, or `supabase/functions` directory existed before this backend pass.

## Existing Supabase Artifacts

- `supabase/README.md`: public operations dataset setup notes.
- `supabase/bof_mvp_schema.sql`: creates `public.bof_public_operations_dataset` for public demo data.
- `supabase/bof_public_operations_dataset_seed.generated.sql`: seed data for public demo dataset.
- `supabase/export-bof-dataset-seed.ps1`: local export helper.
- `Website/assets/js/bof-supabase-config.js`: browser-safe demo dataset config with project URL and publishable key.
- `Website/assets/js/bof-data-loader.js`: public demo data loader with local JSON fallback.

## Missing Before This Pass

- Supabase project link/config.
- Versioned migrations folder.
- Edge Functions folder.
- Public-intake schema.
- Public-intake RLS policies.
- Public-intake Edge Function.
- Intake-specific environment templates.
- Approved function secrets.
- Approved allowed origins.
- Notification provider credentials.

## Local Environment

- Supabase CLI shim was found and reports version `2.109.1`.
- CLI authentication is not available: access token is missing.
- Some local CLI commands are blocked because the installed shim cannot find the paired `supabase-go` binary.
- Docker engine is available.
- Local Supabase services were not started or reset because the CLI installation is incomplete.

## Remote Environment

- No Supabase project reference is configured in `supabase/config.toml`.
- No remote project was linked.
- No remote migrations were applied.
- Remote migration application is not currently permitted because project reference, CLI authentication, secrets, allowed origins, backup/rollback path, and owner approval are not all confirmed.

## Safe To Reuse

- Existing public operations dataset files may remain untouched.
- Existing browser-safe public Supabase config may remain for public demo data only.
- Existing local frontend intake renderer can be connected to a configured Edge Function endpoint.

## Must Remain Isolated

- MG3 document tables.
- Sensitive document upload paths.
- Authenticated fleet records.
- Production chat and message attachments.
- Payments, banking, financial records, CDL, medical-card, insurance files, BOL/POD files, and protected government records.

## Secrets Handling

No secret values were printed or committed. Required values must be supplied through Supabase function secrets or deployment environment configuration.
