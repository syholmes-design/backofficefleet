import type { BofData } from "@/lib/load-bof-data";
import {
  buildLoadPacketRegistry,
  LOAD_PACKET_CATEGORIES,
  LOAD_PACKET_ROLES,
  type LoadPacketCategory,
  type LoadPacketCriticality,
  type LoadPacketItem,
  type LoadPacketRole,
} from "@/lib/load-artifact-registry";

export type TripPacketRole = LoadPacketRole;
export type TripPacketCategory = LoadPacketCategory;
export type TripPacketCriticality = LoadPacketCriticality;
export type TripPacketWorkspaceItem = LoadPacketItem;

export type TripPacketWorkspaceLoad = {
  loadId: string;
  loadNumber: string;
  status: string;
  driverId: string;
  driverName: string;
  customerName: string;
  lane: string;
};

export type TripPacketWorkspaceModel = {
  load: TripPacketWorkspaceLoad;
  readiness: {
    ready: number;
    required: number;
    recommendedAction: string;
  };
  items: TripPacketWorkspaceItem[];
};

export const TRIP_PACKET_ROLES = LOAD_PACKET_ROLES;
export const TRIP_PACKET_CATEGORIES = LOAD_PACKET_CATEGORIES;

export function buildTripPacketWorkspaceModel(data: BofData, loadId: string): TripPacketWorkspaceModel | null {
  const registry = buildLoadPacketRegistry(data, loadId);
  if (!registry) return null;

  return {
    load: registry.load,
    readiness: {
      ready: registry.validation.readyCount,
      required: registry.validation.requiredCount,
      recommendedAction: registry.validation.recommendedAction,
    },
    items: registry.packetItems,
  };
}

export function visibleItemsForRole(model: TripPacketWorkspaceModel, role: TripPacketRole) {
  return model.items.filter((item) => item.visibility.includes(role));
}
