import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "generate-driver-dqf-summaries.ts");

const result = spawnSync("npx", ["tsx", script], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
