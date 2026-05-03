"use client";

import Link from "next/link";

type Base = {
  className?: string;
  children?: React.ReactNode;
};

/** Opens driver hub review drawer (`#driver-review`). */
export function DriverHubReviewLink({ driverId, className, children }: Base & { driverId: string }) {
  return (
    <Link
      href={`/drivers/${driverId}#driver-review`}
      className={className ?? "text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline"}
    >
      {children ?? "View driver review"}
    </Link>
  );
}

/** Opens driver DQF vault (document rows + vault drawer). */
export function DriverVaultReviewLink({ driverId, className, children }: Base & { driverId: string }) {
  return (
    <Link
      href={`/drivers/${driverId}/vault`}
      className={className ?? "text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline"}
    >
      {children ?? "Open DQF vault"}
    </Link>
  );
}

/** Opens load detail review (`#load-review`). */
export function LoadReviewDeepLink({ loadId, className, children }: Base & { loadId: string }) {
  return (
    <Link
      href={`/loads/${loadId}#load-review`}
      className={className ?? "text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline"}
    >
      {children ?? "View load review"}
    </Link>
  );
}

/**
 * Compact link cluster for proof/documentation gaps. Omits invalid combos.
 */
export function ProofGapReviewLinks({
  driverId,
  loadId,
  className,
}: {
  driverId?: string | null;
  loadId?: string | null;
  className?: string;
}) {
  const d = driverId?.trim();
  const l = loadId?.trim();
  if (!d && !l) return null;
  return (
    <span className={className ?? "flex flex-wrap gap-x-2 gap-y-1"}>
      {l ? (
        <LoadReviewDeepLink loadId={l} className="text-[10px] font-semibold text-teal-300 hover:text-teal-200" />
      ) : null}
      {d ? (
        <DriverHubReviewLink driverId={d} className="text-[10px] font-semibold text-teal-300 hover:text-teal-200" />
      ) : null}
      {d ? (
        <DriverVaultReviewLink driverId={d} className="text-[10px] font-semibold text-slate-400 hover:text-slate-200" />
      ) : null}
    </span>
  );
}
