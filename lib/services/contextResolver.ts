import { prisma } from "@/lib/prisma";
import type { SessionUserLike } from "@/lib/services/intakeService";

export type AuthenticationContextState = "AUTHENTICATED" | "UNAUTHENTICATED";

export type PersonalContext = {
  userId: string;
  driverId: string;
};

export type EmploymentContext = {
  fleetId: string;
  role: string;
  status: string;
  employmentId: string | null;
  source: "DRIVER" | "FLEET_MEMBERSHIP";
};

export type ResolvedContext = {
  authentication: AuthenticationContextState;
  personal: PersonalContext | null;
  employmentContexts: EmploymentContext[];
};

type DriverContextRow = {
  id: string;
  fleetId: string;
  status: string;
};

type FleetMembershipRow = {
  id: string;
  fleetId: string;
  status: string;
  role: {
    code: string;
  } | null;
};

function mergeEmploymentContext(
  contexts: Map<string, EmploymentContext>,
  next: EmploymentContext,
) {
  const existing = contexts.get(next.fleetId);
  if (!existing) {
    contexts.set(next.fleetId, next);
    return;
  }

  if (existing.source === "DRIVER" && next.source === "FLEET_MEMBERSHIP") {
    contexts.set(next.fleetId, {
      ...existing,
      role: next.role,
      status: next.status,
      employmentId: next.employmentId,
      source: next.source,
    });
  }
}

export async function resolveContext(sessionUser: SessionUserLike | null | undefined): Promise<ResolvedContext> {
  if (!sessionUser?.id) {
    return {
      authentication: "UNAUTHENTICATED",
      personal: null,
      employmentContexts: [],
    };
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: sessionUser.id },
    select: {
      id: true,
      fleetId: true,
      status: true,
    },
  }) as DriverContextRow | null;

  if (!driver) {
    return {
      authentication: "AUTHENTICATED",
      personal: null,
      employmentContexts: [],
    };
  }

  const memberships = await prisma.fleetMembership.findMany({
    where: {
      userId: sessionUser.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
      fleetId: true,
      status: true,
      role: {
        select: {
          code: true,
        },
      },
    },
  }) as FleetMembershipRow[];

  const employmentContexts = new Map<string, EmploymentContext>();

  mergeEmploymentContext(employmentContexts, {
    fleetId: driver.fleetId,
    role: "DRIVER",
    status: driver.status,
    employmentId: null,
    source: "DRIVER",
  });

  for (const membership of memberships) {
    mergeEmploymentContext(employmentContexts, {
      fleetId: membership.fleetId,
      role: membership.role?.code ?? "DRIVER",
      status: membership.status,
      employmentId: membership.id,
      source: "FLEET_MEMBERSHIP",
    });
  }

  return {
    authentication: "AUTHENTICATED",
    personal: {
      userId: sessionUser.id,
      driverId: driver.id,
    },
    employmentContexts: [...employmentContexts.values()].sort((left, right) => {
      if (left.source !== right.source) {
        return left.source === "DRIVER" ? -1 : 1;
      }
      return left.fleetId.localeCompare(right.fleetId);
    }),
  };
}
