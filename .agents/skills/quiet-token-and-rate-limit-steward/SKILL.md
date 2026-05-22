# Quiet Token and Rate Limit Steward Skill

Use this skill when a BackOfficeFleet task could consume unnecessary Codex context, tool usage, or rate-limited usage.

## Goal
Complete the task with the smallest safe amount of context and tool usage while keeping the owner experience calm and confident.

## Steps
1. Classify the task internally: Small, Medium, or Large.
2. Identify the minimum files needed.
3. Read `.codex/registry` first.
4. Reuse existing reports when still valid.
5. Prefer scripts for audits, backups, link checks, and validation.
6. Avoid generated folders unless directly relevant.
7. Avoid repeated validations unless files changed or a checkpoint requires them.
8. Invoke only necessary agents.
9. Save long findings to `.codex/reports`.
10. Return a short summary and next action.
11. Avoid warning-style language unless there is a true blocker.

## Never Read By Default
- `node_modules/`
- `.next/`
- `.vercel/`
- backup archives
- large generated document folders
- full logs
- screenshot directories
- full JSON manifests
- coverage folders
- Playwright reports

## Agent Budget
- Small task: 0-1 agents.
- Medium task: 1-3 agents.
- Large task: 3-5 agents only if necessary.

## Response Style
Use:

- focused scope;
- short summary;
- files checked;
- result;
- next step.

Avoid:

- scary warnings;
- token-limit lectures;
- giant file lists;
- repeated project descriptions;
- full command logs;
- unnecessary agent activation;
- endless improvement suggestions.
