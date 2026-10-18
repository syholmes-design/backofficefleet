# BOF Operational Platform Map (read-only analysis)

Repo: /home/user/bof-website-recovery @ 244d6928 (base origin/release/web-004-005-prep). 155 page.tsx, 127 route.ts.
Companion reference already in repo: docs/BOF_ROUTE_MAP.md (route -> component -> DEMO/LIVE classification; matches findings below).

## 0. Auth model (critical context)

- NextAuth v5, Credentials provider only, JWT sessions (auth.ts:36-89). No `pages:` config -> **sign-in URL is the NextAuth default `/api/auth/signin`**, supports `?callbackUrl=`. No custom /login route exists. If AUTH_SECRET is unset, handlers return 503 JSON (auth.ts:184-188) and `auth()` returns null.
- **No middleware.ts.** `app/(bof)/layout.tsx` has NO auth guard; it seeds `BofDemoDataShell` with `getBofData()` (static lib/demo-data.json) for every (bof) page. `app/customer-portal/layout.tsx` same.
- Auth is enforced per page. Only these pages redirect anon users to sign-in (good pattern to copy):
  - /contact-inquiries -> `redirect("/api/auth/signin?callbackUrl=/contact-inquiries")` + `isBofStaff` / forbidden() (app/(bof)/contact-inquiries/page.tsx:15-18)
  - /recruiting -> `/api/auth/signin?callbackUrl=/recruiting` (app/(bof)/recruiting/page.tsx:21-23); /recruiting/requisitions/[id] likewise.
- "LIVE" pages call `auth()` and degrade to an empty state for anon (no redirect, no sign-in link):
  - /dispatch: renders shell, error "Production dispatch requires a LIVE fleet session. DEMO board: /demo/dispatch" (components/dispatch/DispatchShell.tsx:93-95)
  - /drivers: empty roster + "Production driver roster requires a LIVE fleet session. DEMO roster: /demo/drivers" (components/drivers/DriversRosterTable.tsx:482-484, 730-732)
  - /drivers/[id]: "Session expired. Sign in again..." (app/(bof)/drivers/[id]/page.tsx:35-47)
  - /loads, /command-center, /settlements: LIVE operating-spine fetch; anon gets empty/non-live notice.
  - /portals/driver: "Sign in to view your driver vault." with no link (app/portals/driver/page.tsx:43-53)
- OperatorSurfaceModeBanner (components/operations/OperatorSurfaceModeBanner.tsx) labels /demo/* "DEMO sandbox", /dashboard "DEMO operator overview", and LIVE prefixes (/command-center,/dispatch,/loads,/drivers,/settlements,/pretrip,/trip-release) "Production".
- APIs: nearly all /api/* gate via `auth()` or helpers (`operatorUnauthorizedResponse` lib/require-operator-session.ts, `recruitingV2UnauthorizedResponse`, `requireChatUser`, `requireInquiryStaff`). Unauthenticated by design: /api/auth/*, POST /api/contact/inquiries, POST /api/recruiting/apply, /api/marketing-demo-media, /api/regulatory-feed, (bof)/maintenance/photos/[file]. /api/debug-drivers 404s in production.

## 1. Page route inventory

Legend: Auth = R (redirects to sign-in), S (session-aware, anon gets empty/notice), N (none). Data = DEMO (lib/demo-data.json / *demo* libs / localStorage stores), LIVE (Prisma), STATIC (copy).

### (marketing) — layout app/(marketing)/layout.tsx; all Auth N, STATIC; no prisma/auth imports anywhere in the group
/, /product, /how-bof-works, /what-we-do(+/finance,/operations-compliance,/people-hr,/procurement-savings), /business-operations(+/accounting-finance, /customer-billing(+/billing-ar-control), /document-records-control, /driver-onboarding, /driver-onboarding/assignment-readiness, /operational-reporting(+/owner-queue-reporting), /payroll-administration(+/pay-exception-control)), /private-fleets(+/driver-management,/fleet-growth-back-office,/maintenance-administration,/safety-risk,/settlements-payroll), /for-hire-carriers, /government(+ ~30 subpages), /bof-vault(+8 subpages incl /bof-vault/intake), /fleet-operations, /fleet-savings (calculator), /driver-experience, /founding-fleet, /aggregators, /company, /investors, /blog, /blog/[slug], /qa, /team-briefing (internal-sounding, public),
/careers (CareersPageClient -> POST /api/recruiting/apply), /apply (FleetApplicationWizardClient, client-only), /contact (ContactInquiryForm -> POST /api/contact/inquiries), /book-assessment (JS redirect to /assessment).
Existing outbound links: /business-operations/driver-onboarding/assignment-readiness -> "/dashboard" (line 40); /private-fleets/driver-management -> /dashboard, /book-assessment?sector=private-fleet; /business-operations/document-records-control -> /documents/company-operations-vault.

### Root-level (no group, root layout only) — Auth N
| URL | Data | Purpose |
|---|---|---|
| /assessment | STATIC | assessment track selector, ?sector= auto-routes |
| /assessment/{for-hire-carriers,private-fleets,government-fleets,bof-vault} | client-only | AssessmentTrackPageClient; scores shown in-browser, never submitted |
| /customer-portal (+/load-intake,/quotes,/assignment,/shipments,/documents,/tracking,/billing) | DEMO ("Prairie View" walkthrough) | simulated customer portal: request shipment, quote, BOL packet, tracking, billing |
| /portals | DEMO | portal chooser |
| /portals/customer, /customers (alias) | DEMO (Apex DEMO_CUSTOMER_PROFILE) | customer-visible loads |
| /portals/manager | DEMO | manager portal |
| /portals/driver, /portals/driver/[driverId] | S + LIVE Prisma | driver's own vault (authenticated driver) |

### (bof) — layout app/(bof)/layout.tsx (AppShell + BofDemoDataShell seeded from demo JSON; NO auth guard)
| URL | Auth | Data | Purpose |
|---|---|---|---|
| /dashboard | N | DEMO | demo operator overview |
| /command-center | S | LIVE (/api/dispatch/operating-spine) | production command center |
| /demo/command-center, /demo/dispatch, /demo/drivers, /demo/loads, /demo/settlements | N | DEMO, explicitly labelled sandbox | public-safe demos of each LIVE surface |
| /demo/scenario | N | DEMO | equipment scenario walkthrough |
| /dispatch | S | LIVE Prisma drivers + spine | dispatch board / assignment |
| /dispatch/intake | N | DEMO/client store | dispatch load intake |
| /dispatch/pickup, /dispatch/pickup/dock | N page (APIs authed) | LIVE via API | pickup authorization |
| /dispatch-v2, /settlements-v2 | N | DEMO reference | preview boards |
| /loads | S | LIVE | load roster |
| /loads/[id] | S | LIVE + demo fallback | load detail |
| /loads/[id]/readiness-summary | N | DEMO | readiness artifact |
| /drivers | S | LIVE (empty for anon) | driver readiness roster |
| /drivers/[id] | S | LIVE | operator driver file |
| /drivers/[id]/{profile,hr,safety,settlements,vault,dispatch,bank-info} | **N** | **DEMO, rendered to anyone** | driver sub-views; vault = DQF; bank-info = routing number |
| /documents | N | STATIC sample library | Operations File Cabinet ("Sample files are not live carrier evidence") |
| /documents/vault | N | DEMO (getBofData) | 12-driver document vault index |
| /documents/vault/[driverId] | N | redirect -> /documents/vault?driverId= | |
| /documents/vault/final, /documents/template-packs(+/artifact,/view) | N | DEMO/STATIC | vault artifact + template packs |
| /documents/company-operations-vault | N | STATIC (lib/company-operations-vault.ts) | company ops vault |
| /documents/compliance-flow | N | DEMO | ComplianceFlowDashboard |
| /emergency-contacts, /emergency-contacts/[driverId] | **N** | **DEMO PII-like** | emergency contact cards |
| /intake, /intake/[intakeId] | N | DEMO (zustand intake-engine-store) | driver/entity intake engine |
| /recruiting-v2, /recruiting-v2/candidates/[id](+/[workspace], /documents/[code]) | N page; API panels need session | DEMO (lib/recruiting-v2/recruiting-v2-demo-data.ts, example.test / 555 numbers) + LIVE API panels | onboarding & qualification pipeline |
| /recruiting, /recruiting/requisitions/[id] | R | LIVE Prisma | requisitions |
| /recruiting/workspace | N | DEMO (localStorage recruiting store) | recruiting pipeline demo |
| /settlements | S | LIVE Prisma Settlement holds | settlement controls |
| /settlements/workbook | N | DEMO workbook | payroll workbook |
| /money-at-risk, /fleet-financials, /rf-actions, /source-of-truth, /safety, /safety/training, /maintenance/* | N | DEMO | finance/safety/maintenance demos (/maintenance/work-orders/[id] calls auth) |
| /load-intake, /load-requirements | redirect | -> /dispatch/intake | legacy |
| /load-request, /load-requests | N | DEMO | legacy |
| /shipper-portal/[loadId], /trip-release/[loadId] | N | DEMO | shipper view / trip release |
| /pretrip/[loadId] | S | LIVE | pretrip |
| /operational-chat | S | LIVE | ops chat |
| /contact-inquiries | R + staff role | LIVE Prisma ContactInquiry | inquiry review inbox |
| /carriers, /carriers/[id](/...) | N | DEMO | carrier registry |

## 2. Capability map

| Capability | Public (anon) | Authenticated | APIs | Public demo? |
|---|---|---|---|---|
| Driver onboarding & qualification | /business-operations/driver-onboarding(+/assignment-readiness) explainer; /recruiting-v2 (demo pipeline); /intake | /recruiting-v2 API panels; /drivers/[id] | /api/recruiting-v2/{documents,interviews,offer,onboarding,qualification,activation}/[candidateId] (session-only), /api/intake/** (auth), /api/driver-claim/* | YES: /recruiting-v2 (synthetic example.test candidates), /intake |
| Driver document mgmt / DQF / vault | /bof-vault marketing; /documents (sample file cabinet); /documents/company-operations-vault; /documents/vault + /drivers/[id]/vault (demo but PII-like) | /portals/driver (driver's own vault), /drivers/[id] | /api/driver/vault/** , /api/employer/driver-documents/**, /api/documents/[id] (all auth) | YES: /documents (labelled sample), /documents/compliance-flow |
| Dispatch assignment & readiness | /business-operations/driver-onboarding/assignment-readiness explainer | /dispatch, /drivers, /loads/[id] | /api/dispatch/assignment/**, /api/dispatch/driver/[id]/eligibility, /api/dispatch/load/[id]/readiness (auth) | YES: /demo/dispatch, /demo/drivers (sandbox-bannered) |
| Load management | — | /loads, /loads/[id], /dispatch/intake | /api/dispatch/load/**, /api/load-intake/extract (auth) | YES: /demo/loads |
| Settlement controls / finance | /business-operations/payroll-administration | /settlements | /api/dispatch/settlements, /api/generate/settlement (auth) | YES: /demo/settlements, /settlements-v2, /money-at-risk |
| Customer docs / portal / load intake | /customer-portal/* (demo), /portals/customer | none LIVE for customers found | /api/generate/{bol,pod,invoice} (auth) | YES: /customer-portal |
| Recruiting / careers | /careers, /apply | /recruiting (R) | /api/recruiting/apply (no storage), /api/recruiting/requisitions/** (auth) | /recruiting/workspace (demo) |
| Assessment & inquiry | /assessment/*, /book-assessment, /contact | /contact-inquiries (staff) | POST /api/contact/inquiries | n/a |
| Demos / explainers | /demo/*, /dashboard, /demo/scenario; DemoPageExplainer (lib/demo/demo-page-explainers.ts ids: dashboard, command-center, drivers, documents, dispatch, loads, safety, settlements, portals) | | /api/marketing-demo-media | |
| Command center | /dashboard (demo), /demo/command-center | /command-center | /api/dispatch/operating-spine | YES |

## 3. Recommended destinations for website cards

| Card | Anonymous | Signed-in |
|---|---|---|
| Driver Onboarding | Explainer: /business-operations/driver-onboarding ; demo: /recruiting-v2 (synthetic candidates) | /api/auth/signin?callbackUrl=/recruiting-v2 (LIVE panels need session); requisitions: /recruiting |
| Driver Compliance Documents | Explainer: /bof-vault (or /business-operations/document-records-control); demo: /documents (labelled "sample") or /documents/compliance-flow. Avoid /documents/vault and /drivers/[id]/vault until demo data is de-PII'd | /api/auth/signin?callbackUrl=/drivers (operator); drivers: /api/auth/signin?callbackUrl=/portals/driver |
| Dispatch Assignment | Explainer: /business-operations/driver-onboarding/assignment-readiness ; demo: /demo/dispatch (and /demo/drivers) | /api/auth/signin?callbackUrl=/dispatch |

Do not link anon visitors to /dispatch, /drivers, /loads, /command-center: they show "requires LIVE fleet session" empty states with no sign-in button. Existing marketing CTA "See current operations" -> /dashboard is a demo, not current ops.

## 4. Security / privacy findings

1. **Reflected XSS** — app/(marketing)/book-assessment/page.tsx:20-37: `sector` query param interpolated unescaped into an inline `<script>` (`window.location.href = '${redirectUrl}'`). `/book-assessment?sector=';alert(document.cookie);//` executes. Use `redirect()` from next/navigation with an allow-listed sector. This page is linked from marketing CTAs.
2. **Realistic driver PII publicly served, no auth, no "sample" watermark**:
   - lib/demo-data.json drivers: DRV-001 "John Carter" phone [redacted], [email redacted], CDL [redacted], home address, emergency contacts with gmail/aol addresses and non-555 numbers; others use non-555 phones.
   - public/documents/drivers/DRV-0xx/* (static, world-readable): driver-application.html (DOB [redacted], SSN XXX-XX-0106), bank-card-*.html (full routing number [redacted], acct ••0202), CDL/medical card images, I-9/W-9 PDFs, MVR, DQF summaries. Also public/reference/bank-info/.
   - Rendered unauthenticated at /drivers/[id]/{profile,hr,bank-info,vault,settlements,safety}, /documents/vault, /emergency-contacts. Synthetic, but indistinguishable from real records; should be labelled or moved behind /demo with fictitious 555/example.test values.
3. **Authz gap** — recruiting-v2 APIs (lib/recruiting-v2/require-operator-session.ts) only require any session; no fleet/role scoping, so any signed-in user can read/modify any candidate's documents by candidateCode (e.g. /api/recruiting-v2/documents/[candidateId]/[documentCode]/file).
4. No middleware / no layout guard for (bof): protection relies on each page remembering to call auth(); new pages default to public.

## 5. Public form APIs

| Form | Endpoint | Validation | Rate limit / spam | Storage |
|---|---|---|---|---|
| /contact (components/marketing/ContactInquiryForm.tsx:27) | POST /api/contact/inquiries (app/api/contact/inquiries/route.ts:28) | lib/contact/contactInquiry.ts: lengths, email regex, message 10-4000 | honeypot `website_hp` (l.52); 5 per email per 15 min (l.93-94); duplicate email+message within 24h (contactInquiryStore.ts:14); no IP limit, no CAPTCHA | **Prisma ContactInquiry** (schema.prisma:2931), transaction; emailed:false (no email sent); reviewed at /contact-inquiries (staff) |
| /careers (CareersPageClient.tsx:39) | POST /api/recruiting/apply | lib/validations/applicant.ts incl honeypot (l.61) | none | **None server-side**: echoes candidate; client stores in zustand localStorage `bof-recruiting-store-v1` (lib/stores/recruiting-store.ts:120). Applications never reach BOF. |
| /apply (FleetApplicationWizardClient) | none | client-only | n/a | localStorage only ("This demo keeps your submission client-side only") |
| /assessment/*, homepage embedded FleetAssessmentWizardClient, /book-assessment | none | client-only | n/a | localStorage/sessionStorage only; nothing submitted |

Net: the only real lead capture is /contact -> ContactInquiry table. Assessment, fleet application and careers submissions go nowhere.
