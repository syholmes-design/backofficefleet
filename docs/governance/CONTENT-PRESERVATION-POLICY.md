# BOF content preservation policy

**Principle (owner directive, 2026-10-18):** No AI agent may remove, abbreviate, simplify, replace, or
materially diminish previously approved BOF content, functionality, imagery, or workflows without
explicit owner authorization.

This applies to every agent and tool that edits this repository: Claude, Cursor, GitHub Copilot,
Google Antigravity, Codex and any future tool. It applies equally to people working through them.

## What counts as approved work

- The recovered historical pages in `content/recovered-site/` and the assets in `public/recovered-assets/`
  (provenance: `docs/recovery/business-operations-recovery-report.md`).
- The public marketing pages in `app/(marketing)/`, the public demonstrations (`/demo/*`,
  `/interactive-demo/*`, `/customer-portal/*`, `/documents`, `/bof-vault/*`) and the assessment (`/assessment/*`).
- Imagery, videos and sample documents those pages use.
- Working interactions: calculators, demos, the assessment flow and its durable inquiry record.

## Rules

1. **Do not shrink approved pages.** Do not cut sections, headings, imagery or interactions to make a
   change easier. Rewording counts as replacement.
2. **Do not substitute.** Do not swap an approved page or demo for a simpler new one, a placeholder or
   a static image of an interaction.
3. **Regenerate, don't hand-edit.** Recovered pages come from `scripts/recovery/recover_business_operations.py`.
   Owner-directed removals and replacements are listed in that script (`OWNER_REMOVALS`,
   `OWNER_REPLACEMENTS`) and in the generated report, never made silently.
4. **Superseded decisions stay superseded.** See [superseded-decisions.md](superseded-decisions.md).
   Do not reintroduce them.
5. **Run the check.** `npm run check:preservation` compares the site with
   `docs/governance/preservation-manifest.json` and fails on lost words, headings, routes or assets, and
   on superseded wording. A failure is a stop sign, not a manifest to regenerate.
6. **Updating the manifest needs the owner.** `npm run check:preservation -- --update` is only for
   changes the owner approved; record the approval (date, what changed) in the commit message.
7. **Report, don't decide.** If a change seems to require a reduction (legal, security, privacy), make
   the smallest change, record it as an owner decision item, and say so in the hand-off.

Security and privacy fixes are not exempt from reporting: de-identifying a sample document is allowed
and expected, but it is recorded (see `DEIDENTIFIED_ASSETS` in the generator and
`docs/security/SECURITY-REMEDIATION-2026-10-18.md`).
