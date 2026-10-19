# Recruiting & Onboarding: closure record

Date: 2026-10-19
Branch: `claude/website-recovery-20261018`

**Status:** development closed. Future Drivers and Safety work integrates through the handoff contract in §4. It does not reopen Recruiting.

## 1. Canonical implementation (one active version)

The full map is in `docs/architecture/BOF-CANONICAL-IMPLEMENTATION-REGISTER.md` §1.

| Area | Canonical |
|---|---|
| Recruiter UI | `/recruiting` (requisitions), `/recruiting/requisitions/[id]`, `/recruiting/workspace` (the Michael Anderson workspace) |
| Public UI | `/recruiting-onboarding`, `/careers`, and the `/demo/recruiting/**` demonstration, which uses the same screens and rules on an in-browser transport |
| APIs | `/api/recruiting/**` (requisitions, workspace, positions and intake, screening, disposition, openings, apply); `/api/recruiting-v2/**` (per-candidate documents and files, qualification, interviews, offer, onboarding, activation) |
| Services | `lib/services/requisitionService.ts`, `lib/services/requisitionRecruitingBridge.ts` (positions, pipeline, intake, openings), `lib/recruiting/*` (pure rules), `lib/recruiting-v2/*` (engines, tenant scope, activation) |

An inventory of every recruiting, onboarding, careers, candidate and requisition route, component, service and link found **no second active implementation**. Two related items are deliberately separate:
- `/apply` is the *carrier* application to BOF (fleet onboarding), not driver recruiting.
- `components/compliance-flow-pro/DriverOnboardingIntake.tsx` belongs to the Drivers/Safety qualification-file module (see §5).

## 2. Retired

**This round:**
- The live-API branch that attached fictional "bundled synthetic" PDFs to a candidate document record (`POST …/file` with `attachBundledSynthetic`). Its only caller was the removed V2 screens. **Reading** previously attached synthetic files still works, so existing records stay viewable.
- The unused `bundledSyntheticArtifact` helper.
- The public-demo link map sent anonymous `/recruiting` links to an archive page. It now points to the canonical `/demo/recruiting/workspace`.

**Earlier rounds** (all recoverable from Git):
- the `/recruiting-v2` screens (15 files);
- the browser-only `recruiting-store` and `recruiting-demo-data`;
- the careers flow that saved nothing;
- the manual position builder;
- the fake-success job-board adapters and hardcoded demo postings.

**Kept on purpose:** the per-candidate read endpoints under `/api/recruiting-v2/**` (GET qualification, documents, interviews, offer, onboarding, activation). They are the canonical per-candidate API, built on the same engines. The workspace reads in bulk through `/api/recruiting/workspace`.

## 3. Driver verification: what exists

| Capability | Status | Where | Connected to Recruiting? |
|---|---|---|---|
| FMCSA carrier verification (USDOT authority, insurance, safety) | **Implemented, real.** QCMobile provider (`FMCSA_QCMOBILE_WEBKEY`), cached in `FmcsaRegulatoryVerification`; a fixture provider is used outside production only; an "unavailable" provider applies otherwise. | `lib/services/fmcsa/**`, `/api/carriers/fmcsa-verification`, `FmcsaVerificationPanel` on carrier pages | Not applicable: this is **carrier-level**, not driver. Recruiting must not duplicate it. |
| Samba Intelligence findings | **Implemented, internal.** A rule engine over BOF's own records: FMCSA carrier rows, `DriverLicense` expiry, `DriverReadinessScore`, pickups, equipment. It has **no** external SambaSafety MVR-monitoring connection. | `lib/services/samba/**`, `/api/samba/**`, `SambaIntelligencePanel` | Indirectly: recruited drivers get readiness scores, which Samba reads. |
| Driver qualification | **Implemented.** Requirement-driven, plus license, medical, drug-test, work-history and accident/violation records. | `qualificationService`, `requirementService`, `workHistoryService` | **Yes**, via activation (§4). |
| Readiness and dispatch gate | **Implemented.** | `readinessService`, `dispatchAssignmentService` | **Yes**: dispatch reads only `DriverReadinessScore`. |
| Staff eligibility review (manual QUALIFIED/READY or NOT, with reason and audit) | **Implemented** (Drivers/Safety control) | `driverEligibilityReviewService`, `/api/dispatch/driver/[id]/eligibility` | Not called by Recruiting. Untouched. |
| MVR, PSP, Drug & Alcohol Clearinghouse, CDLIS, national medical registry (NRCME) | **Not implemented.** There is no external driver-level verification integration. Recruiting records these as verified *documents* and recruiter *confirmations*. | — | Integration requirement (§5). Nothing was invented. |

## 4. Handoff contract: Recruiting → Driver Qualification and Safety

At activation (`lib/recruiting-v2/driver-activation-service.ts`), in one transaction, Recruiting hands over the following and then **stops deciding**:

| Handed over | Record |
|---|---|
| Driver | `Driver` (ACTIVE in the carrier's fleet; tenancy checked) |
| Qualification file | `DriverIntake` at stage **QUALIFICATION_REVIEW** / IN_REVIEW, owned by Drivers/Safety from here |
| Documents | One `DriverDocument` per recruiting document. Types: CDL→DRIVER_LICENSE, MEDICAL→MEDICAL, EMPLOYMENT_VERIFICATION→WORK_HISTORY, I-9/W-9→IDENTITY_SUPPORTING, MVR/Clearinghouse/road test→OTHER. Each carries its verification status and `verificationExpiresAt`, with recruiting provenance in `verificationQuality`. |
| Verification requirements | `DriverIntakeRequirement` for DRIVER_LICENSE, MEDICAL and WORK_HISTORY, satisfied by the carried-over verified documents. Later expiry or rejection therefore disqualifies the driver. |
| Status | The candidate is marked ACTIVATED with the driver handoff (`readRecruitingV2DriverHandoff`). The requisition fill count updates. |

Activation then calls the **canonical** engines: `runPostActivationQualificationAndReadiness` → `evaluateQualification`/`writeQualificationSnapshot` → `evaluateReadiness`/`writeReadinessScore`. Recruiting contains **no** qualification, readiness, FMCSA, MVR, Clearinghouse or medical decision logic of its own.

Its pre-hire document gates and requisition screening decide only whether to **hire** (a candidate stage). They never write driver qualification or readiness.

**Recruiting completion does not qualify a driver and cannot override dispatch** (verified again today on the final build):
1. Newly activated → NOT QUALIFIED (work history incomplete) → dispatch 409.
2. Employer recorded but medical expired → NOT QUALIFIED (DOCUMENT_EXPIRED) → 409.
3. All requirements met → QUALIFIED / READY → 200.

## 5. Remaining dependencies on Drivers and Safety (integration requirements, not built here)

1. **No write path for `DriverLicense` and `MedicalQualification`.** No service creates these records; only seed data does. Samba's expired-credential findings and the requirement engine's advance-expiry windows read them.
   - When Drivers/Safety defines the canonical write service, activation should call it with the CDL class, state and expiry, and the medical expiry.
   - Recruiting stores only a **masked** CDL number, so the full number must come from the Drivers/Safety intake.
2. **External verifications** (MVR, PSP, Clearinghouse queries, CDLIS, NRCME) need provider agreements and credentials and a Drivers/Safety service boundary. Recruiting will consume their results through the qualification requirements; it will not call providers itself.
3. **Live driver safety view:** `/drivers/[id]/safety` reads demo data, so the workspace links real drivers to `/drivers/[id]`. Which Safety implementation becomes canonical is pending the independent review.
4. **Orphaned component** `components/compliance-flow-pro/DriverOnboardingIntake.tsx`: no importers. Left untouched for the Drivers/Safety review.
5. **Employment history** is entered by staff on `/drivers/[id]` (`workHistoryService`). Drivers/Safety may later derive it from verified employment-verification documents.
6. **Two carrier models** (demo `carrier-registry` vs Prisma `Fleet`) affect carrier pages, not Recruiting (GAP-020).

## 6. Tests on the final code (local nonproduction)

| Suite | Result |
|---|---|
| Typecheck, production build, preservation check | Clean, pass, pass (87 recovered pages, no superseded wording) |
| Unit and route tests (`requisition-integration`, `work-history-input`, `recruiting-workspace-route`, `route-access`) | 19 / 19 |
| On `bof_dev`: contact (3 suites), requisition persistence and hardening, requirement evidence, eligibility/Samba boundary | 28 / 28 |
| Under `tsx`: dispatch safety and concurrency, activation service and presentation, candidate-access certification, FMCSA certification and normalization | 34 / 34 |
| Recruiting V2 tenancy | 9 / 9 |
| Browser, signed in: 21-step requisition → activation flow | 21 / 21 |
| Browser: careers intake, document upload/view (no file bytes sent), payroll preview, retired V2 route (404) | Pass |
| Browser: qualification and dispatch handoff, including the negative leg and the access checks (another carrier 404, fleet ops 403, anonymous 401) | Pass |
| Browser, anonymous: demonstration (19 steps), five stage links, contact (validation, save, honeypot, staff-only, server error, mobile) | Pass |
| Release verification script | 16 / 16 |

Lint shows 4 warnings, all in `components/dispatch/LoadDeliveryScreen.tsx`, which this work does not touch.

## 7. Production release

**Ready as a release candidate; awaiting authorized deployment.** Follow `docs/release/PRODUCTION-RELEASE-PACKAGE-2026-10-19.md`:
1. Record the baseline (read-only).
2. Run `prisma migrate status`.
3. Apply the three additive migrations with approval (`migrate deploy` only, after a restore point).
4. Run the pre-release checks.
5. `vercel deploy --prod`.
6. Run the read-only verification.
7. Rollback is "Promote" of the previous deployment; no schema rollback is needed.

No migration was added in this closure round.

## 8. Historical demonstration candidates restored (pre-release check, 2026-10-19)

**Finding.** The consolidation lost **Sarah Mitchell (CAND-002)**, and Michael Anderson's historical state was not preserved:
- The Recruiting V2 demo data (`lib/recruiting-v2/recruiting-v2-demo-data.ts`, removed in `cfdbd24c`) defined both candidates.
- The consolidated demonstration seeded only an approved requisition with no candidates.
- The acceptance scripts had also reused the name "Sarah Mitchell" for an invented Class B rejection scenario, which does not represent the historical Sarah. That scenario now uses "Dana Whitfield (fictional)", and the earlier screenshots that show the name are superseded by this record.

**Restoration** (in the canonical module only; no second Recruiting implementation). `lib/recruiting/demo-backend.ts` now seeds both historical candidates by **replaying the real workflow requests** through the demonstration's own rules, so their states are earned, not hand-set. `lib/recruiting/demo-stages.ts` reuses the same seed instead of keeping its own replay.

| | Michael Anderson | Sarah Mitchell |
|---|---|---|
| ID / workspace | CAND-001, `/demo/recruiting/workspace?candidateId=CAND-001` | CAND-002, `/demo/recruiting/workspace?candidateId=CAND-002` |
| Requisition (historical position) | BOF-HR-DRV-001, CDL-A Regional Reefer, Cleveland, OH (V2 `POSITION-CLASS-A-CLE`) | BOF-HR-DRV-002, CDL-A Local Shuttle, Dallas, TX (V2 `POSITION-CLASS-A-DAL`) |
| Profile | Class A, OH, 4 years | Class A, TX, 3 years |
| Application | Complete | Complete |
| Qualification / documents / compliance | All 8 document gates verified → READY | No documents collected → gates BLOCKED |
| Interview | Structured interview recorded: Proceed | Not scheduled (the structured interview form is available) |
| Offer | Prepared, sent, accepted | **Not provided**: blocked until qualification is complete |
| Onboarding | Complete | Pending (not eligible) |
| Activation | Ready (simulated in the demonstration) | Not available |

These match V2's `READY`/`COMPLETE` for Michael and `BLOCKED`/`NOT_PROVIDED`/`PENDING` for Sarah.

The `/recruiting-onboarding` stage links reseed Michael at the chosen stage and keep Sarah unchanged. "Reset demonstration" restores both. The demonstration storage key moved to `bof-recruiting-demo-v2`, so returning visitors get the restored seed.

**Production safety:**
- Both candidates exist only in the visitor's browser (the demonstration transport). No seed, migration or script writes candidate rows to a database (searched: `prisma/`, `scripts/`, `lib/`).
- In live (signed-in) mode, the workspace's "Use fictional candidate Michael Anderson" prefill is offered only when no Michael is present.

**Release check (cannot be run from here):** if production still holds rows created through the old V2 APIs (the Oct 17 gap register cites `GET /api/recruiting-v2/activation/CAND-001` on production), run this read-only query:

```sql
select "candidateCode", "fullName", "applicationSummary"->'tenant' from "Candidate" order by "createdAt";
```

Then decide whether those legacy demo rows should stay. New candidates continue numbering after the highest existing code.

**Focused regression:** `historical-candidates` browser suite, 26 of 26. Screenshots are in `docs/recovery/evidence/historical-candidates-2026-10-19/`.
