/**
 * Stage 0 D-1 PR 1: read-only driver qualification evidence inventory for ONE fleet.
 *
 * Usage (approved non-production snapshot only):
 *   BOF_STAGE0_ENVIRONMENT_CLASS=STAGING DATABASE_URL=... \
 *   npx tsx scripts/driver-qualification-evidence-inventory.ts --fleet-id <id> \
 *     --confirm-approved-nonproduction-snapshot [--include-drivers] [--out <file>]
 *
 * Refuses to run unless the environment is explicitly declared LOCAL, TEST or STAGING (the same declaration
 * D-2 uses to allow non-production behaviour), VERCEL_ENV is not production, and the confirmation flag is given.
 * The run is a READ ONLY transaction: it cannot write. Output is aggregate JSON; driver ids are included only
 * with --include-drivers. The database URL is never printed, only the host and database name.
 */
import { writeFileSync } from "node:fs";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { runDriverQualificationEvidenceInventory } from "../lib/services/driverQualificationEvidenceInventoryService";

const NON_PRODUCTION_CLASSES = new Set(["LOCAL", "TEST", "STAGING"]);

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const fleetId = arg("--fleet-id")?.trim();
  if (!fleetId) throw new Error("--fleet-id is required: the inventory is scoped to exactly one fleet");
  if (!process.argv.includes("--confirm-approved-nonproduction-snapshot")) {
    throw new Error("Refusing to run without --confirm-approved-nonproduction-snapshot");
  }
  const environmentClass = (process.env.BOF_STAGE0_ENVIRONMENT_CLASS ?? "").trim().toUpperCase();
  if (!NON_PRODUCTION_CLASSES.has(environmentClass) || process.env.VERCEL_ENV === "production") {
    throw new Error("Refusing to run: BOF_STAGE0_ENVIRONMENT_CLASS must be LOCAL, TEST or STAGING and VERCEL_ENV must not be production");
  }
  const connectionString = process.env.DATABASE_URL?.trim() ?? "";
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const target = new URL(connectionString);
  console.error(`Target: host=${target.hostname} database=${target.pathname.replace(/^\//, "")} (read-only)`);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }), log: [] });
  try {
    const inventory = await runDriverQualificationEvidenceInventory(prisma, {
      fleetId,
      includeDrivers: process.argv.includes("--include-drivers"),
    });
    const json = `${JSON.stringify(inventory, null, 2)}\n`;
    const out = arg("--out");
    if (out) writeFileSync(out, json);
    else process.stdout.write(json);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Inventory failed");
  process.exitCode = 1;
});
