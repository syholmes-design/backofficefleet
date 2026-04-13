import Link from "next/link";

export function DriverLink({
  driverId,
  children,
  className,
}: {
  driverId: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={`/drivers/${driverId}`} className={className ?? "bof-driver-link"}>
      {children}
    </Link>
  );
}
