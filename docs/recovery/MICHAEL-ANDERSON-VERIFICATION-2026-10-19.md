# Michael Anderson recruiting version: does it include the September 18 requisition system?

**Answer: present but not connected.**

## Method

- I ran the September 18 commit `02705000` unmodified in an isolated worktree.
- It used a local scratch database (`bof_hist_a`) seeded with the repository's own fictional dev users (`*@dev.local`).
- I drove it in a real browser as "Fleet A Admin" (fleet role) and "BOF Operations".
- Screenshots: `docs/recovery/evidence/michael-anderson-verification-2026-10-19/`.
- Nothing in the repository was changed.

## Which interface shows Michael Anderson

| Interface | First commit | Route | How it stores state |
|---|---|---|---|
| **Recruiting & Onboarding workspace** ("BOF Back-Office Workforce Engine", 8-stage pipeline, Michael Anderson CAND-001 and Sarah Mitchell CAND-002) | `9cf71b4d`, 2026-08-29 | `/recruiting/workspace` (it was `/recruiting` until Sept 18) | Browser only: a persisted client store seeded from `lib/recruiting-demo-data.ts` |
| Recruiting V2 (candidate workspaces: application, interview, documents, qualification, offer, onboarding, activation) | `6f9d9c7b`, 2026-09-02 | `/recruiting-v2` | Database APIs (empty unless candidate rows exist; the code has no way to create one) |

Both interfaces are still present, unchanged in design, in `02705000` (Sept 18) and in every later version.
The screenshots show the first one, which matches the interface the owner recognised.

## The seven checks (Sept 18 build, real browser)

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Identify a carrier's staffing requirement | **Yes.** The requisition captures the requesting carrier, USDOT/MC, domicile, states, positions needed, position, lanes, equipment, CDL and qualification requirements, pay and budget. | 02 |
| 2 | Create an 11-section driver requisition | **Yes.** All 11 sections completed and saved (45 fields filled) | 02 |
| 3 | Submit for approval | **Yes.** DRAFT → SUBMITTED → UNDER_REVIEW | 01–02 |
| 4 | Complete the five required approvals | **Yes.** Requesting Manager, Fleet Safety Director and Fleet Owner/GM were signed by the fleet user; BOF Account Manager and BOF HR Review by BOF Operations. Each records reviewer, signature and notes. | 02 |
| 5 | Advance to READY_FOR_RECRUITING | **Yes.** APPROVED, "5/5 approved · READY FOR RECRUITING" | 01 |
| 6 | Connect the approved requisition to the Michael Anderson workspace | **No (navigation only).** The requisition list has two plain links, "Recruiting workspace" and "Recruiting v2 documents". Neither interface shows, reads or uses the requisition: its number BOF-HR-DRV-001 and its title "Regional Class A Driver" appear nowhere in them. The workspace has its own separate "Create Position" builder and its own position (POS-001 "CDL-A OTR Regional Driver"). The requisition page itself states: *"This surface stops at Approved / Ready for Recruiting. It does not create a Driver or open DriverIntake."* | 01, 03, 05, 12–16 |
| 7 | Continue through interview, onboarding, qualification, activation, assignment readiness | **Partly, and only inside the workspace's own demo data.** Michael Anderson moves through Qualify → Interview → Send Offer → Start Onboarding. The onboarding checklist goes from 8/10 to 10/10, then "Activate driver" shows "ACTIVATED & HANDED OFF TO OPERATIONS", driver "DRV-DEMO-001". All of this is browser-only: the database still has 0 candidates and 0 drivers, so qualification files, dispatch and assignment readiness never see this driver. The interview stage shows an "interview record on file" with a decision prompt; there is no questionnaire or scoring. | 06–11 |

## Code confirmation (Sept 18 commit and every later version, including today)

- `Candidate` has no requisition reference. `Requisition` has no candidate or position reference.
- `READY_FOR_RECRUITING` is written in one place (`lib/services/requisitionService.ts:341`) and read nowhere.
- Neither the workspace (`components/recruiting/RecruitingPageClient.tsx`, `lib/stores/recruiting-store.ts`) nor Recruiting V2 refers to requisitions.
- The commit message of `02705000` itself says: "requisition front door **without replacing recruiting v1/v2**".
- No later commit on any branch adds a connection.

## Missing integration (what would have to be built to make one continuous workflow)

1. An approved requisition opens a position or job in the recruiting workspace: same title, lanes, pay, requirements and number of seats.
2. Candidates are attached to that requisition, and the requisition shows its candidates and fill count, ending in FILLED.
3. The requisition's screening requirements drive the candidate's qualification checks.
4. Interview: a structured questionnaire and scoring. None exists in any version. The workspace keeps notes only; Recruiting V2 can only schedule an interview.
5. The workspace's activation, which is browser-only, is replaced by the real database activation in Recruiting V2 / driver intake (Oct 17, `40582665`). That activation creates the Driver, driver intake, qualification snapshot and readiness score that dispatch uses.

No changes have been made. Awaiting owner direction.
