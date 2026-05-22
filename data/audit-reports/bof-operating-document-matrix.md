# BOF Operating Document Matrix (Read-Only Planning)

## Executive Summary

- Core BOF load documents are broadly in place and generated per-load under `public/generated/loads/L###/`.
- Claims/insurance/factoring/settlement/legal/vendor documents are partially present as generated artifacts, partially present only in template registry (`lib/bof-template-system.ts`), and partially missing.
- Current runtime doc model is load-centric (`public/generated/loads/...`) with evidence split under `public/evidence/loads/...`.
- No dedicated generated roots currently exist for `claims`, `settlements`, `factoring`, `agreements`, or `vendors`.
- One-off hardcoded path logic still exists (notably L004 seal delivery).

Status legend used below:
- `exists_generated`
- `exists_template_only`
- `exists_registry_only`
- `exists_evidence_only`
- `missing`
- `duplicate_or_scattered`

---

## A) Core Load / Dispatch

| Category | Document Type | Business Purpose | Current Status | Current Path or Registry Key | Scope | Linked in UI | UI Surface | Consumers (canonicalEvidence/tripPacket/loadProof/dispatchLib/claimsPanel/settlementsDrawer/templateWorkspace) | Recommended Canonical Destination | Recommended Action | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Core Load / Dispatch | Rate Confirmation | Contracted rate baseline for dispatch + billing | exists_generated | `public/generated/loads/L###/rate-confirmation.html`; template `scripts/templates/load-docs/rate-confirmation.template.html` | load-specific | Yes | `components/dispatch/LoadDocumentsLibraryEnhanced.tsx`, `DocumentationReadinessPanel.tsx` | N/Y/Y/Y/N/Y/Y | `public/generated/loads/L###/rate-confirmation.html` | leave_as_is | P1 demo-critical |
| Core Load / Dispatch | BOL | Custody and shipment control doc | exists_generated | `public/generated/loads/L###/bol.html`; template `bol.template.html` | load-specific | Yes | Dispatch load docs + settlement detail | N/Y/Y/Y/N/Y/Y | `public/generated/loads/L###/bol.html` | leave_as_is | P1 demo-critical |
| Core Load / Dispatch | POD | Delivery completion + payment release proof | exists_generated | `public/generated/loads/L###/pod.html`; template `pod.template.html` | load-specific | Yes | Dispatch load docs + settlement detail | N/Y/Y/Y/N/Y/Y | `public/generated/loads/L###/pod.html` | leave_as_is | P1 demo-critical |
| Core Load / Dispatch | Dispatch Sheet / Load Assignment | Driver/load assignment operating sheet | exists_generated | `public/generated/loads/L###/work-order.html`; template `work-order.template.html`; registry key `driver-assignment-packet` | load-specific | Yes | Dispatch load docs | N/Y/Y/Y/N/Y/Y | `public/generated/loads/L###/work-order.html` + `public/generated/dispatch/L###/assignment-packet.html` (future split) | promote_to_generated_artifact | P2 credibility/polish |
| Core Load / Dispatch | Trip Packet / Shipper Packet | Consolidated trip-facing packet | exists_generated | `public/generated/loads/L###/shipper-packet.html` | load-specific | Yes | `DocumentationReadinessPanel.tsx` | N/Y/Y/Y/N/Y/N | `public/generated/loads/L###/shipper-packet.html` | leave_as_is | P1 demo-critical |
| Core Load / Dispatch | Invoice | Billing artifact for AR/factoring | exists_generated | `public/generated/loads/L###/invoice.html`; template `invoice.template.html` | load-specific | Yes | Dispatch docs, settlement flows | N/Y/Y/Y/N/Y/Y | `public/generated/loads/L###/invoice.html` (future also `generated/factoring/L###/`) | leave_as_is | P1 demo-critical |
| Core Load / Dispatch | Settlement Summary | Settlement-ready rollup for finance review | exists_registry_only | registry key `billing-packet-cover` in `lib/bof-template-system.ts`; no dedicated generated settlement summary file observed | settlement-specific | Partial | `components/settlements-payroll/SettlementDetailDrawer.tsx` (UI exists, not standardized generated artifact) | N/N/Y/N/N/Y/Y | `public/generated/settlements/L###/settlement-summary.html` | create_template | P1 demo-critical |

---

## B) Claims / Insurance / Incident

| Category | Document Type | Business Purpose | Current Status | Current Path or Registry Key | Scope | Linked in UI | UI Surface | Consumers (canonicalEvidence/tripPacket/loadProof/dispatchLib/claimsPanel/settlementsDrawer/templateWorkspace) | Recommended Canonical Destination | Recommended Action | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Claims / Insurance / Incident | Insurance Notification / Notice to Insurance Carrier | Notify insurer of claim-sensitive event | exists_generated | `public/generated/loads/L###/insurance-notification.html`; template `insurance-notification.template.html` | load/claim-specific | Yes | Dispatch packet panel + claim flows | N/Y/Y/Y/Y/Y/Y | `public/generated/claims/L###/insurance-notification.html` | consolidate_duplicate_paths | P1 demo-critical |
| Claims / Insurance / Incident | Insurance Claim Form / Claim Intake | Initial claim intake and triage form | exists_generated | `public/generated/loads/L###/claim-intake.html`; template `claim-intake.template.html` | claim-specific | Yes | `components/ClaimPacketPanel.tsx`, dispatch docs | N/Y/Y/Y/Y/Y/Y | `public/generated/claims/L###/claim-intake.html` | consolidate_duplicate_paths | P1 demo-critical |
| Claims / Insurance / Incident | Claim Packet | Consolidated insurer/claims support packet | exists_generated | `public/generated/loads/L###/claim-packet.html`; template `claim-packet.template.html` | claim-specific | Yes | Claim panel + dispatch packet links | N/Y/Y/Y/Y/Y/Y | `public/generated/claims/L###/claim-packet.html` | consolidate_duplicate_paths | P1 demo-critical |
| Claims / Insurance / Incident | Damage Photo Packet | Curated damage evidence bundle | exists_generated | `public/generated/loads/L###/damage-photo-packet.html`; template `damage-photo-packet.template.html` | claim-specific | Yes | Dispatch/claim packet surfaces | Y/Y/Y/Y/Y/Y/Y | `public/generated/claims/L###/damage-photo-packet.html` | consolidate_duplicate_paths | P1 demo-critical |
| Claims / Insurance / Incident | Seal Verification / Seal Discrepancy Report | Seal chain-of-custody validation and mismatch handling | exists_generated | `public/generated/loads/L###/seal-verification.html`; template `seal-verification.template.html` | load/claim-specific | Yes | Dispatch doc library + readiness panel | Y/Y/Y/Y/N/Y/Y | `public/generated/claims/L###/seal-verification.html` (claim context) + load copy | leave_as_is | P1 demo-critical |
| Claims / Insurance / Incident | Accident Report | Formal accident narrative/report | exists_registry_only | registry concept via `incident-report`/claims pack keys in `lib/bof-template-system.ts`; no generated artifact found | claim-specific | No | N/A | N/N/N/N/N/N/Y | `public/generated/claims/L###/accident-report.html` | create_template | P1 demo-critical |
| Claims / Insurance / Incident | Incident Report | Formal incident documentation | exists_registry_only | template key `incident-report` in `lib/bof-template-system.ts`; not emitted in load-doc templates | claim-specific | No | N/A | N/N/N/N/N/N/Y | `public/generated/claims/L###/incident-report.html` | promote_to_generated_artifact | P1 demo-critical |
| Claims / Insurance / Incident | Driver Statement | Driver statement for claim/incident investigation | missing | no generated/template key observed in load-doc templates | claim-specific | No | N/A | N/N/N/N/N/N/N | `public/generated/claims/L###/driver-statement.html` | create_template | P1 demo-critical |
| Claims / Insurance / Incident | Photo Evidence Log | Index of evidence files and provenance | missing | no explicit generated artifact; evidence manifests exist (`load-evidence-manifest.json`) but no human-facing log doc | claim/load-specific | No | N/A | Y/N/N/N/N/N/N | `public/generated/claims/L###/photo-evidence-log.html` | create_template | P1 demo-critical |
| Claims / Insurance / Incident | COI Request | Request certificate of insurance | exists_registry_only | registry key `insurance-notice-coi` (`lib/bof-template-system.ts`) | customer/claim-specific | No | N/A | N/N/N/N/N/N/Y | `public/generated/agreements/{customerId}/coi-request.html` | promote_to_generated_artifact | P2 credibility/polish |
| Claims / Insurance / Incident | Additional Insured Request | Endorsement/additional insured request | exists_registry_only | registry key `additional-insured-request` | customer/claim-specific | No | N/A | N/N/N/N/N/N/Y | `public/generated/agreements/{customerId}/additional-insured-request.html` | promote_to_generated_artifact | P2 credibility/polish |
| Claims / Insurance / Incident | Facility Insurance Notice | Facility-specific insurance requirement notice | exists_registry_only | registry key `facility-insurance-notice` | facility/customer-specific | No | N/A | N/N/N/N/N/N/Y | `public/generated/agreements/{customerId}/facility-insurance-notice.html` | promote_to_generated_artifact | P2 credibility/polish |

---

## C) Factoring / Finance / Collections

| Category | Document Type | Business Purpose | Current Status | Current Path or Registry Key | Scope | Linked in UI | UI Surface | Consumers (canonicalEvidence/tripPacket/loadProof/dispatchLib/claimsPanel/settlementsDrawer/templateWorkspace) | Recommended Canonical Destination | Recommended Action | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Factoring / Finance / Collections | Factoring Notification / Notice to Factoring Company | Notify factor of invoice/assignment context | exists_generated | `public/generated/loads/L###/factoring-notification.html`; template `factoring-notification.template.html` | factoring-specific | Yes | Dispatch readiness/docs | N/Y/Y/Y/N/Y/Y | `public/generated/factoring/L###/factoring-notification.html` | consolidate_duplicate_paths | P1 demo-critical |
| Factoring / Finance / Collections | Factoring Submission Cover Sheet | Cover sheet for factor package submission | exists_registry_only | closest registry key `billing-packet-cover`; no explicit factoring cover generated | factoring-specific | No | N/A | N/N/N/N/N/N/Y | `public/generated/factoring/L###/factoring-submission-cover.html` | create_template | P1 demo-critical |
| Factoring / Finance / Collections | Invoice Assignment Notice | Notice of receivable assignment | missing | no dedicated generated/template key observed | factoring-specific | No | N/A | N/N/N/N/N/N/N | `public/generated/factoring/L###/invoice-assignment-notice.html` | create_template | P2 credibility/polish |
| Factoring / Finance / Collections | Billing Packet | Billing packet rollup | exists_generated | `public/generated/loads/L###/billing-packet.html` | settlement/factoring-specific | Yes | Dispatch readiness panel | N/Y/Y/Y/N/Y/N | `public/generated/settlements/L###/billing-packet.html` + factoring copy | consolidate_duplicate_paths | P1 demo-critical |
| Factoring / Finance / Collections | Customer Billing Dispute Letter | Formal dispute correspondence | missing | no generated/template key observed | customer-specific | No | N/A | N/N/N/N/N/N/N | `public/generated/factoring/L###/billing-dispute-letter.html` | create_template | P2 credibility/polish |
| Factoring / Finance / Collections | Settlement Hold Notice | Hold communication and reasoning | exists_generated | `public/generated/loads/L###/settlement-hold-notice.html`; template `settlement-hold-notice.template.html` | settlement-specific | Yes | Dispatch readiness, settlements review | N/Y/Y/Y/N/Y/Y | `public/generated/settlements/L###/settlement-hold-notice.html` | consolidate_duplicate_paths | P1 demo-critical |
| Factoring / Finance / Collections | Lumper Reimbursement Support | Reimbursement proof wrapper for lumper charges | exists_template_only | `scripts/templates/load-docs/lumper-receipt.template.html`; currently mostly evidence-only in runtime | load/settlement-specific | Partial | Settlement detail / proof flows (data-driven) | Y/Y/Y/Y/N/Y/Y | `public/generated/settlements/L###/lumper-reimbursement-support.html` + `public/evidence/loads/L###/lumper-receipt.*` | promote_to_generated_artifact | P1 demo-critical |
| Factoring / Finance / Collections | Detention Support | Accessorial/detention backup | exists_registry_only | registry key `detention-layover-request` in template system; no generated load-doc artifact | settlement-specific | Partial | Settlement narratives only | N/N/Y/N/N/Y/Y | `public/generated/settlements/L###/detention-support.html` | promote_to_generated_artifact | P2 credibility/polish |

---

## D) Customer / Legal / Agreement

| Category | Document Type | Business Purpose | Current Status | Current Path or Registry Key | Scope | Linked in UI | UI Surface | Consumers (canonicalEvidence/tripPacket/loadProof/dispatchLib/claimsPanel/settlementsDrawer/templateWorkspace) | Recommended Canonical Destination | Recommended Action | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Customer / Legal / Agreement | Master Agreement Reference | Legal/commercial reference for load | exists_generated | `public/generated/loads/L###/master-agreement-reference.html`; template `master-agreement-reference.template.html` | customer/load-specific | Yes | Dispatch docs/readiness | N/Y/Y/Y/N/Y/Y | `public/generated/agreements/{contractId}/master-agreement-reference.html` | consolidate_duplicate_paths | P2 credibility/polish |
| Customer / Legal / Agreement | Master Services Agreement | Full MSA artifact | exists_registry_only | keys around carrier-broker/master agreement in `lib/bof-template-system.ts`; no standalone generated MSA artifact found | customer-specific | No | N/A | N/N/N/N/N/N/Y | `public/generated/agreements/{contractId}/master-services-agreement.html` | create_template | P2 credibility/polish |
| Customer / Legal / Agreement | Work Order | Operational assignment/scope of work line-item | exists_generated | `public/generated/loads/L###/work-order.html`; template `work-order.template.html` | load-specific | Yes | Dispatch docs/readiness | N/Y/Y/Y/N/Y/Y | `public/generated/loads/L###/work-order.html` | leave_as_is | P1 demo-critical |
| Customer / Legal / Agreement | Statement of Work | Scope and obligations statement | exists_registry_only | template system concepts (`service-schedule-work-order`) but no dedicated emitted SOW artifact | customer/load-specific | No | N/A | N/N/N/N/N/N/Y | `public/generated/agreements/{contractId}/statement-of-work.html` | create_template | P2 credibility/polish |
| Customer / Legal / Agreement | Schedule | Service/trip schedule formal document | exists_registry_only | registry key `trip-schedule` in template system; no emitted dedicated schedule file in generated loads | load/customer-specific | Partial | Dispatch/intake logic only | N/Y/Y/Y/N/N/Y | `public/generated/agreements/{contractId}/schedule.html` or `generated/loads/L###/schedule.html` | promote_to_generated_artifact | P2 credibility/polish |

---

## E) Vendor / Maintenance / Operations

| Category | Document Type | Business Purpose | Current Status | Current Path or Registry Key | Scope | Linked in UI | UI Surface | Consumers (canonicalEvidence/tripPacket/loadProof/dispatchLib/claimsPanel/settlementsDrawer/templateWorkspace) | Recommended Canonical Destination | Recommended Action | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Vendor / Maintenance / Operations | Small Vendor Contract | Legal agreement for small vendors | missing | no generated/template key observed | vendor-specific | No | N/A | N/N/N/N/N/N/N | `public/generated/vendors/{vendorId}/small-vendor-contract.html` | create_template | P2 credibility/polish |
| Vendor / Maintenance / Operations | Vendor Onboarding Packet | Vendor setup package | missing | no generated/template key observed | vendor-specific | No | N/A | N/N/N/N/N/N/N | `public/generated/vendors/{vendorId}/vendor-onboarding-packet.html` | create_template | P2 credibility/polish |
| Vendor / Maintenance / Operations | Vendor W-9 / ACH Authorization | Vendor tax + payment authorization | missing | no non-driver vendor artifact observed (driver W-9/bank handled elsewhere) | vendor-specific | No | N/A | N/N/N/N/N/N/N | `public/generated/vendors/{vendorId}/vendor-w9-ach-authorization.html` | create_template | P1 demo-critical |
| Vendor / Maintenance / Operations | Maintenance Vendor Authorization | Authorize maintenance vendor work | missing | no generated/template key observed | vendor/maintenance-specific | No | N/A | N/N/N/N/N/N/N | `public/generated/vendors/{vendorId}/maintenance-vendor-authorization.html` | create_template | P2 credibility/polish |
| Vendor / Maintenance / Operations | Repair Approval Form | Approve repair spend/work | missing | no generated/template key observed | vendor/maintenance-specific | No | N/A | N/N/N/N/N/N/N | `public/generated/vendors/{vendorId}/repair-approval-form.html` | create_template | P2 credibility/polish |
| Vendor / Maintenance / Operations | Certificate of Insurance Request | COI request to vendor/facility | exists_registry_only | related insurance registry keys (COI/additional insured/facility notice) only | vendor/customer-specific | No | N/A | N/N/N/N/N/N/Y | `public/generated/vendors/{vendorId}/coi-request.html` | promote_to_generated_artifact | P2 credibility/polish |

---

## Demo Operating-Document Pack Recommendation

### Pack 1: L004 Seal Discrepancy Package
- **Target:** `L004`
- **Include:** Seal Verification, POD, BOL, Claim Intake, Claim Packet, Insurance Notification, Damage Photo Packet, Settlement Hold Notice (if applicable).
- **Exists now:** Yes for all core claim docs under `public/generated/loads/L004/` + evidence under `public/evidence/loads/L004/`.
- **Reuse files:** `seal-verification.html`, `claim-intake.html`, `claim-packet.html`, `insurance-notification.html`, `damage-photo-packet.html`, `pod.html`, `bol.html`.
- **Missing templates:** none for current demo package.
- **UI link surfaces:** Dispatch readiness panel + load documents library + claim panel + settlements drawer.

### Pack 2: L003 Lumper + Claim Support
- **Target:** `L003`
- **Include:** Claim Packet, Claim Intake, Damage Photo Packet, Lumper Reimbursement Support.
- **Exists now:** claim docs generated; lumper support currently template/evidence-first (not clean generated packet artifact).
- **Reuse files:** `public/generated/loads/L003/claim-*.html`, `damage-photo-packet.html`, evidence in `public/evidence/loads/L003/`.
- **Missing templates to create/promote:** dedicated lumper reimbursement support artifact generation.
- **UI surface:** Dispatch docs/readiness + settlements drawer.

### Pack 3: L008 Lumper + Claim Support
- **Target:** `L008`
- **Include:** Lumper Reimbursement Support, Claim Support docs where claim context exists.
- **Exists now:** mixed; claim docs less complete than L003/L004 family.
- **Reuse files:** `public/generated/loads/L008/*` where available; evidence in `public/evidence/loads/L008/`.
- **Missing templates:** lumper support promotion + claim-support packet promotion for this storyline.
- **UI surface:** Dispatch docs + settlements.

### Pack 4: L009 Insurance Claim Package
- **Target:** `L009`
- **Include:** Claim Intake, Claim Packet, Insurance Notification, Photo Evidence Log (new), Seal Discrepancy context.
- **Exists now:** claim/insurance generated set present.
- **Reuse files:** `public/generated/loads/L009/claim-intake.html`, `claim-packet.html`, `insurance-notification.html`, plus evidence assets.
- **Missing templates:** explicit photo evidence log template.
- **UI surface:** claim panel + dispatch docs.

### Pack 5: Customer Agreement Pack
- **Target:** one customer (suggest `customerId` tied to L004/L009 account)
- **Include:** Master Agreement, Schedule, Work Order.
- **Exists now:** master-agreement-reference + work-order generated by load; MSA/Schedule only registry-level.
- **Reuse files:** `public/generated/loads/L###/master-agreement-reference.html`, `work-order.html`.
- **Missing templates:** full MSA + schedule artifact.
- **UI surface:** documents/template workspace now; add links later in dispatch/customer setup surfaces.

### Pack 6: Vendor Ops Pack
- **Target:** one vendor (maintenance vendor pilot)
- **Include:** Small Vendor Contract, Vendor W-9/ACH, Repair Approval, Maintenance Vendor Authorization.
- **Exists now:** not as generated non-driver operating docs.
- **Reuse files:** none canonical in current tree.
- **Missing templates:** all listed.
- **UI surface:** documents/template workspace first, then maintenance/settlement flows.

### Pack 7: Factoring Flow Pack
- **Target:** one factoring flow (suggest `L011` or `L012`)
- **Include:** Factoring Notification, Factoring Submission Cover, Invoice Assignment Notice, Invoice.
- **Exists now:** factoring notification + invoice generated; cover + assignment notice missing.
- **Reuse files:** `public/generated/loads/L###/factoring-notification.html`, `invoice.html`.
- **Missing templates:** factoring submission cover + invoice assignment notice.
- **UI surface:** dispatch readiness + settlements/factoring views (future).

---

## Path Consistency Audit

### Observed current state
- Most generated operating docs live under `public/generated/loads/L###/`.
- Most proof/evidence lives under `public/evidence/loads/L###/`.
- Dedicated folders absent today:
  - `public/generated/claims/`
  - `public/generated/settlements/`
  - `public/generated/factoring/`
  - `public/generated/agreements/`
  - `public/generated/vendors/`

### Flagged issues
- **One-off hardcoded path:** L004 special-case path in `lib/canonical-load-evidence.ts` for seal delivery.
- **Domain mixing:** claim/factoring/settlement docs emitted under load folder instead of domain folders.
- **Evidence/doc split drift risk:** both `load-doc-manifest` and `load-evidence-manifest` include overlapping narrative artifacts.
- **Duplicate/scattered representation:** template registry lists many docs not emitted by load-doc generator templates.

### Linked in UI but potentially fragile
- Dispatch and readiness surfaces rely on stable generated-load paths and packet manifests.
- Registry-only docs are visible in template workspace logic but not emitted as standard generated artifacts.

---

## Implementation Plan (No Changes Applied)

### P1 Demo-Critical
- Promote/generate:
  - Settlement Summary (`settlement-summary.html`)
  - Lumper Reimbursement Support artifact
  - Accident Report
  - Incident Report
  - Driver Statement
  - Photo Evidence Log
  - Factoring Submission Cover Sheet
  - Vendor W-9 / ACH Authorization
- Keep existing core set in place:
  - rate confirmation, BOL, POD, work order, invoice, claim intake, claim packet, insurance notification, seal verification.

### P2 Credibility/Polish
- Promote registry-only insurance/legal docs:
  - COI Request, Additional Insured Request, Facility Insurance Notice
  - Master Services Agreement, Statement of Work, Schedule
  - Invoice Assignment Notice, Billing Dispute Letter
  - Vendor onboarding + maintenance authorization + repair approval + small vendor contract
- Start domain folder split for new generation:
  - claims/settlements/factoring/agreements/vendors

### P3 Future Operating Library
- Expand reusable vendor/customer packs and governance docs.
- Add richer conditional pack assembly across customer/vender/factoring scenarios.

---

## Recommended Canonical Folder Taxonomy

- `public/generated/loads/L###/` (core load docs only)
- `public/generated/claims/L###/` (claim/incident/insurance packet docs)
- `public/generated/settlements/L###/` (settlement summary/hold/reimbursement support)
- `public/generated/factoring/L###/` (factoring notice/cover/assignment)
- `public/generated/agreements/{customerId|contractId}/` (MSA/SOW/schedule/COI/additional insured)
- `public/generated/vendors/{vendorId}/` (vendor onboarding/contract/W-9/ACH/maintenance authorization/repair approval)
- `public/evidence/loads/L###/` (operational proof media)
- `public/evidence/claims/L###/` (claim-specific media/log derivatives, optional future split)

---

## Exact Next Tasks

### Next generation/backfill tasks (docs)
1. Add missing templates for P1 docs (accident, incident, driver statement, evidence log, factoring cover, settlement summary, vendor W-9/ACH, lumper support wrapper).
2. Extend generator/manifest mapping to output these docs in canonical domain folders.
3. Add validation scripts for required doc presence per demo pack scenario.

### Next wiring tasks
1. Wire new generated docs into:
   - Dispatch doc library rows
   - Claims panel
   - Settlements drawer
   - Documents/template workspace
2. Add conditional links based on load story (seal mismatch, claim context, lumper context, factoring context).

### Risks / Unknowns
- Registry definitions and generated template sets are currently out of sync.
- Domain-folder migration risks breaking current links if manifests are not bridged.
- Special-case hardcoded path handling can reintroduce missing-file false negatives if not normalized.

---

## P1 Backfill Status Update (Implemented)

Execution pass: `scripts/backfill-p1-operating-docs.mjs` (deterministic date `2026-05-04`), output manifest `public/generated/operating-doc-manifest.json`.

### Before -> After (P1 rows only)

- **Settlement Summary (`P1`)**: `exists_registry_only` -> `exists_generated` at:
  - `public/generated/settlements/L003/settlement-summary.html`
  - `public/generated/settlements/L004/settlement-summary.html`
  - `public/generated/settlements/L008/settlement-summary.html`
  - `public/generated/settlements/L009/settlement-summary.html`
- **Lumper Reimbursement Support (`P1`)**: `exists_template_only` -> `exists_generated` at:
  - `public/generated/settlements/L003/lumper-reimbursement-support.html`
  - `public/generated/settlements/L008/lumper-reimbursement-support.html`
- **Accident Report (`P1`)**: `exists_registry_only` -> `exists_generated` for `L003`, `L004`, `L008`, `L009` under `public/generated/claims/L###/accident-report.html`
- **Incident Report (`P1`)**: `exists_registry_only` -> `exists_generated` for `L003`, `L004`, `L008`, `L009` under `public/generated/claims/L###/incident-report.html`
- **Driver Statement (`P1`)**: `missing` -> `exists_generated` for `L003`, `L004`, `L008`, `L009` under `public/generated/claims/L###/driver-statement.html`
- **Photo Evidence Log (`P1`)**: `missing` -> `exists_generated` for `L003`, `L004`, `L008`, `L009` under `public/generated/claims/L###/photo-evidence-log.html`
- **Factoring Submission Cover Sheet (`P1`)**: `exists_registry_only` -> `exists_generated` at:
  - `public/generated/factoring/L011/factoring-submission-cover.html`
- **Vendor W-9 / ACH Authorization (`P1`)**: `missing` -> `exists_generated` at:
  - `public/generated/vendors/VEND-001/vendor-w9-ach-authorization.html`

### P1 Promotions (old paths preserved)

- Promoted claim docs for targeted claim loads to canonical claims folders (copies, not moves):
  - `insurance-notification.html`, `claim-intake.html`, `claim-packet.html`, `damage-photo-packet.html`, `seal-verification.html`
  - Paths: `public/generated/claims/L003|L004|L009/...`, plus `seal-verification.html` for `L008`
- Promoted factoring docs for demo flow `L011` to canonical factoring folder:
  - `public/generated/factoring/L011/factoring-notification.html`
  - `public/generated/factoring/L011/invoice.html`

### Intentionally not created in this P1-only pass

- P2/P3 rows remain deferred by design: COI/Additional Insured/Facility Notice, MSA/SOW/Schedule, Invoice Assignment Notice, Billing Dispute Letter, Small Vendor Contract, Maintenance Vendor Authorization, Repair Approval Form, Vendor Onboarding Packet.
- Customer agreement pack wiring and non-P1 artifact creation deferred to next pass to keep this change set within strict P1 scope.

