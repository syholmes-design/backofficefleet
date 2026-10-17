import { NextResponse } from "next/server";

import { FleetVisibilityError } from "@/lib/fleet-visibility/errors";
import { GPS_STORAGE_UNAVAILABLE, GpsStorageUnavailableError } from "@/lib/fleet-visibility/gps-storage";
import { isDatabaseUrlNotConfiguredError, prismaUnavailablePayload } from "@/lib/prisma";

export function fleetVisibilityErrorResponse(error: unknown) {
  if (error instanceof FleetVisibilityError) {
    return NextResponse.json({ error: error.message, code: error.name }, { status: error.statusCode });
  }
  if (error instanceof GpsStorageUnavailableError) {
    return NextResponse.json(
      { error: error.message, code: GPS_STORAGE_UNAVAILABLE },
      { status: error.statusCode },
    );
  }
  if (isDatabaseUrlNotConfiguredError(error)) {
    return NextResponse.json(prismaUnavailablePayload(), { status: 503 });
  }
  return null;
}
