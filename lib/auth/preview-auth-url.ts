/**
 * Vercel Preview deployments are served from per-deployment and per-branch hostnames.
 * A fixed AUTH_URL / NEXTAUTH_URL inherited by the Preview environment (for example the
 * production domain) makes next-auth rewrite the request origin, so the sign-in form
 * posts to that other host and Preview sign-in fails. On Vercel the host is already
 * trusted (VERCEL=1), so Preview deployments derive it from the request instead.
 * Production and local runs are unaffected.
 */
export function ignoreFixedAuthUrlOnVercelPreview(env: Record<string, string | undefined> = process.env): void {
  if (env.VERCEL_ENV !== "preview") return;
  delete env.AUTH_URL;
  delete env.NEXTAUTH_URL;
}
