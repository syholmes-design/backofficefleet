import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs") as {
  hash: (password: string, rounds: number) => Promise<string>;
  compare: (password: string, hash: string) => Promise<boolean>;
};

export const PRODUCTION_CONFIRMATION = "PROVISION PRODUCTION OPERATOR";
export const ACTIVATE_USER_CONFIRMATION = "ACTIVATE OPERATOR USER";
export const ROTATE_PASSWORD_CONFIRMATION = "ROTATE OPERATOR PASSWORD";
export const ACTIVATE_MEMBERSHIP_CONFIRMATION = "ACTIVATE OPERATOR MEMBERSHIP";
export const CHANGE_ROLE_CONFIRMATION = "CHANGE OPERATOR ROLE";

export const BCRYPT_ROUNDS = 12;

export const PROVISION_OPERATOR_ROLE = "FLEET_ADMIN" as const;

export type ProvisionOperatorRole = typeof PROVISION_OPERATOR_ROLE;

export class OperatorProvisionError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "OperatorProvisionError";
    this.code = code;
  }
}

export type OperatorProvisionMode = "dry-run" | "execute";

export type OperatorConfirmations = {
  production: string;
  activateUser: string;
  rotatePassword: string;
  activateMembership: string;
  changeRole: string;
};

export type OperatorProvisionRequest = {
  mode: OperatorProvisionMode;
  email: string;
  name: string | null;
  password: string;
  fleetId: string;
  roleCode: string;
  confirmations: OperatorConfirmations;
};

export type UserStatusValue = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type MembershipStatusValue = "ACTIVE" | "INVITED" | "INACTIVE";
export type FleetStatusValue = "ACTIVE" | "ARCHIVED";

export type RoleView = { id: string; code: string };
export type FleetView = { id: string; slug: string; name: string; status: FleetStatusValue };
export type UserView = { id: string; email: string; status: UserStatusValue; driverId: string | null };
export type MembershipView = {
  id: string;
  userId: string;
  fleetId: string;
  roleId: string;
  roleCode: string;
  status: MembershipStatusValue;
};

export type OperatorStore = {
  findRole(code: string): Promise<RoleView | null>;
  findFleet(id: string): Promise<FleetView | null>;
  findUserByEmail(email: string): Promise<UserView | null>;
  findMembership(userId: string, fleetId: string): Promise<MembershipView | null>;
  createUser(data: {
    email: string;
    name: string | null;
    passwordHash: string;
    status: "ACTIVE";
  }): Promise<UserView>;
  updateUser(id: string, data: { status?: "ACTIVE"; passwordHash?: string }): Promise<UserView>;
  createMembership(data: {
    userId: string;
    fleetId: string;
    roleId: string;
    status: "ACTIVE";
  }): Promise<MembershipView>;
  updateMembership(id: string, data: { status?: "ACTIVE"; roleId?: string }): Promise<MembershipView>;
  transaction<T>(fn: (store: OperatorStore) => Promise<T>): Promise<T>;
};

export type OperatorProvisionPlan = {
  email: string;
  fleetId: string;
  fleetSlug: string;
  fleetName: string;
  fleetStatus: "ACTIVE";
  role: ProvisionOperatorRole;
  userAction: "create" | "unchanged" | "activate";
  userId: string | null;
  userStatus: UserStatusValue | null;
  requiresActivationConfirmation: boolean;
  requiresPasswordRotationConfirmation: boolean;
  membershipAction: "create" | "unchanged" | "activate" | "change-role" | "activate-and-change-role";
  membershipId: string | null;
  membershipStatus: MembershipStatusValue | null;
  existingRoleCode: string | null;
  requiresMembershipActivationConfirmation: boolean;
  requiresRoleChangeConfirmation: boolean;
};

export type OperatorProvisionAudit = {
  email: string;
  userId: string;
  fleetId: string;
  fleetName: string;
  fleetSlug: string;
  role: ProvisionOperatorRole;
  userStatus: "ACTIVE";
  membershipStatus: "ACTIVE";
  userResult: "created" | "changed" | "unchanged";
  membershipResult: "created" | "changed" | "unchanged";
};

export type OperatorProvisionDeps = {
  hashPassword?: (password: string) => Promise<string>;
};

type ExecuteAction = {
  createUser: boolean;
  activateUser: boolean;
  rotatePassword: boolean;
  createMembership: boolean;
  activateMembership: boolean;
  changeRole: boolean;
  usePassword: boolean;
};

const EMPTY_CONFIRMATIONS: OperatorConfirmations = {
  production: "",
  activateUser: "",
  rotatePassword: "",
  activateMembership: "",
  changeRole: "",
};

export function emptyConfirmations(): OperatorConfirmations {
  return { ...EMPTY_CONFIRMATIONS };
}

export function assertRuntimeDatabaseUrl(value: string | undefined | null): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new OperatorProvisionError("DATABASE_URL_REQUIRED");
  }
  if (!/^postgres(ql)?:\/\//i.test(value.trim())) {
    throw new OperatorProvisionError("DATABASE_URL_UNSUPPORTED");
  }
}

export function parseOperatorProvisionArgs(argv: string[]): { mode: OperatorProvisionMode; help: boolean } {
  const allowed = new Set(["--dry-run", "--execute", "--help"]);
  const forbidden = new Set(["--password", "--password-hash", "--passwordhash", "-p"]);
  for (const arg of argv) {
    const name = arg.split("=")[0]?.toLowerCase() ?? "";
    if (forbidden.has(name)) {
      throw new OperatorProvisionError("PASSWORD_ARGUMENT_REJECTED");
    }
    if (!allowed.has(arg)) {
      throw new OperatorProvisionError("ARGUMENT_REJECTED");
    }
  }
  if (argv.includes("--execute") && argv.includes("--dry-run")) {
    throw new OperatorProvisionError("ARGUMENT_REJECTED");
  }
  return {
    mode: argv.includes("--execute") ? "execute" : "dry-run",
    help: argv.includes("--help"),
  };
}

export function normalizeOperatorEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new OperatorProvisionError("INVALID_EMAIL");
  }
  return normalized;
}

export function normalizeOperatorRole(roleCode: string): ProvisionOperatorRole {
  if (roleCode.trim().toUpperCase() !== PROVISION_OPERATOR_ROLE) {
    throw new OperatorProvisionError("ROLE_NOT_APPROVED");
  }
  return PROVISION_OPERATOR_ROLE;
}

export function assertInteractivePasswordInput(isInteractive: boolean): void {
  if (!isInteractive) throw new OperatorProvisionError("PASSWORD_NOT_INTERACTIVE");
}

export async function hashOperatorPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function passwordMatchesHash(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function inspectOperatorProvision(
  store: OperatorStore,
  request: Pick<OperatorProvisionRequest, "email" | "password" | "fleetId" | "roleCode">,
): Promise<OperatorProvisionPlan> {
  const email = normalizeOperatorEmail(request.email);
  const roleCode = normalizeOperatorRole(request.roleCode);
  const fleetId = request.fleetId.trim();
  if (!fleetId) throw new OperatorProvisionError("FLEET_NOT_FOUND");

  const [role, fleet] = await Promise.all([store.findRole(roleCode), store.findFleet(fleetId)]);
  if (!role || role.code !== roleCode) throw new OperatorProvisionError("ROLE_NOT_FOUND");
  if (!fleet) throw new OperatorProvisionError("FLEET_NOT_FOUND");
  if (fleet.status !== "ACTIVE") throw new OperatorProvisionError("FLEET_NOT_ACTIVE");

  const user = await store.findUserByEmail(email);
  if (user?.driverId) throw new OperatorProvisionError("DRIVER_LINKED_USER");
  if (!user && request.password.length === 0) throw new OperatorProvisionError("PASSWORD_REQUIRED");

  const membership = user ? await store.findMembership(user.id, fleet.id) : null;
  const activateUser = Boolean(user && user.status !== "ACTIVE");
  const activateMembership = Boolean(membership && membership.status !== "ACTIVE");
  const changeRole = Boolean(membership && membership.roleCode !== roleCode);

  let membershipAction: OperatorProvisionPlan["membershipAction"] = "create";
  if (membership && !activateMembership && !changeRole) membershipAction = "unchanged";
  else if (membership && activateMembership && changeRole) membershipAction = "activate-and-change-role";
  else if (membership && activateMembership) membershipAction = "activate";
  else if (membership && changeRole) membershipAction = "change-role";

  return {
    email,
    fleetId: fleet.id,
    fleetSlug: fleet.slug,
    fleetName: fleet.name,
    fleetStatus: "ACTIVE",
    role: roleCode,
    userAction: user ? (activateUser ? "activate" : "unchanged") : "create",
    userId: user?.id ?? null,
    userStatus: user?.status ?? null,
    requiresActivationConfirmation: activateUser,
    requiresPasswordRotationConfirmation: Boolean(user),
    membershipAction,
    membershipId: membership?.id ?? null,
    membershipStatus: membership?.status ?? null,
    existingRoleCode: membership?.roleCode ?? null,
    requiresMembershipActivationConfirmation: activateMembership,
    requiresRoleChangeConfirmation: changeRole,
  };
}

function resolveExecuteAction(plan: OperatorProvisionPlan, request: OperatorProvisionRequest): ExecuteAction {
  if (request.confirmations.production !== PRODUCTION_CONFIRMATION) {
    throw new OperatorProvisionError("EXECUTION_NOT_CONFIRMED");
  }
  if (plan.requiresActivationConfirmation && request.confirmations.activateUser !== ACTIVATE_USER_CONFIRMATION) {
    throw new OperatorProvisionError("USER_ACTIVATION_NOT_CONFIRMED");
  }
  if (
    plan.requiresMembershipActivationConfirmation &&
    request.confirmations.activateMembership !== ACTIVATE_MEMBERSHIP_CONFIRMATION
  ) {
    throw new OperatorProvisionError("MEMBERSHIP_ACTIVATION_NOT_CONFIRMED");
  }
  if (plan.requiresRoleChangeConfirmation && request.confirmations.changeRole !== CHANGE_ROLE_CONFIRMATION) {
    throw new OperatorProvisionError("ROLE_CHANGE_NOT_CONFIRMED");
  }

  let rotatePassword = false;
  if (plan.requiresPasswordRotationConfirmation) {
    const phrase = request.confirmations.rotatePassword;
    if (phrase === ROTATE_PASSWORD_CONFIRMATION) rotatePassword = true;
    else if (phrase.trim() !== "") throw new OperatorProvisionError("CONFIRMATION_REJECTED");
  }
  if ((plan.userAction === "create" || rotatePassword) && request.password.length === 0) {
    throw new OperatorProvisionError("PASSWORD_REQUIRED");
  }

  return {
    createUser: plan.userAction === "create",
    activateUser: plan.requiresActivationConfirmation,
    rotatePassword,
    createMembership: plan.membershipAction === "create",
    activateMembership: plan.requiresMembershipActivationConfirmation,
    changeRole: plan.requiresRoleChangeConfirmation,
    usePassword: plan.userAction === "create" || rotatePassword,
  };
}

function samePlan(left: OperatorProvisionPlan, right: OperatorProvisionPlan): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function applyProvision(
  store: OperatorStore,
  plan: OperatorProvisionPlan,
  action: ExecuteAction,
  passwordHash: string | null,
  name: string | null,
): Promise<OperatorProvisionAudit> {
  let userId = plan.userId;
  let userResult: OperatorProvisionAudit["userResult"] = "unchanged";
  if (action.createUser) {
    if (!passwordHash) throw new OperatorProvisionError("PASSWORD_REQUIRED");
    const created = await store.createUser({
      email: plan.email,
      name,
      passwordHash,
      status: "ACTIVE",
    });
    userId = created.id;
    userResult = "created";
  } else if (userId && (action.activateUser || action.rotatePassword)) {
    if (action.rotatePassword && !passwordHash) throw new OperatorProvisionError("PASSWORD_REQUIRED");
    await store.updateUser(userId, {
      ...(action.activateUser ? { status: "ACTIVE" as const } : {}),
      ...(action.rotatePassword && passwordHash ? { passwordHash } : {}),
    });
    userResult = "changed";
  }

  if (!userId) throw new OperatorProvisionError("PROVISION_FAILED");

  let membershipResult: OperatorProvisionAudit["membershipResult"] = "unchanged";
  if (action.createMembership) {
    await store.createMembership({
      userId,
      fleetId: plan.fleetId,
      roleId: await requiredRoleId(store, plan.role),
      status: "ACTIVE",
    });
    membershipResult = "created";
  } else if (plan.membershipId && (action.activateMembership || action.changeRole)) {
    await store.updateMembership(plan.membershipId, {
      ...(action.activateMembership ? { status: "ACTIVE" as const } : {}),
      ...(action.changeRole ? { roleId: await requiredRoleId(store, plan.role) } : {}),
    });
    membershipResult = "changed";
  }

  return {
    email: plan.email,
    userId,
    fleetId: plan.fleetId,
    fleetName: plan.fleetName,
    fleetSlug: plan.fleetSlug,
    role: plan.role,
    userStatus: "ACTIVE",
    membershipStatus: "ACTIVE",
    userResult,
    membershipResult,
  };
}

async function requiredRoleId(store: OperatorStore, code: ProvisionOperatorRole): Promise<string> {
  const role = await store.findRole(code);
  if (!role) throw new OperatorProvisionError("ROLE_NOT_FOUND");
  return role.id;
}

export async function provisionOperator(
  store: OperatorStore,
  request: OperatorProvisionRequest,
  deps: OperatorProvisionDeps = {},
): Promise<{ mode: "dry-run"; plan: OperatorProvisionPlan } | { mode: "execute"; audit: OperatorProvisionAudit }> {
  const plan = await inspectOperatorProvision(store, request);
  if (request.mode === "dry-run") return { mode: "dry-run", plan };

  const action = resolveExecuteAction(plan, request);
  const passwordHash = action.usePassword ? await hashPassword(request.password, deps) : null;
  const name = request.name?.trim() ? request.name.trim() : null;
  const audit = await store.transaction(async (tx) => {
    const fresh = await inspectOperatorProvision(tx, request);
    if (!samePlan(plan, fresh)) throw new OperatorProvisionError("STATE_CHANGED");
    return applyProvision(tx, fresh, action, passwordHash, name);
  });
  return { mode: "execute", audit };
}

export async function runOperatorProvisionSession(input: {
  mode: OperatorProvisionMode;
  store: OperatorStore;
  email: string;
  name: string | null;
  password: string;
  fleetId: string;
  roleCode: string;
  onPreview?: (plan: OperatorProvisionPlan) => void;
  readConfirmations?: (plan: OperatorProvisionPlan) => Promise<OperatorConfirmations>;
  deps?: OperatorProvisionDeps;
}): Promise<{ mode: "dry-run"; plan: OperatorProvisionPlan } | { mode: "execute"; audit: OperatorProvisionAudit }> {
  const requestBase = {
    email: input.email,
    name: input.name,
    password: input.password,
    fleetId: input.fleetId,
    roleCode: input.roleCode,
    confirmations: emptyConfirmations(),
  };
  const plan = await inspectOperatorProvision(input.store, requestBase);
  input.onPreview?.(plan);
  if (input.mode === "dry-run") return { mode: "dry-run", plan };

  const confirmations = input.readConfirmations ? await input.readConfirmations(plan) : emptyConfirmations();
  const result = await provisionOperator(
    input.store,
    { ...requestBase, mode: "execute", confirmations },
    input.deps,
  );
  if (result.mode !== "execute") throw new OperatorProvisionError("PROVISION_FAILED");
  return { mode: "execute", audit: result.audit };
}

async function hashPassword(password: string, deps: OperatorProvisionDeps): Promise<string> {
  if (deps.hashPassword) return deps.hashPassword(password);
  return hashOperatorPassword(password);
}

export function formatDryRun(plan: OperatorProvisionPlan): string {
  const lines = [
    "mode: dry-run",
    "writes: none",
    `email: ${plan.email}`,
    `fleetId: ${plan.fleetId}`,
    `fleetSlug: ${plan.fleetSlug}`,
    `fleetName: ${plan.fleetName}`,
    `fleetStatus: ${plan.fleetStatus}`,
    `role: ${plan.role}`,
    `user: ${plan.userAction}`,
    `membership: ${plan.membershipAction}`,
  ];
  if (plan.requiresActivationConfirmation) lines.push(`confirmation required: ${ACTIVATE_USER_CONFIRMATION}`);
  if (plan.requiresPasswordRotationConfirmation) {
    lines.push("password: unchanged unless rotation is confirmed at execute");
  }
  if (plan.requiresMembershipActivationConfirmation) {
    lines.push(`confirmation required: ${ACTIVATE_MEMBERSHIP_CONFIRMATION}`);
  }
  if (plan.requiresRoleChangeConfirmation) {
    lines.push(`existing role: ${plan.existingRoleCode ?? ""}`);
    lines.push(`confirmation required: ${CHANGE_ROLE_CONFIRMATION}`);
  }
  return lines.join("\n");
}

export function formatAudit(audit: OperatorProvisionAudit): string {
  return [
    "provisioned: yes",
    `email: ${audit.email}`,
    `userId: ${audit.userId}`,
    `fleetId: ${audit.fleetId}`,
    `fleetName: ${audit.fleetName}`,
    `fleetSlug: ${audit.fleetSlug}`,
    `role: ${audit.role}`,
    `userStatus: ${audit.userStatus}`,
    `membershipStatus: ${audit.membershipStatus}`,
    `user: ${audit.userResult}`,
    `membership: ${audit.membershipResult}`,
    "signIn: https://backofficefleet.com/api/auth/signin",
  ].join("\n");
}
