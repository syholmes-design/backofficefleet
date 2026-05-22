# Instruction Quality Gate

Use this skill when the owner pastes advice from ChatGPT or another AI tool, proposes a new instruction, or asks to add a new persona to the BackOfficeFleet Codex environment.

## Goal

Keep new guidance project-specific, non-duplicative, and aligned with finishing the BackOfficeFleet demo.

## Checklist

Before adding an instruction, first archive any long pasted AI suggestion or proposed instruction in `.codex/instruction-requests/raw/` and add a short row to `.codex/instruction-requests/index.md`.

Then confirm it has:

1. A BackOfficeFleet-specific purpose.
2. A clear activation trigger.
3. A defined output format.
4. Clear boundaries.
5. No duplicate owner in the current agent registry.
6. A relationship to the demo finish line.
7. A reason it cannot be handled by an existing agent, checklist, script, playbook, or registry update.

## Capture-First Archive

For long pasted ChatGPT/AI suggestions, generic prompt blocks, persona proposals, or proposed instructions:

1. Save the original text verbatim to `.codex/instruction-requests/raw/YYYY-MM-DD-HHMMSS-short-topic.md`.
2. Add only tiny metadata above the raw text: date captured, source, captured by, and gatekeeper status.
3. Add a compact index row to `.codex/instruction-requests/index.md`.
4. Keep the archive neutral: use it for instruction traceability, duplicate detection, scope-drift prevention, and helper cleanup only.
5. If the pasted text appears to contain secrets, credentials, or highly sensitive personal information, pause and ask whether to redact or skip archival.

## Preferred Actions

- Rewrite useful generic advice into project-specific guidance.
- Merge overlapping ideas into existing agents.
- Turn fixed review steps into checklists.
- Turn mechanical checks into scripts.
- Reject duplicate, too-generic, or scope-drifting instructions.
- Hold good but nonessential ideas for a future version.

## Owner-Friendly Explanation

Use this phrasing when helpful:

```markdown
This is not bad advice, but it is weaker than the system already built here.

The issue is that it is less grounded: it does not know BackOfficeFleet's routes, finish-line rules, demo-completion standard, backup memory, test tiers, or existing specialist agents.

I recommend not pasting it directly. Instead, we should either reject it, merge the useful part into an existing agent, or rewrite it as a specific BackOfficeFleet rule with a trigger, boundary, and output.
```
