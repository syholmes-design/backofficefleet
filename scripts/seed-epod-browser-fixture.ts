import { hashSync } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { resolveSecurePickupTestDatabaseUrl } from "@/lib/test/assertTestDatabaseTarget";

const email = "epod-browser-driver@dev.local";
const password = process.env.EPOD_BROWSER_PASSWORD ?? "";

async function main() {
  const url = resolveSecurePickupTestDatabaseUrl();
  if (process.env.DATABASE_URL !== url) {
    throw new Error("REFUSING_UNSAFE_TEST_DATABASE");
  }
  if (!password) {
    throw new Error("EPOD_BROWSER_PASSWORD is required");
  }
  const rows = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (rows[0]?.name !== "bof_dev") {
    throw new Error("REFUSING_UNSAFE_TEST_DATABASE");
  }

  const aggregator = await prisma.aggregator.upsert({
    where: { id: "epod-browser-aggregator" },
    update: {},
    create: { id: "epod-browser-aggregator", name: "epod-browser" },
  });
  const group = await prisma.carrierGroup.upsert({
    where: { id: "epod-browser-group" },
    update: {},
    create: { id: "epod-browser-group", aggregatorId: aggregator.id, name: "epod-browser" },
  });
  const fleet = await prisma.fleet.upsert({
    where: { slug: "epod-browser" },
    update: {},
    create: { slug: "epod-browser", name: "Browser Cert Carrier", carrierGroupId: group.id },
  });
  const driverRole = await prisma.role.upsert({
    where: { code: "DRIVER" },
    update: {},
    create: { code: "DRIVER", name: "Driver" },
  });
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hashSync(password, 8), status: "ACTIVE" },
    create: { email, passwordHash: hashSync(password, 8), status: "ACTIVE", name: "Browser Driver" },
  });
  await prisma.fleetMembership.upsert({
    where: { fleetId_userId: { fleetId: fleet.id, userId: user.id } },
    update: { status: "ACTIVE", roleId: driverRole.id },
    create: { userId: user.id, fleetId: fleet.id, roleId: driverRole.id, status: "ACTIVE" },
  });
  const driver = await prisma.driver.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, fleetId: fleet.id, firstName: "Browser", lastName: "Driver", email },
  });
  const tractor = await prisma.equipment.upsert({
    where: { fleetId_unitNumber: { fleetId: fleet.id, unitNumber: "BROWSER-1" } },
    update: {},
    create: { fleetId: fleet.id, equipmentType: "TRACTOR", unitNumber: "BROWSER-1", status: "AVAILABLE" },
  });
  let load = await prisma.load.findFirst({ where: { fleetId: fleet.id, referenceNumber: "EPOD-BROWSER-1" } });
  if (!load) {
    load = await prisma.load.create({
      data: {
        fleetId: fleet.id,
        customerName: "Browser Receiver",
        origin: "Dallas yard",
        destination: "Atlanta dock",
        referenceNumber: "EPOD-BROWSER-1",
        status: "IN_TRANSIT",
      },
    });
  }
  const existing = await prisma.dispatchAssignment.findFirst({ where: { loadId: load.id, status: "ACTIVE" } });
  if (!existing) {
    await prisma.dispatchAssignment.create({
      data: {
        fleetId: fleet.id,
        loadId: load.id,
        driverId: driver.id,
        tractorEquipmentId: tractor.id,
        status: "ACTIVE",
      },
    });
  }
  console.log(`BROWSER_EMAIL=${email}`);
  console.log(`BROWSER_LOAD=${load.id}`);
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "seed failed";
  console.error(message);
  process.exit(1);
});
