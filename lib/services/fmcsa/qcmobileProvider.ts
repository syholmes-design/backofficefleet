import { FMCSA_QCMOBILE_BASE_URL, type FmcsaLookupRequest, type FmcsaProviderOutcome, type FmcsaRegulatoryProvider } from "@/lib/services/fmcsa/types";
import { normalizeDocket, normalizeQcMobileCarrier, normalizeUsdot } from "@/lib/services/fmcsa/normalize";

const DEFAULT_TIMEOUT_MS = 8000;

export class QcMobileFmcsaProvider implements FmcsaRegulatoryProvider {
  id = "qcmobile" as const;

  constructor(
    private readonly webKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  async lookup(request: FmcsaLookupRequest): Promise<FmcsaProviderOutcome> {
    const identifier = request.kind === "USDOT" ? normalizeUsdot(request.value) : normalizeDocket(request.value);
    if (!identifier) {
      return {
        status: "ERROR",
        provenance: "ERROR",
        retrievedAt: null,
        endpointUsed: null,
        carrier: null,
        errorCode: "MALFORMED_IDENTIFIER",
        errorMessage: "Identifier must contain digits",
      };
    }

    const path =
      request.kind === "USDOT" ? `/carriers/${identifier}` : `/carriers/docket-number/${identifier}`;
    const url = new URL(`${FMCSA_QCMOBILE_BASE_URL}${path}`);
    url.searchParams.set("webKey", this.webKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });
      const retrievedAt = new Date();
      if (response.status === 404) {
        return {
          status: "NOT_FOUND",
          provenance: "LIVE",
          retrievedAt,
          endpointUsed: path,
          carrier: null,
        };
      }
      if (response.status === 401) {
        return {
          status: "UNAVAILABLE",
          provenance: "UNAVAILABLE",
          retrievedAt,
          endpointUsed: path,
          carrier: null,
          errorCode: "AUTH_FAILED",
          errorMessage: "QCMobile rejected the webKey",
        };
      }
      if (!response.ok) {
        return {
          status: "ERROR",
          provenance: "ERROR",
          retrievedAt,
          endpointUsed: path,
          carrier: null,
          errorCode: `HTTP_${response.status}`,
          errorMessage: `QCMobile returned HTTP ${response.status}`,
        };
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return {
          status: "ERROR",
          provenance: "ERROR",
          retrievedAt,
          endpointUsed: path,
          carrier: null,
          errorCode: "MALFORMED_RESPONSE",
          errorMessage: "QCMobile response was not JSON",
        };
      }

      const carrier = normalizeQcMobileCarrier(payload);
      if (!carrier) {
        return {
          status: "ERROR",
          provenance: "ERROR",
          retrievedAt,
          endpointUsed: path,
          carrier: null,
          errorCode: "MALFORMED_RESPONSE",
          errorMessage: "QCMobile JSON did not contain a carrier object",
        };
      }
      return {
        status: "FOUND",
        provenance: "LIVE",
        retrievedAt,
        endpointUsed: path,
        carrier,
      };
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      return {
        status: "ERROR",
        provenance: "ERROR",
        retrievedAt: null,
        endpointUsed: path,
        carrier: null,
        errorCode: aborted ? "TIMEOUT" : "NETWORK_ERROR",
        errorMessage: aborted ? "QCMobile request timed out" : "QCMobile request failed",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createQcMobileProviderFromEnv(): QcMobileFmcsaProvider | null {
  const webKey = process.env.FMCSA_QCMOBILE_WEBKEY?.trim();
  if (!webKey) return null;
  return new QcMobileFmcsaProvider(webKey);
}
