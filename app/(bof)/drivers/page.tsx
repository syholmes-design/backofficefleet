/**
 * BOF Route Owner:
 * URL: /drivers
 * Type: DEMO
 * Primary component: DriversIndexPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { auth } from "@/auth";
import { DriversCommandCenterV4 } from "@/components/drivers-v4/DriversCommandCenterV4";
import {
  listDriverOperationalSummaries,
  type DriverOperationalSummary,
} from "@/lib/services/driverOperationalReadModelService";
import { listDriverRequirementsForFleet } from "@/lib/services/requirementService";
import type { DriverReviewRequirement } from "@/lib/driver-review-explanation";
import { getPrimaryFleetId, type SessionWithMemberships } from "@/lib/session-fleet";

export const metadata = {
  title: "Drivers | BOF",
  description: "Manage driver readiness, documents, worker type, dispatch eligibility, acknowledgments, and fix paths from one manager view",
};

export default async function DriversIndexPage() {
  const session = (await auth()) as SessionWithMemberships;
  const fleetId = getPrimaryFleetId(session);
  let operationalSummaries: DriverOperationalSummary[] = [];
  let driverRequirements: DriverReviewRequirement[] = [];

  if (session?.user?.id && fleetId) {
    operationalSummaries = await listDriverOperationalSummaries(session.user, fleetId);
    driverRequirements = (
      await Promise.all(
        operationalSummaries.map((summary) =>
          listDriverRequirementsForFleet(session.user, summary.driverId, fleetId),
        ),
      )
    ).flat();
  }

  return (
    <DriversCommandCenterV4
      operationalSummaries={operationalSummaries}
      driverRequirements={driverRequirements}
      hasFleetContext={Boolean(fleetId)}
    />
  );
}
