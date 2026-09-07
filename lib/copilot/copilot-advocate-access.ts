/**
 * Copilot Advocate access using existing BOF authorization helpers.
 * Does not create a Copilot role model or permission engine.
 */

import { getMemberships, hasRole, type SessionUserLike } from "@/lib/authorization";

/** Same operator roles used by pre-trip / condition services. */
export const COPILOT_OPERATOR_ROLE_CODES = [
  "BOF_OPERATIONS",
  "BOF_COMPLIANCE_REVIEW",
  "FLEET_ADMIN",
  "FLEET_MANAGER",
  "FLEET_OPERATIONS",
  "DISPATCH",
] as const;

export type CopilotAccessReason =
  | "AUTH_PENDING"
  | "AUTH_REQUIRED"
  | "DEMO_SHELL_OPEN"
  | "ROLE_OK"
  | "ROLE_REQUIRED";

export type CopilotAccessDecision = {
  allowed: boolean;
  reason: CopilotAccessReason;
  note: string;
};

export function resolveCopilotAdvocateAccess(
  user: SessionUserLike | null | undefined,
  options?: { sessionResolved?: boolean },
): CopilotAccessDecision {
  if (options?.sessionResolved === false) {
    return {
      allowed: false,
      reason: "AUTH_PENDING",
      note: "Existing BOF session has not been resolved. Protected Copilot information is not shown yet.",
    };
  }

  const memberships = getMemberships(user);
  if (!user || memberships.length === 0) {
    return {
      allowed: false,
      reason: "AUTH_REQUIRED",
      note: "Existing BOF operator session is required. Copilot does not inherit an unauthenticated demo shell.",
    };
  }

  if (hasRole(user, [...COPILOT_OPERATOR_ROLE_CODES])) {
    return {
      allowed: true,
      reason: "ROLE_OK",
      note: "Session membership matches existing BOF operator roles used by dispatch/pre-trip services.",
    };
  }

  return {
    allowed: false,
    reason: "ROLE_REQUIRED",
    note: "Existing BOF operator roles are required. DRIVER and other non-operator memberships cannot view Copilot Advocate information.",
  };
}

export function sessionUserFromAuthPayload(payload: unknown): SessionUserLike | null {
  if (!payload || typeof payload !== "object") return null;
  const user = (payload as { user?: unknown }).user;
  if (!user || typeof user !== "object") return null;
  const record = user as SessionUserLike;
  return {
    id: record.id,
    email: record.email,
    memberships: getMemberships(record),
  };
}
