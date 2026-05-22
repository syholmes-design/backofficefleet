/**
 * @deprecated Use generate-driver-docs.mjs (npm run generate:driver-docs).
 * Kept so older docs / bookmarks still work.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, "generate-driver-docs.mjs");
const r = spawnSync(process.execPath, [target], { stdio: "inherit" });
process.exit(r.status ?? 1);
