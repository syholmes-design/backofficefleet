/**
 * Public URL prefix for on-demand SVGs. Rewritten to `/api/bof-generated/:path*`
 * in `next.config.ts` (`afterFiles`). Kept in a tiny module so pages do not pull
 * in the full document engine graph when they only need this string.
 */
export const GENERATED_PUBLIC_PREFIX = "/generated";
