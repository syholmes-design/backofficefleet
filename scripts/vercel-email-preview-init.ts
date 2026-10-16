/**
 * Guarded initialization of the ISOLATED email Preview database during a Vercel Preview
 * build (gate: scripts/vercel-email-preview-init.mjs). Every check runs BEFORE any write;
 * any failure aborts the build. Never prints the connection string, passwords or tokens.
 *
 * Handles a Neon schema-only branch of production: tables exist but `_prisma_migrations`
 * has no rows. In that case the live schema must differ from the target schema ONLY by
 * the new Email* objects; then the pre-email migrations are recorded as applied
 * (baseline) and the email migration is applied normally.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { PREVIEW_EMAIL_DOMAIN, PREVIEW_FLEET_SLUGS, PREVIEW_MAIL_HOST, PRODUCTION_DB_MARKERS, seedEmailPreview } from "../lib/email-service/preview-seed";

const EMAIL_MIGRATION = "20261015200000_email_service_foundation";
const log = (msg: string) => console.log(`[email-preview-init] ${msg}`);
function fail(msg: string): never {
  console.error(`[email-preview-init] ABORTED: ${msg}`);
  process.exit(1);
}

/** Tables the preview seed itself writes; anything else holding rows means "not our database". */
const SEED_TABLES = new Set([
  "User", "Role", "Aggregator", "CarrierGroup", "Fleet", "FleetMembership", "AuditEvent",
  "EmailMailbox", "EmailMailboxCredential", "EmailSyncState", "EmailThread", "EmailMessage",
  "EmailEntityLink", "EmailDraft", "EmailApproval", "EmailAgentGrant",
]);

function prisma(args: string[]): string {
  // DATABASE_URL reaches the CLI through the environment only (prisma.config.ts).
  return execFileSync("node_modules/.bin/prisma", args, { env: process.env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function sqlStatements(diff: string): string[] {
  return diff
    .split("\n")
    .filter((l) => /^(CREATE|ALTER|DROP|COMMENT|INSERT|UPDATE|DELETE)\b/.test(l.trim()))
    .map((l) => l.trim());
}

async function main() {
  // ── 1. Environment checks ────────────────────────────────────────────────
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) fail("DATABASE_URL is missing or not PostgreSQL");
  if (!process.env.EMAIL_KEK_V1 || !process.env.EMAIL_SYNC_TOKEN) {
    fail("branch-scoped EMAIL_KEK_V1 / EMAIL_SYNC_TOKEN are not present, so the branch-specific variables may not be applied");
  }
  if (process.env.EMAIL_SENDING_ENABLED === "true") fail("EMAIL_SENDING_ENABLED=true is not allowed in the preview");
  if (PRODUCTION_DB_MARKERS.some((m) => url.includes(m))) fail("DATABASE_URL points at the production database endpoint");
  const parsed = new URL(url);
  log(`target host: ${parsed.hostname}  database: ${decodeURIComponent(parsed.pathname.slice(1))}`);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    // ── 2. Identity: inspect every table BEFORE writing ──────────────────────
    const tables = (await db.$queryRawUnsafe<Array<{ name: string }>>(
      `select table_name as name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1`,
    )).map((t) => t.name);
    const userTables = tables.filter((t) => t !== "_prisma_migrations");
    const counts: Record<string, number> = {};
    for (const t of userTables) {
      const [{ n }] = await db.$queryRawUnsafe<Array<{ n: bigint }>>(`select count(*)::bigint as n from "${t.replaceAll('"', '""')}"`);
      counts[t] = Number(n);
    }
    const nonEmpty = Object.entries(counts).filter(([, n]) => n > 0);
    const migrationRows = tables.includes("_prisma_migrations")
      ? Number((await db.$queryRawUnsafe<Array<{ n: bigint }>>(`select count(*)::bigint as n from "_prisma_migrations"`))[0].n)
      : -1;
    log(`tables: ${userTables.length}, non-empty: ${nonEmpty.length}, migration history rows: ${migrationRows < 0 ? "no table" : migrationRows}`);

    const foreign = nonEmpty.filter(([t]) => !SEED_TABLES.has(t));
    if (foreign.length > 0) fail(`database holds data outside the preview seed: ${foreign.map(([t, n]) => `${t}=${n}`).join(", ")}`);
    if (counts.User) {
      const realUsers = await db.$queryRawUnsafe<Array<{ n: bigint }>>(`select count(*)::bigint as n from "User" where email not like $1`, `%@${PREVIEW_EMAIL_DOMAIN}`);
      if (Number(realUsers[0].n) > 0) fail(`database holds ${realUsers[0].n} non-preview user(s); refusing`);
    }
    if (counts.Fleet) {
      const realFleets = await db.$queryRawUnsafe<Array<{ n: bigint }>>(`select count(*)::bigint as n from "Fleet" where not (slug = any($1::text[]))`, [...PREVIEW_FLEET_SLUGS]);
      if (Number(realFleets[0].n) > 0) fail(`database holds ${realFleets[0].n} non-preview fleet(s); refusing`);
    }
    // Reference rows inserted by migration 20260815023140 (not customer data) plus the preview seed's own rows.
    const allowedRefs = {
      Aggregator: { ids: ["agg-bof-default"], name: "Preview Aggregator" },
      CarrierGroup: { ids: ["cg-bof-service", "cg-fleet-a", "cg-fleet-b"], name: "Preview Carriers" },
    } as const;
    for (const [table, allow] of Object.entries(allowedRefs)) {
      if (!counts[table]) continue;
      const other = await db.$queryRawUnsafe<Array<{ n: bigint }>>(
        `select count(*)::bigint as n from "${table}" where not (id = any($1::text[])) and name <> $2`,
        [...allow.ids],
        allow.name,
      );
      if (Number(other[0].n) > 0) fail(`database holds ${other[0].n} non-preview ${table} row(s); refusing`);
    }
    if (counts.EmailMailbox) {
      const realHosts = await db.$queryRawUnsafe<Array<{ n: bigint }>>(`select count(*)::bigint as n from "EmailMailbox" where "imapHost" is distinct from $1 or "smtpHost" is distinct from $1`, PREVIEW_MAIL_HOST);
      if (Number(realHosts[0].n) > 0) fail("an email mailbox points at a real mail host; refusing");
    }
    if (counts.EmailMailboxCredential) fail("a mailbox credential is stored; the preview must hold none");
    log("identity checks passed: no production, real-user or business data present");

    // ── 3. Migrations ───────────────────────────────────────────────────────
    const allMigrations = readdirSync("prisma/migrations", { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    if (!allMigrations.includes(EMAIL_MIGRATION)) fail("email migration not found in prisma/migrations");

    if (userTables.length > 0 && migrationRows <= 0) {
      // Schema-only branch: prove the live schema is exactly "pre-email" before baselining.
      const statements = sqlStatements(prisma(["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--script"]));
      const unexpected = statements.filter((s) => !/"Email[A-Za-z]*"/.test(s));
      if (unexpected.length > 0) {
        fail(`live schema differs from the release schema beyond the email tables (${unexpected.length} statement(s)), e.g. ${unexpected.slice(0, 3).join(" | ").slice(0, 300)}`);
      }
      const emailAlreadyPresent = statements.length === 0 && userTables.includes("EmailMailbox");
      const toBaseline = allMigrations.filter((m) => emailAlreadyPresent || m !== EMAIL_MIGRATION);
      log(`schema-only branch detected: schema matches release schema minus ${statements.length} email statement(s); baselining ${toBaseline.length} migration(s)`);
      for (const m of toBaseline) prisma(["migrate", "resolve", "--applied", m]);
    }

    log("applying pending migrations");
    prisma(["migrate", "deploy"]);
    const drift = sqlStatements(prisma(["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--script"]));
    if (drift.length > 0) fail(`schema drift after migration (${drift.length} statement(s))`);
    const checks = await db.$queryRawUnsafe<Array<{ conname: string }>>(
      `select conname from pg_constraint where conname in ('EmailMailbox_scope_fleet_check', 'EmailAgentGrant_scopes_check')`,
    );
    if (checks.length !== 2) fail("email safety CHECK constraints are missing");
    log("migrations applied; schema matches; safety constraints present");

    // ── 4. Synthetic preview data (idempotent) ───────────────────────────────
    const password = process.env.EMAIL_PREVIEW_LOGIN_PASSWORD;
    const agentToken = process.env.EMAIL_PREVIEW_AGENT_TOKEN;
    if (password !== undefined && password.length < 12) fail("EMAIL_PREVIEW_LOGIN_PASSWORD must be at least 12 characters");
    if (agentToken !== undefined && agentToken.length < 32) fail("EMAIL_PREVIEW_AGENT_TOKEN must be at least 32 characters");
    const result = await seedEmailPreview(db, { password, agentToken, generateAgentToken: false });
    log(`seeded ${result.accounts.length} preview accounts (@${PREVIEW_EMAIL_DOMAIN}); sample correspondence ${result.sampleDataCreated ? "created" : "already present"}`);
    if (!password) log("EMAIL_PREVIEW_LOGIN_PASSWORD is not set: preview accounts have random unknown passwords until it is set and the preview is redeployed");
    if (!agentToken) log("EMAIL_PREVIEW_AGENT_TOKEN is not set: no Claude connector grant was created for this preview");
    log("done. Sending remains disabled; no mailbox has credentials or a real mail host.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => fail((err as Error).message?.replace(/postgres(ql)?:\/\/[^\s"']+/gi, "<redacted-url>") ?? "unknown error"));
