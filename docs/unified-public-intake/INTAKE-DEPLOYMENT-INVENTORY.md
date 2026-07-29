# Deployment Inventory

## Front-End Files

- `Website/assets/js/public-intake.js`
- `Website/assets/css/styles.css`
- `Website/contact/index.html`
- `Website/book-a-demo/index.html`
- `Website/priority-fleet-program/index.html`
- `Website/assessment/index.html`
- `Website/assets/js/wave3-assessment.js`
- `Website/government/index.html`
- `Website/aggregators/index.html`
- `Website/drivers/index.html`
- `Website/bof-vault/index.html`
- `Website/privacy/index.html`
- `Website/internal-intake-review/index.html`

## Routes

- `/contact/`
- `/book-a-demo/`
- `/priority-fleet-program/`
- `/assessment/`
- `/government/`
- `/aggregators/`
- `/drivers/`
- `/bof-vault/`
- `/internal-intake-review/` noindex prototype, not linked in navigation

## Backend Files

- `supabase/config.toml`
- `supabase/migrations/202607290001_public_intake_schema.sql`
- `supabase/functions/submit-public-intake/index.ts`
- `supabase/functions/submit-public-intake/.env.example`
- `supabase/functions/submit-public-intake/README.md`
- `scripts/cleanup-public-intake-test-records.sql`

No remote migration was applied and no function was deployed.
