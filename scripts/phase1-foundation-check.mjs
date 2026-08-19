const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const BOF_OPERATIONS = "BOF_OPERATIONS";
const BOF_COMPLIANCE_REVIEW = "BOF_COMPLIANCE_REVIEW";
const FLEET_ADMIN = "FLEET_ADMIN";
const FLEET_MANAGER = "FLEET_MANAGER";

function getMemberships(user) {
  return user?.memberships ?? [];
}

function hasRole(user, allowedRoleCodes) {
  const memberships = getMemberships(user);
  return memberships.some(
    (membership) =>
      membership.status !== "INACTIVE" &&
      membership.status !== "INVITED" &&
      allowedRoleCodes.includes(membership.roleCode),
  );
}

function canAccessFleet(user, fleetId) {
  const memberships = getMemberships(user);
  return memberships.some(
    (membership) => membership.fleetId === fleetId && membership.status !== "INACTIVE" && membership.status !== "INVITED",
  );
}

function requireFleetAccess(user, fleetId, allowedRoleCodes = []) {
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

const fleetAUser = {
  id: "u-1",
  email: "ops@fleet-a.com",
  memberships: [
    { fleetId: "fleet-a", roleCode: FLEET_ADMIN, status: "ACTIVE" },
  ],
};

const fleetBUser = {
  id: "u-2",
  email: "ops@fleet-b.com",
  memberships: [
    { fleetId: "fleet-b", roleCode: FLEET_MANAGER, status: "ACTIVE" },
  ],
};

const serviceOpsUser = {
  id: "service-ops",
  email: "operations@backofficefleet.com",
  memberships: [{ fleetId: "global", roleCode: BOF_OPERATIONS, status: "ACTIVE" }],
};

const serviceComplianceUser = {
  id: "service-compliance",
  email: "review@backofficefleet.com",
  memberships: [{ fleetId: "global", roleCode: BOF_COMPLIANCE_REVIEW, status: "ACTIVE" }],
};

assert(canAccessFleet(fleetAUser, "fleet-a"), "Fleet A user should access Fleet A");
assert(!canAccessFleet(fleetAUser, "fleet-b"), "Fleet A user should not access Fleet B");
assert(requireFleetAccess(fleetAUser, "fleet-a", [FLEET_ADMIN]).allowed, "Fleet A user should satisfy required admin role");
assert(!requireFleetAccess(fleetAUser, "fleet-b", [FLEET_ADMIN]).allowed, "Cross-tenant access must be denied");
assert(hasRole(serviceOpsUser, [BOF_OPERATIONS]), "BOF Operations service user must have service role");
assert(hasRole(serviceComplianceUser, [BOF_COMPLIANCE_REVIEW]), "BOF Compliance/Review service user must have service role");
assert(requireFleetAccess(serviceOpsUser, "global", [BOF_OPERATIONS]).allowed, "Global service role should authorize service scope");

console.log("Phase One foundation checks passed: tenant isolation, role checks, and server-side authorization boundaries verified.");
