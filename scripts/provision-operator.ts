import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";

import {
  ACTIVATE_MEMBERSHIP_CONFIRMATION,
  ACTIVATE_USER_CONFIRMATION,
  CHANGE_ROLE_CONFIRMATION,
  OperatorProvisionError,
  PRODUCTION_CONFIRMATION,
  PROVISION_OPERATOR_ROLE,
  ROTATE_PASSWORD_CONFIRMATION,
  assertInteractivePasswordInput,
  assertRuntimeDatabaseUrl,
  emptyConfirmations,
  formatAudit,
  formatDryRun,
  parseOperatorProvisionArgs,
  runOperatorProvisionSession,
  type FleetView,
  type MembershipView,
  type OperatorConfirmations,
  type OperatorStore,
  type RoleView,
  type UserView,
} from "../lib/provisioning/operatorProvision";

const USAGE = [
  "Usage: npm run provision:operator -- --dry-run",
  "       npm run provision:operator -- --execute",
  "Default is dry-run. Writes require --execute and the confirmation phrase.",
  "The password is requested interactively and cannot be passed as an argument.",
].join("\n");

function ask(label: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, historySize: 0 });
  return new Promise((resolve) => {
    rl.question(label, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function askHidden(label: string): Promise<string> {
  assertInteractivePasswordInput(Boolean(stdin.isTTY));
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      for (const char of text) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          stdin.setRawMode(false);
          process.exit(1);
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        if (char < " " || char === "\u001b") continue;
        value += char;
      }
    };
    stdin.on("data", onData);
  });
}

function mapUser(user: {
  id: string;
  email: string;
  status: UserView["status"];
  driver: { id: string } | null;
}): UserView {
  return { id: user.id, email: user.email, status: user.status, driverId: user.driver?.id ?? null };
}

function bindStore(client: PrismaClient | Prisma.TransactionClient, allowTransaction: boolean, prisma: PrismaClient): OperatorStore {
  return {
    async findRole(code: string): Promise<RoleView | null> {
      return client.role.findUnique({ where: { code }, select: { id: true, code: true } });
    },
    async findFleet(id: string): Promise<FleetView | null> {
      return client.fleet.findUnique({
        where: { id },
        select: { id: true, slug: true, name: true, status: true },
      });
    },
    async findUserByEmail(email: string): Promise<UserView | null> {
      const user = await client.user.findUnique({
        where: { email },
        select: { id: true, email: true, status: true, driver: { select: { id: true } } },
      });
      return user ? mapUser(user) : null;
    },
    async findMembership(userId: string, fleetId: string): Promise<MembershipView | null> {
      const membership = await client.fleetMembership.findUnique({
        where: { fleetId_userId: { fleetId, userId } },
        select: {
          id: true,
          userId: true,
          fleetId: true,
          roleId: true,
          status: true,
          role: { select: { code: true } },
        },
      });
      if (!membership) return null;
      return {
        id: membership.id,
        userId: membership.userId,
        fleetId: membership.fleetId,
        roleId: membership.roleId,
        roleCode: membership.role.code,
        status: membership.status,
      };
    },
    async createUser(data) {
      const user = await client.user.create({
        data: { email: data.email, name: data.name, passwordHash: data.passwordHash, status: data.status },
        select: { id: true, email: true, status: true, driver: { select: { id: true } } },
      });
      return mapUser(user);
    },
    async updateUser(id, data) {
      const user = await client.user.update({
        where: { id },
        data,
        select: { id: true, email: true, status: true, driver: { select: { id: true } } },
      });
      return mapUser(user);
    },
    async createMembership(data) {
      const membership = await client.fleetMembership.create({
        data,
        select: {
          id: true,
          userId: true,
          fleetId: true,
          roleId: true,
          status: true,
          role: { select: { code: true } },
        },
      });
      return {
        id: membership.id,
        userId: membership.userId,
        fleetId: membership.fleetId,
        roleId: membership.roleId,
        roleCode: membership.role.code,
        status: membership.status,
      };
    },
    async updateMembership(id, data) {
      const membership = await client.fleetMembership.update({
        where: { id },
        data,
        select: {
          id: true,
          userId: true,
          fleetId: true,
          roleId: true,
          status: true,
          role: { select: { code: true } },
        },
      });
      return {
        id: membership.id,
        userId: membership.userId,
        fleetId: membership.fleetId,
        roleId: membership.roleId,
        roleCode: membership.role.code,
        status: membership.status,
      };
    },
    transaction(fn) {
      if (!allowTransaction) throw new OperatorProvisionError("PROVISION_FAILED");
      return prisma.$transaction((tx) => fn(bindStore(tx, false, prisma)));
    },
  };
}

async function collectConfirmations(plan: {
  requiresActivationConfirmation: boolean;
  requiresPasswordRotationConfirmation: boolean;
  requiresMembershipActivationConfirmation: boolean;
  requiresRoleChangeConfirmation: boolean;
  existingRoleCode: string | null;
}): Promise<OperatorConfirmations> {
  const confirmations = emptyConfirmations();
  if (plan.requiresActivationConfirmation) {
    confirmations.activateUser = await ask(`Type ${ACTIVATE_USER_CONFIRMATION} to activate this user: `);
  }
  if (plan.requiresPasswordRotationConfirmation) {
    confirmations.rotatePassword = await ask(
      `Type ${ROTATE_PASSWORD_CONFIRMATION} to replace the password, or press enter to keep it: `,
    );
  }
  if (plan.requiresMembershipActivationConfirmation) {
    confirmations.activateMembership = await ask(
      `Type ${ACTIVATE_MEMBERSHIP_CONFIRMATION} to activate this membership: `,
    );
  }
  if (plan.requiresRoleChangeConfirmation) {
    confirmations.changeRole = await ask(
      `Existing role is ${plan.existingRoleCode ?? "unknown"}. Type ${CHANGE_ROLE_CONFIRMATION} to change it: `,
    );
  }
  confirmations.production = await ask(`Type ${PRODUCTION_CONFIRMATION} to write: `);
  return confirmations;
}

async function main() {
  const args = parseOperatorProvisionArgs(process.argv.slice(2));
  if (args.help) {
    stdout.write(`${USAGE}\n`);
    return;
  }

  assertInteractivePasswordInput(Boolean(stdin.isTTY));
  assertRuntimeDatabaseUrl(process.env.DATABASE_URL);
  const email = await ask("Operator email: ");
  const name = await ask("Operator name (optional): ");
  const password = await askHidden("Password: ");
  const fleetId = await ask("Existing fleet id: ");

  const connectionString = process.env.DATABASE_URL?.trim() ?? "";
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }), log: [] });
  try {
    const store = bindStore(prisma, true, prisma);
    const result = await runOperatorProvisionSession({
      mode: args.mode,
      store,
      email,
      name: name.trim() ? name.trim() : null,
      password,
      fleetId,
      roleCode: PROVISION_OPERATOR_ROLE,
      onPreview(plan) {
        stdout.write(`${formatDryRun(plan)}\n`);
      },
      readConfirmations: async (plan) => {
        stdout.write("No records written yet.\n");
        return collectConfirmations(plan);
      },
    });
    if (result.mode === "execute") stdout.write(`${formatAudit(result.audit)}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof OperatorProvisionError) {
    process.stderr.write(`${error.code}\n`);
  } else {
    process.stderr.write("PROVISION_FAILED\n");
  }
  process.exitCode = 1;
});
