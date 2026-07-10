# BOF Driver Document Realism Instructions

Created: 2026-06-09
Source: User-provided client note on public BOF document pages, driver-related records, DQF realism, document history, and back-office workflow depth.

## Purpose

Use this document before changing BOF driver pages, driver records, DQF surfaces, document viewers, document packets, compliance examples, or `/interactive-demo/` paperwork flows.

The client note says the current BOF demo is stronger than typical trucking software demos because records are connected to dispatch consequences, load readiness, carrier packets, settlements, safety reviews, owners, dates, and next actions. The gap is not the page-level operating story. The gap is document-level depth.

The desired next level is: BOF should feel less like a polished document vault and more like a working back-office department that requests, reviews, approves, rejects, generates, versions, and audits fleet paperwork.

## Keep These Current Strengths

Preserve these existing strengths during future edits:

- Driver files should stay tied to dispatch consequences.
- Medical cards, MVR reviews, CDL status, acknowledgements, and qualification files should remain recognizable to fleet managers.
- Documents should stay connected to loads, carrier packets, release decisions, settlements, and safety reviews.
- Expiration dates, reviewers, owners, and next actions should remain visible.
- Ready, Watch, Hold, Review, and blocked states should feel operational, not decorative.

Do not flatten the demo into a generic file repository.

## Core Standard

For fleet owners with roughly 20 to 250 trucks, document storage alone is not impressive. They assume a TMS or document system can store a medical card.

What should impress them:

- DQF completeness.
- Compliance workflow.
- Document history.
- Document requests and reminders.
- Approval and rejection trail.
- Generated HR and safety forms.
- Readiness scoring.
- Failed-compliance examples.
- Dispatch consequences tied to missing or failed paperwork.

## Priority Order

When improving driver/document realism, prioritize in this order:

1. DQF folder expansion.
2. Audit trail and version history.
3. Document request workflow.
4. Generated HR and safety forms.
5. Readiness scoring.
6. More failed-compliance examples.

Do not start by adding more decorative cards. Start by making the records feel more like active compliance operations.

## DQF Folder Expansion

Future driver records should show a richer DQF folder tree, even if not every document opens at first. Seeing the folder structure alone improves credibility.

Required or preferred DQF categories:

- Employment Application.
- CDL.
- Medical Examiner Certificate.
- Road Test Certificate.
- Annual Review of Driving Record.
- MVR.
- Safety Performance History.
- Drug and Alcohol Clearinghouse Consent.
- Drug Test Results.
- Driver Agreement.
- Driver Handbook Acknowledgement.
- ELD Acknowledgement.
- Accident Register.
- Training Records.
- Corrective Actions.
- Disciplinary Notices.

The demo can keep about 20 driver documents per important driver, but the structure should feel like a real driver qualification file rather than a short checklist.

## Make Documents Look Used

Documents should not all look pristine. Working fleet paperwork should show signs of review, handling, correction, and follow-up.

Useful document realism details:

- Handwritten notes.
- Highlighted sections.
- Reviewer stamps.
- Signatures.
- Rejected versions.
- Revised versions.
- Expiration warnings.
- Original upload date.
- Reviewed-by field.
- Renewal reminder timing.
- Status stamp such as Filed, Review, Rejected, Revised, Missing, Expiring Soon, or Approved.

Example pattern for a medical card:

- Original Upload: 03/18/2026.
- Reviewed by Safety: 03/19/2026.
- Renewal Reminder: 60 days before expiration.
- Version: v2, revised after first upload was rejected for missing examiner registry number.

## Add Document History

This is one of the highest-value improvements. Fleet owners care about who touched a document and when.

Every important driver document should expose, at minimum:

- Uploaded by.
- Uploaded date.
- Last reviewed by.
- Review date.
- Version number.
- Approval or rejection status.
- Audit trail.
- Owner or responsible desk.
- Next action when not fully approved.

Avoid making history feel like developer metadata. Present it as a normal fleet document review trail.

## Add Failed Compliance Examples

The demo should not show only clean records. Failed and incomplete examples make BOF's value clearer.

Include examples such as:

- Failed MVR review.
- Expired medical card.
- Clearinghouse issue.
- Missing employment verification.
- Missing annual review.
- Rejected or revised upload.

Each failed example must explain:

- What failed or is missing.
- Why dispatch is blocked or on watch.
- Who owns the next action.
- What document or correction clears the hold.
- What the release/settlement/safety consequence is.

Failed examples are more useful than adding another compliant file.

## Add A DQF Score

Driver records should eventually include a DQF readiness score that a fleet owner can understand quickly.

Example score table:

| Category | Status |
|---|---|
| CDL | Complete |
| Medical | Complete |
| MVR | Complete |
| Prior Employer Verification | Missing |
| Annual Review | Due in 14 Days |
| Drug and Alcohol | Complete |

Then show a plain summary such as:

`DQF Readiness: 91%`

The score must be backed by visible categories and should affect Ready, Watch, or Hold state.

## Add Employer-Generated Documents

BOF should feel like a back office that creates paperwork, not only stores uploaded files.

Employer-generated document examples:

- Annual MVR Review.
- Driver Warning Notice.
- Safety Counseling Form.
- Accident Review Form.
- Return-to-Work Form.
- Training Completion Certificate.

These documents should have realistic fields, reviewer names/roles, dates, signatures or acknowledgement areas, and consequences.

## Add Document Requests

Real operations chase paperwork constantly. Add document request surfaces where appropriate.

Outstanding request examples:

- Updated Medical Card.
- New Insurance Certificate.
- Signed Driver Handbook Receipt.
- Prior Employer Verification.
- Annual Review Signature.

Useful request statuses:

- Requested.
- Reminder Sent.
- Received.
- In Review.
- Rejected.
- Approved.

Each request should include requested date, owner, recipient, due date, current status, and next action.

## Acceptance Criteria For Future Implementation

A future DQF/document pass is not complete unless it can show:

- A richer DQF folder tree on driver records.
- At least one clean driver, one watch driver, and one failed/hold driver.
- Document history for important driver documents.
- At least one rejected/revised document version.
- At least one outstanding document request.
- At least one employer-generated HR or safety form.
- A readiness score or score-like summary tied to the driver status.
- Clear dispatch consequence for missing or failed compliance paperwork.

The UI should let a buyer inspect these details without hunting below the fold or opening vague placeholder panels.

## Static Site Boundary

These instructions do not authorize backend scope.

Keep this as static/shared-hosting-safe work unless the user explicitly changes direction:

- HTML.
- CSS.
- Vanilla JavaScript.
- JSON.
- Static document-like pages or generated image/document assets.

Do not add:

- Real compliance automation.
- Real FMCSA or Clearinghouse calls.
- Real driver private data.
- API integrations.
- Credentials.
- `.env`.
- Database.
- Auth.
- Uploads.
- React, Next.js, TypeScript, npm packages, or backend routes.

Use complete fictional values where safe. Do not use `Masked`, `TBD`, `On file`, `sample`, or placeholder-style fields in client-facing document bodies when a believable fictional value can be used.

## Persona Routing

Use these project-local roles when implementing or reviewing work based on this document:

- `client-demo-proof-advocate`: proof depth, clickable records, dispatch consequences, owner/next action.
- `demo-document-reality-director`: real-looking document bodies and viewer quality.
- `reference-driver-documentation-auditor`: parity against reference driver documentation depth.
- `document-file-artifact-director`: file-like DOCX/PDF-style artifacts when HTML document panels are not believable enough.
- `document-artifact-realism-director`: generated CDL/license, scan-like proof, stamps, signatures, and photo evidence.
- `synthetic-document-completeness-director`: complete fictional values instead of masked/placeholder document fields.
- `checklist-execution-steward`: checklist-led implementation from this instruction set.

## Quick Implementation Prompt

When the user asks to improve driver documents or DQF realism, use this working instruction:

> Upgrade the BOF driver-document demo from a document vault into a back-office compliance workflow. Preserve the existing operating-record strengths, then add richer DQF folder structure, document history/versioning, outstanding document requests, employer-generated HR/safety forms, DQF readiness scoring, and failed-compliance examples. Keep everything static/shared-hosting safe and make every important document click open an inspectable, realistic record with owner, dates, status, consequence, and next action.
