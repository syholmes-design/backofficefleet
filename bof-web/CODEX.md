# BackOfficeFleet Codex Setup

This file exists for shared Codex setups that look for `CODEX.md` instead of `AGENTS.md`.

Canonical instructions live in:

- `AGENTS.md`
- `.codex/session-brief.md`
- `.codex/README.md`
- `.codex/manifest.json`

Shared usage behavior:

- This project runs in low-effort mode by default on every Codex instance.
- Use the shortest useful response unless the owner explicitly asks for deeper analysis.
- Do not suppress overwrite, rollback, backup, validation, source-of-truth, or demo-breaking warnings.
- The shared rule lives in `AGENTS.md` under `Shared Intelligence Budget Rule`.
- The helper lives at `.codex/agents/intelligence-budget-controller.md`.
- The shared skill lives at `.agents/skills/low-intelligence-budget/SKILL.md`.

Run:

```powershell
npm run codex:bootstrap
```

That command prints the available BackOfficeFleet-specific agents, skills, audit scripts, priority routes, and environment warnings.
