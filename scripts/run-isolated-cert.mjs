import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { assertTestDatabaseTarget } from "../lib/test/assertTestDatabaseTarget.ts";

const root = resolve(process.cwd());
const url =
  process.env.BOF_TEST_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  (() => {
    throw new Error("Set BOF_TEST_DATABASE_URL or DATABASE_URL");
  })();

const safeUrl = assertTestDatabaseTarget(url);
process.env.DATABASE_URL = safeUrl;

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/run-isolated-cert.mjs <test files...>");
  process.exit(1);
}

const result = spawnSync("npx", ["--yes", "tsx", "--test", ...files], {
  cwd: root,
  env: process.env,
  encoding: "utf8",
  shell: process.platform === "win32",
  maxBuffer: 20 * 1024 * 1024,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
