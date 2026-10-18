import { isPublicRoute, normalizePathname } from "@/lib/security/route-access";

/**
 * Public demonstration pages reuse platform components whose links point at signed-in record
 * routes (/loads/L001, /drivers/DRV-001/safety, /dispatch?view=...). For anonymous visitors those
 * links would end at the sign-in page, so they are pointed at the public demonstration of the same
 * work instead. Authentication is unchanged: the private routes stay gated, and signed-in users keep
 * the original links (see components/security/PublicDemoLinkGuard.tsx).
 *
 * Order matters: the first matching prefix wins.
 */
const DEMO_TARGETS: Array<[prefix: string, target: string, keepSearch?: boolean]> = [
  ["/dispatch/intake", "/customer-portal/load-intake"],
  ["/load-intake", "/customer-portal/load-intake"],
  ["/dispatch/command-center", "/demo/command-center"],
  ["/command-center", "/demo/command-center"],
  ["/dispatch", "/demo/dispatch", true],
  ["/loads", "/demo/loads"],
  ["/pretrip", "/demo/loads"],
  ["/trip-release", "/demo/loads"],
  ["/maintenance", "/demo/loads"],
  ["/documents/vault", "/documents"],
  ["/drivers", "/demo/drivers"],
  ["/portals/driver", "/demo/drivers"],
  ["/portals/customer", "/customer-portal"],
  ["/settlements", "/demo/settlements"],
  ["/fleet-financials", "/demo/settlements"],
  ["/carriers", "/interactive-demo/carriers"],
  ["/safety", "/safety"],
  ["/recruiting", "/business-operations/hr-tier/recruiting-onboarding"],
  ["/operational-chat", "/demo/command-center"],
];

/** Public destination for a link on a public page, or null when the link may stay as it is. */
export function publicDemoTarget(href: string): string | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const url = new URL(href, "http://bof.local");
  const pathname = normalizePathname(url.pathname);
  if (pathname === null || pathname.startsWith("/api/") || isPublicRoute(pathname)) return null;
  for (const [prefix, target, keepSearch] of DEMO_TARGETS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return keepSearch && pathname === prefix ? `${target}${url.search}` : target;
    }
  }
  return null;
}
