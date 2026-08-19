import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { requireFleetAccess, hasRole } from '../lib/authorization.ts';

config({ path: '.env.local' });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const fleetA = await prisma.fleet.findUnique({ where: { slug: 'fleet-a' } });
const fleetB = await prisma.fleet.findUnique({ where: { slug: 'fleet-b' } });
const bofService = await prisma.fleet.findUnique({ where: { slug: 'bof-service' } });

const userA = await prisma.user.findUnique({
  where: { email: 'fleet-a-admin@dev.local' },
  include: { memberships: { include: { role: true, fleet: true } } },
});

const userOps = await prisma.user.findUnique({
  where: { email: 'bof-operations@dev.local' },
  include: { memberships: { include: { role: true, fleet: true } } },
});

const userCompliance = await prisma.user.findUnique({
  where: { email: 'bof-compliance@dev.local' },
  include: { memberships: { include: { role: true, fleet: true } } },
});

if (!fleetA || !fleetB || !bofService || !userA || !userOps || !userCompliance) {
  throw new Error('Seeded dev tenants or users not present');
}

const userAObj = {
  id: userA.id,
  email: userA.email,
  memberships: userA.memberships.map((m) => ({
    fleetId: m.fleetId,
    roleCode: m.role.code,
    status: m.status,
  })),
};

const userOpsObj = {
  id: userOps.id,
  email: userOps.email,
  memberships: userOps.memberships.map((m) => ({
    fleetId: m.fleetId,
    roleCode: m.role.code,
    status: m.status,
  })),
};

const userComplianceObj = {
  id: userCompliance.id,
  email: userCompliance.email,
  memberships: userCompliance.memberships.map((m) => ({
    fleetId: m.fleetId,
    roleCode: m.role.code,
    status: m.status,
  })),
};

const auditRecord = await prisma.auditEvent.create({
  data: {
    actorId: userA.id,
    actorEmail: userA.email,
    tenantId: fleetA.id,
    action: 'ACCESS_GRANTED',
    entityType: 'Fleet',
    entityId: fleetA.id,
    details: { scope: 'dev-foundation-validation' },
    metadata: { source: 'runtime-validation' },
  },
});

const result = {
  fleetAAllowed: requireFleetAccess(userAObj, fleetA.id, ['FLEET_ADMIN']).allowed,
  fleetBCrossDenied: requireFleetAccess(userAObj, fleetB.id, ['FLEET_ADMIN']).allowed,
  bofOpsAllowed: requireFleetAccess(userOpsObj, bofService.id, ['BOF_OPERATIONS']).allowed,
  bofComplianceAllowed: requireFleetAccess(userComplianceObj, bofService.id, ['BOF_COMPLIANCE_REVIEW']).allowed,
  bofOpsRole: hasRole(userOpsObj, ['BOF_OPERATIONS']),
  bofComplianceRole: hasRole(userComplianceObj, ['BOF_COMPLIANCE_REVIEW']),
  auditCreated: Boolean(auditRecord.id),
  auditActorMatches: auditRecord.actorId === userA.id,
  auditTenantMatches: auditRecord.tenantId === fleetA.id,
};

console.log(JSON.stringify(result, null, 2));

await prisma.$disconnect();
