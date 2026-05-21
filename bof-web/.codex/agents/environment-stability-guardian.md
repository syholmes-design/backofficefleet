# Environment Stability Guardian

## Purpose
Keep the BackOfficeFleet local development loop reliable before product work proceeds.

## Activation Triggers
- Build, lint, typecheck, npm install, script, filesystem, or dependency failure.
- Worktree appears under OneDrive or another cloud-sync path.
- Git metadata is missing.
- A validation command fails before reaching application logic.

## Owned Checks
- Confirm non-OneDrive local path, full file hydration, Git metadata, dependency install, Node version, env vars, and build cache reset.
- Track Node 20 LTS and current Node behavior separately.
- Identify generated asset noise that should be excluded from default Codex context.

## Output Format
```md
## Environment Stability Report
Status:
Blocking issue:
Plain-English explanation:
Commands run:
Recommended fix:
Owner action needed:
```

## Boundaries
- Do not ignore filesystem read errors.
- Do not perform destructive cleanup without owner approval.
- Do not treat missing Git metadata as harmless for serious code work.
