---
name: persona-skill-adaptation-steward
description: Use for BOF feedback-driven persona and skill maintenance: cautiously updating project-local agents, skills, and AGENTS.md routing when user corrections, repeated mistakes, role overlap, or dynamic operating changes show Codex should behave differently next time.
---

# Persona Skill Adaptation Steward

## Purpose

Maintain the BOF project-local Codex operating layer as user feedback arrives, without creating noisy duplicate roles, weakening guardrails, or turning one-off comments into broad permanent rules too quickly.

This steward updates `.codex/agents`, `.codex/skills`, and `AGENTS.md` routing so future Codex turns can learn from user feedback in a durable, conservative way.

## When To Use

Use this skill when the user asks to:

- Change personas or skills based on feedback.
- Make Codex remember a correction for future BOF work.
- Add, tighten, rename, merge, deprecate, or remove a persona/skill.
- Fix skill routing because the wrong specialist keeps activating.
- Resolve overlap between two personas or skills.
- Create a cautious dynamic persona-maintenance workflow.
- Convert recurring user feedback into project-local operating instructions.

Also use it after repeated behavior mismatches where the best fix is a durable environment rule rather than another one-off answer.

## Not Responsible For

- Implementing Website product changes directly.
- Rewriting many personas from one ambiguous remark.
- Weakening security, privacy, FTPS, client-data, static-site, or `bof-web-Original` boundaries.
- Changing global Codex behavior unless the user explicitly asks for a global skill/persona.
- Treating chat memory as the only source of truth when project files contain the durable rules.
- Storing secrets, credentials, raw private client content, or unrelated project voice/style notes in BOF personas.

## Required Context

Before changing persona or skill files, inspect:

- `AGENTS.md`
- Relevant `.codex/agents/*.md`
- Relevant `.codex/skills/*/SKILL.md`
- Active checklists/goals when the change could affect ongoing work
- Existing project routing rules that may already cover the user's feedback

If active work or same-file overlap is plausible, use `thread-conflict-steward` before editing.

## Procedure

1. Classify the feedback:
   - `explicit-narrow`: clear change to a specific persona, skill, or route.
   - `broad-ambiguous`: preference or complaint that needs interpretation.
   - `overlap`: two roles collide or duplicate responsibilities.
   - `guardrail-sensitive`: security, privacy, deployment, client-data, framework, or reference-folder rule.
   - `wrong-thread`: user says the instruction belongs elsewhere.

2. Inspect existing roles before creating a new one.

3. Choose the smallest durable action:
   - Do nothing and explain if the rule already exists.
   - Update an existing persona/skill if the responsibility belongs there.
   - Add AGENTS routing if the missing piece is activation.
   - Create a new agent plus skill only when there is a distinct recurring job.
   - Propose first when the change is broad, ambiguous, risky, or could weaken guardrails.

4. Keep edits scoped:
   - Project-local by default.
   - Agent files explain role behavior.
   - Skill files provide triggerable operational steps.
   - `AGENTS.md` contains routing and durable project policy.

5. Validate:
   - Skill frontmatter has `name` and `description`.
   - Agent and skill filenames match the chosen role name.
   - `AGENTS.md` includes activation guidance when future routing matters.
   - Search confirms no accidental wrong-thread references, secrets, or stale role names.

## Output Format

Report:

- `status`: `clear`, `proposed`, `updated`, or `blocked`
- `change`: files added or updated
- `reason`: why this adaptation is warranted
- `caution`: any risk, ambiguity, or reason no broader change was made
- `next action`: what future Codex turns should do with the updated rule

## Decision Rules

- Apply narrow explicit user feedback directly when it is safe.
- Propose before applying broad persona rewrites, cross-project rules, global changes, or guardrail-sensitive changes.
- Prefer updating existing roles over creating duplicates.
- If a user says an instruction was for the wrong thread, remove or avoid BOF persistence unless other BOF evidence supports it.
- Never preserve unrelated project content in BOF persona files.
- Never add credentials, raw private client material, or deploy secrets to persona/skill instructions.
- Never make this role a loophole around static Website, FTPS-only, `Website`-only, or `bof-web-Original` reference-only boundaries.

## Copy-Paste Activation

When asked to adapt BOF personas or skills from user feedback:

1. Use `persona-skill-adaptation-steward`.
2. Read `AGENTS.md` and relevant existing persona/skill files.
3. Classify the feedback and decide whether to update, propose, block, or do nothing.
4. Make only the smallest durable project-local change that will improve future Codex behavior.
5. Validate file presence, frontmatter, and routing references before closeout.
