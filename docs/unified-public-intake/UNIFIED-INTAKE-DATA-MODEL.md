# Unified Intake Data Model

## Bounded Context

Public intake is a separate bounded context from MG3 operating data, customer portals, driver document intake, authenticated records, financial data, and protected government records.

Suggested table: `public_intakes`

## Enums

`submission_type`

- `contact`
- `demo_request`
- `priority_fleet`
- `assessment_roadmap`
- `government_inquiry`
- `aggregator_inquiry`
- `driver_inquiry`

`status`

- `new`
- `review_required`
- `assigned`
- `contacted`
- `qualified`
- `not_ready`
- `closed`

`routing_category`

- `GENERAL`
- `DEMO`
- `PRIORITY_FLEET`
- `ASSESSMENT`
- `GOVERNMENT`
- `AGGREGATOR`
- `DRIVER`

`preferred_contact_method`

- `email`
- `phone`
- `either`

`fleet_type`

- `private_fleet`
- `for_hire_fleet`
- `aggregator_network`
- `government_public_fleet`
- `driver_or_document_operation`
- `other`
- `unknown`

## Core Fields

| Field | Type | Required | Limits / validation | Notes |
| --- | --- | --- | --- | --- |
| `id` | UUID | yes | generated server-side | Not exposed publicly unless a safe short reference is generated separately |
| `public_reference` | text | yes | generated, 12-18 chars, non-sequential | Safe visitor reference if real backend exists |
| `submission_type` | enum | yes | listed values only | Derived from form configuration |
| `status` | enum | yes | default `new` | Internal workflow |
| `source_page` | text | yes | path only, max 180 | No full URL with personal data |
| `source_campaign` | text | no | max 120, allowlisted query keys only | Never store arbitrary query string |
| `routing_category` | enum | yes | listed values only | Derived server-side |
| `assigned_queue` | text | yes | enum-like controlled values | Internal queue label |
| `priority` | smallint | yes | 1-4 | 1 high, 4 low |
| `first_name` | text | yes | 1-80 | Server trims and strips control chars |
| `last_name` | text | no | max 80 | Split from full name only when provided |
| `email` | citext/text | yes | max 254, valid email | Normalize to lowercase for matching |
| `phone` | text | no | max 40, E.164 when possible | Do not require |
| `preferred_contact_method` | enum | yes | default `email` | |
| `organization_name` | text | yes for non-driver | max 160 | Driver inquiries may use `Individual driver` |
| `organization_domain` | text | no | derived from email domain when business domain | Matching only; do not expose |
| `job_title` | text | no | max 120 | |
| `audience_type` | text enum | no | aggregator/private/for-hire/government/driver/unknown | Derived from page and selected fields |
| `fleet_type` | enum | no | listed values only | |
| `fleet_size` | text enum | no | `1-5`, `6-25`, `26-100`, `101-500`, `500+`, `unknown` | Avoid unrestricted text |
| `operating_regions` | jsonb | no | array of strings, max 12 values | Allowlisted region labels or short freeform with length cap |
| `request_summary` | text | yes | max 2000 | Reject HTML/script patterns server-side |
| `requested_next_step` | text enum | yes | `respond`, `demo`, `roadmap`, `priority_review`, `preparedness_review`, `network_review`, `vault_review` | |
| `assessment_type` | text enum | no | same audience enum | Summary only |
| `assessment_readiness_band` | text enum | no | controlled bands from assessment | |
| `assessment_section_scores` | jsonb | no | max 8 sections, integer 0-100 | No individual answers |
| `assessment_top_gaps` | jsonb | no | max 3 strings, max 240 each | |
| `assessment_recommended_modules` | jsonb | no | max 8 strings, allowlisted module labels | |
| `privacy_acknowledged_at` | timestamptz | yes | server timestamp when user checks required acknowledgment | Not preselected |
| `submitted_at` | timestamptz | yes | server timestamp | |
| `assigned_to` | text | no | internal user ID or email alias, not public | |
| `last_contacted_at` | timestamptz | no | internal | |
| `closed_at` | timestamptz | no | required when status closed | |
| `internal_notes` | jsonb | no | internal note objects with author/time/body | Restricted internal access |
| `follow_up_history` | jsonb | no | event array | Restricted internal access |
| `metadata` | jsonb | no | strict schema | Browser, viewport, safe campaign, validation version |

## Indexes

- `submitted_at`
- `status, assigned_queue`
- `submission_type, submitted_at`
- `routing_category, status`
- normalized email hash for internal matching
- organization domain for internal matching

## Retention Treatment

Recommend retaining public intakes for 24 months, then review/delete or anonymize depending on business/legal requirements. Do not claim automatic deletion until scheduled deletion is implemented and audited.
