import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

config({ path: '.env.local' });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const roles = [
  { code: 'FLEET_ADMIN', name: 'Fleet Administrator' },
  { code: 'FLEET_OPERATIONS', name: 'Fleet Operations' },
  { code: 'BOF_OPERATIONS', name: 'BOF Operations' },
  { code: 'BOF_COMPLIANCE_REVIEW', name: 'BOF Compliance / Review' },
  { code: 'DRIVER', name: 'Driver' },
];

const fleets = [
  { slug: 'fleet-a', name: 'Fleet A', carrierGroupName: 'Fleet A' },
  { slug: 'fleet-b', name: 'Fleet B', carrierGroupName: 'Fleet B' },
  { slug: 'bof-service', name: 'BOF Service', carrierGroupName: 'BOF Service' },
];

const users = [
  { email: 'fleet-a-admin@dev.local', name: 'Fleet A Admin', password: 'DevPass123!' },
  { email: 'fleet-a-ops@dev.local', name: 'Fleet A Ops', password: 'DevPass123!' },
  { email: 'fleet-b-admin@dev.local', name: 'Fleet B Admin', password: 'DevPass123!' },
  { email: 'bof-operations@dev.local', name: 'BOF Operations', password: 'DevPass123!' },
  { email: 'bof-compliance@dev.local', name: 'BOF Compliance Review', password: 'DevPass123!' },
];

const membershipByEmail = {
  'fleet-a-admin@dev.local': { fleetSlug: 'fleet-a', roleCode: 'FLEET_ADMIN' },
  'fleet-a-ops@dev.local': { fleetSlug: 'fleet-a', roleCode: 'FLEET_OPERATIONS' },
  'fleet-b-admin@dev.local': { fleetSlug: 'fleet-b', roleCode: 'FLEET_ADMIN' },
  'bof-operations@dev.local': { fleetSlug: 'bof-service', roleCode: 'BOF_OPERATIONS' },
  'bof-compliance@dev.local': { fleetSlug: 'bof-service', roleCode: 'BOF_COMPLIANCE_REVIEW' },
};

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: { code: role.code, name: role.name },
    });
  }

  const aggregator = await prisma.aggregator.findFirst({
    where: { name: 'BOF Development' },
  }) ?? await prisma.aggregator.create({
    data: { name: 'BOF Development' },
  });

  for (const fleet of fleets) {
    const carrierGroup = await prisma.carrierGroup.upsert({
      where: {
        aggregatorId_name: {
          aggregatorId: aggregator.id,
          name: fleet.carrierGroupName,
        },
      },
      update: { status: 'ACTIVE' },
      create: {
        aggregatorId: aggregator.id,
        name: fleet.carrierGroupName,
        status: 'ACTIVE',
      },
    });

    await prisma.fleet.upsert({
      where: { slug: fleet.slug },
      update: { name: fleet.name, carrierGroupId: carrierGroup.id },
      create: {
        slug: fleet.slug,
        name: fleet.name,
        carrierGroupId: carrierGroup.id,
      },
    });
  }

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        status: 'ACTIVE',
      },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        status: 'ACTIVE',
      },
    });
  }

  for (const [email, mapping] of Object.entries(membershipByEmail)) {
    const user = await prisma.user.findUnique({ where: { email } });
    const fleet = await prisma.fleet.findUnique({ where: { slug: mapping.fleetSlug } });
    const role = await prisma.role.findUnique({ where: { code: mapping.roleCode } });

    if (!user || !fleet || !role) {
      throw new Error(`Missing seed data for ${email}`);
    }

    await prisma.fleetMembership.upsert({
      where: {
        fleetId_userId: {
          fleetId: fleet.id,
          userId: user.id,
        },
      },
      update: { roleId: role.id, status: 'ACTIVE' },
      create: {
        fleetId: fleet.id,
        userId: user.id,
        roleId: role.id,
        status: 'ACTIVE',
      },
    });
  }

  console.log('Synthetic BOF development seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
