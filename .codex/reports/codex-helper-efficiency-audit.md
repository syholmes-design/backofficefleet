# Codex Helper Efficiency Audit

## Plain-English Summary

The project helpers are valid and useful, but they should be lazy-loaded. The main limit risk is not that the helpers exist; it is reading every full helper file or activating multiple overlapping review agents when the registry or a compact skill would do.

## Current Health

- Registry sync passes.
- The helper system has clear specialist ownership.
- Most older core helpers are compact.
- Newer specialist helpers are more detailed and should be loaded only when triggered.

## Highest Priority Fixes Applied

- Added `Helper Loading Discipline` to root `AGENTS.md`.
- Added lazy-loading guidance to `.codex/session-brief.md`.
- Trimmed `instruction-quality-gatekeeper.md` from a long template-heavy version into a compact trigger/decision agent.
- Kept the fuller reusable checklist in `.codex/skills/instruction-quality-gate.md` and `.agents/skills/instruction-quality-gatekeeper/SKILL.md` for shared-environment compatibility.

## Helper Classifications

| Helper | Classification | Efficiency Note |
| --- | --- | --- |
| Quiet Token and Rate Limit Steward | Keep | Long but specifically prevents waste. Load only for broad, repeated, or high-usage work. |
| Codex Operations Supervisor | Keep | Useful for helper audits and cleanup. Do not load for product work. |
| Instruction Quality Gatekeeper | Keep but tightened | Compact canonical agent now; skill carries reusable checklist. |
| Dynamic Agent Installer | Keep but gated | Must consult quality/efficiency gates before future helper creation. |
| Demo Completion Governor | Keep | Finish-line authority. Load for done/not-done and scope decisions. |
| Enterprise Demo Experience Architect | Keep but trigger narrowly | Use for executive demo impact, not ordinary polish. |
| UX Retention & Beauty Director | Keep but trigger narrowly | Use for UX, beauty, trust, retention. |
| Persuasive Copy & Design Strategist | Keep but trigger narrowly | Use for copy, CTAs, buyer psychology. |
| Website Polish Director | Keep | Use for lightweight visual consistency when broad design agents are unnecessary. |
| Test Health Maintainer | Keep | Load for failing, flaky, or slow tests only. |
| Backup/rollback/change-memory helpers | Keep | Script-driven and useful for shared folder safety; keep reports short. |
| Route, source-of-truth, document, domain helpers | Keep | Compact and task-specific. |

## Agent Activation Budget

- Small task: 0-1 helpers.
- Medium task: 1-3 helpers.
- Large task: 3-5 helpers only when ownership truly crosses routes, data, design, tests, and owner readiness.
- Do not load all design helpers together unless the owner asks for a broad design review.

## What To Avoid

- Reading all `.codex/agents/*.md` files at session start.
- Loading full helper files when a registry entry is enough.
- Running broad audits when files did not change.
- Repeating visual smoke screenshots for non-visual edits.
- Creating new agents when an existing agent, skill, playbook, checklist, or script can own the idea.

## Technical Appendix

Largest helper bodies at audit time were the quiet steward, instruction gatekeeper, persuasive strategist, test maintainer, UX director, enterprise architect, operations supervisor, and demo governor. The newest gatekeeper was the most obvious trim candidate because the detailed reusable wording already exists in skill form.
