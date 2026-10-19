#!/usr/bin/env node
/**
 * BOF preflight: run before tests, builds and releases.
 *
 *   npm run preflight             # application + database checks against DATABASE_URL
 *   npm run preflight -- --test   # also checks the disposable test database (bof_dev)
 *
 * Each failure is labelled INFRASTRUCTURE (database down, env missing, dependencies not installed)
 * or APPLICATION (schema/migration drift, generated client out of date), so a stopped Postgres is
 * not mistaken for a code defect. Prints variable names only, never values.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = process.cwd();
const require = createRequire(path.join(ROOT, "package.json"));
const results = [];
const record = (status, kind, check, detail) => results.push({ status, kind, check, detail });

const PRODUCTION_HOST_MARKERS = ["neon.tech"];

function describeTarget(url) {
  try {
    const u = new URL(url);
    const production = PRODUCTION_HOST_MARKERS.some((m) => u.hostname.includes(m));
    return { host: u.hostname, database: u.pathname.replace(/^\//, ""), production };
  } catch {
    return null;
  }
}

// 1. Runtime and dependencies
const major = Number(process.versions.node.split(".")[0]);
if (major >= 20) record("PASS", "INFRASTRUCTURE", "Node.js", `v${process.versions.node}`);
else record("FAIL", "INFRASTRUCTURE", "Node.js", `v${process.versions.node}; Node 20 or newer is required`);

for (const dep of ["next", "@prisma/client", "pg"]) {
  try {
    require.resolve(`${dep}/package.json`);
    record("PASS", "INFRASTRUCTURE", `dependency ${dep}`, "installed");
  } catch {
    record("FAIL", "INFRASTRUCTURE", `dependency ${dep}`, "not installed; run npm ci");
  }
}

const generatedClient = path.join(ROOT, "node_modules/.prisma/client");
const schemaPath = path.join(ROOT, "prisma/schema.prisma");
if (!existsSync(generatedClient)) {
  record("FAIL", "APPLICATION", "Prisma client", "not generated; run npx prisma generate");
} else if (statSync(schemaPath).mtimeMs > statSync(generatedClient).mtimeMs + 1000) {
  record("WARN", "APPLICATION", "Prisma client", "schema.prisma is newer than the generated client; run npx prisma generate");
} else {
  record("PASS", "APPLICATION", "Prisma client", "generated");
}

// 2. Environment (names only)
const required = ["DATABASE_URL", "AUTH_SECRET"];
for (const name of required) {
  if (process.env[name]) record("PASS", "INFRASTRUCTURE", `env ${name}`, "set");
  else record("FAIL", "INFRASTRUCTURE", `env ${name}`, "not set");
}
if (process.env.BOF_EPOD_ENABLED !== "false") {
  record("WARN", "APPLICATION", "env BOF_EPOD_ENABLED", "not exactly 'false': electronic POD is enabled unless this is explicitly false (owner policy: disabled)");
} else {
  record("PASS", "APPLICATION", "env BOF_EPOD_ENABLED", "false (ePOD disabled per policy)");
}

// 3. Database reachability and migrations
const migrationDir = path.join(ROOT, "prisma/migrations");
const expectedMigrations = existsSync(migrationDir)
  ? readdirSync(migrationDir).filter((d) => statSync(path.join(migrationDir, d)).isDirectory()).sort()
  : [];

async function checkDatabase(label, url) {
  const target = describeTarget(url);
  if (!target) {
    record("FAIL", "INFRASTRUCTURE", `${label} URL`, "not a valid connection URL");
    return;
  }
  record(target.production ? "WARN" : "PASS", "INFRASTRUCTURE", `${label} target`, `${target.host}/${target.database}${target.production ? " (PRODUCTION host: read-only checks only)" : ""}`);
  const { Client } = require("pg");
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
  } catch (error) {
    record("FAIL", "INFRASTRUCTURE", `${label} reachable`, `cannot connect (${error.code ?? error.message}). If local, start Postgres (e.g. pg_ctlcluster 16 main start)`);
    return;
  }
  record("PASS", "INFRASTRUCTURE", `${label} reachable`, "connected");
  try {
    const { rows } = await client.query(
      'select migration_name, finished_at is not null as finished, rolled_back_at is not null as rolled_back from "_prisma_migrations"',
    );
    const applied = new Set(rows.filter((r) => r.finished && !r.rolled_back).map((r) => r.migration_name));
    const failed = rows.filter((r) => !r.finished && !r.rolled_back).map((r) => r.migration_name);
    const pending = expectedMigrations.filter((m) => !applied.has(m));
    const unknown = [...applied].filter((m) => !expectedMigrations.includes(m));
    if (failed.length) record("FAIL", "APPLICATION", `${label} migrations`, `failed/incomplete: ${failed.join(", ")}`);
    else if (pending.length) record("FAIL", "APPLICATION", `${label} migrations`, `${pending.length} pending: ${pending.join(", ")}`);
    else record("PASS", "APPLICATION", `${label} migrations`, `all ${expectedMigrations.length} applied`);
    if (unknown.length) record("WARN", "APPLICATION", `${label} migrations`, `applied but not in this checkout: ${unknown.join(", ")}`);
  } catch (error) {
    record("FAIL", "APPLICATION", `${label} migrations`, `cannot read _prisma_migrations (${error.code ?? error.message})`);
  } finally {
    await client.end().catch(() => {});
  }
}

if (process.env.DATABASE_URL) await checkDatabase("database", process.env.DATABASE_URL);
if (process.argv.includes("--test")) {
  const testUrl = process.env.TEST_DATABASE_URL ?? "postgresql://bof:bof@127.0.0.1:5432/bof_dev";
  const target = describeTarget(testUrl);
  if (target?.production || target?.database !== "bof_dev") {
    record("FAIL", "INFRASTRUCTURE", "test database", "tests may only target a local bof_dev database (see lib/test/assertTestDatabaseTarget.ts)");
  } else {
    await checkDatabase("test database", testUrl);
  }
}

// Report
const width = Math.max(...results.map((r) => r.check.length));
for (const r of results) console.log(`${r.status.padEnd(4)}  ${r.kind.padEnd(14)}  ${r.check.padEnd(width)}  ${r.detail}`);
const failures = results.filter((r) => r.status === "FAIL");
const infra = failures.filter((r) => r.kind === "INFRASTRUCTURE").length;
const app = failures.length - infra;
console.log(
  failures.length
    ? `\nPreflight FAILED: ${infra} infrastructure, ${app} application. Fix infrastructure first; application results are unreliable until it passes.`
    : "\nPreflight passed.",
);
process.exit(failures.length ? 1 : 0);
