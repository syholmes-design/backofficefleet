#!/usr/bin/env node
/**
 * Prints host/database metadata for DATABASE_URL (never credentials).
 *
 * Usage:
 *   DATABASE_URL=... node scripts/admin/database-connection-metadata.mjs
 *   node scripts/admin/database-connection-metadata.mjs --env-file .env.local
 */
import { databaseConnectionMetadata, resolveDatabaseUrl } from "./read-env-database-url.mjs";

const envFileArg = process.argv.indexOf("--env-file");
const envFile = envFileArg >= 0 ? process.argv[envFileArg + 1] : undefined;
const url = resolveDatabaseUrl({ envFile, preferEnvFile: Boolean(envFile) });

if (!url) {
  console.error("DATABASE_URL_REQUIRED");
  process.exit(1);
}

console.log(JSON.stringify({ status: "OK", ...databaseConnectionMetadata(url) }, null, 2));
