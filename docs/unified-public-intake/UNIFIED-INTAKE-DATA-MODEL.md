# Unified Intake Data Model

## Bounded Context

Public intake is a separate bounded context from MG3 operating data, customer portals, driver document intake, authenticated records, financial data, and protected government records.

Implemented schema: `intake`

Implemented tables:

- `intake.public_intakes`
- `intake.intake_events`
- `intake.intake_notes`
- `intake.intake_assignments`

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

`assigned_queue`

- `general`
- `demo`
- `priority_fleet`
- `assessment`
- `government`
- `aggregator`
- `driver`

`preferred_contact_method`

- `email`
- `phone`
- `either`

`fleet_type`

- `private_fleet`
- `for_hire_fleet`
- `government_fleet`
- `carrier_network`
- `owner_operator`
- `other`

## Core Fields

| Field | Type | Required | Limits / validation | Notes |
| --- | --- | --- | --- | --- |
| `id` | UUID | yes | generated server-side | Not exposed publicly unless a safe short reference is generated separately |
| `public_reference` | text | yes | generated, 12-18 chars, non-sequential | Safe visitor reference if real backend exists |
| `submission_type` | enum | yes | listed values only | Derived from form configuration |
| `status` | enum | yes | default `new` | Internal workflow |
| `source_page` | text | yes | path only, max 180 | No full URL with personal data |
| `source_campaign` | text | no | max 120, allowlisted query keys only | Never store arbitrary query string |
| `assigned_queue` | enum | yes | listed values only | Derived server-side |
| `priority` | enum | yes | normal/elevated/urgent | Public users cannot set directly |
| `first_name` | text | yes | 1-80 | Server trims and strips control chars |
| `last_name` | text | yes | max 80 | Required by current shared frontend |
| `email` | text | yes | max 254, valid email | Normalize to lowercase for matching |
| `phone` | text | no | max 40, E.164 when possible | Do not require |
| `preferred_contact_method` | enum | yes | default `email` | |
| `organization_name` | text | yes for non-driver | max 160 | Driver inquiries may use `Individual driver` |
| `organization_domain` | text | no | derived from email domain when business domain | Matching only; do not expose |
| `job_title` | text | no | max 120 | |
| `audience_type` | text enum | no | aggregator/private/for-hire/government/driver/unknown | Derived from page and selected fields |
| `fleet_type` | enum | no | listed values only | |
| `fleet_size_range` | text | no | max 40 | Avoid unrestricted long text |
| `operating_regions` | text[] | no | max 12 values, max 60 chars each | Short freeform region labels |
| `request_summary` | text | yes | max 1500 | Reject HTML/script patterns server-side |
| `requested_next_step` | enum | yes | listed requested-next-step values | |
| `assessment_type` | text enum | no | same audience enum | Summary only |
| `assessment_readiness_band` | text enum | no | controlled bands from assessment | |
| `assessment_section_scores` | jsonb | no | max 8 sections, integer 0-100 | No individual answers |
| `assessment_top_gaps` | jsonb | no | max 3 strings, max 240 each | |
| `assessment_recommended_modules` | jsonb | no | max 8 strings, allowlisted module labels | |
| `privacy_acknowledged_at` | timestamptz | yes | server timestamp when user checks required acknowledgment | Not preselected |
| `submitted_at` | timestamptz | yes | server timestamp | |
| `assigned_to` | uuid | no | internal user id, not public | |
| `last_contacted_at` | timestamptz | no | internal | |
| `closed_at` | timestamptz | no | required when status closed | |
| `internal_notes` | separate table | no | `intake.intake_notes` | Restricted internal access |
| `follow_up_history` | separate table | no | `intake.intake_events` | Restricted internal access |
| `metadata` | jsonb | no | strict schema | Browser, viewport, safe campaign, validation version |

## Indexes

- `submitted_at`
- `status, assigned_queue`
- `submission_type, submitted_at`
- `assigned_queue`
- normalized email for internal matching
- organization domain for internal matching

## Retention Treatment

Recommend retaining public intakes for 24 months, then review/delete or anonymize depending on business/legal requirements. Do not claim automatic deletion until scheduled deletion is implemented and audited.
