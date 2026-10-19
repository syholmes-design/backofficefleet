/**
 * Central route access policy, enforced by middleware.ts.
 *
 * Deny by default: every page and API route requires a signed-in session unless it is listed
 * here as intentionally public (marketing, assessments, public demonstrations with synthetic
 * data, sign-in itself, and the two public submission endpoints). Role and tenant checks stay in
 * the pages, route handlers and services; this layer only guarantees that private operating
 * routes are never served to an anonymous visitor.
 */

/** Public marketing site: app/(marketing)/<segment>/** (kept in sync by route-access.test.ts). */
export const PUBLIC_MARKETING_SEGMENTS = [
  "aggregators",
  "apply",
  "blog",
  "bof-vault",
  "book-assessment",
  "business-operations",
  "careers",
  "company",
  "contact",
  "driver-experience",
  "fleet-operations",
  "fleet-savings",
  "for-hire-carriers",
  "founding-fleet",
  "government",
  "how-bof-works",
  "interactive-demo",
  "investors",
  "private-fleets",
  "product",
  "qa",
  "recruiting-onboarding",
  "services",
  "team-briefing",
  "what-we-do",
] as const;

/** Public pages outside the marketing group, matched with all sub-paths. */
export const PUBLIC_PAGE_PREFIXES = [
  "/assessment",
  // Public demonstrations (synthetic demo data, labelled DEMO).
  "/demo",
  "/customer-portal",
  "/shipper-portal",
  "/portals/manager",
  // Public sample document library and templates linked from the marketing site.
  "/documents/company-operations-vault",
  "/documents/template-packs",
  "/documents/compliance-flow",
] as const;

/** Public pages matched exactly (their sub-paths stay private). */
export const PUBLIC_PAGE_EXACT = [
  "/",
  "/dashboard",
  "/documents",
  "/portals",
  "/safety",
  "/money-at-risk",
  "/rf-actions",
  "/settlements-v2",
  "/dispatch-v2",
] as const;

/**
 * Top-level folders of public/ (static files, kept in sync by route-access.test.ts). A request for a
 * file (last segment has an extension) under one of these is a static asset and stays public.
 */
export const PUBLIC_STATIC_ROOTS = [
  "actual_docs",
  "approved",
  "assets",
  "customer-portal",
  "data",
  "documents",
  "evidence",
  "generated",
  "images",
  "logo",
  "marketing",
  "mocks",
  "profiles",
  "proof",
  "recovered-assets",
  "reference",
  "source-assets",
] as const;

/** Private app routes that live under a static root; file-like paths here are not static assets. */
const PRIVATE_UNDER_STATIC_ROOTS = ["/documents/vault"] as const;

/** API routes that are public by design. */
export const PUBLIC_API_PREFIXES = ["/api/auth", "/api/marketing-demo-media", "/api/regulatory-feed"] as const;

/** Public submission endpoints: only the listed methods are public. */
export const PUBLIC_API_METHODS: Record<string, readonly string[]> = {
  "/api/contact/inquiries": ["POST"],
  "/api/recruiting/apply": ["POST"],
  "/api/recruiting/openings": ["GET"],
};

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Decoded, slash-collapsed path as the router will see it; null when it cannot be decoded. */
export function normalizePathname(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const collapsed = decoded.replace(/\/{2,}/g, "/");
  const trimmed = collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : collapsed;
  return trimmed || "/";
}

/**
 * Static files under public/. Only real public/ folders qualify: an extension on any other path
 * (e.g. /carriers/CAR-001/x.json) still reaches a dynamic page and is gated like that page.
 */
function isStaticAssetPath(pathname: string) {
  const last = pathname.slice(pathname.lastIndexOf("/") + 1);
  if (!/\.[A-Za-z0-9]+$/.test(last)) return false;
  if (PRIVATE_UNDER_STATIC_ROOTS.some((prefix) => matchesPrefix(pathname, prefix))) return false;
  return PUBLIC_STATIC_ROOTS.some((root) => pathname.startsWith(`/${root}/`));
}

export function isPublicRoute(rawPathname: string, method = "GET"): boolean {
  const pathname = normalizePathname(rawPathname);
  if (pathname === null) return false;
  if (pathname.startsWith("/api/") || pathname === "/api") {
    if (PUBLIC_API_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) return true;
    const methods = PUBLIC_API_METHODS[pathname];
    return Boolean(methods?.includes(method.toUpperCase()));
  }
  if (isStaticAssetPath(pathname)) return true;
  if ((PUBLIC_PAGE_EXACT as readonly string[]).includes(pathname)) return true;
  if (PUBLIC_PAGE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) return true;
  return PUBLIC_MARKETING_SEGMENTS.some((segment) => matchesPrefix(pathname, `/${segment}`));
}

/** Relative sign-in URL that returns the visitor to the requested page (never built from the Host header). */
export function signInRedirectPath(pathname: string, search: string) {
  const params = new URLSearchParams(search);
  params.delete("_rsc");
  const query = params.toString();
  const callbackUrl = `${pathname}${query ? `?${query}` : ""}`;
  return `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
