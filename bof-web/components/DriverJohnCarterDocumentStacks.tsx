"use client";

import { JOHN_CARTER_REFERENCE_DRIVER_ID } from "@/lib/john-carter-reference";
import {
  DriverFleetDocumentStacks,
  type DriverFleetDocumentStacksProps,
} from "@/components/DriverFleetDocumentStacks";

type Props = Omit<DriverFleetDocumentStacksProps, "driverId">;

/** @deprecated Prefer {@link DriverFleetDocumentStacks} with `driverId`. */
export function DriverJohnCarterDocumentStacks(props: Props) {
  return (
    <DriverFleetDocumentStacks {...props} driverId={JOHN_CARTER_REFERENCE_DRIVER_ID} />
  );
}
