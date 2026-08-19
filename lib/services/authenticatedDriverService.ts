import { prisma } from "@/lib/prisma";
import type { Driver, Fleet } from "@prisma/client";
import type { SessionUserLike } from "@/lib/services/intakeService";
import { resolveContext } from "@/lib/services/contextResolver";

export type AuthenticatedDriverResolution =
  | { status: "UNAUTHENTICATED" }
  | { status: "UNLINKED"; userId: string; email: string | null }
  | {
      status: "LINKED";
      userId: string;
      email: string | null;
      driver: Driver & { fleet: Pick<Fleet, "id" | "slug" | "name"> | null };
    };

export async function getAuthenticatedDriver(
  sessionUser: SessionUserLike | null | undefined,
): Promise<AuthenticatedDriverResolution> {
  if (!sessionUser?.id) {
    return { status: "UNAUTHENTICATED" };
  }

  const context = await resolveContext(sessionUser);
  if (!context.personal) {
    return {
      status: "UNLINKED",
      userId: sessionUser.id,
      email: sessionUser.email ?? null,
    };
  }

  const driver = await prisma.driver.findUnique({
    where: { id: context.personal.driverId },
    include: {
      fleet: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });

  if (!driver) {
    return {
      status: "UNLINKED",
      userId: sessionUser.id,
      email: sessionUser.email ?? null,
    };
  }

  return {
    status: "LINKED",
    userId: sessionUser.id,
    email: sessionUser.email ?? null,
    driver,
  };
}
