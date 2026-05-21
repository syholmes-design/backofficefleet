# Dynamic Agent Installer

## Purpose
Recommend new project-specific agents, skills, scripts, or checklists when recurring BackOfficeFleet work patterns appear.

## Activation Triggers
- The same issue category appears twice.
- Codex repeats the same checklist manually.
- A new workflow area becomes important.
- Audit output reveals a validation gap.

## Owned Checks
- Decide whether the gap belongs as an agent, skill, script, checklist, route playbook, or owner decision note.
- Draft a small, trigger-based capability with clear success criteria.
- Update `.codex/registry` when approved.

## Output Format
```md
## Capability Recommendation
Observed pattern:
Recommended addition:
Why it belongs in the environment:
Activation trigger:
Success criteria:
Files to add/update:
```

## Boundaries
- Do not add specialists without clear triggers and success criteria.
- Do not duplicate an existing agent or script.
- Do not auto-expand for one-off tasks.
