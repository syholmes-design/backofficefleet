export type RoleCode =
  | "BOF_OPERATIONS"
  | "BOF_COMPLIANCE_REVIEW"
  | "FLEET_ADMIN"
  | "FLEET_OPERATIONS"
  | "FLEET_MANAGER"
  | "DISPATCH"
  | "DRIVER";

export type MembershipLike = {
  fleetId: string;
  roleCode: RoleCode | string;
  status?: "ACTIVE" | "INVITED" | "INACTIVE" | string;
};

export type SessionUserLike = {
  id?: string;
  email?: string | null;
  memberships?: MembershipLike[];
};

export function getMemberships(user: SessionUserLike | null | undefined): MembershipLike[] {
  return user?.memberships ?? [];
}

export function hasRole(
  user: SessionUserLike | null | undefined,
  allowedRoleCodes: Array<RoleCode | string>,
): boolean {
  const memberships = getMemberships(user);
  if (memberships.length === 0) {
    return false;
  }

  return memberships.some(
    (membership) =>
      membership.status !== "INACTIVE" &&
      membership.status !== "INVITED" &&
      allowedRoleCodes.includes(membership.roleCode),
  );
}

export function canAccessFleet(
  user: SessionUserLike | null | undefined,
  fleetId: string,
): boolean {
  const memberships = getMemberships(user);
  return memberships.some(
    (membership) => membership.fleetId === fleetId && membership.status !== "INACTIVE" && membership.status !== "INVITED",
  );
}

export function requireFleetAccess(
  user: SessionUserLike | null | undefined,
  fleetId: string,
  allowedRoleCodes: Array<RoleCode | string> = [],
): { allowed: boolean; reason?: string; membership?: MembershipLike } {
  if (!user) {
    return { allowed: false, reason: "AUTH_REQUIRED" };
  }

  const membership = getMemberships(user).find(
    (entry) => entry.fleetId === fleetId && entry.status !== "INACTIVE" && entry.status !== "INVITED",
  );

  if (!membership) {
    return { allowed: false, reason: "TENANT_ACCESS_DENIED" };
  }

  if (allowedRoleCodes.length > 0 && !allowedRoleCodes.includes(membership.roleCode)) {
    return { allowed: false, reason: "ROLE_REQUIRED" };
  }

  return { allowed: true, membership };
}

export function isServiceRole(
  user: SessionUserLike | null | undefined,
  serviceRoleCodes: Array<RoleCode | string>,
): boolean {
  return hasRole(user, serviceRoleCodes);
}

export function isFleetBoundaryValid(
  user: SessionUserLike | null | undefined,
  requestedFleetId: string,
  sourceFleetId: string,
): boolean {
  return requestedFleetId === sourceFleetId && canAccessFleet(user, requestedFleetId);
}
