/**
 * Canonical driver headshot path for the BOF demo.
 * Files live under `public/images/drivers/` (e.g. DRV-001.png).
 */
export function driverPhotoPath(driverId: string): string {
  return `/images/drivers/${driverId}.png`;
}
