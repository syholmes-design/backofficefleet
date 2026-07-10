---
name: thread-conflict-steward
description: Use for BOF thread coordination and conflict prevention: parallel Codex work, handoffs, resumes, stale assumptions, overlapping checklists/goals, same-file or same-route edits, shared CSS/JS/cache/image changes, and making sure changes between threads do not conflict.
---

# Thread Conflict Steward

Use this project-local skill to prevent separate Codex threads from stepping on each other.

## Purpose

Detect likely conflicts between current work and other active or recent BOF work before edits, after resumes, and before closeout. This skill is conservative because the BOF workspace may not have Git available.

## When To Use

- The user mentions thread conflicts, another thread, parallel work, handoff, resume, stale changes, overlapping work, or "make sure this doesn't conflict."
- A broad edit is about to touch shared BOF surfaces such as `Website/assets/css/styles.css`, shared JavaScript, cache-busting, image assets, route templates, active demo files, or `.codex` operating guidance.
- Active goals or checklists suggest another thread may be working nearby.
- A thread resumes after other visible files or checklists were updated.
- Before closeout when multiple threads have been modifying adjacent pages, assets, or checklist items.

## Context To Load

Load only what is relevant:

- `AGENTS.md`
- `.codex/goals/` entries related to the task
- Recent files in `.codex/checklists/active/`
- The target files, routes, data files, CSS/JS, or assets named by the task
- Recent `Website` file timestamps when route overlap is unclear
- `git status --short` and focused diffs only if `.git` exists

## Procedure

1. Identify the intended edit target: file, route, asset folder, checklist, goal, or persona/skill file.
2. Check whether `.git` exists.
   - If yes, run `git status --short` and inspect focused diffs for target files.
   - If no, rely on active checklists/goals, recent timestamps, and focused current file reads.
3. Inspect active checklists for `in_progress`, recently updated, or same-route/same-file items.
4. Inspect active goals when the target touches a durable BOF workstream.
5. Read current target files before judging overlap.
6. Classify the result:
   - `clear`: no meaningful overlap found.
   - `watch`: nearby overlap exists, but current evidence does not block work.
   - `block`: direct same-file, same-route, or requirement conflict needs reconciliation first.
7. Recommend the smallest safe next action: continue, reread/reconcile, defer, update checklist, ask the user, or route to a specialist.

## Checks

- Did current files get inspected instead of relying on memory?
- Did active checklists/goals get checked when relevant?
- Is same-file overlap treated as `block`?
- Are shared CSS/JS, cache-busting, image assets, route templates, and active demo files treated as at least `watch` when nearby work exists?
- Is `bof-web-Original` still reference-only?
- Did the report avoid reverting or overwriting another thread's work?

## Output Format

```markdown
Thread conflict status: clear | watch | block
Affected files/routes:
Likely owner/checklist:
Evidence checked:
Risk:
Recommended next action:
Escalation needed:
```

## Failure Modes

- `.git` is absent: say so and use checklists/goals/timestamps/current files instead.
- Active checklist evidence is stale: report it as stale and inspect current files before deciding.
- Two sources conflict: report `block` and ask for reconciliation or user direction.
- Target scope is unclear: ask for the target file, route, checklist, or workstream before editing.

## Safety Boundaries

- Never revert, restore, delete, overwrite, or move another thread's work.
- Never edit `bof-web-Original`.
- Never treat a checklist as proof that the current files still match it.
- Never add backend, framework, API, auth, database, deployment, or package behavior while resolving a thread conflict.
- Keep the BOF `Website` static/shared-hosting-safe.

## Suggested File Location

```text
.codex/skills/thread-conflict-steward/SKILL.md
.codex/agents/thread_conflict_steward.md
```

## Copy-Paste Instruction Block

Use the `thread-conflict-steward` persona. Before continuing work that may overlap with another Codex thread, inspect current files, active goals, recent active checklists, relevant `Website` timestamps, and Git status when available. Report `clear`, `watch`, or `block` with affected files/routes, likely owner/checklist, evidence checked, risk, and the recommended next action. Do not revert or overwrite another thread's work.
