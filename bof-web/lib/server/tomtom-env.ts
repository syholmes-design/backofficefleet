/**
 * TomTom Search & Fuel API — server only.
 * Set in Vercel: **TOMTOM_API_KEY** (Project → Settings → Environment Variables).
 * Optional fallbacks for older misnamed secrets (not recommended; prefer TOMTOM_API_KEY).
 */
export function getTomTomApiKey(): string | undefined {
  const primary = process.env.TOMTOM_API_KEY?.trim();
  if (primary) return primary;
  return (
    process.env.TOMTOM_MAPS_API_KEY?.trim() ||
    process.env.TT_API_KEY?.trim() ||
    undefined
  );
}

export function tomTomKeyConfigured(): boolean {
  return Boolean(getTomTomApiKey());
}
