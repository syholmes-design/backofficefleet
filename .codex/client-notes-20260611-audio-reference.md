# BOF Client Notes Reference - 2026-06-11 Audio Set

Created: 2026-06-11

Source files:

- `Client Suggestions/Audio/6-11-26-1.txt`
- `Client Suggestions/Audio/6-11-26-2.txt`
- `Client Suggestions/Audio/6-11-26-3.txt`

Purpose:

This is a durable reference document for the June 11 client audio notes. Use it before planning or editing the BOF `Website`, especially work involving sectors, hero imagery, AI explanation, TMS simulation/partnership positioning, and settlement/payroll demo capability.

## Executive Summary

The client is asking for the site and demo to better show BOF as a serious operating service for multiple fleet sectors, not only for-hire trucking. The most important new notes are:

- Bring over the private fleet sector and government contracting sector pages/substance from the old BOF demo.
- Improve hero imagery and page imagery so the site looks more professional and less thin, potentially using a large command-center style hero visual.
- Explain how artificial intelligence helps BOF deliver services: faster document/load review, compliance checks, exception flagging, rejection/correction support, and reduced mundane review work for managers.
- Clarify the TMS integration story: BOF should look familiar to fleet owners who already use TMS systems and should consider partnership/prep communications for TMS vendors such as AscendTMS or ALVYS/AVS.
- Add a settlement section to the demo that shows revenue, driver pay, pay types, deductions, and settlement holds tied to missing receipts, POD, signatures, or other required proof.

## Source 1: `6-11-26-1.txt`

### Sector Pages

The client wants the private fleet and government contracting sectors back in the new site/demo:

- Add back private fleet.
- Add back government contracting.
- Bring those pages/sections over from the old demo "basically as is."
- The client sees them as two variations on the same BOF theme and expects them to be visibly covered.

Implementation meaning:

- Private fleet and government/government-contracting should be structural pages or clear structural pathways, not just short mentions.
- The old demo/reference can be used as source material, but `bof-web-Original` remains reference-only.
- The active implementation remains static HTML/CSS/vanilla JS in `Website`.

### Hero And Imagery

The client wants the hero imagery polished:

- Change or improve the hero image.
- Make imagery look more professional.
- A "gigantic command center" showing many moving parts could be a good hero direction.
- The text can mostly stay as-is, but imagery should polish the page and make it feel stronger.

Implementation meaning:

- The hero should feel like a real operations command center or fleet readiness console.
- Imagery should support the BOF story: loads, documents, drivers, exceptions, release decisions, AI-assisted review, and manager visibility.
- Prefer realistic generated/compressed bitmap art or existing BOF assets; do not hand-draw complex people/trucks with SVG.
- Preserve aspect ratios and avoid distorted images.

### AI Explanation

The client wants BOF to explain the impact of artificial intelligence on services:

- BOF can analyze documentation and loads quickly.
- BOF can check whether loads/documents are in compliance with requirements.
- BOF can flag records for extra review.
- BOF can flag records for rejection/correction.
- AI can reduce the time needed to perform review and correction handling.
- AI supports exception handling and review process.
- BOF is still doing the work.
- Mundane, information-intensive review work moves out of the hands of managers.
- Major decisions, such as dispatch decisions, remain with the fleet owner and management team.

Implementation meaning:

- Use credible buyer-facing language such as `AI-assisted review`, `human-verified`, `BOF-managed follow-up`, and `manager-facing release decision`.
- Do not imply autonomous compliance/legal decisions.
- Do not imply a real production AI backend unless explicitly approved.
- Tie AI to BOF service delivery: triage, review, exception routing, correction requests, and manager time savings.

## Source 2: `6-11-26-2.txt`

### TMS Integration Story

The client asked:

- What is the story with integrating a TMS into BOF?
- BOF should mirror a current TMS program so fleet owners see something consistent with what they already know.
- Are we trying to integrate AscendTMS or ALVYS/AVS?
- Either vendor could work.
- ALVYS/AVS may be more conducive to BOF because of available API integrations, according to the client.
- What communication should be sent to ALVYS/AVS to prepare them for partnership?
- The incentive to the TMS vendor is additional sales.

Implementation meaning:

- This is not approval to build a live API integration.
- It is a planning and positioning note:
  - the BOF demo should visually and structurally feel familiar to TMS users;
  - a future vendor-specific adapter/partnership path may be considered;
  - any outreach should be drafted as business development, not implemented as code.
- Existing resolved project direction still applies:
  - no visible AscendTMS on public website unless specifically reversed;
  - use neutral Partner TMS / Connected TMS language in buyer-facing site copy;
  - do not add real API calls, credentials, `.env`, backend routes, auth, database, or packages.

Open clarification:

- The transcript says "AVS" and "ALVYS." Treat this as likely referring to ALVYS, but verify spelling/source before creating external-facing outreach.

Suggested future outputs:

- A neutral `Partner TMS integration story` section or page, if not already sufficient.
- A simulated TMS-like demo shell that mirrors familiar load-board/TMS workflow without claiming a live integration.
- A vendor outreach draft for ALVYS/AVS that explains BOF's value:
  - BOF can help fleets get more value from their TMS;
  - BOF adds readiness, document, compliance, exception, audit, settlement, and release-decision depth;
  - partnership could support joint sales without replacing the TMS.
- A comparison note for AscendTMS vs ALVYS/AVS, after research with current sources.

## Source 3: `6-11-26-3.txt`

### Settlement Section In Demo

The client wants a settlement section added to the demo.

The old demo had settlement coverage that included:

- Pay and revenue generated from a load.
- Pay made to the driver.
- Deductions.
- Different forms of driver pay:
  - cents per mile;
  - percentage of revenue generated;
  - hourly;
  - wage/salary basis.
- Payroll deductions:
  - HSA;
  - garnishment;
  - health care plan;
  - life insurance plan.
- Settlement holds on driver accounts when required proof is missing:
  - receipt not submitted;
  - POD missing;
  - signature missing;
  - other required information missing.
- Holds give drivers an incentive to remain in full compliance and do their part.

Implementation meaning:

- Add settlement/payroll proof to the demo in a way fleet owners understand.
- Settlement should connect to the existing BOF readiness story:
  - documents affect release and settlement;
  - missing proof creates holds;
  - holds name the reason, owner, amount/status, and clearance action;
  - payroll deductions and pay type examples show versatility.
- Avoid exposing real financial, bank, tax, medical, or private driver values.
- Use synthetic but realistic values and document-like surfaces.

Suggested demo surfaces:

- `/interactive-demo/` section/page/state: `Settlements` or `Settlement Desk`.
- In-app record/drawer for a selected driver/load settlement.
- A public overview section only if needed, but the strongest proof belongs inside the interactive demo.

Suggested fields:

- Load ID / BOF record ID.
- Driver.
- Pay basis.
- Miles / hours / revenue share.
- Gross load revenue.
- Driver gross pay.
- Deductions.
- Net settlement.
- Hold status.
- Hold reason.
- Required proof.
- Owner.
- Next action.
- Audit note.

## Acceptance Principles

For future implementation, the work should pass these checks:

- Private fleet and government/government-contracting are visible structural paths.
- The hero imagery looks professional and command-center-like, not thin or decorative.
- AI is explained as BOF service support, not unchecked automation.
- Major fleet decisions remain with the owner/management team in copy.
- TMS integration is framed as neutral and simulated unless the user explicitly approves real vendor/API work.
- Any vendor outreach is a draft/planning artifact, not a technical integration.
- Settlement demo coverage includes pay types, deductions, holds, missing proof, and compliance incentive logic.
- Documents/settlements remain synthetic and privacy-safe.
- Site remains static/shared-hosting safe.
- No React, Next.js, TypeScript, npm packages, backend routes, `.env`, credentials, live sync, auth, or database work is added without explicit approval.

## Recommended Specialist Personas

Use these project personas when implementing this note set:

- `client-advocate-project-manager`: convert client concerns into acceptance criteria and keep the work aligned.
- `checklist-execution-steward`: execute the checklist one item at a time.
- `client-scope-translator`: translate TMS/API/vendor language into static-safe work.
- `ascendtms-integration-researcher`: research AscendTMS or ALVYS/AVS if vendor facts or outreach are requested.
- `ascendtms-backend-visual-parity-director` and `ascendtms-backend-formatting-director`: shape TMS-like demo visuals if needed.
- `interactive-demo-czar`: add settlement/payroll demo surfaces.
- `demo-document-reality-director`: make settlement/payroll proof look believable.
- `persuasive-onpage-copywriter`: refine buyer-facing sector and AI copy.
- `realistic-industry-image-director`, `motion-visual-storyteller`, and `visual-taste-curator`: improve command-center hero imagery and realistic page imagery.
- `shared-hosting-performance-guardian`: keep assets and implementation lightweight.
