import { createInterface, type Interface } from "node:readline";
import { stdin, stdout } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { ISSUE_AGENT_TOKEN_CONFIRMATION, issueAgentGrant } from "../lib/email-service/agent-grants";
import { PrismaEmailRepository } from "../lib/email-service/prisma-repository";

const USAGE = [
  "Manage the restricted Claude connector token for partnerships@nathson.com.",
  "",
  "  npm run email:agent-grant -- --list               show grants (no tokens are stored or shown)",
  "  npm run email:agent-grant -- --issue              issue a new token (shown ONCE in this terminal)",
  "  npm run email:agent-grant -- --revoke <grantId>   revoke immediately",
  "",
  "Tokens allow: search/read this mailbox, create drafts, request approval, link threads.",
  "Tokens never allow sending, approving, settings or credentials.",
].join("\n");

const ADDRESS = process.env.EMAIL_GRANT_MAILBOX ?? "partnerships@nathson.com";

let lineReader: Interface | null = null;
const pending: string[] = [];
const waiters: Array<(line: string) => void> = [];
function ask(label: string): Promise<string> {
  stdout.write(label);
  if (!lineReader) {
    lineReader = createInterface({ input: stdin, historySize: 0 });
    lineReader.on("line", (line) => (waiters.length ? waiters.shift()!(line) : pending.push(line)));
    lineReader.on("close", () => waiters.splice(0).forEach((w) => w("")));
  }
  const queued = pending.shift();
  return queued !== undefined ? Promise.resolve(queued.trim()) : new Promise((r) => waiters.push((l) => r(l.trim())));
}

async function main() {
  const args = process.argv.slice(2);
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL must be set in the runtime environment");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const repo = new PrismaEmailRepository(db);
  try {
    const row = await db.emailMailbox.findUnique({ where: { address: ADDRESS } });
    if (!row) throw new Error(`Mailbox ${ADDRESS} is not provisioned`);
    const mailbox = (await repo.getMailbox(row.id))!;

    if (args.includes("--list") || args.length === 0) {
      const grants = await repo.listAgentGrants(mailbox.id);
      if (grants.length === 0) console.log("No grants.");
      for (const g of grants) {
        const state = g.revokedAt ? `revoked ${g.revokedAt.toISOString()}` : g.expiresAt <= new Date() ? "expired" : `active until ${g.expiresAt.toISOString()}`;
        console.log(`${g.id}  ${g.agentId}  ${state}  scopes=${g.scopes.join(",")}  folders=${g.folderAllowlist.join(",")}`);
      }
      return;
    }

    if (args.includes("--revoke")) {
      const id = args[args.indexOf("--revoke") + 1];
      if (!id) throw new Error("--revoke needs a grant id (see --list)");
      console.log((await repo.revokeAgentGrant(id, new Date())) ? `Revoked ${id}.` : `No active grant ${id}.`);
      return;
    }

    if (args.includes("--issue")) {
      const email = (await ask("Your BOF login email (must be an approver of this mailbox): ")).toLowerCase();
      const user = await db.user.findUnique({ where: { email }, select: { id: true, status: true } });
      if (!user || user.status !== "ACTIVE") throw new Error(`No ACTIVE BOF user with email ${email}`);
      const days = Number((await ask("Valid for how many days? [30, max 90]: ")) || "30");
      const typed = await ask(`Type "${ISSUE_AGENT_TOKEN_CONFIRMATION}" to continue: `);
      if (typed !== ISSUE_AGENT_TOKEN_CONFIRMATION) throw new Error("Confirmation phrase did not match. Nothing was written.");
      const { token, grant } = await issueAgentGrant(repo, { mailbox, createdById: user.id, days });
      console.log("\nGrant", grant.id, "expires", grant.expiresAt.toISOString());
      console.log("Scopes:", grant.scopes.join(", "), "| Folders:", grant.folderAllowlist.join(", "));
      console.log("\nToken (shown once; store it only in the connector configuration):\n");
      console.log(token);
      console.log("\nUse header: Authorization: Bearer <token>");
      return;
    }

    console.log(USAGE);
  } finally {
    lineReader?.close();
    await db.$disconnect();
  }
}

if (process.argv.includes("--help")) {
  console.log(USAGE);
} else {
  main().catch((err) => {
    console.error((err as Error).message);
    process.exit(1);
  });
}
