#!/usr/bin/env node
/**
 * Wrapper for `npx prisma migrate status` using DATABASE_URL from the environment
 * or a local gitignored env file. Never prints connection strings.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/admin/prisma-migration-status.mjs
 *   node scripts/admin/prisma-migration-status.mjs --env-file .env.production.local
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { databaseConnectionMetadata, resolveDatabaseUrl } from "./read-env-database-url.mjs";

const envFileArg = process.argv.indexOf("--env-file");
const envFile = envFileArg >= 0 ? process.argv[envFileArg + 1] : undefined;
const url = resolveDatabaseUrl({ envFile, preferEnvFile: Boolean(envFile) });

if (!url) {
  console.error("DATABASE_URL_REQUIRED");
  process.exit(1);
}

console.error(JSON.stringify({ target: databaseConnectionMetadata(url) }));

const result = spawnSync("npx", ["prisma", "migrate", "status"], {
  cwd: resolve(process.cwd()),
  env: { ...process.env, DATABASE_URL: url },
  encoding: "utf8",
  shell: true,
});

process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
process.exit(result.status ?? 1);
