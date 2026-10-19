# Checkpoint 1 — source findings (1A) and Business Operations correction (1B)

Branch `claude/website-recovery-20261018`, building on `6efff449`. Working tree was clean. There are two
worktrees: this one and `/home/user/backofficefleet` (`claude/loving-allen-zr8loh`), which was not touched.
No production deployment, no production data, no migrations.

## 1A. Where the most advanced work is

**Search coverage:**
- All 41 remote branches and both worktrees.
- `recovered/` archives.
- Commit messages and code history (`-S`) for 2026-08-15 → 2026-10-18.
- The current tree.

**Not searchable:** Copilot conversation history and uncommitted work on other machines.

### Why the previous recovery looked shallow

The advanced recruiting work was never in the static marketing site that the previous recovery mined
(`Website/*` and the August fork). It lives in the signed-in Next.js application, which is database-backed:
- requisitions: `/recruiting`, `/recruiting/requisitions/*`
- Recruiting V2: `/recruiting-v2/*`
- driver intake: `/intake/*`

The previous recovery linked the public site to the July marketing page
`/business-operations/hr-tier/recruiting-onboarding`. That page has a browser-only pipeline widget and
starts at "interest", not at the staffing requirement. Nothing advanced was deleted. It was simply never
made visible to the public.

### Recruiting: strongest implementation of each stage (all in HEAD; no branch has anything newer)

| Stage | Strongest implementation | Date / commit | What it really does | Missing |
|---|---|---|---|---|
| Staffing requirement & requisition | `components/recruiting/RequisitionFormClient.tsx`, `RequisitionListClient.tsx`, `lib/services/requisitionService.ts`, `lib/recruiting/requisition-{fields,transitions}.ts`, `app/api/recruiting/requisitions/**`, tests `lib/services/requisition-*.test.ts` | 2026-09-18 `02705000` ("requisition front door") | 11-section form, about 60 fields (carrier/USDOT/MC, position, CDL class and endorsements, PSP/Clearinghouse/medical/drug/background/TSA, pay, HOS cycle, sourcing, budget). Lifecycle DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → FILLED, plus ON_HOLD and CANCELLED. Multi-role approvals (requesting manager, safety director for CDL roles, owner/GM, BOF account manager, BOF HR). Approval marks the requisition READY_FOR_RECRUITING. | Nothing consumes READY_FOR_RECRUITING. Requisitions are not linked to candidates. Signed-in only. |
| Recruiting queue & pipeline | V2 `components/recruiting-v2/RecruitingV2App.tsx`, `RecruitingV2WorkflowRows.tsx`. V1 `components/recruiting/RecruitingPageClient.tsx` (1,159 lines: pipeline, position builder, job distribution, candidate detail, onboarding tabs) | V1 2026-08-29 `9cf71b4d`; V2 2026-09-02 `6f9d9c7b` (+09-03, 09-07, 10-17) | V2 stages: APPLICANT → QUALIFICATION → INTERVIEW → DOCUMENT_REVIEW → COMPLIANCE → OFFER → ONBOARDING → DRIVER_ACTIVATION_READY → ACTIVATED | V1 keeps everything in the browser. V2 has no candidate list query. |
| Screening | V1 credential checks; V2 `lib/recruiting-v2/qualification-engine.ts`, `document-gate-engine.ts` | 09-02 / 09-03 | Document gates (CDL, MVR, medical, Clearinghouse, I-9, W-9, road test, employment verification) combined with interview state give READY, PENDING or BLOCKED | The requisition's screening requirements are not applied to candidates |
| **Interview** | `app/api/recruiting-v2/interviews/[candidateId]/route.ts`, `components/recruiting-v2/RecruitingV2InterviewApiPanel.tsx`, Prisma `Interview` (score, recommendation, categoryScores, notes, interviewers, auditTrail) | 2026-09-02 `6f9d9c7b` | Schedules an interview. Recommendation (ADVANCE, HOLD_FOR_REVIEW, DO_NOT_ADVANCE) gates qualification and therefore the offer. The demo record carries a completed interview with category scores ("Safety judgment", "Route discipline", "Documentation habits"). | **No question bank, questionnaire, rubric or scorecard exists anywhere in the repository or its history.** No endpoint records a completed interview, score or recommendation; it can only schedule. |
| Selection / rejection | Interview recommendation → qualification gate | 09-02 | A hold or do-not-advance result blocks the offer | No reject/disposition action and no adverse-action step |
| Offer | `lib/recruiting-v2/offer-engine.ts`, `app/api/recruiting-v2/offer/[candidateId]` | 09-02 | DRAFT → SENT → ACCEPTED or DECLINED, with pay, start and orientation dates; requires qualification READY | No offer letter or e-signature |
| Driver intake & onboarding | `lib/recruiting-v2/onboarding-engine.ts`, `app/api/recruiting-v2/onboarding/**`, `lib/services/intakeService.ts`, `/intake/**` | 09-02 / earlier | Onboarding checklist (documents, application, qualification, interview, offer, orientation, training, equipment). Intake stages NEW → IDENTITY_REVIEW → DOCUMENT_COLLECTION → QUALIFICATION_REVIEW → COMPLIANCE_REVIEW → READY_FOR_APPROVAL → APPROVED | Training and equipment are flags only |
| Qualification (DQF) | `lib/services/qualificationService.ts`, `components/drivers/DriverVaultDqfPageClient.tsx`, `lib/compliance-flow-pro/dqf-*` | earlier, maintained | QUALIFIED, CONDITIONALLY_QUALIFIED, NOT_QUALIFIED, PENDING_REVIEW snapshots | — |
| Fleet activation | `lib/recruiting-v2/driver-activation-service.ts`, `activation-engine.ts`, `/api/recruiting-v2/activation/**` | 2026-10-17 `40582665`, tenant fix 10-18 | Requires qualification READY, offer ACCEPTED and onboarding COMPLETE, plus the fleet role. In one transaction it creates the Driver, DriverIntake and documents, then runs the qualification and readiness projections. | Payroll (Paylocity) payload built but never sent |
| Assignment readiness | `lib/services/readinessService.ts`, `lib/driver-readiness-ui.ts`, `lib/driver-dqf-readiness.ts` | maintained | READY, CONDITIONAL or NOT_READY; recruiting ACTIVE does not by itself mean dispatch-eligible | — |

**Fictional data available for a public demonstration:**
- `lib/recruiting-v2/recruiting-v2-demo-data.ts`: two positions; candidates CAND-001 and CAND-002 with documents, an offer and two interviews.
- `lib/recruiting-demo-data.ts`
- eight synthetic candidate PDFs in `lib/recruiting-v2/synthetic-documents/`
- the driver qualification files for DRV-001…012

There is no seed data for requisitions.

**What I need from you (missing sources):**
1. If an interview questionnaire, structured evaluation or scoring rubric was developed in September, it is not in this repository: not in any branch, archive or commit. If it exists in a Copilot conversation, a document or another machine, please send it. I will not invent one.
2. The same applies to any requisition-to-candidate linkage or candidate rejection workflow.

### Assessment: findings

| Version | Date / commit / branch | Questions per category | Results |
|---|---|---|---|
| **Current Next.js tracks** — `lib/assessment-tracks.ts`, `components/assessment/AssessmentTrackPageClient.tsx`, `app/assessment/*` | 2026-05-07 `5e869c4e` → 05-09 `7b94792a` → 05-22 baseline; same on every branch | For-Hire 36 (9 sections), Private Fleet 38 (10), Government 42 (11), Driver/BOF Vault 24 (7). Six question types; optional sections. | Scoring is a placeholder (every choice answer scores 75). Risk areas and recommended modules are fixed per category, not drawn from answers. Hand-off to a saved inquiry works. |
| Static "Wave 3" five-path assessment — `Website/assessment/index.html`, `assets/js/wave3-assessment.js`, design docs `docs/design-system-2/wave-3/WAVE-3-ASSESSMENT-{ARCHITECTURE,QUESTION-MATRIX,SCORING-MODEL}.md` | 2026-07-28/29, `f48bef67`…`66929e67`, only on `origin/codex/public-site-deployment-candidate` | 12 per audience (Aggregator, Private, For-Hire, Government, Driver), one In place / Partial / Unsure / Not in place scale | Real scoring rubric: percentage, bands, top-3 gaps, section scores, strongest area, review step |

**Root cause of "category headings appear but the questions do not"** (reproduced in the browser on all four categories):
- Choosing a category opens a section-selection screen. It lists only section titles and question counts.
- The only way forward is a Start Assessment button 1,700–2,500 px below the top of the page.
- The button is disabled until the page's JavaScript has loaded.
- The optional-section checkboxes cannot be toggled, because two handlers cancel each other out.

The questions themselves are all present.

**Other defects found:**
- Required questions are not enforced.
- Skipping a section still counts it as completed.
- The Driver/BOF Vault track asks for a **password in a plain text field** on a public page. It is not sent anywhere, but no public assessment should collect passwords. This is a separate security note; I'll remove the field in Step 4 unless you object.

**Proposed Step 4 (not started):**
- Open the questions immediately after the category is chosen, with a visible section progress list and optional sections adjustable inline.
- Keep the current question bank (the richest).
- Replace the placeholder scoring with the Wave 3 rubric, adapted to the current question types.
- Enforce required answers, fix the checkbox bug and remove the password field.
- Test all four categories through submission and confirmation.

### Proposed Step 3, recruiting (not started)

Build the public recruiting demonstration from the real components and engines listed above, running on fictional records in a clearly labelled demo mode:
1. A requisition, using the requisition form and approval lifecycle.
2. The recruiting pipeline.
3. Screening, using the document gates.
4. The interview record and recommendation.
5. Selection, via the qualification gate.
6. Offer.
7. Onboarding checklist.
8. Qualification (DQF).
9. Activation.
10. Assignment readiness.

Each step uses the real state-transition rules, held in the browser, with nothing written to any database. Stages with no real implementation will be labelled as such:
- interview questionnaire and scoring (unless you supply the source)
- candidate rejection

The signed-in application and its tenant isolation stay unchanged.

## 1B. Business Operations correction (done)

Evidence is in `docs/recovery/evidence/checkpoint-1-2026-10-18/`:
- before and after, desktop and mobile, full page and hero
- one screenshot per hero-card destination
- `/services`

| Owner direction | Result |
|---|---|
| Delete "Workspace preview — A practical desk for the work behind the fleet." with its illustration and both buttons | Removed. The Business Operations Command Center software is untouched. |
| Keep the hero heading, photograph and introduction | Kept unchanged |
| Make the five hero cards the department navigation | Each whole card is a keyboard-focusable link. Clicked in a real browser (on the card's edge, not the text): **HR & Workforce** → `/business-operations/hr-tier` (HR control center with recruiting & onboarding, compensation, talent and employee-relations pages); **Accounting** → `/business-operations/accounting-finance` (AP/vendor control, cash-flow review, interactive workbench); **Treasury** → `/business-operations/cash-flow` (Cash Flow & Factoring Strategy); **Finance** → `/business-operations/operational-reporting` (owner-queue reporting); **Payroll** → `/business-operations/payroll-administration` (pay-profile workbench, pay-exception control) |
| Remove the duplicate five white cards | Removed. Their five destinations stay one click away: each hero destination page now links its sibling pages (for example, `hr-tier` ↔ `human-resources` ↔ `driver-onboarding` and `payroll-administration` ↔ `payroll`). |
| Remove Operating Proof (5 / 12 / 4) | Removed, with no replacement numbers |
| Preserve substantive content | Everything else is kept: administrative control board, connected workflows, the 14 functional-area pages, related workflows, directory, office workspace, operational integration. The page went from 12,720 px to 11,007 px. |

All three removals are recorded in the generator (`OWNER_SECTION_REMOVALS`, `HERO_AREA_LINKS`) and the
recovery report. The preservation check flagged exactly these removals and nothing else before the
baseline was updated.

**`/services` 404: fixed.** The explainers existed only at `/services/<name>`. `/services` now lists the six
service explainers with their detail pages, demos and the assessment, using the pages' own titles and
descriptions. All 23 links return 200 in the browser.

**Thin destinations (flagged, not padded):**
- Treasury: `cash-flow`, 243 words.
- Finance: `operational-reporting`, 254 words.

No richer historical treasury or finance page exists. The forecasting, banking and liquidity material the brief describes would need your content or approval to write.

## Owner decisions requested at this checkpoint

1. Approve the hero-card destinations above, especially Finance → Operational Reporting and Treasury → Cash Flow.
2. Two further sections partly repeat the department list:
   - the "Business Operations directory" (eight second-level cards)
   - the closing "Review the administrative workspace…" demo panel, which links to the general demo lobby

   Keep or remove them? I left them in place because you did not direct their removal.
3. The interview questionnaire and rubric: send the source if it exists, or approve a clearly labelled "interview record and recommendation" demo built only from the existing Interview model.
4. Approve the Step 3 (recruiting) and Step 4 (assessment) plans above before I start them.
