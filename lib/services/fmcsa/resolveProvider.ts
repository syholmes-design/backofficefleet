import { FixtureFmcsaProvider } from "@/lib/services/fmcsa/fixtureProvider";
import { QcMobileFmcsaProvider } from "@/lib/services/fmcsa/qcmobileProvider";
import type { FmcsaRegulatoryProvider } from "@/lib/services/fmcsa/types";
import { UnavailableFmcsaProvider } from "@/lib/services/fmcsa/unavailableProvider";

export function resolveFmcsaProvider(override?: FmcsaRegulatoryProvider): FmcsaRegulatoryProvider {
  if (override) return override;

  const mode = process.env.BOF_FMCSA_PROVIDER?.trim().toLowerCase();
  if (mode === "fixture" && process.env.NODE_ENV !== "production") {
    return new FixtureFmcsaProvider("match");
  }
  if (mode === "qcmobile") {
    const webKey = process.env.FMCSA_QCMOBILE_WEBKEY?.trim();
    if (!webKey) return new UnavailableFmcsaProvider("FMCSA_QCMOBILE_WEBKEY is not configured");
    return new QcMobileFmcsaProvider(webKey);
  }
  return new UnavailableFmcsaProvider();
}

export function bofCacheStaleAfterMs(): number | null {
  const raw = process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS?.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}
