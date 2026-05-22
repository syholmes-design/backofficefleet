import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";
import { driverPhotoPath } from "@/lib/driver-photo";

/** Avatar + name for tables and dense lists; photo falls back via DriverAvatar on error. */
export function DriverCell({
  driverId,
  name,
  size = 32,
}: {
  driverId: string;
  name: string;
  size?: number;
}) {
  return (
    <div className="bof-driver-cell">
      <DriverLink driverId={driverId} className="bof-driver-cell-photo">
        <DriverAvatar
          name={name}
          photoUrl={driverPhotoPath(driverId)}
          size={size}
        />
      </DriverLink>
      <div className="bof-driver-cell-text">
        <DriverLink driverId={driverId}>{name}</DriverLink>
      </div>
    </div>
  );
}
