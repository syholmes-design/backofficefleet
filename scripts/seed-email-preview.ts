import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { SEED_PREVIEW_CONFIRMATION, assertPreviewDatabase, readOccupancy, seedEmailPreview } from "../lib/email-service/preview-seed";

/**
 * Seed an EMPTY, ISOLATED preview database for inspecting the email integration.
 *   DATABASE_URL=<preview db> npm run seed:email-preview
 * Refuses the production database and any database holding non-preview users/fleets.
 * Prints generated preview passwords and a preview agent token ONCE to this terminal.
 */
function ask(label: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, historySize: 0 });
  return new Promise((resolve) => rl.question(label, (a) => (rl.close(), resolve(a.trim()))));
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url ?? "" }) });
  try {
    const occupancy = await readOccupancy(db);
    assertPreviewDatabase(url, occupancy);
    console.log(`Target host: ${new URL(url!).hostname}  (existing email mailboxes: ${occupancy.emailMailboxes})`);
    if ((await ask(`Type "${SEED_PREVIEW_CONFIRMATION}" to continue: `)) !== SEED_PREVIEW_CONFIRMATION) {
      throw new Error("Confirmation phrase did not match. Nothing was written.");
    }
    const result = await seedEmailPreview(db);
    console.log("\nPreview accounts (shown once; synthetic, preview database only):\n");
    for (const a of result.accounts) console.log(`  ${a.email.padEnd(42)} ${a.password}   ${a.description}`);
    if (result.agentToken) {
      console.log("\nPreview Claude connector token (shown once, valid 14 days, preview DB only):\n");
      console.log(`  ${result.agentToken}`);
    }
    console.log("\nAll seeded mailboxes point at mail.preview.invalid and have no credential. Sending is disabled.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
