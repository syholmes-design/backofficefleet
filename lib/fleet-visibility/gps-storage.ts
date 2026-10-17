import { Prisma } from "@prisma/client";

import { isDatabaseUrlNotConfiguredError } from "@/lib/prisma";

export const GPS_STORAGE_UNAVAILABLE = "GPS_STORAGE_UNAVAILABLE" as const;

export function isGpsStorageUnavailable(error: unknown): boolean {
  return (
    isDatabaseUrlNotConfiguredError(error) ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022" || error.code === "P2010"))
  );
}

export class GpsStorageUnavailableError extends Error {
  code = GPS_STORAGE_UNAVAILABLE;
  statusCode = 503;

  constructor(message = "Fleet GPS storage is not available") {
    super(message);
    this.name = "GpsStorageUnavailableError";
  }
}

export async function withGpsStorage<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isGpsStorageUnavailable(error)) {
      throw new GpsStorageUnavailableError();
    }
    throw error;
  }
}
