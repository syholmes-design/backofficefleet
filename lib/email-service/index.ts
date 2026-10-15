/**
 * BOF Email Service (server-only). See docs/email-service/ARCHITECTURE.md.
 *
 * Entry points:
 *  - EmailService: authenticated BOF users (NextAuth session → access.ts)
 *  - AgentGateway: AI agents with a scoped EmailAgentGrant (no send/approve)
 *  - syncMailbox: scheduled/on-demand IMAP sync
 *  - createEmailServices (server.ts): Prisma + IMAP/SMTP wiring
 */
export * from "./types";
export * from "./access";
export * from "./content-hash";
export * from "./credential-vault";
export * from "./credentials";
export * from "./threading";
export * from "./repository";
export * from "./send-policy";
export * from "./transport";
export * from "./service";
export * from "./sync";
export * from "./agent-gateway";
export * from "./partner-directory";
export * from "./provisioning";
export * from "./agent-grants";
export * from "./sync-auth";
