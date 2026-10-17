#!/usr/bin/env node
/**
 * Writes a loopback DATABASE_URL for a named local database (stdout only).
 * Uses the credentials/host from a gitignored env file; never logs passwords when used as a subprocess pipe.
 *
 * Usage:
 *   $url = node scripts/admin/local-isolated-database-url.mjs --env-file ../bof-web/.env.local bof_inc5_verify
 */
import { readDatabaseUrlFromFile, resolveDatabaseUrl } from "./read-env-database-url.mjs";

const envFileArg = process.argv.indexOf("--env-file");
const envFile = envFileArg >= 0 ? process.argv[envFileArg + 1] : undefined;
const positional = process.argv.slice(2).filter((arg, index, argv) => {
  if (arg === "--env-file") return false;
  if (argv[index - 1] === "--env-file") return false;
  return !arg.startsWith("-");
});
const dbName = (positional[0] ?? "bof_inc5_verify").replace(/[^a-zA-Z0-9_]/g, "");

let baseUrl = resolveDatabaseUrl({ envFile, preferEnvFile: Boolean(envFile) });
if (!baseUrl && envFile) baseUrl = readDatabaseUrlFromFile(envFile);
if (!baseUrl || !dbName) {
  process.exit(1);
}

const url = new URL(baseUrl);
url.pathname = `/${dbName}`;
process.stdout.write(url.toString());
