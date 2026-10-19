# Branch reconciliation: `main` → `claude/website-recovery-20261018`

Date: 2026-10-19

| Branch | Layout | Last commit | Role |
|---|---|---|---|
| `main` | Old `bof-web/` subdirectory | June 2026 | Retired |
| `claude/website-recovery-20261018` | Repository root | — | Canonical integration branch |

`main` has 50 commits the integration branch lacks. None is patch-identical, because of the layout change.

A file-level comparison found that 79 of the 139 files `main` added already exist at the root. Of the remaining 60:
- 35 are Codex agent tooling (`.codex/**`, `CODEX.md`). It is not product code and is not ported; it stays recoverable from Git if the owner wants Codex configuration in the canonical layout.
- 4 are the generated insurance notice and its template, ported under item 3.
- The rest map to the five features below.

`main` was **not** merged.

## The five main-only features

| # | Feature | Source on `main` | Canonical destination | Classification | Action completed | Remaining blocker |
|---|---|---|---|---|---|---|
| 1 | Carrier packet evidence pages | `bof-web/app/(bof)/carriers/[carrierId]/packet/**` | `app/(bof)/carriers/[id]/packet/page.tsx` and `…/packet/[evidenceId]/page.tsx` | **PORT REQUIRED** → ported | Ported. The libraries they use (`carrier-registry`, `carrier-packet-evidence`, `carrier-dispatch-gates`) are byte-identical on both branches. The route parameter was renamed to match the canonical `[id]` segment. The carrier detail page now links to the preview. Browser-verified: detail → packet → evidence; anonymous visitors are sent to sign-in. | None. These remain demo-registry pages, labelled "Customer-safe carrier packet preview". |
| 2 | Freight compliance pulse | `bof-web/app/(marketing)/compliance/page.tsx`, `components/marketing/FreightCompliancePulse.tsx` | `app/(marketing)/compliance/page.tsx`, `components/marketing/FreightCompliancePulse.tsx`; the feed back end (`lib/regulatory-feed/**`, `/api/regulatory-feed`) already existed | **PORT REQUIRED** → ported | Ported the page and component, added `compliance` to the public marketing segments, and added a footer link. **Improved on `main`:** `main` padded the "live" feed with sample items when the public sources were empty. The branch's 2026-10-09 security hardening (`c17bcc17`) had already removed that from the feed. The component now shows an explicit "temporarily unavailable" notice and never presents samples as live. | None. Content depends on the public FMCSA, DOT and Federal Register sources at build and revalidation (every 6 h). |
| 3 | Insurance-notice and MSA routing | `789fdada`, `d0337bdc`, `97efd6b5`, `4be2a093` | `public/generated/loads/L001/insurance-notification.html`, `scripts/templates/load-docs/insurance-notification.template.html`, `scripts/generate-load-docs.mjs` | MSA: **ALREADY INTEGRATED**. Insurance notice: **PORT REQUIRED** → ported, in part. | **MSA:** the branch already routes every MSA reference to the canonical Delta MSA PDF (file cabinet entry, `load-intake/document-paths.ts`, trip-packet label); the PDF exists. **Insurance notice:** ported `789fdada`, which replaced the placeholder "Insurance Company Notification … demo/test" with the real incident notification (both files were exactly `main`'s pre-fix versions). From `d0337bdc`, ported the generator fixes: the customer comes from the load's customer, broker or consignee instead of the first word of the origin city; specific exception notes; and the claim date comes from the load's delivery or pickup date. | **Not ported, deliberately:** `d0337bdc`'s rule that routes every load's insurance link to L001's notice. It would show one load's incident on other loads. The improved generator applies the next time load documents are regenerated (`scripts/generate-load-docs.mjs`). They were not bulk-regenerated here, because that would restamp every load's dates. |
| 4 | Demo walkthrough and demo access | `bof-web/app/(bof)/demo/page.tsx`, `demo/walkthrough/page.tsx`, `lib/demo-access.ts` | `/interactive-demo` (the canonical public demo hub) and `/assessment` | **SUPERSEDED** | Not ported. The persona/tier hub duplicates `/interactive-demo`. The walkthrough's centerpiece is an embedded Calendly "Schedule Guided BOF Operations Walkthrough" booking, which is the "Book a demo" path superseded by the Assessment (`docs/governance/superseded-decisions.md`). The old URLs `/demo` and `/demo/walkthrough` now redirect permanently (308) to `/interactive-demo`. | None |
| 5 | Request Shipment | `bof-web/app/(bof)/customer-portal/request-shipment/page.tsx` | `/customer-portal/load-intake` | **SUPERSEDED** | On `main` it was only a redirect to load intake. `main`'s customer portal (June; one 1,210-line client component calling no APIs) is superseded by the branch's validated customer portal (Sept 2, `6f9d9c7b`). `/customer-portal/request-shipment` now redirects (308) to `/customer-portal/load-intake`. | None |

## Retiring `main`

Every unique product feature on `main` is now integrated, superseded with a redirect, or deliberately not ported for a stated reason (the misrouting rule in item 3).

Retiring `main` as a branch, or changing the repository's default branch, is an owner action on GitHub. It was not done here.
