"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIVE_PRODUCTION_PREFIXES = [
  "/command-center",
  "/dispatch",
  "/loads",
  "/drivers",
  "/settlements",
  "/pretrip",
  "/trip-release",
];

function isLiveProductionPath(pathname: string) {
  if (pathname.startsWith("/demo")) return false;
  if (pathname.startsWith("/dispatch-v2") || pathname.startsWith("/settlements-v2")) return false;
  return LIVE_PRODUCTION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function OperatorSurfaceModeBanner() {
  const pathname = usePathname() || "";

  if (pathname.startsWith("/demo")) {
    return (
      <div className="border-b border-amber-500/40 bg-amber-950/80 px-4 py-2 text-sm text-amber-50">
        <strong>DEMO sandbox.</strong> This path is training/sales/onboarding only. It is not LIVE operational
        authority. Production Command Center is{" "}
        <Link className="underline decoration-amber-300" href="/command-center">
          /command-center
        </Link>
        .
      </div>
    );
  }

  if (pathname === "/dashboard") {
    return (
      <div className="border-b border-amber-500/40 bg-amber-950/80 px-4 py-2 text-sm text-amber-50">
        <strong>DEMO operator overview.</strong> Dashboard is not the production Command Center. LIVE feeds are at{" "}
        <Link className="underline decoration-amber-300" href="/command-center">
          /command-center
        </Link>
        . Explicit DEMO Command Center:{" "}
        <Link className="underline decoration-amber-300" href="/demo/command-center">
          /demo/command-center
        </Link>
        .
      </div>
    );
  }

  if (isLiveProductionPath(pathname)) {
    return (
      <div className="border-b border-emerald-500/40 bg-emerald-950/70 px-4 py-2 text-sm text-emerald-50">
        <strong>LIVE production operator path.</strong> Operational state comes from Prisma/API. DEMO records
        (L001, T-102, DRV-*) are not LIVE authority. DEMO sandbox:{" "}
        <Link className="underline decoration-emerald-300" href="/demo/command-center">
          /demo/command-center
        </Link>
        .
      </div>
    );
  }

  return null;
}
