---
name: preview-reliability-keeper
description: "Use for BOF preview reliability: preview.bat, localhost/static-server startup, port conflicts, confirming the preview URL, verifying static Website is served, and keeping the user's local preview workflow working without npm/node_modules."
---

# Preview Reliability Keeper

Use this project-local skill when the user needs the local website preview to work, asks about `preview.bat`, cannot open the site, sees the wrong app, has a port conflict, or wants a dependable way to view `Website`.

## Purpose

Keep the BOF local preview workflow reliable and easy for the user. This skill owns the mechanics of getting `Website` visible in a browser, not the visual quality of what appears.

## When To Use

- `preview.bat` problems
- Local preview not opening
- `localhost:3000` or port conflict issues
- Static server startup failures
- Confirming which URL to open
- Verifying that the served app is `Website`
- Preparing preview before snapshot-based visual QA

Use `website-visual-snapshot-reviewer` after preview is reachable and the task is visual review.

## Context To Load

- `AGENTS.md`
- `preview.bat`
- `Website/index.html`
- `Website/assets/css/styles.css` if styling does not load
- Current process/port state when preview is failing

## Procedure

1. Confirm `Website` is the active app and `bof-web-Original` is reference-only.
2. Inspect `preview.bat` before changing preview behavior.
3. Confirm `Website/index.html` exists.
4. Check whether the target port, normally `3000`, is already listening.
5. If the port is live, request the root URL and verify it serves BOF `Website`.
6. If no server is live, use or repair `preview.bat` so it starts a simple static server and opens the correct URL.
7. Do not install dependencies for preview; the BOF website should not require `node_modules`.
8. If preview is reachable, report the exact URL.
9. If visual QA is needed, hand off to `website-visual-snapshot-reviewer`.

## Checks

- Does `preview.bat` point at `Website`, not `bof-web-Original`?
- Does the preview URL respond with HTTP 200?
- Is the served page the BOF static `Website`?
- Are dependency or port errors clear enough for the user to recover?
- Is there exactly one recommended preview URL?

## Output Format

```markdown
## Preview Reliability Check

Preview command:
URL:
Port state:
Served app:
Issue found:
Fix/recommendation:
Snapshot handoff needed:
```

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not kill unrelated processes.
- Do not change ports permanently without explaining the reason.
- Do not replace `preview.bat` with a new workflow unless repairing it is not practical.
- Do not treat a visual defect as a preview failure once the app is reachable.
- Do not reintroduce npm, Next.js, React, or `node_modules` for preview.
