# Integrated Route Governance Report

## Authoritative Public Routes

These are public, indexable, canonical product routes:

- `/drivers/`
- `/dispatch/`
- `/safety/`
- `/settlements/`
- `/documents/`
- `/policies-procedures/`
- `/bof-vault/`

## Authoritative Demo Route

`/customer-demo/` is the unified hidden interactive demo shell.

Supported states:

- `/customer-demo/?portal=manager`
- `/customer-demo/?portal=driver`
- `/customer-demo/?portal=customer`
- `/customer-demo/?portal=safety`
- `/customer-demo/?portal=maintenance`
- `/customer-demo/?portal=finance`
- `/customer-demo/?portal=vault`
- `/customer-demo/?portal=vault&view=document-intake`
- `/customer-demo/?portal=policy`

Additional legacy-compatible state handlers remain available for selected-load, credential-hold, settlement-hold, and upload-request query states.

## Public CTA Deep Links

| Public route | Demo target |
| --- | --- |
| `/drivers/` | `/customer-demo/?portal=driver` |
| `/dispatch/` | `/customer-demo/?portal=manager` |
| `/safety/` | `/customer-demo/?portal=safety` |
| `/settlements/` | `/customer-demo/?portal=finance` |
| `/documents/` | `/customer-demo/?portal=vault&view=document-intake` |
| `/policies-procedures/` | `/customer-demo/?portal=policy` |
| `/bof-vault/` | `/customer-demo/?portal=vault` |

## BOF Vault Routing

- Public BOF Vault page: `/bof-vault/`
- Unified BOF Vault demo: `/customer-demo/?portal=vault`
- Document-intake workflow: `/customer-demo/?portal=vault&view=document-intake`
- Top-level public navigation keeps BOF Vault as the public page route.
- BOF Vault CTAs now open the unified Vault demo states, not the old `/interactive-demo/` shell.

## Legacy Interactive Demo

Legacy routes remain available and were not deleted:

- `/interactive-demo/`
- `/interactive-demo/drivers/`
- `/interactive-demo/dispatch/`
- `/interactive-demo/safety/`
- `/interactive-demo/alerts/`
- `/interactive-demo/carriers/`
- `/interactive-demo/documents/`
- `/interactive-demo/load-queue/`
- `/interactive-demo/reports/`
- `/interactive-demo/settings/`
- `/interactive-demo/settlements/`
- driver detail records under `/interactive-demo/drivers/`

Unique functions preserved:

- driver detail records
- legacy document intake
- alert management
- dispatch/load queue views
- carrier view
- document library
- reports/settings surfaces
- settlement-specific legacy views

No redirect was deployed. Candidate redirects should remain temporary until parity is verified and owner-approved.

## SEO Result

- Public product pages have canonical tags.
- `Website/sitemap.xml` includes public routes only.
- `/customer-demo/` and `/interactive-demo/` are excluded from the sitemap.
- `Website/robots.txt` disallows both hidden demo route families.
- `Website/.htaccess` applies `X-Robots-Tag: noindex, nofollow` to both hidden demo route families.
- Public product pages were not noindexed.

