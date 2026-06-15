---
name: runtime-resource-steward
description: "Use for BOF Codex runtime cleanup: finding and stopping leftover preview servers, snapshot scripts, Playwright/npx screenshot jobs, localhost port listeners, and stale Node/Python helper processes that can consume RAM after website/demo checks."
---

# Runtime Resource Steward

Use this project-local skill when the user reports high RAM/CPU after Codex work, asks to clean up tool leftovers, preview servers, browser automation, stuck snapshot jobs, or wants future runs to avoid leaving processes behind.

## Purpose

Keep Codex website/demo work from leaving stale local processes running. This persona owns process hygiene, not product code quality.

## When To Use

- RAM or CPU seems high after Codex work.
- `localhost` preview servers may still be running.
- Snapshot, Playwright, npx, Node, or Python helper commands appear stuck.
- A browser/screenshot check timed out.
- A task starts or ends local servers, browser automation, visual snapshot scripts, or long-running helpers.

## Context To Load

- `AGENTS.md`
- This `SKILL.md`
- Script help/source only when needed:
- `scripts/audit-runtime-resources.ps1`
- `scripts/stop-runtime-leftovers.ps1`
- `scripts/report-memory-pressure.ps1`

## Procedure

1. Audit first:

   ```powershell
   .\.codex\skills\runtime-resource-steward\scripts\audit-runtime-resources.ps1
   ```

2. If the user says RAM is still high, run:

   ```powershell
   .\.codex\skills\runtime-resource-steward\scripts\report-memory-pressure.ps1
   ```

3. Identify only clear BOF/Codex leftovers, usually:
   - Python `http.server` preview listeners on local preview ports.
   - `.codex/skills/website-visual-snapshot-reviewer/scripts/snapshot-website.mjs`.
   - `playwright screenshot` or `npx playwright screenshot` commands writing to `.codex/reports/visual-snapshots`.
   - Node/Python processes whose command line clearly references this BOF workspace and a preview/snapshot task.
4. Do not stop active Codex runtime processes, `node_repl.exe`, OpenAI kernel processes, unrelated Python test runs, game launchers, editors, browsers, or processes from other projects.
5. Cleanup defaults to dry-run. To apply cleanup:

   ```powershell
   .\.codex\skills\runtime-resource-steward\scripts\stop-runtime-leftovers.ps1 -Apply
   ```

6. Re-run the audit and report what remains.

## Checks

- Did the audit list listening preview ports?
- Are candidates tied to this BOF workspace or known BOF snapshot scripts?
- Are active Codex kernel/repl processes excluded?
- Did cleanup use `Stop-Process -Id` on verified candidates only?
- Did a follow-up audit show the preview/snapshot leftovers are gone?

## Output Format

```markdown
## Runtime Resource Check

Audit:
Stopped:
Left running intentionally:
Preview ports:
Notes:
```

## Safety Boundaries

- Never kill unrelated processes just because they are Node or Python.
- Never stop `node_repl.exe` or OpenAI/Codex kernel processes.
- Never clean by process name alone; require command-line or port evidence.
- Default to dry-run unless the user clearly asked to clean up or the process was started by Codex for the current project.
- Do not delete files, caches, screenshots, reports, or `node_modules` as part of runtime cleanup unless separately requested.
