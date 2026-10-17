const loads = [
  { id: "load-carrier-a", fleetId: "carrier-a" },
  { id: "load-carrier-b", fleetId: "carrier-b" },
];
const drivers = [
  { id: "driver-a", fleetId: "carrier-a", firstName: "A", lastName: "One", driverIntakes: [], qualificationSnapshots: [], readinessScores: [] },
  { id: "driver-b", fleetId: "carrier-b", firstName: "B", lastName: "Two", driverIntakes: [], qualificationSnapshots: [], readinessScores: [] },
];
const equipment = [
  { id: "equipment-a", fleetId: "carrier-a" },
  { id: "equipment-b", fleetId: "carrier-b" },
];
const pickups = [
  { id: "pickup-a", fleetId: "carrier-a", verificationAttempts: [], physicalReconciliation: null },
  { id: "pickup-b", fleetId: "carrier-b", verificationAttempts: [], physicalReconciliation: null },
];

function allowedFleetIds(args) {
  const fleetId = args?.where?.fleetId;
  if (!fleetId) return null;
  if (typeof fleetId === "string") return [fleetId];
  return fleetId.in ?? null;
}

function scoped(rows) {
  return async (args) => {
    const allowed = allowedFleetIds(args);
    if (!allowed) return rows;
    return rows.filter((row) => allowed.includes(row.fleetId));
  };
}

export const prisma = {
  load: { findMany: scoped(loads) },
  driver: { findMany: scoped(drivers) },
  equipment: { findMany: scoped(equipment) },
  pickupAuthorization: { findMany: scoped(pickups) },
  aggregatorMembership: {
    findMany: async () => [],
    findFirst: async () => null,
  },
};
