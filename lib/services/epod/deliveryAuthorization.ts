import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { rejectDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

export const EPOD_DRIVER_ROLE = "DRIVER" as const;
export const EPOD_OPERATOR_ROLE = "FLEET_ADMIN" as const;

export type DeliveryActor = "ASSIGNED_DRIVER" | "FLEET_OPERATOR";

function httpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function assertLiveActor(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw httpError("Unauthorized", 401);
  }
  rejectDemoOperationalKey(sessionUser.id, "actorId");
  if (sessionUser.email) {
    rejectDemoOperationalKey(sessionUser.email, "actorEmail");
  }
}

export function classifyDeliveryActor(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  assignedDriverUserId: string | null,
): DeliveryActor {
  assertLiveActor(sessionUser);
  const access = requireFleetAccess(sessionUser, fleetId);
  if (!access.allowed || !access.membership) {
    throw httpError("Fleet membership is required.", 403);
  }
  const role = access.membership.roleCode;
  if (role === EPOD_DRIVER_ROLE) {
    if (!assignedDriverUserId) {
      throw httpError("Assigned driver is not linked to a user account.", 403);
    }
    if (assignedDriverUserId !== sessionUser?.id) {
      throw httpError("Only the assigned driver can record this delivery.", 403);
    }
    return "ASSIGNED_DRIVER";
  }
  if (role === EPOD_OPERATOR_ROLE) {
    return "FLEET_OPERATOR";
  }
  throw httpError("This fleet role cannot record or review delivery.", 403);
}

export function assertAssignedDriver(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  assignedDriverUserId: string | null,
) {
  const actor = classifyDeliveryActor(sessionUser, fleetId, assignedDriverUserId);
  if (actor !== "ASSIGNED_DRIVER") {
    throw httpError("Fleet administrator review does not record the driver delivery.", 403);
  }
  return actor;
}

export function assertDeliveryReader(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  assignedDriverUserId: string | null,
) {
  return classifyDeliveryActor(sessionUser, fleetId, assignedDriverUserId);
}

export function assertFleetOperator(sessionUser: SessionUserLike | null | undefined, fleetId: string) {
  const actor = classifyDeliveryActor(sessionUser, fleetId, null);
  if (actor !== "FLEET_OPERATOR") {
    throw httpError("Operator review requires a fleet administrator. Collecting a signature does not verify the POD.", 403);
  }
  return actor;
}
