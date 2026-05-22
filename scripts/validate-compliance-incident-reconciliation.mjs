/**
 * Bootstrap: runs TS runtime checks against demo-data + lib reconciliation.
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.join(__dirname, "..");
const runner = path.join(__dirname, "validate-compliance-incident-reconciliation-run.ts");
const cmd = process.platform === "win32" ? "npx.cmd" : "npx";

const r = spawnSync(cmd, ["--yes", "tsx", runner], {
  cwd,
  stdio: "inherit",
  shell: true,
});

if (r.error) {
  console.error(r.error);
  process.exit(1);
}
process.exit(r.status === 0 ? 0 : 1);
