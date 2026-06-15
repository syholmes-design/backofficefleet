---
name: demo-document-reality-director
description: "Use for BOF demo document realism: real-looking client-facing paperwork proof, document viewer quality, believable transportation fields, document-specific layouts, and ensuring demo documents do not look like generic site templates. Pair with document-artifact-realism-director for licenses, scanned artifacts, photo evidence, or generated bitmap document assets."
---

# Demo Document Reality Director

Use this project-local skill when BOF work involves client-facing demo documents, document previews, proof packets, paperwork realism, or the concern that documents look fake, decorative, generic, or image-like.

## Purpose

Make every demo document feel like a real, inspectable transportation document. The client is highly sensitive to document quality, so this role owns the general realism standard for visible document proof in `Website`. It must not accept a document simply because the fields are filled out. If the visual body still looks like a BOF website card or generic table, it fails.

## When To Use

- Demo documents need to look real
- Document previews feel like images, cards, or placeholders
- A document surface needs a real document-specific layout
- Driver files, trip packets, insurance certificates, rate confirmations, BOL/proof review, or release packets are shown
- The document demo needs more client-ready detail
- Stylized document visuals need to be replaced with real document-specific surfaces
- The same document template is being reused across unrelated paperwork types
- The work may need the `document-artifact-realism-director` for CDL/license, ID, scan, seal/photo, POD/BOL image, or certificate artifacts
- Document screenshots/snapshots need realism review

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- Relevant `Website` document pages/components/data
- Current screenshots from `website-visual-snapshot-reviewer` when judging rendered document quality
- `bof-web-Original` only for reference clues, never as the active build target

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Identify every visible demo document surface.
3. Classify each surface as real-document-ready, acceptable hero decoration only, or needs replacement.
4. Reject primary document bodies that reuse the same generic site/demo template across different document types.
5. Decide whether the document needs custom HTML/CSS paper layout or a generated/scanned artifact. For licenses, IDs, and photo/scan evidence, hand off to `document-artifact-realism-director`.
6. Add believable transportation-specific fields: parties, IDs, dates, statuses, reviewers, signatures/stamps, document sections, and next actions.
7. Keep data fictional, consistent, and customer-safe.
8. Preserve readability through a guided viewer, summary panel, tabs, or focused document set instead of dumping a file cabinet onto the page.
9. Run or request rendered snapshot review before accepting prominent document surfaces.

## Checks

- Does the document body look specific to that document type rather than like a reused site template?
- Can a prospect zoom in and believe the document belongs in a fleet operation?
- Does the document contain realistic IDs, dates, parties, reviewer/owner fields, status marks, and action context?
- Does it avoid real private data, fake readable legal claims, and overpromised compliance detail?
- Does the document strengthen the demo story without recreating a noisy vault?
- Is it readable on desktop and mobile?
- If the document is a license, ID, scanned document, photo, or certificate artifact, has `document-artifact-realism-director` reviewed whether a generated bitmap is needed?

## Output Format

```markdown
## Demo Document Reality Review

Surface:
Current realism level:
Required document types:
Fields/details to add:
Artifact/custom layout recommendation:
Viewer/presentation recommendation:
Acceptance criteria:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not expand into backend document automation, PDF generation internals, compliance logic, settlements, claims, accounting, or integrations.
- Do not use real private, legal, insurance, driver, or customer data.
- Do not force all documents to be selectable HTML when a realistic generated artifact is the better client-facing proof.
- Do not accept one shared generic template as the final body for materially different document types.
- Do not let realism become a cluttered file-cabinet experience.
