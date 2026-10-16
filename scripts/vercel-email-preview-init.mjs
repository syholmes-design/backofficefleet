// Build-time gate for the isolated email Preview. Runs at the start of `npm run build`.
// Does NOTHING unless this is a Vercel *Preview* build of the email branch; production,
// other branches and local builds return immediately. Remove before merging (see
// docs/email-service/PREVIEW.md).
import { spawnSync } from "node:child_process";

const TARGET_BRANCH = "claude/loving-allen-zr8loh";

if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH) {
  process.exit(0);
}

console.log(`[email-preview-init] Preview build of ${TARGET_BRANCH}: running guarded preview database initialization`);
const result = spawnSync("npx", ["--yes", "tsx@4.23.15", "scripts/vercel-email-preview-init.ts"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
