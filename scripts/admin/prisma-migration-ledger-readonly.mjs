#!/usr/bin/env node
/**
 * Read-only query of `_prisma_migrations` for release verification.
 * Does not run migrate deploy or write schema changes.
 *
 * Usage (operator shell — credentials stay in the environment, not in chat):
 *   DATABASE_URL=... node scripts/admin/prisma-migration-ledger-readonly.mjs
 *   node scripts/admin/prisma-migration-ledger-readonly.mjs --env-file .env.production.local
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { databaseConnectionMetadata, resolveDatabaseUrl } from "./read-env-database-url.mjs";

const envFileArg = process.argv.indexOf("--env-file");
const envFile = envFileArg >= 0 ? process.argv[envFileArg + 1] : undefined;
const url = resolveDatabaseUrl({ envFile, preferEnvFile: Boolean(envFile) });

if (!url) {
  console.error("DATABASE_URL_REQUIRED");
  process.exit(1);
}

console.error(JSON.stringify({ target: databaseConnectionMetadata(url) }));

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
try {
  const rows = await prisma.$queryRaw`
    SELECT migration_name,
           finished_at IS NOT NULL AS applied,
           rolled_back_at IS NOT NULL AS rolled_back,
           started_at,
           finished_at
    FROM "_prisma_migrations"
    ORDER BY migration_name ASC
  `;
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await prisma.$disconnect();
}
