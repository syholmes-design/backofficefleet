import { randomBytes } from "node:crypto";

import type { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

import { AgentGateway } from "./agent-gateway";
import { issueAgentGrant } from "./agent-grants";
import { PrismaAuditSink, PrismaEmailRepository } from "./prisma-repository";
import { partnershipsMailboxSpec } from "./provisioning";
import { EmailCore } from "./service";
import { DisabledTransport } from "./transport";
import type { IncomingMessage } from "./types";

/**
 * Seeds an ISOLATED, EMPTY preview database with synthetic users, fleets and
 * partnership correspondence so the email integration can be inspected on a Vercel
 * Preview deployment. Never connects to a mail server: every seeded mailbox points
 * at a `.invalid` host (RFC 2606, never resolves) and has no stored credential.
 */

export const SEED_PREVIEW_CONFIRMATION = "SEED EMAIL PREVIEW";
export const PREVIEW_EMAIL_DOMAIN = "preview.bof.invalid";
export const PREVIEW_MAIL_HOST = "mail.preview.invalid";
export const PREVIEW_FLEET_SLUGS = ["preview-fleet-a", "preview-fleet-b"] as const;
/** Known production Neon endpoint (also listed in lib/test/assertTestDatabaseTarget.ts). */
export const PRODUCTION_DB_MARKERS = ["ep-young-sound-axayjjna"] as const;

export interface DatabaseOccupancy {
  foreignUsers: number;
  foreignFleets: number;
  emailMailboxes: number;
}

/** Throws unless the target is clearly an isolated preview/test database. */
export function assertPreviewDatabase(url: string | undefined, occupancy: DatabaseOccupancy): void {
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) throw new Error("DATABASE_URL must be a PostgreSQL URL");
  if (PRODUCTION_DB_MARKERS.some((m) => url.includes(m))) throw new Error("Refusing: DATABASE_URL points at the production database");
  if (occupancy.foreignUsers > 0 || occupancy.foreignFleets > 0) {
    throw new Error(
      `Refusing: database already holds ${occupancy.foreignUsers} non-preview user(s) and ${occupancy.foreignFleets} non-preview fleet(s). ` +
        "Use an empty, isolated database for the preview.",
    );
  }
}

export async function readOccupancy(db: PrismaClient): Promise<DatabaseOccupancy> {
  const [foreignUsers, foreignFleets, emailMailboxes] = await Promise.all([
    db.user.count({ where: { NOT: { email: { endsWith: `@${PREVIEW_EMAIL_DOMAIN}` } } } }),
    db.fleet.count({ where: { slug: { notIn: [...PREVIEW_FLEET_SLUGS] } } }),
    db.emailMailbox.count(),
  ]);
  return { foreignUsers, foreignFleets, emailMailboxes };
}

export interface PreviewAccount {
  email: string;
  password: string;
  description: string;
}

export interface PreviewSeedResult {
  accounts: PreviewAccount[];
  agentToken: string;
  partnershipsMailboxId: string;
  fleetMailboxId: string;
}

function password(): string {
  return randomBytes(15).toString("base64url");
}

const at = (iso: string) => new Date(iso);

function msg(o: Partial<IncomingMessage> & Pick<IncomingMessage, "messageIdHeader" | "fromAddress" | "subject" | "textBody" | "receivedAt">): IncomingMessage {
  return {
    direction: "INBOUND",
    folder: "INBOX",
    imapUid: null,
    inReplyTo: null,
    references: [],
    fromName: null,
    toAddresses: ["partnerships@nathson.com"],
    ccAddresses: [],
    ...o,
  };
}

export async function seedEmailPreview(db: PrismaClient): Promise<PreviewSeedResult> {
  const roleCodes = ["BOF_OPERATIONS", "FLEET_ADMIN", "DISPATCH", "DRIVER"] as const;
  const roles = Object.fromEntries(
    await Promise.all(
      roleCodes.map(async (code) => [code, await db.role.upsert({ where: { code }, create: { code, name: code.replaceAll("_", " ") }, update: {} })] as const),
    ),
  );

  const aggregator = (await db.aggregator.findFirst({ where: { name: "Preview Aggregator" } })) ?? (await db.aggregator.create({ data: { name: "Preview Aggregator" } }));
  const group = await db.carrierGroup.upsert({
    where: { aggregatorId_name: { aggregatorId: aggregator.id, name: "Preview Carriers" } },
    create: { aggregatorId: aggregator.id, name: "Preview Carriers" },
    update: {},
  });
  const [fleetA, fleetB] = await Promise.all(
    PREVIEW_FLEET_SLUGS.map((slug, i) =>
      db.fleet.upsert({ where: { slug }, create: { slug, name: `Preview Fleet ${i === 0 ? "A" : "B"}`, carrierGroupId: group.id }, update: {} }),
    ),
  );

  const specs = [
    { key: "approver", description: "Partnerships approver (you): read, draft, approve, admin", membership: null },
    { key: "bof-ops", description: "BOF_OPERATIONS: read and draft partnerships mail; cannot approve", membership: { fleetId: fleetA.id, role: "BOF_OPERATIONS" } },
    { key: "fleet-a-admin", description: "FLEET_ADMIN of Preview Fleet A: own fleet mailbox only; no partnerships access", membership: { fleetId: fleetA.id, role: "FLEET_ADMIN" } },
    { key: "fleet-b-admin", description: "FLEET_ADMIN of Preview Fleet B: sees no mailbox at all", membership: { fleetId: fleetB.id, role: "FLEET_ADMIN" } },
    { key: "driver-a", description: "DRIVER in Fleet A: no email access", membership: { fleetId: fleetA.id, role: "DRIVER" } },
  ] as const;

  const accounts: PreviewAccount[] = [];
  const userIds: Record<string, string> = {};
  for (const s of specs) {
    const email = `${s.key}@${PREVIEW_EMAIL_DOMAIN}`;
    const pw = password();
    const user = await db.user.upsert({
      where: { email },
      create: { email, name: `Preview ${s.key}`, passwordHash: await hash(pw, 10), status: "ACTIVE" },
      update: { passwordHash: await hash(pw, 10), status: "ACTIVE" },
    });
    userIds[s.key] = user.id;
    if (s.membership) {
      const roleId = roles[s.membership.role].id;
      await db.fleetMembership.upsert({
        where: { fleetId_userId: { fleetId: s.membership.fleetId, userId: user.id } },
        create: { fleetId: s.membership.fleetId, userId: user.id, roleId, status: "ACTIVE" },
        update: { roleId, status: "ACTIVE" },
      });
    }
    accounts.push({ email, password: pw, description: s.description });
  }

  const partnerships = await db.emailMailbox.upsert({
    where: { address: "partnerships@nathson.com" },
    create: {
      ...partnershipsMailboxSpec({ mailHost: PREVIEW_MAIL_HOST, approverUserIds: [userIds.approver] }),
      status: "ACTIVE",
      sendEnabled: false,
    },
    update: { imapHost: PREVIEW_MAIL_HOST, smtpHost: PREVIEW_MAIL_HOST, approverUserIds: [userIds.approver], sendEnabled: false },
  });
  const fleetBox = await db.emailMailbox.upsert({
    where: { address: `dispatch@fleet-a.${PREVIEW_EMAIL_DOMAIN}` },
    create: {
      scope: "FLEET",
      fleetId: fleetA.id,
      lane: "CORRESPONDENCE",
      address: `dispatch@fleet-a.${PREVIEW_EMAIL_DOMAIN}`,
      displayName: "Preview Fleet A Dispatch",
      imapHost: PREVIEW_MAIL_HOST,
      imapPort: 993,
      smtpHost: PREVIEW_MAIL_HOST,
      smtpPort: 465,
      syncFolders: ["INBOX"],
      approverUserIds: [userIds["fleet-a-admin"]],
      status: "ACTIVE",
      sendEnabled: false,
    },
    update: {},
  });

  const repo = new PrismaEmailRepository(db);
  const core = new EmailCore(repo, new PrismaAuditSink(db), new DisabledTransport(), () => ({ globalSendingEnabled: false, now: new Date() }));
  const pmb = (await repo.getMailbox(partnerships.id))!;
  const fmb = (await repo.getMailbox(fleetBox.id))!;
  const sig = "\n\nSylvester Holmes\nFounder | BackOfficeFleet\nA Nathson Company\npartnerships@nathson.com";

  await core.ingest(pmb, msg({ direction: "OUTBOUND", folder: "INBOX.Sent", messageIdHeader: "pv-out-checkr@nathson.com", fromAddress: "partnerships@nathson.com", toAddresses: ["partners@checkr.com"], subject: "Partner application: BackOfficeFleet", textBody: `Hello Checkr Partnerships team,\n\nBackOfficeFleet would like to integrate Checkr screenings into our driver qualification workflow.${sig}`, receivedAt: at("2026-10-13T15:00:00Z") }));
  await core.ingest(pmb, msg({ messageIdHeader: "pv-re-checkr@checkr.com", inReplyTo: "pv-out-checkr@nathson.com", references: ["pv-out-checkr@nathson.com"], fromAddress: "partners@checkr.com", fromName: "Checkr Partnerships (sample)", subject: "Re: Partner application: BackOfficeFleet", textBody: "Hi Sylvester,\n\nThanks for reaching out. Could you share expected monthly screening volume and whether each carrier will hold its own Checkr account?\n\n[Synthetic preview message]", receivedAt: at("2026-10-14T17:20:00Z") }));
  const samba = await core.ingest(pmb, msg({ messageIdHeader: "pv-intro@sambasafety.com", fromAddress: "bd@sambasafety.com", fromName: "SambaSafety BD (sample)", subject: "Intro call re: continuous MVR monitoring", textBody: "Hello,\n\nWe received your partner request. Are you available Tuesday or Wednesday next week for a 20-minute call?\n\n[Synthetic preview message]", receivedAt: at("2026-10-15T09:05:00Z") }));
  await core.ingest(pmb, msg({ messageIdHeader: "pv-ticket@dot.gov", fromAddress: "clearinghouse-support@dot.gov", subject: "Your Clearinghouse inquiry (ticket 88)", textBody: "Thank you for contacting the FMCSA Drug & Alcohol Clearinghouse. Your inquiry has been received.\n\n[Synthetic preview message]", receivedAt: at("2026-10-15T11:40:00Z") }));
  await core.ingest(pmb, msg({ messageIdHeader: "pv-tenstreet@tenstreet.com", fromAddress: "integrations@tenstreet.com", fromName: "Tenstreet Integrations (sample)", subject: "Integration partner program", textBody: "Thanks for your interest. Please complete the attached partner questionnaire.\n\n[Synthetic preview message]", receivedAt: at("2026-10-12T13:00:00Z") }));
  await core.ingest(fmb, msg({ messageIdHeader: "pv-fleet-a@shipper.preview.invalid", fromAddress: "ops@shipper.preview.invalid", toAddresses: [fmb.address], subject: "Fleet A only: pickup window change", textBody: "This message belongs to Preview Fleet A and must not be visible to other fleets or to BOF staff.", receivedAt: at("2026-10-15T08:00:00Z") }));

  const { token } = await issueAgentGrant(repo, { mailbox: pmb, createdById: userIds.approver, days: 14 });
  const agent = (await AgentGateway.fromToken(core, token))!;
  const draft = await agent.createDraft({
    threadId: samba!.threadId,
    inReplyTo: samba!.messageIdHeader,
    toAddresses: ["bd@sambasafety.com"],
    subject: "Re: Intro call re: continuous MVR monitoring",
    textBody: `Hello,\n\nThank you. Tuesday at 2:00 PM ET works well for a 20-minute call.${sig}`,
  });
  await agent.requestApproval(draft.id);

  return { accounts, agentToken: token, partnershipsMailboxId: pmb.id, fleetMailboxId: fmb.id };
}
