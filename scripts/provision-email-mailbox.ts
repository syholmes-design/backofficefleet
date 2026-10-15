import { createInterface, type Interface } from "node:readline";
import { stdin, stdout } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { loadMailboxSecret, storeMailboxCredential } from "../lib/email-service/credentials";
import { envKekProvider } from "../lib/email-service/credential-vault";
import { verifyMailboxConnection } from "../lib/email-service/mail-transports";
import { PrismaAuditSink, PrismaEmailRepository } from "../lib/email-service/prisma-repository";
import {
  NATHSON_MAIL_HOST,
  PROVISION_MAILBOX_CONFIRMATION,
  STORE_CREDENTIAL_CONFIRMATION,
  VERIFY_CONNECTION_CONFIRMATION,
  parseProvisionMode,
  partnershipsMailboxSpec,
} from "../lib/email-service/provisioning";
import { EmailCore } from "../lib/email-service/service";
import { DisabledTransport } from "../lib/email-service/transport";
import type { Actor } from "../lib/email-service/types";

const USAGE = [
  "Provision partnerships@nathson.com in BOF. Run by an authorized operator in their own terminal.",
  "",
  "  npm run provision:email-mailbox -- --dry-run          (default) print the plan, write nothing",
  "  npm run provision:email-mailbox -- --execute          create/update the mailbox record (no password)",
  "  npm run provision:email-mailbox -- --set-credential   seal and store the mailbox password (hidden prompt)",
  "  npm run provision:email-mailbox -- --verify           log in to IMAP and SMTP (nothing read or sent), list folder",
  "                                                        names, and mark the mailbox ACTIVE on success",
  "",
  "DATABASE_URL is read from the runtime environment only. --set-credential and --verify also need",
  "EMAIL_KEK_V1 (base64, 32 bytes). Sending stays disabled regardless.",
].join("\n");

const ADDRESS = "partnerships@nathson.com";
const KEY_VERSION = process.env.EMAIL_KEK_VERSION ?? "v1";

// One shared line reader: separate readline instances would drop buffered input.
let lineReader: Interface | null = null;
const pendingLines: string[] = [];
const lineWaiters: Array<(line: string) => void> = [];

function reader(): Interface {
  if (!lineReader) {
    lineReader = createInterface({ input: stdin, historySize: 0 });
    lineReader.on("line", (line) => {
      const waiter = lineWaiters.shift();
      if (waiter) waiter(line);
      else pendingLines.push(line);
    });
    lineReader.on("close", () => {
      while (lineWaiters.length > 0) lineWaiters.shift()!("");
    });
  }
  return lineReader;
}

function closeReader(): void {
  lineReader?.close();
  lineReader = null;
}

function ask(label: string): Promise<string> {
  stdout.write(label);
  reader();
  const queued = pendingLines.shift();
  if (queued !== undefined) return Promise.resolve(queued.trim());
  return new Promise((resolve) => lineWaiters.push((line) => resolve(line.trim())));
}

function askHidden(label: string): Promise<string> {
  if (!stdin.isTTY) throw new Error("Refusing to read a password from a non-interactive input");
  closeReader();
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          stdin.setRawMode(false);
          process.exit(1);
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        if (char >= " ") value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function confirm(phrase: string): Promise<void> {
  const typed = await ask(`Type "${phrase}" to continue: `);
  if (typed !== phrase) throw new Error("Confirmation phrase did not match. Nothing was written.");
}

async function main() {
  const mode = parseProvisionMode(process.argv.slice(2));
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL must be set in the runtime environment");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const operator: Actor = { kind: "SYSTEM", id: "provision-email-mailbox" };
  const core = new EmailCore(new PrismaEmailRepository(db), new PrismaAuditSink(db), new DisabledTransport(), () => ({
    globalSendingEnabled: false,
    now: new Date(),
  }));

  try {
    if (mode === "dry-run" || mode === "execute") {
      const approverEmail = (await ask("Approver BOF login email (the person who approves sends): ")).toLowerCase();
      const approver = await db.user.findUnique({ where: { email: approverEmail }, select: { id: true, status: true } });
      if (!approver || approver.status !== "ACTIVE") throw new Error(`No ACTIVE BOF user with email ${approverEmail}`);
      const mailHost = (await ask(`Mail server hostname [${NATHSON_MAIL_HOST}]: `)) || NATHSON_MAIL_HOST;
      const sentFolder = (await ask("Sent folder [INBOX.Sent] (--verify detects the real name): ")) || "INBOX.Sent";
      const spec = partnershipsMailboxSpec({ mailHost, approverUserIds: [approver.id], sentFolder });
      console.log("\nPlanned mailbox record (sendEnabled=false, status=PENDING_CREDENTIALS):");
      console.log(JSON.stringify(spec, null, 2));
      if (mode === "dry-run") return console.log("\nDry run: nothing written.");
      await confirm(PROVISION_MAILBOX_CONFIRMATION);
      const existing = await db.emailMailbox.findUnique({ where: { address: ADDRESS } });
      // A changed server means the stored credential/connection is unproven again.
      const hostChanged = existing && (existing.imapHost !== spec.imapHost || existing.smtpHost !== spec.smtpHost);
      const row = existing
        ? await db.emailMailbox.update({ where: { address: ADDRESS }, data: { ...spec, ...(hostChanged ? { status: "PENDING_CREDENTIALS" as const } : {}) } })
        : await db.emailMailbox.create({ data: { ...spec, sendEnabled: false, status: "PENDING_CREDENTIALS" } });
      console.log(`Mailbox ${existing ? "updated" : "created"}: ${row.id}`);
      return;
    }

    const row = await db.emailMailbox.findUnique({ where: { address: ADDRESS } });
    if (!row) throw new Error("Mailbox not provisioned. Run --execute first.");
    const mailbox = (await core.repo.getMailbox(row.id))!;
    const kek = envKekProvider();

    if (mode === "set-credential") {
      const username = (await ask(`IMAP/SMTP username [${ADDRESS}]: `)) || ADDRESS;
      const password = await askHidden("Mailbox password (hidden): ");
      await confirm(STORE_CREDENTIAL_CONFIRMATION);
      await storeMailboxCredential(core, operator, mailbox, { username, password }, kek, KEY_VERSION);
      console.log("Credential sealed and stored. Mailbox stays PENDING_CREDENTIALS until --verify succeeds.");
      return;
    }

    // verify: the only mode that contacts the live mail server.
    await confirm(VERIFY_CONNECTION_CONFIRMATION);
    const result = await verifyMailboxConnection(mailbox, await loadMailboxSecret(core, mailbox, kek));
    console.log(`IMAP: ${result.imap}\nSMTP: ${result.smtp}`);
    if (result.folders.length > 0) console.log(`Folders on server: ${result.folders.join(", ")}`);
    if (result.sentFolder && !mailbox.syncFolders.includes(result.sentFolder)) {
      const answer = await ask(`Server's Sent folder is "${result.sentFolder}" (configured: ${mailbox.syncFolders.join(", ")}). Use it? [y/N]: `);
      if (answer.toLowerCase() === "y") {
        const syncFolders = ["INBOX", result.sentFolder];
        await db.emailMailbox.update({ where: { id: mailbox.id }, data: { syncFolders } });
        console.log(`Sync folders set to ${syncFolders.join(", ")}.`);
      }
    }
    const ok = result.imap === "ok" && result.smtp === "ok";
    await core.repo.updateMailbox(mailbox.id, { status: ok ? "ACTIVE" : "AUTH_FAILED" });
    await core.record(operator, mailbox, "mailbox.status_changed", "EmailMailbox", mailbox.id, { status: ok ? "ACTIVE" : "AUTH_FAILED" });
    console.log(ok ? "Mailbox ACTIVE (sync allowed; sending still disabled)." : "Mailbox marked AUTH_FAILED.");
  } finally {
    closeReader();
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
