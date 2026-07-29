# Intake Routing Model

## Categories

| Category | Submission types | Initial queue | Priority rule | Recommended next action |
| --- | --- | --- | --- | --- |
| GENERAL | `contact` | General Review | normal unless public-sector or urgent terms are present | triage and assign |
| DEMO | `demo_request` | Demo Review | normal/high for multi-area or implementation-ready requests | qualify demo fit |
| PRIORITY_FLEET | `priority_fleet` | Priority Fleet Review | high when implementation readiness is selected | review operational fit |
| ASSESSMENT | `assessment_roadmap` | Assessment Roadmap Review | high when readiness band shows significant gaps | prepare roadmap follow-up |
| GOVERNMENT | `government_inquiry` | Government Preparedness Review | high when procurement/preparedness terms appear | review agency use case |
| AGGREGATOR | `aggregator_inquiry` | Network Readiness Review | high for multi-carrier coordination | review network structure |
| DRIVER | `driver_inquiry` | Driver/Vault Review | normal, but never document upload | clarify support path |

## Initial Statuses

- `new`
- `review_required`
- `assigned`
- `contacted`
- `qualified`
- `not_ready`
- `closed`

## Minimum Internal Workflow

1. Intake event created.
2. Server assigns routing category and queue.
3. Internal reviewer can add status, assignment, notes, and follow-up history.
4. Visitor receives only safe confirmation.
5. No CRM-level automation is required for this launch.
