import { hasRole, requireFleetAccess, type SessionUserLike } from "@/lib/authorization";

import type { EmailCapability, MailboxConnection } from "./types";

/**
 * Maps BOF's existing FleetMembership roles onto mailbox capabilities. No new auth
 * system: the session user comes from NextAuth (auth.ts) exactly as other services use.
 *
 * PLATFORM mailboxes (BOF-owned, e.g. partnerships@nathson.com):
 *  - users listed in mailbox.approverUserIds: read, draft, approve, admin
 *  - BOF_OPERATIONS: read, draft
 *  - everyone else (including all fleet roles): nothing
 *
 * FLEET mailboxes (owned by one fleet; fleet-level isolation via requireFleetAccess):
 *  - FLEET_ADMIN: read, draft, admin
 *  - FLEET_MANAGER, FLEET_OPERATIONS, DISPATCH: read, draft
 *  - approve only if also listed in mailbox.approverUserIds
 *  - BOF platform roles get no implicit access to fleet mail
 */
export const PLATFORM_DRAFTER_ROLES = ["BOF_OPERATIONS"] as const;
export const FLEET_ADMIN_ROLES = ["FLEET_ADMIN"] as const;
export const FLEET_DRAFTER_ROLES = ["FLEET_ADMIN", "FLEET_MANAGER", "FLEET_OPERATIONS", "DISPATCH"] as const;

export function resolveMailboxCapabilities(
  user: SessionUserLike | null | undefined,
  mailbox: MailboxConnection,
): Set<EmailCapability> {
  const caps = new Set<EmailCapability>();
  if (!user?.id) return caps;
  const isApprover = mailbox.approverUserIds.includes(user.id);

  if (mailbox.scope === "PLATFORM") {
    if (mailbox.fleetId !== null) return caps; // malformed: fail closed
    if (isApprover) {
      caps.add("read").add("draft").add("approve").add("admin");
    } else if (hasRole(user, [...PLATFORM_DRAFTER_ROLES])) {
      caps.add("read").add("draft");
    }
    return caps;
  }

  if (!mailbox.fleetId) return caps;
  const access = requireFleetAccess(user, mailbox.fleetId, [...FLEET_DRAFTER_ROLES]);
  if (!access.allowed) return caps;
  caps.add("read").add("draft");
  if (access.membership && (FLEET_ADMIN_ROLES as readonly string[]).includes(access.membership.roleCode)) {
    caps.add("admin");
  }
  if (isApprover) caps.add("approve");
  return caps;
}
