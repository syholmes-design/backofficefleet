# Checklist: Priority Fleet Implementation Program copy and intake update

Created: 2026-07-02 10:34:14 -04:00
Source: User attachment 2026-07-02 pasted-text.txt
Owner persona: `checklist-execution-steward`
Status: active

## Scope

Convert the source into atomic checklist items and process them one at a time.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Keep BOF static/shared-hosting safe unless the user explicitly changes direction.
- Do not add React, Next.js, TypeScript, npm packages, credentials, `.env`, auth, database, backend routes, or real API/sync.
- Preserve buyer-facing language. Avoid developer notes in visible UI.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CL-001 | User attachment 2026-07-02 pasted-text.txt | Search `Website` for old Founding Fleet, discount, implementation, working-session, scenario, HR, and Finance phrases. | complete | Initial and repeat `rg` scans over `Website` HTML/JS/PHP; repeat scan found no old Founding Fleet/member phrasing except intentional compatibility URL paths. | Search repeated after edits. |
| CL-002 | User attachment 2026-07-02 pasted-text.txt | Replace/reframe public copy that promises or implies lifetime discounts, 90-day guarantees, or early fleets funding BOF's launch. | complete | Updated Priority Fleet pages, homepage CTA labels, scenario CTA labels, and fleet-operator commercial table; scan only finds explicit "no lifetime discount" disclaimers and unrelated customer-rate discount copy. | 60-90 wording is framed as a target after activation, not a guarantee. |
| CL-003 | User attachment 2026-07-02 pasted-text.txt | Add Priority Fleet Implementation Program language to relevant demo/CTA/offer areas, including reservation deposit and activation payment wording. | complete | `Website/founding-fleet/index.html`, `pricing/index.html`, `trial/index.html`, `apply/index.html`, `Website/founding-fleets/index.html`, `Website/index.html`. | Formal implementation clock conditions added. |
| CL-004 | User attachment 2026-07-02 pasted-text.txt | Expand intake/questionnaire fields for fleet profile, requested tiers, operations readiness, HR readiness, finance readiness, documents, systems, and coordination complexity. | complete | `Website/scenario-walkthrough/index.html` expanded form fields and preserved original required fields. | Existing required behavior remains name/company/email/org type/description. |
| CL-005 | User attachment 2026-07-02 pasted-text.txt | Add visible Preliminary Implementation Class A/B/C/D guidance with timeline, implementation fee range, monthly fee guidance, and non-guarantee disclaimer if feasible. | complete | `Website/assets/js/scenario-walkthrough.js`; Edge validation showed Class D for complex full conversion and Class B for Operations + HR mixed records. | Static vanilla JS scoring implemented. |
| CL-006 | User attachment 2026-07-02 pasted-text.txt | Update frontend confirmation/summary preview to include requested tiers, document condition, preliminary class, timeline, fee range, monthly fee guidance, and customer-delay warning. | complete | Rendered summary includes requested tiers, document condition, class, timeline, fee range, monthly guidance, preliminary disclaimer, and customer-delay warning. | Verified by Playwright/Edge text extraction. |
| CL-007 | User attachment 2026-07-02 pasted-text.txt | Update PHP/email payloads with new fields if PHP submission exists. | complete | `Website/scenario-walkthrough/submit.php` includes new fields in email summary and higher JSON body limit. | PHP CLI unavailable locally, so syntax lint could not run. |
| CL-008 | User attachment 2026-07-02 pasted-text.txt | Preserve static-site guardrails: no Vercel, no deploy, no framework/runtime/package changes. | complete | No Vercel/deploy/package commands used; changes remain static HTML/CSS inline/vanilla JS/PHP endpoint copy. | Local-only. |
| CL-009 | User attachment 2026-07-02 pasted-text.txt | Validate source, routes, form behavior, HTTP 200 responses, navigation, and responsive readability/no horizontal overflow at 1366, 1024, 768, and 390 widths. | complete | `node --check`; local route checks returned 200; Edge overflow check showed 0 body overflow for key routes at 1366/1024/768/390; intercepted form POST included new fields/classes. | PHP runtime validation unavailable locally. |
| CL-010 | User attachment 2026-07-02 pasted-text.txt | Report git status, changed files, validation steps, tested routes, copy changes, questionnaire changes, and issues. | complete | Final response includes status summary, changed-file groups, validation, routes, issues. | Final closeout. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Syntax checks | complete | `node --check Website/assets/js/scenario-walkthrough.js`; PHP CLI not installed, no bundled PHP found. |
| Route checks | complete | HTTP 200 for `/`, `/scenario-walkthrough/`, `/scenario-walkthrough/submit.php`, `/founding-fleet/`, `/founding-fleet/apply/`, `/founding-fleet/pricing/`, `/founding-fleet/trial/`, `/founding-fleets/`, `/fleet-operator-offer/`, `/book-demo/`, `/demo/`. |
| Browser/rendered check | complete | Edge/Playwright overflow checks at 1366, 1024, 768, 390 for key routes: no body-level horizontal overflow. |
| Source/privacy/stale-copy scans | complete | Repeat `rg` scans for old Founding Fleet/member wording, lifetime offer promises, awkward Priority Fleet grammar, HR/Finance old labels. |
| Runtime cleanup audit | complete | Started local preview PID 21072, stopped exact PID after validation, follow-up audit reports 0 candidate leftovers. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|

## Closeout Summary

- Completed: Priority Fleet copy, expanded assessment questionnaire, class scoring, frontend summary, PHP email payload, route/render validation, cleanup.
- Remaining: None for local static changes.
- Blocked: PHP syntax/runtime validation could not run because no local or bundled PHP executable is installed.
- Deferred: No deployment or Vercel work by request.
- Verification: Phrase scans, `node --check`, local HTTP 200 route checks, Edge rendered overflow checks, intercepted frontend form POST, runtime cleanup audit.
