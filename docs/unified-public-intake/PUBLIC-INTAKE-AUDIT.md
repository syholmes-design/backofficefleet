# Public Intake Audit

Date: July 28, 2026
Worktree: `C:\Users\syhol\BOF-unified-public-intake`
Base commit: `9494c83c39dddd5c1c4db02c47f40bec9d52ff29`

## Infrastructure Summary

- `/contact/`, `/book-a-demo/`, and `/priority-fleet-program/` use `data-wave4-form` and `Website/assets/js/site.js` for browser validation only. These forms do not transmit data.
- `/assessment/` uses `Website/assets/js/wave3-assessment.js` for in-browser assessment state and a preliminary result. The current “roadmap” CTA explicitly does not transmit personal data.
- `/scenario-walkthrough/` is a legacy assessment-style form posting to `Website/scenario-walkthrough/submit.php`.
- `Website/scenario-walkthrough/submit.php` uses PHP `mail()` with hard-coded recipient/from values, JSON responses, length limits, honeypot, and minimum/maximum form age checks.
- Supabase artifacts exist: `supabase/README.md`, `supabase/bof_mvp_schema.sql`, `Website/assets/js/bof-supabase-config.js`, and `Website/assets/js/bof-data-loader.js`.
- No `package.json`, serverless config, CRM config, approved email-service config, or environment-variable loader was found in this static site root.
- No analytics tags or active CRM tracking events were found for public intake forms.

## Form Inventory

| Route | Purpose | Fields | Validation | Current submission behavior | Current data destination | Privacy language | Duplicated fields | Audience context | Assessment context | Recommended unified submission type | Backend dependency | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/contact/` | General contact and routing inquiry | name, organization, email, phone, inquiry type, message | HTML required/email plus `site.js` local check | Prevents default submit; validates and says no data transmitted | None | Privacy Policy link and sensitive-data warning | name/org/email/phone repeated on other forms | Inquiry type radio group | None | `contact`, with routing category derived from inquiry type | Required for real submission | Low while disabled; medium if wired without backend controls |
| `/book-a-demo/` | Demo request | name, organization, email, fleet type, interest checkboxes, message | HTML required/email plus `site.js` local check | Prevents default submit; validates and says no data transmitted | None | Privacy Policy link and sensitive-data warning | name/org/email repeated | fleet type and interest areas | None | `demo_request` | Required for real submission | Low while disabled; medium if wired without backend controls |
| `/priority-fleet-program/` | Priority Fleet consideration | name, organization, email, fleet type, message | HTML required/email plus `site.js` local check | Prevents default submit; validates and says no data transmitted | None | Privacy Policy link and sensitive-data warning | name/org/email/fleet type repeated | fleet type | None | `priority_fleet` | Required for real submission | Low while disabled; medium if wired without qualification/routing controls |
| `/assessment/` | Preliminary readiness assessment and roadmap request | assessment answers in browser memory; no contact fields currently | JS-controlled answer selection | Shows preliminary result; roadmap CTA displays non-transmission note | None | Assessment says preliminary result appears before follow-up; no current roadmap intake disclosure | N/A | selected assessment audience | readiness band, section scores, top gaps, recommended modules are calculable | `assessment_roadmap` once a visitor opts in and enters contact details | Required for real submission | Medium because summary handling needs clear disclosure |
| `/scenario-walkthrough/` | Legacy assessment/workflow request | name, company, email, phone, organization type, sizes, categories, narrative fields, urgency, preferred path, honeypot, startedAt | Client and PHP server validation | POSTs to PHP mail handler | `mail()` to hard-coded recipient | Legacy page-specific language, not unified | name/company/email/phone repeated | organization type/categories | Sends detailed narrative answers, not summary-only | Should be deprecated or mapped to `assessment_roadmap` after privacy review | Existing PHP mailer, but not approved for unified intake | High due hard-coded recipient, detailed answers, and separate handler |
| `/government/` | Government preparedness inquiry path | No form currently; assessment CTA only | N/A | N/A | None | No form disclosure | N/A | government fleet profile | Can pass `assessment_type=government` from URL if present | `government_inquiry` | Required for real submission | Low until form added |
| `/aggregators/` | Aggregator/network inquiry path | No form currently; assessment CTA only | N/A | N/A | None | No form disclosure | N/A | aggregator profile | Can pass `assessment_type=aggregator` from URL if present | `aggregator_inquiry` | Required for real submission | Low until form added |
| `/drivers/` | Driver readiness / BOF Vault path | No form currently; assessment/demo links only | N/A | N/A | None | Driver/Vault pages warn against sensitive upload claims elsewhere | N/A | driver profile | Can pass `assessment_type=driver` from URL if present | `driver_inquiry` | Required for real submission | Medium because copy must avoid document-upload/support confusion |
| `/bof-vault/` | BOF Vault product inquiry path | No public inquiry form currently; demo links only | N/A | N/A | None | Page states public preview does not upload/store files | N/A | driver/Vault | None | `driver_inquiry` | Required for real submission | Medium because public intake must stay separate from document upload |
| Newsletter forms | Newsletter signup | None found | N/A | N/A | None | N/A | N/A | N/A | N/A | Not applicable | N/A | Low |

## Key Risks

- There is no approved secure unified backend in this worktree.
- The existing PHP mailer is narrow and hard-coded; it is not a clean unified intake backend.
- Supabase exists as demo/data infrastructure, but this task does not permit modifying Supabase and no environment is confirmed for a public intake table.
- Assessment follow-up should send a summary only, not individual answers, unless separately justified and disclosed.
- Public intake must not accept sensitive document uploads or protected operational records.

## Recommendation

Proceed with a shared front-end intake component and disabled/mock-safe adapter. Prepare schema, API contract, routing, notification, privacy, and deployment docs. Do not claim operational submission until a secure backend is selected and an end-to-end receipt is verified.
