import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { rejectDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

export const DELIVERY_STAGES = [
  "DELIVERY_PENDING",
  "ARRIVED",
  "UNLOADING",
  "AWAITING_RECIPIENT_ACKNOWLEDGMENT",
  "ACCEPTED",
  "ACCEPTED_WITH_EXCEPTIONS",
  "REFUSED",
  "POD_GENERATED",
] as const;

export type DeliveryStage = (typeof DELIVERY_STAGES)[number];

const NEXT: Record<DeliveryStage, readonly DeliveryStage[]> = {
  DELIVERY_PENDING: ["ARRIVED"],
  ARRIVED: ["UNLOADING"],
  UNLOADING: ["AWAITING_RECIPIENT_ACKNOWLEDGMENT"],
  AWAITING_RECIPIENT_ACKNOWLEDGMENT: ["ACCEPTED", "ACCEPTED_WITH_EXCEPTIONS", "REFUSED"],
  ACCEPTED: ["POD_GENERATED"],
  ACCEPTED_WITH_EXCEPTIONS: ["POD_GENERATED"],
  REFUSED: ["POD_GENERATED"],
  POD_GENERATED: [],
};

export function assertEpodFleetMembership(sessionUser: SessionUserLike | null | undefined, fleetId: string) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  const access = requireFleetAccess(sessionUser, fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Fleet membership is required."), { statusCode: 403 });
  }
}

export function assertLiveLoadKey(loadKey: string) {
  rejectDemoOperationalKey(loadKey, "loadId");
  const key = loadKey.trim();
  if (!key) {
    throw Object.assign(new Error("Load is required."), { statusCode: 422 });
  }
  return key;
}

export function assertDeliveryTransition(current: DeliveryStage, next: DeliveryStage) {
  if (!DELIVERY_STAGES.includes(current) || !DELIVERY_STAGES.includes(next)) {
    throw Object.assign(new Error("Delivery stage is not supported."), { statusCode: 422 });
  }
  if (current === next) {
    return { idempotent: true as const, stage: current };
  }
  if (!NEXT[current].includes(next)) {
    throw Object.assign(new Error(`Delivery cannot move from ${current} to ${next}.`), { statusCode: 409 });
  }
  return { idempotent: false as const, stage: next };
}

export function isDeliveryStage(value: string): value is DeliveryStage {
  return (DELIVERY_STAGES as readonly string[]).includes(value);
}

export function assertEpodEnabled() {
  if (process.env.BOF_EPOD_ENABLED === "false") {
    throw Object.assign(new Error("Electronic POD is disabled."), { statusCode: 503 });
  }
}
