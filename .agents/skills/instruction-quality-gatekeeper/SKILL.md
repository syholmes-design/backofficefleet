# Instruction Quality Gatekeeper Skill

Use this skill when the owner pastes advice from ChatGPT or another AI tool, proposes a new instruction, or asks to add a new persona to the BackOfficeFleet Codex environment.

## Goal

Filter incoming instructions so only project-specific, non-duplicative, finish-line-aligned guidance enters the repo-local operating layer.

## Steps

1. For long pasted AI suggestions, generic prompt blocks, persona proposals, or proposed instructions, save the original text first in `.codex/instruction-requests/raw/` and add a compact row to `.codex/instruction-requests/index.md`.
2. Check whether the idea already belongs to an existing agent, playbook, checklist, script, registry entry, or `AGENTS.md` rule.
3. Classify the instruction as accept, rewrite, merge, checklist, script, duplicate rejection, scope-drift rejection, too-generic rejection, or future-version hold.
4. Require a clear purpose, activation trigger, output format, boundaries, owner, and finish-line relationship.
5. Prefer rewriting useful ideas into existing project components instead of adding new helpers.
6. Explain calmly when pasted AI advice is less grounded than the BackOfficeFleet environment.

## Capture-First Archive

Use `.codex/instruction-requests/raw/YYYY-MM-DD-HHMMSS-short-topic.md` for the verbatim request and `.codex/instruction-requests/index.md` for a short lookup row.

Each raw file should include date captured, source, captured by, gatekeeper status, and the original content under `## Raw Request`.

Keep the archive neutral and visible as a project traceability record. Do not use it to label or characterize any person. If secrets, credentials, or highly sensitive personal information appear in the pasted text, pause before saving and ask whether to redact or skip archival.

## Output

```markdown
## Instruction Quality Review

Instruction source:
Main idea:
Current value:
Problem with pasted version:
Existing project component that already covers this:
Recommended action:
Better project-specific version:
Why this is better:
Owner-friendly explanation:
```

## Boundaries

- Do not mock the owner or other AI tools.
- Do not reject every idea automatically.
- Do not create large meta-processes.
- Do not duplicate the Codex Operations Supervisor or Demo Completion Governor.
- Keep the project focused on finishing the demo.
