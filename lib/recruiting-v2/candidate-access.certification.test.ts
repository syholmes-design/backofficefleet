import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { candidateScopeWhere, resolveRecruitingScope } from "@/lib/recruiting-v2/candidate-access";
import { activateRecruitingV2Candidate } from "@/lib/recruiting-v2/driver-activation-service";
import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

assertTestDatabaseTarget(process.env.DATABASE_URL);

const tag = `rv2-tenancy-${randomUUID().slice(0, 8)}`;
const ids = {
  aggregators: [] as string[],
  carrierGroups: [] as string[],
  fleets: [] as string[],
  users: [] as string[],
  positions: [] as string[],
  candidates: [] as string[],
  roles: [] as string[],
};

type Fixture = {
  fleetA: string;
  fleetB: string;
  fleetC: string;
  candidates: { a: string; b: string; c: string; unassigned: string };
  sessions: {
    fleetAAdmin: SessionUserLike;
    fleetBAdmin: SessionUserLike;
    fleetADriver: SessionUserLike;
    fleetAInvited: SessionUserLike;
    aggregatorAB: SessionUserLike;
    aggregatorAOnly: SessionUserLike;
    aggregatorInactiveLink: SessionUserLike;
    platform: SessionUserLike;
  };
};

let fixture: Fixture;

function session(userId: string, memberships: Array<{ fleetId: string; roleCode: string; status?: string }>): SessionUserLike {
  return { id: userId, email: `${userId}@${tag}.test`, memberships: memberships.map((m) => ({ status: "ACTIVE", ...m })) };
}

async function user(label: string) {
  const row = await prisma.user.create({ data: { email: `${label}@${tag}.test`, name: `${label} ${tag}` } });
  ids.users.push(row.id);
  return row.id;
}

async function candidate(code: string, positionId: string, fleetId: string | null) {
  const row = await prisma.candidate.create({
    data: {
      candidateCode: code,
      fullName: `Test Candidate ${code}`,
      email: `${code.toLowerCase()}@example.test`,
      phone: "555-0100",
      homeLocation: "Testville, OH",
      cdlClass: "A",
      cdlState: "OH",
      cdlNumberMasked: "XXXX0000",
      applicationSummary: fleetId ? { tenant: { fleetId } } : {},
      qualificationSummary: {},
      documentRequirements: {},
      complianceSummary: {},
      onboardingSummary: {},
      auditTrail: [],
      positionId,
    },
  });
  ids.candidates.push(row.id);
  return row.candidateCode;
}

/** The query every Recruiting V2 route now uses: the requested code, restricted to the user's scope. */
async function visibleCandidate(sessionUser: SessionUserLike, candidateCode: string) {
  const scope = await resolveRecruitingScope(sessionUser);
  return prisma.candidate.findUnique({ where: { candidateCode, AND: [candidateScopeWhere(scope)] }, select: { candidateCode: true } });
}

async function aggregatorWith(label: string, fleetLinks: Array<{ fleetId: string; status: "ACTIVE" | "INACTIVE" }>, roleId: string) {
  const aggregator = await prisma.aggregator.create({ data: { name: `${label} ${tag}` } });
  ids.aggregators.push(aggregator.id);
  for (const link of fleetLinks) {
    await prisma.aggregatorFleet.create({ data: { aggregatorId: aggregator.id, fleetId: link.fleetId, status: link.status } });
  }
  const userId = await user(label);
  await prisma.aggregatorMembership.create({ data: { userId, aggregatorId: aggregator.id, roleId, status: "ACTIVE" } });
  return session(userId, []);
}

test.before(async () => {
  const owner = await prisma.aggregator.create({ data: { name: `Owner ${tag}` } });
  ids.aggregators.push(owner.id);
  const group = await prisma.carrierGroup.create({ data: { aggregatorId: owner.id, name: `Group ${tag}` } });
  ids.carrierGroups.push(group.id);
  const fleet = async (suffix: string) => {
    const row = await prisma.fleet.create({ data: { carrierGroupId: group.id, slug: `${tag}-${suffix}`, name: `Fleet ${suffix} ${tag}` } });
    ids.fleets.push(row.id);
    return row.id;
  };
  const [fleetA, fleetB, fleetC] = [await fleet("a"), await fleet("b"), await fleet("c")];

  const role = await prisma.role.create({ data: { code: `FLEET_OPERATIONS_${tag}`, name: `Aggregator test role ${tag}` } });
  ids.roles.push(role.id);

  const position = await prisma.position.create({
    data: {
      positionCode: `POS-${tag}`,
      title: "Test position",
      homeTerminal: "Testville",
      freightType: "Dry van",
      primaryLanes: "Test",
      compensation: "Test",
      description: "Recruiting V2 tenancy certification fixture",
    },
  });
  ids.positions.push(position.id);

  const code = (suffix: string) => `CAND-${tag}-${suffix}`.toUpperCase();
  fixture = {
    fleetA,
    fleetB,
    fleetC,
    candidates: {
      a: await candidate(code("a"), position.id, fleetA),
      b: await candidate(code("b"), position.id, fleetB),
      c: await candidate(code("c"), position.id, fleetC),
      unassigned: await candidate(code("none"), position.id, null),
    },
    sessions: {
      fleetAAdmin: session(await user("fleet-a-admin"), [{ fleetId: fleetA, roleCode: "FLEET_ADMIN" }]),
      fleetBAdmin: session(await user("fleet-b-admin"), [{ fleetId: fleetB, roleCode: "FLEET_ADMIN" }]),
      fleetADriver: session(await user("fleet-a-driver"), [{ fleetId: fleetA, roleCode: "DRIVER" }]),
      fleetAInvited: session(await user("fleet-a-invited"), [{ fleetId: fleetA, roleCode: "FLEET_ADMIN", status: "INVITED" }]),
      aggregatorAB: await aggregatorWith("aggregator-ab", [{ fleetId: fleetA, status: "ACTIVE" }, { fleetId: fleetB, status: "ACTIVE" }], role.id),
      aggregatorAOnly: await aggregatorWith("aggregator-a", [{ fleetId: fleetA, status: "ACTIVE" }], role.id),
      aggregatorInactiveLink: await aggregatorWith("aggregator-inactive", [{ fleetId: fleetB, status: "INACTIVE" }], role.id),
      platform: session(await user("bof-operations"), [{ fleetId: fleetC, roleCode: "BOF_OPERATIONS" }]),
    },
  };
});

test.after(async () => {
  await prisma.candidate.deleteMany({ where: { id: { in: ids.candidates } } });
  await prisma.position.deleteMany({ where: { id: { in: ids.positions } } });
  await prisma.aggregatorMembership.deleteMany({ where: { userId: { in: ids.users } } });
  await prisma.aggregatorFleet.deleteMany({ where: { aggregatorId: { in: ids.aggregators } } });
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  await prisma.fleet.deleteMany({ where: { id: { in: ids.fleets } } });
  await prisma.carrierGroup.deleteMany({ where: { id: { in: ids.carrierGroups } } });
  await prisma.aggregator.deleteMany({ where: { id: { in: ids.aggregators } } });
  await prisma.role.deleteMany({ where: { id: { in: ids.roles } } });
  await prisma.$disconnect();
});

test("1. Fleet A cannot retrieve Fleet B's candidate (same result as an unknown code)", async () => {
  const { fleetAAdmin } = fixture.sessions;
  assert.equal(await visibleCandidate(fleetAAdmin, fixture.candidates.b), null);
  assert.equal(await visibleCandidate(fleetAAdmin, `CAND-${tag}-DOES-NOT-EXIST`), null);
  assert.equal((await visibleCandidate(fleetAAdmin, fixture.candidates.a))?.candidateCode, fixture.candidates.a);
});

test("2. Fleet B cannot retrieve Fleet A's candidate", async () => {
  const { fleetBAdmin } = fixture.sessions;
  assert.equal(await visibleCandidate(fleetBAdmin, fixture.candidates.a), null);
  assert.equal((await visibleCandidate(fleetBAdmin, fixture.candidates.b))?.candidateCode, fixture.candidates.b);
});

test("3. An aggregator affiliated with A and B reaches both, but not unaffiliated Fleet C", async () => {
  const { aggregatorAB } = fixture.sessions;
  assert.equal((await visibleCandidate(aggregatorAB, fixture.candidates.a))?.candidateCode, fixture.candidates.a);
  assert.equal((await visibleCandidate(aggregatorAB, fixture.candidates.b))?.candidateCode, fixture.candidates.b);
  assert.equal(await visibleCandidate(aggregatorAB, fixture.candidates.c), null);
});

test("4. An aggregator affiliated with A only, or with an inactive B link, cannot reach B", async () => {
  assert.equal(await visibleCandidate(fixture.sessions.aggregatorAOnly, fixture.candidates.b), null);
  assert.equal((await visibleCandidate(fixture.sessions.aggregatorAOnly, fixture.candidates.a))?.candidateCode, fixture.candidates.a);
  assert.equal(await visibleCandidate(fixture.sessions.aggregatorInactiveLink, fixture.candidates.b), null);
});

test("5. Drivers and invited members of Fleet A get no candidates", async () => {
  assert.equal(await visibleCandidate(fixture.sessions.fleetADriver, fixture.candidates.a), null);
  assert.equal(await visibleCandidate(fixture.sessions.fleetAInvited, fixture.candidates.a), null);
});

test("6. BOF platform staff reach every candidate, including one with no recorded fleet; fleet users do not see unassigned candidates", async () => {
  for (const code of Object.values(fixture.candidates)) {
    assert.equal((await visibleCandidate(fixture.sessions.platform, code))?.candidateCode, code);
  }
  assert.equal(await visibleCandidate(fixture.sessions.fleetAAdmin, fixture.candidates.unassigned), null);
  assert.equal(await visibleCandidate(fixture.sessions.aggregatorAB, fixture.candidates.unassigned), null);
});

test("7. Fleet A cannot activate Fleet B's candidate into Fleet A or into Fleet B; no driver is created", async () => {
  const before = await prisma.driver.count({ where: { fleetId: { in: [fixture.fleetA, fixture.fleetB] } } });
  const statusOf = async (fleetId: string) => {
    try {
      await activateRecruitingV2Candidate({ sessionUser: fixture.sessions.fleetAAdmin, candidateCode: fixture.candidates.b, fleetId });
      return 200;
    } catch (error) {
      return Number((error as { statusCode?: number }).statusCode) || 500;
    }
  };
  assert.equal(await statusOf(fixture.fleetA), 422, "candidate belongs to Fleet B");
  assert.equal(await statusOf(fixture.fleetB), 403, "Fleet A admin has no access to Fleet B");
  const after = await prisma.driver.count({ where: { fleetId: { in: [fixture.fleetA, fixture.fleetB] } } });
  assert.equal(after, before);
});

test("8. No Recruiting V2 API route loads a candidate by code without the tenant scope", () => {
  const root = join(process.cwd(), "app/api/recruiting-v2");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === "route.ts") files.push(full);
    }
  };
  walk(root);
  assert.ok(files.length >= 8);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /candidateCode:\s*candidateId\s*}/, `${file} queries by candidate code without scope`);
    assert.match(source, /requireRecruitingCandidateAccess\(candidateId\)/, `${file} must use the tenant gate`);
  }
});
