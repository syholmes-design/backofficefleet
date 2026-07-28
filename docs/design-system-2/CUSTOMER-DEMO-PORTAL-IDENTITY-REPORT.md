# Customer Demo Portal Identity Report

## Portal Mapping

| Portal | Demo route | Public page | Header title | Product link |
| --- | --- | --- | --- | --- |
| Manager | `/customer-demo/?portal=manager` | `/dispatch/` | Manager Portal | View Dispatch & Operations |
| Driver | `/customer-demo/?portal=driver` | `/drivers/` | Driver Portal | View Driver Management |
| Finance Readiness | `/customer-demo/?portal=finance` | `/settlements/` | Finance Readiness | View Settlements & Billing |
| Safety & Compliance | `/customer-demo/?portal=safety` | `/safety/` | Safety & Compliance | View Safety & Compliance |
| BOF Vault | `/customer-demo/?portal=vault` | `/bof-vault/` | BOF Vault | View BOF Vault |
| Policy Governance | `/customer-demo/?portal=policy` | `/policies-procedures/` | Policy Governance | View Policies & Procedures |
| Business Operations | `/customer-demo/?portal=business-operations` | `/business-operations/` | Business Operations | View Business Operations |

## Business Operations Addition

Business Operations was added to the unified demo with the requested description:

`Administrative control center for workforce, payroll, vendors, records, and executive oversight.`

The public `/business-operations/` page now includes a CTA to `/customer-demo/?portal=business-operations`, but its existing public hero remains unchanged.

## Reusable Header Identity

Each portal now controls:

- background image
- background focal position
- header title
- description
- persona label
- public product route
- product link label
- optional secondary link
- status metric label, value, and detail

The legacy top status strip now uses the same portal persona as the compact secondary header, so BOF Vault shows `Vault Administrator`, Policy Governance shows `Compliance Officer`, Finance Readiness shows `Finance Analyst`, and Business Operations shows `Operations Lead`.

## Dashboard Continuity

The first dashboard section below the secondary header is portal-specific:

- Manager: operational queue and release blockers
- Driver: current assignment and readiness
- Finance Readiness: settlement and proof readiness
- Safety & Compliance: exceptions and corrective actions
- BOF Vault: document requests, review, renewal, and access posture
- Policy Governance: acknowledgments, revisions, training, and audit posture
- Business Operations: workforce, payroll, vendor/equipment, records, and executive oversight

## Public Page Links

Final QA confirmed the expected public-to-demo links exist and resolve on:

- `/drivers/`
- `/dispatch/`
- `/settlements/`
- `/safety/`
- `/bof-vault/`
- `/policies-procedures/`
- `/business-operations/`

## Validation Result

Final local browser validation passed with 49 portal/viewport checks, seven public page link checks, Business Operations click/back/forward history verification, zero console errors, and no missing compact-header image assets.
