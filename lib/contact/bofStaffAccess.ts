import { hasRole, type SessionUserLike } from "@/lib/authorization";

/**
 * Inquiry review roles. BOF_INQUIRY_REVIEW is intentionally absent from the
 * global service-role checks that read every carrier's operations.
 */
export const BOF_STAFF_ROLE_CODES = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW", "BOF_INQUIRY_REVIEW"] as const;

export function isBofStaff(user: SessionUserLike | null | undefined) {
  return Boolean(user?.id) && hasRole(user, [...BOF_STAFF_ROLE_CODES]);
}
