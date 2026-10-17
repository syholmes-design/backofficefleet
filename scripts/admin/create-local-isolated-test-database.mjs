#!/usr/bin/env node
/**
 * Creates a disposable local Postgres database for Increment 5 / GPS verification.
 * Refuses non-loopback hosts. Requires a loopback DATABASE_URL (or --env-file pointing at one).
 *
 * Usage:
 *   node scripts/admin/create-local-isolated-test-database.mjs --env-file ../bof-web/.env.local bof_inc5_verify
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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
if (!baseUrl && envFile) {
  baseUrl = readDatabaseUrlFromFile(envFile);
}
if (!baseUrl || !dbName) {
  console.error("DATABASE_URL_REQUIRED");
  process.exit(1);
}

const parsed = new URL(baseUrl);
const host = parsed.hostname.toLowerCase();
if (host !== "localhost" && host !== "127.0.0.1") {
  console.error("REFUSING_NON_LOOPBACK_CREATE");
  process.exit(1);
}

const admin = new URL(baseUrl);
admin.pathname = "/postgres";

const adminClient = new PrismaClient({ adapter: new PrismaPg({ connectionString: admin.toString() }) });
try {
  const exists = await adminClient.$queryRawUnsafe(
    `SELECT 1 AS ok FROM pg_database WHERE datname = '${dbName}' LIMIT 1`,
  );
  if (Array.isArray(exists) && exists.length > 0) {
    console.log(JSON.stringify({ status: "exists", database: dbName }));
  } else {
    await adminClient.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
    console.log(JSON.stringify({ status: "created", database: dbName }));
  }
} finally {
  await adminClient.$disconnect();
}
