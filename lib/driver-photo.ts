/**
 * Canonical driver headshot path for the BOF demo.
 * Files live under `public/images/drivers/` (e.g. DRV-001.png).
 */
export function driverPhotoPath(driverId: string): string {
  const explicitMap: Record<string, string> = {
    "DRV-006": "/images/drivers/DRV-006.png",
    "DRV-011": "/images/drivers/DRV-011.png",
  };
  const hit = explicitMap[driverId];
  if (hit) return hit;
  return `/images/drivers/${driverId}.png`;
}
