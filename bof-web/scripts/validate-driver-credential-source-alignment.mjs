import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const r = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["--yes", "tsx", join(__dirname, "validate-driver-credential-source-alignment.ts")],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" }
);
process.exit(r.status ?? 1);
