import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ACTIVATE_MEMBERSHIP_CONFIRMATION,
  ACTIVATE_USER_CONFIRMATION,
  CHANGE_ROLE_CONFIRMATION,
  OperatorProvisionError,
  PRODUCTION_CONFIRMATION,
  ROTATE_PASSWORD_CONFIRMATION,
  assertRuntimeDatabaseUrl,
  assertInteractivePasswordInput,
  emptyConfirmations,
  formatAudit,
  formatDryRun,
  parseOperatorProvisionArgs,
  passwordMatchesHash,
  provisionOperator,
  hashOperatorPassword,
  runOperatorProvisionSession,
  type FleetView,
  type MembershipView,
  type OperatorConfirmations,
  type OperatorProvisionRequest,
  type OperatorStore,
  type RoleView,
  type UserView,
} from "./operatorProvision";

const PASSWORD = "provision-test-only";
const HASH = "stored-hash-marker";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  status: UserView["status"];
  passwordHash: string;
  driverId: string | null;
};

type Memory = {
  roles: RoleView[];
  fleets: FleetView[];
  users: UserRow[];
  memberships: MembershipView[];
  failMembershipCreate: boolean;
  linkDriverOnSecondUserRead: boolean;
  userReads: number;
  writes: string[];
  transactions: number;
};

function baseMemory(): Memory {
  return {
    roles: [
      { id: "role-ops", code: "FLEET_ADMIN" },
      { id: "role-dispatch", code: "DISPATCH" },
      { id: "role-driver", code: "DRIVER" },
    ],
    fleets: [{ id: "fleet-live", slug: "live-fleet", name: "Live Fleet", status: "ACTIVE" }],
    users: [],
    memberships: [],
    failMembershipCreate: false,
    linkDriverOnSecondUserRead: false,
    userReads: 0,
    writes: [],
    transactions: 0,
  };
}

function createStore(memory: Memory): OperatorStore {
  const viewUser = (user: UserRow): UserView => ({
    id: user.id,
    email: user.email,
    status: user.status,
    driverId: user.driverId,
  });

  const api = (state: Memory): OperatorStore => ({
    async findRole(code) {
      return state.roles.find((role) => role.code === code) ?? null;
    },
    async findFleet(id) {
      return state.fleets.find((fleet) => fleet.id === id) ?? null;
    },
    async findUserByEmail(email) {
      state.userReads += 1;
      const user = state.users.find((row) => row.email === email) ?? null;
      if (!user) return null;
      if (state.linkDriverOnSecondUserRead && state.userReads > 1) user.driverId = "driver-1";
      return viewUser(user);
    },
    async findMembership(userId, fleetId) {
      return state.memberships.find((row) => row.userId === userId && row.fleetId === fleetId) ?? null;
    },
    async createUser(data) {
      state.writes.push("createUser");
      const user: UserRow = {
        id: `user-${state.users.length + 1}`,
        email: data.email,
        name: data.name,
        status: data.status,
        passwordHash: data.passwordHash,
        driverId: null,
      };
      state.users.push(user);
      return viewUser(user);
    },
    async updateUser(id, data) {
      state.writes.push("updateUser");
      const user = state.users.find((row) => row.id === id);
      if (!user) throw new Error("missing user");
      if (data.status) user.status = data.status;
      if (data.passwordHash) user.passwordHash = data.passwordHash;
      return viewUser(user);
    },
    async createMembership(data) {
      state.writes.push("createMembership");
      if (state.failMembershipCreate) throw new Error("forced membership failure");
      if (state.memberships.some((row) => row.userId === data.userId && row.fleetId === data.fleetId)) {
        throw new Error("duplicate membership");
      }
      const role = state.roles.find((row) => row.id === data.roleId);
      const membership: MembershipView = {
        id: `membership-${state.memberships.length + 1}`,
        userId: data.userId,
        fleetId: data.fleetId,
        roleId: data.roleId,
        roleCode: role?.code ?? "",
        status: data.status,
      };
      state.memberships.push(membership);
      return membership;
    },
    async updateMembership(id, data) {
      state.writes.push("updateMembership");
      const membership = state.memberships.find((row) => row.id === id);
      if (!membership) throw new Error("missing membership");
      if (data.status) membership.status = data.status;
      if (data.roleId) {
        membership.roleId = data.roleId;
        membership.roleCode = state.roles.find((row) => row.id === data.roleId)?.code ?? membership.roleCode;
      }
      return membership;
    },
    async transaction(fn) {
      state.transactions += 1;
      const snapshot = structuredClone({
        roles: state.roles,
        fleets: state.fleets,
        users: state.users,
        memberships: state.memberships,
        writes: state.writes,
      });
      try {
        return await fn(api(state));
      } catch (error) {
        state.roles = snapshot.roles;
        state.fleets = snapshot.fleets;
        state.users = snapshot.users;
        state.memberships = snapshot.memberships;
        state.writes = snapshot.writes;
        throw error;
      }
    },
  });

  return api(memory);
}

function request(overrides: Partial<OperatorProvisionRequest> = {}): OperatorProvisionRequest {
  return {
    mode: "dry-run",
    email: "operator@example.com",
    name: "Operator",
    password: PASSWORD,
    fleetId: "fleet-live",
    roleCode: "FLEET_ADMIN",
    confirmations: emptyConfirmations(),
    ...overrides,
  };
}

function confirmed(extra: Partial<OperatorConfirmations> = {}): OperatorConfirmations {
  return { ...emptyConfirmations(), production: PRODUCTION_CONFIRMATION, ...extra };
}

function hasher() {
  const calls: string[] = [];
  return {
    calls,
    hashPassword: async (password: string) => {
      calls.push(password);
      return HASH;
    },
  };
}

test("parse args defaults to dry-run and rejects a password argument without echoing it", () => {
  assert.equal(parseOperatorProvisionArgs([]).mode, "dry-run");
  assert.equal(parseOperatorProvisionArgs(["--dry-run"]).mode, "dry-run");
  assert.equal(parseOperatorProvisionArgs(["--execute"]).mode, "execute");
  assert.throws(() => parseOperatorProvisionArgs(["--execute", "--dry-run"]), (error: OperatorProvisionError) => {
    return error.code === "ARGUMENT_REJECTED";
  });
  const secret = "do-not-echo-this-password";
  assert.throws(
    () => parseOperatorProvisionArgs([`--password=${secret}`]),
    (error: OperatorProvisionError) => error.code === "PASSWORD_ARGUMENT_REJECTED" && !error.message.includes(secret),
  );
});

test("database url assertion never includes the url in the error", () => {
  assert.throws(() => assertRuntimeDatabaseUrl(""), (error: OperatorProvisionError) => error.code === "DATABASE_URL_REQUIRED");
  const secret = "file:///tmp/super-secret-database";
  assert.throws(
    () => assertRuntimeDatabaseUrl(secret),
    (error: OperatorProvisionError) => error.code === "DATABASE_URL_UNSUPPORTED" && !error.message.includes(secret),
  );
  assert.doesNotThrow(() => assertRuntimeDatabaseUrl("postgresql://127.0.0.1:5432/bof_dev"));
});

test("dry run produces zero writes even when the production phrase is present", async () => {
  const memory = baseMemory();
  const hash = hasher();
  const result = await provisionOperator(
    createStore(memory),
    request({ confirmations: confirmed() }),
    { hashPassword: hash.hashPassword },
  );
  assert.equal(result.mode, "dry-run");
  assert.equal(memory.writes.length, 0);
  assert.equal(memory.transactions, 0);
  assert.equal(hash.calls.length, 0);
  if (result.mode === "dry-run") {
    const text = formatDryRun(result.plan);
    assert.match(text, /writes: none/);
    assert.match(text, /fleetSlug: live-fleet/);
    assert.equal(text.includes(PASSWORD), false);
    assert.equal(text.includes(HASH), false);
  }
});

test("missing role, missing fleet, inactive fleet, and invalid email fail with no writes", async () => {
  const missingRole = baseMemory();
  const roleCount = missingRole.roles.length;
  missingRole.roles = missingRole.roles.filter((role) => role.code !== "FLEET_ADMIN");
  await assert.rejects(() => provisionOperator(createStore(missingRole), request()), (error: OperatorProvisionError) => {
    return error.code === "ROLE_NOT_FOUND" && missingRole.writes.length === 0 && missingRole.roles.length === roleCount - 1;
  });

  for (const roleCode of ["DISPATCH", "FLEET_OPERATIONS", "FLEET_MANAGER", "BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"]) {
    const unapproved = baseMemory();
    await assert.rejects(
      () => provisionOperator(createStore(unapproved), request({ roleCode })),
      (error: OperatorProvisionError) => error.code === "ROLE_NOT_APPROVED" && unapproved.writes.length === 0,
    );
  }

  const missingFleet = baseMemory();
  await assert.rejects(
    () => provisionOperator(createStore(missingFleet), request({ fleetId: "missing" })),
    (error: OperatorProvisionError) => error.code === "FLEET_NOT_FOUND" && missingFleet.writes.length === 0,
  );

  const inactiveFleet = baseMemory();
  inactiveFleet.fleets[0].status = "ARCHIVED";
  await assert.rejects(() => provisionOperator(createStore(inactiveFleet), request()), (error: OperatorProvisionError) => {
    return error.code === "FLEET_NOT_ACTIVE" && inactiveFleet.writes.length === 0;
  });

  const invalidEmail = baseMemory();
  await assert.rejects(
    () => provisionOperator(createStore(invalidEmail), request({ email: "not-an-email" })),
    (error: OperatorProvisionError) => error.code === "INVALID_EMAIL" && invalidEmail.writes.length === 0,
  );
});

test("driver-linked email fails and a later link rolls the transaction back", async () => {
  const linked = baseMemory();
  linked.users.push({
    id: "user-driver",
    email: "operator@example.com",
    name: "Driver",
    status: "ACTIVE",
    passwordHash: "original-hash",
    driverId: "driver-1",
  });
  await assert.rejects(() => provisionOperator(createStore(linked), request()), (error: OperatorProvisionError) => {
    return error.code === "DRIVER_LINKED_USER" && linked.writes.length === 0;
  });

  const race = baseMemory();
  race.linkDriverOnSecondUserRead = true;
  race.users.push({
    id: "user-1",
    email: "operator@example.com",
    name: "Operator",
    status: "ACTIVE",
    passwordHash: "original-hash",
    driverId: null,
  });
  await assert.rejects(
    () => provisionOperator(createStore(race), request({ mode: "execute", confirmations: confirmed() }), { hashPassword: hasher().hashPassword }),
    (error: OperatorProvisionError) => error.code === "DRIVER_LINKED_USER" || error.code === "STATE_CHANGED",
  );
  assert.equal(race.users[0].passwordHash, "original-hash");
  assert.equal(race.memberships.length, 0);
  assert.equal(race.writes.length, 0);
});

test("execute is required and the production phrase is required", async () => {
  const memory = baseMemory();
  await assert.rejects(
    () => provisionOperator(createStore(memory), request({ mode: "execute", confirmations: confirmed({ production: "yes" }) })),
    (error: OperatorProvisionError) => error.code === "EXECUTION_NOT_CONFIRMED",
  );
  assert.equal(memory.writes.length, 0);
  assert.equal(memory.transactions, 0);
});

test("creates an operator once and does not duplicate an active membership", async () => {
  const memory = baseMemory();
  const hash = hasher();
  const created = await provisionOperator(
    createStore(memory),
    request({ mode: "execute", email: " Operator@Example.COM ", confirmations: confirmed() }),
    { hashPassword: hash.hashPassword },
  );
  assert.equal(created.mode, "execute");
  if (created.mode === "execute") {
    assert.equal(created.audit.email, "operator@example.com");
    assert.equal(created.audit.userResult, "created");
    assert.equal(created.audit.membershipResult, "created");
    assert.equal(created.audit.role, "FLEET_ADMIN");
    const text = formatAudit(created.audit);
    assert.equal(text.includes(PASSWORD), false);
    assert.equal(text.includes(HASH), false);
  }
  assert.equal(memory.users.length, 1);
  assert.equal(memory.users[0].passwordHash, HASH);
  assert.equal(memory.memberships.length, 1);

  const again = await provisionOperator(
    createStore(memory),
    request({ mode: "execute", confirmations: confirmed(), password: "different-password" }),
    { hashPassword: hash.hashPassword },
  );
  assert.equal(again.mode, "execute");
  if (again.mode === "execute") {
    assert.equal(again.audit.userResult, "unchanged");
    assert.equal(again.audit.membershipResult, "unchanged");
  }
  assert.equal(memory.users.length, 1);
  assert.equal(memory.memberships.length, 1);
  assert.equal(memory.users[0].passwordHash, HASH);
  assert.equal(hash.calls.filter((value) => value === "different-password").length, 0);
});

test("existing password is not overwritten unless rotation is confirmed", async () => {
  const memory = baseMemory();
  memory.users.push({
    id: "user-1",
    email: "operator@example.com",
    name: "Operator",
    status: "ACTIVE",
    passwordHash: "original-hash",
    driverId: null,
  });
  const hash = hasher();
  await assert.rejects(
    () =>
      provisionOperator(createStore(memory), request({ mode: "execute", confirmations: confirmed({ rotatePassword: "yes" }) }), {
        hashPassword: hash.hashPassword,
      }),
    (error: OperatorProvisionError) => error.code === "CONFIRMATION_REJECTED",
  );
  assert.equal(memory.users[0].passwordHash, "original-hash");

  const kept = await provisionOperator(
    createStore(memory),
    request({ mode: "execute", confirmations: confirmed() }),
    { hashPassword: hash.hashPassword },
  );
  assert.equal(kept.mode, "execute");
  assert.equal(memory.users[0].passwordHash, "original-hash");
  assert.equal(hash.calls.length, 0);

  const rotated = await provisionOperator(
    createStore(memory),
    request({ mode: "execute", confirmations: confirmed({ rotatePassword: ROTATE_PASSWORD_CONFIRMATION }) }),
    { hashPassword: hash.hashPassword },
  );
  assert.equal(rotated.mode, "execute");
  if (rotated.mode === "execute") assert.equal(rotated.audit.userResult, "changed");
  assert.equal(memory.users[0].passwordHash, HASH);
  assert.equal(JSON.stringify(rotated).includes(PASSWORD), false);
  assert.equal(JSON.stringify(rotated).includes(HASH), false);
});

test("inactive user and inactive membership require confirmation and role change requires confirmation", async () => {
  const inactiveUser = baseMemory();
  inactiveUser.users.push({
    id: "user-1",
    email: "operator@example.com",
    name: null,
    status: "INACTIVE",
    passwordHash: "original-hash",
    driverId: null,
  });
  await assert.rejects(
    () => provisionOperator(createStore(inactiveUser), request({ mode: "execute", confirmations: confirmed() })),
    (error: OperatorProvisionError) => error.code === "USER_ACTIVATION_NOT_CONFIRMED",
  );
  assert.equal(inactiveUser.users[0].status, "INACTIVE");
  assert.equal(inactiveUser.memberships.length, 0);

  const activated = await provisionOperator(
    createStore(inactiveUser),
    request({ mode: "execute", confirmations: confirmed({ activateUser: ACTIVATE_USER_CONFIRMATION }) }),
    { hashPassword: hasher().hashPassword },
  );
  assert.equal(activated.mode, "execute");
  assert.equal(inactiveUser.users[0].status, "ACTIVE");
  assert.equal(inactiveUser.memberships.length, 1);

  const invited = baseMemory();
  invited.users.push({
    id: "user-1",
    email: "operator@example.com",
    name: null,
    status: "ACTIVE",
    passwordHash: "original-hash",
    driverId: null,
  });
  invited.memberships.push({
    id: "membership-1",
    userId: "user-1",
    fleetId: "fleet-live",
    roleId: "role-ops",
    roleCode: "FLEET_ADMIN",
    status: "INVITED",
  });
  await assert.rejects(
    () => provisionOperator(createStore(invited), request({ mode: "execute", confirmations: confirmed() })),
    (error: OperatorProvisionError) => error.code === "MEMBERSHIP_ACTIVATION_NOT_CONFIRMED",
  );
  assert.equal(invited.memberships[0].status, "INVITED");
  assert.equal(invited.memberships.length, 1);
  await provisionOperator(
    createStore(invited),
    request({ mode: "execute", confirmations: confirmed({ activateMembership: ACTIVATE_MEMBERSHIP_CONFIRMATION }) }),
    { hashPassword: hasher().hashPassword },
  );
  assert.equal(invited.memberships.length, 1);
  assert.equal(invited.memberships[0].status, "ACTIVE");

  const roleChange = baseMemory();
  roleChange.users.push({
    id: "user-1",
    email: "operator@example.com",
    name: null,
    status: "ACTIVE",
    passwordHash: "original-hash",
    driverId: null,
  });
  roleChange.memberships.push({
    id: "membership-1",
    userId: "user-1",
    fleetId: "fleet-live",
    roleId: "role-dispatch",
    roleCode: "DISPATCH",
    status: "ACTIVE",
  });
  await assert.rejects(
    () => provisionOperator(createStore(roleChange), request({ mode: "execute", confirmations: confirmed({ changeRole: "yes" }) })),
    (error: OperatorProvisionError) => error.code === "ROLE_CHANGE_NOT_CONFIRMED",
  );
  assert.equal(roleChange.memberships[0].roleCode, "DISPATCH");
  assert.equal(roleChange.memberships.length, 1);
  const changed = await provisionOperator(
    createStore(roleChange),
    request({ mode: "execute", confirmations: confirmed({ changeRole: CHANGE_ROLE_CONFIRMATION }) }),
    { hashPassword: hasher().hashPassword },
  );
  assert.equal(roleChange.memberships[0].roleCode, "FLEET_ADMIN");
  assert.equal(roleChange.memberships.length, 1);
  if (changed.mode === "execute") assert.equal(changed.audit.membershipResult, "changed");
});

test("transaction rolls back the user when membership creation fails", async () => {
  const memory = baseMemory();
  memory.failMembershipCreate = true;
  await assert.rejects(
    () => provisionOperator(createStore(memory), request({ mode: "execute", confirmations: confirmed() }), { hashPassword: hasher().hashPassword }),
    (error: Error) => error.message === "forced membership failure",
  );
  assert.equal(memory.users.length, 0);
  assert.equal(memory.memberships.length, 0);
  assert.equal(memory.writes.length, 0);
});

test("bcrypt hash is comparable and is not the plaintext password", async () => {
  const hashed = await hashOperatorPassword(PASSWORD);
  assert.equal(await passwordMatchesHash(PASSWORD, hashed), true);
  assert.equal(hashed.includes(PASSWORD), false);
  assert.equal(JSON.stringify({ hashed }).includes(PASSWORD), false);
});

test("cli session dry-run does not confirm or write, and execute uses one transaction", async () => {
  const dry = baseMemory();
  let confirmationsRead = 0;
  const dryResult = await runOperatorProvisionSession({
    mode: "dry-run",
    store: createStore(dry),
    email: "operator@example.com",
    name: "Operator",
    password: PASSWORD,
    fleetId: "fleet-live",
    roleCode: "FLEET_ADMIN",
    readConfirmations: async () => {
      confirmationsRead += 1;
      return confirmed();
    },
    deps: { hashPassword: hasher().hashPassword },
  });
  assert.equal(dryResult.mode, "dry-run");
  assert.equal(confirmationsRead, 0);
  assert.equal(dry.writes.length, 0);
  assert.equal(dry.transactions, 0);

  const executed = baseMemory();
  const hash = hasher();
  const executeResult = await runOperatorProvisionSession({
    mode: "execute",
    store: createStore(executed),
    email: "operator@example.com",
    name: "Operator",
    password: PASSWORD,
    fleetId: "fleet-live",
    roleCode: "FLEET_ADMIN",
    readConfirmations: async () => confirmed(),
    deps: { hashPassword: hash.hashPassword },
  });
  assert.equal(executeResult.mode, "execute");
  assert.equal(executed.transactions, 1);
  assert.equal(executed.users.length, 1);
  assert.equal(executed.users[0].passwordHash, HASH);
  assert.notEqual(executed.users[0].passwordHash, PASSWORD);
  assert.equal(JSON.stringify(executeResult).includes(PASSWORD), false);

  const forbidden = baseMemory();
  let forbiddenConfirmations = 0;
  await assert.rejects(
    () =>
      runOperatorProvisionSession({
        mode: "execute",
        store: createStore(forbidden),
        email: "operator@example.com",
        name: null,
        password: PASSWORD,
        fleetId: "fleet-live",
        roleCode: "BOF_OPERATIONS",
        readConfirmations: async () => {
          forbiddenConfirmations += 1;
          return confirmed();
        },
      }),
    (error: OperatorProvisionError) => error.code === "ROLE_NOT_APPROVED",
  );
  assert.equal(forbiddenConfirmations, 0);
  assert.equal(forbidden.writes.length, 0);
  assert.equal(forbidden.transactions, 0);
});

test("non-interactive password input is refused before a password is accepted", () => {
  assert.throws(() => assertInteractivePasswordInput(false), (error: OperatorProvisionError) => {
    return error.code === "PASSWORD_NOT_INTERACTIVE";
  });
  assert.doesNotThrow(() => assertInteractivePasswordInput(true));
});

test("tool source and runbook do not embed a connection string or the test password", () => {
  const source = [
    readFileSync(new URL("./operatorProvision.ts", import.meta.url), "utf8"),
    readFileSync(new URL("../../scripts/provision-operator.ts", import.meta.url), "utf8"),
    readFileSync(new URL("../../docs/runbooks/provision-production-operator.md", import.meta.url), "utf8"),
  ].join("\n");
  assert.equal(source.includes("postgresql://"), false);
  assert.equal(source.includes("postgres://"), false);
  assert.equal(source.includes(PASSWORD), false);
  assert.equal(source.includes("console.log(password"), false);
  assert.match(source, /PROVISION PRODUCTION OPERATOR/);
  assert.match(source, /https:\/\/backofficefleet.com\/api\/auth\/signin/);
  const script = readFileSync(new URL("../../scripts/provision-operator.ts", import.meta.url), "utf8");
  assert.equal(script.includes("BOF_OPERATIONS"), false);
  assert.equal(script.includes("BOF_COMPLIANCE_REVIEW"), false);
  assert.match(script, /roleCode: PROVISION_OPERATOR_ROLE/);
  assert.match(source, /PROVISION_OPERATOR_ROLE = "FLEET_ADMIN"/);
  assert.equal(source.includes("FLEET_OPERATIONS"), false);
  assert.match(script, /setRawMode\(true\)/);
  assert.equal(script.includes("stdout.write(value"), false);
  assert.equal(script.includes("stdout.write(char"), false);
});
