# Checklist: Corrected Stray Project Document Audit

Created: 2026-06-12 09:34:45 -05:00
Corrected: 2026-06-12
Source: User cleanup request and correction, 2026-06-12
Owner persona: `checklist-execution-steward`
Status: complete

## Scope

Undo the over-broad generated-cache cleanup from the first pass, then audit for the user's intended target: documents or project artifacts from other projects that may have been accidentally saved in the BOF project folder.

## Guardrails

- Active edit target: `Website` unless the user explicitly says otherwise.
- `bof-web-Original` is reference-only.
- Do not delete additional files from the project without clear user confirmation.
- Treat browser profiles, `.next`, and `node_modules` as generated/runtime/dependency folders, not as "other project documents."
- Focus the corrected audit on documents, archives, and source/reference artifacts that look unrelated to BOF.

## Items

| ID | Source | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CL-001 | User correction, 2026-06-12 | Undo the prior deletion of generated/cache/dependency folders as far as possible. | complete | Restored `.codex/reports/responsive-formatting-qa-20260610/chrome-profile` from the same QA report's `postfix/chrome-profile`; restored `bof-web-Original/bof-web/.next` and partially restored `bof-web-Original/bof-web/node_modules` from `bof-web-Original.zip`. | The zip reports `Unexpected end of archive`, so `node_modules` may be incomplete. |
| CL-002 | User correction, 2026-06-12 | Re-scope the audit to accidental documents or project artifacts from other projects. | complete | Ran a read-only inventory of `.odt`, `.docx`, `.pdf`, `.xlsx`, `.xls`, `.csv`, `.pptx`, and `.zip` files while excluding generated/browser/dependency cache paths. | No additional files deleted. |
| CL-003 | Corrected document audit, 2026-06-12 | Inspect named ODT/client documents enough to distinguish BOF/client material from unrelated project material. | complete | ODT text previews for `Chatgpt Instructions`, `Client Suggestions`, and `New Documents` show BOF, AscendTMS, Delta Advanced Trucking, financial calculator, or demo instructions. | `Client Suggestions/Audio/Ascend-TMS.odt` has M4A file bytes despite the `.odt` extension. |
| CL-004 | Corrected document audit, 2026-06-12 | Flag possible cleanup candidates for user decision instead of removing them. | complete | Flagged `.codex/tmp/Implement These Suggestions.copy.odt` as an exact duplicate of `Client Suggestions/Implement These Suggestions.odt`; flagged `2nd Reference Folder/teleportHQ/MISC/versions/insistent affectionate kouprey-html.zip` as BOF-related content with a non-BOF generated export name. | These are candidates only, not confirmed unrelated files. |

## Verification Gates

| Gate | Status | Evidence |
|---|---|---|
| Restore check | complete | `Test-Path`/file counts show `.next`, `node_modules`, and `chrome-profile` exist again. |
| Corrected artifact scan | complete | Read-only document/archive inventory completed with generated/cache/dependency folders excluded. |
| Content spot-check | complete | ODT previews and TeleportHQ HTML string search show reviewed items are mostly BOF/client/reference material. |
| Deletion safety | complete | No additional files were removed after the user's correction. |

## Decisions And Deferrals

| Item | Decision | Reason | Revisit Trigger |
|---|---|---|---|
| `.codex/tmp/Implement These Suggestions.copy.odt` | defer deletion | It is an exact duplicate, but it is BOF-related and user confirmation is safer. | User asks to remove duplicate/temp files. |
| `Client Suggestions/Audio/Ascend-TMS.odt` | defer rename | File bytes indicate M4A audio even though the extension is `.odt`; renaming a client source file should be explicit. | User asks to normalize client-source filenames. |
| `2nd Reference Folder/teleportHQ/MISC/versions/insistent affectionate kouprey-html.zip` | defer deletion | Name looks unrelated, but contents reference BackOfficeFleet and Founding Fleet. | User asks to remove old/generated reference exports by name. |

## Closeout Summary

- Completed: CL-001 undo/restoration pass, CL-002 corrected document/archive inventory, CL-003 BOF/client content spot-check, CL-004 cleanup-candidate report.
- Remaining: none for this read-only corrected pass.
- Blocked: none.
- Deferred: deletion/renaming of candidates until user confirms.
- Verification: restored paths exist; document/archive inventory was read-only; ODT and HTML spot-checks show the main documents are BOF/client/reference material.
