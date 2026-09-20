import type { FmcsaLookupRequest, FmcsaNormalizedCarrier, FmcsaProviderOutcome, FmcsaRegulatoryProvider } from "@/lib/services/fmcsa/types";
import { normalizeDocket, normalizeUsdot } from "@/lib/services/fmcsa/normalize";

export type FixtureMode = "match" | "mismatch" | "not_found" | "malformed" | "timeout" | "error";

const MATCH_CARRIER: FmcsaNormalizedCarrier = {
  usdot: "2481936",
  docketNumber: "874201",
  legalName: "Delta Advanced Trucking, Inc.",
  dbaName: "Delta Advanced Trucking",
  allowToOperate: "Y",
  outOfService: "N",
  outOfServiceDate: null,
};

const MISMATCH_CARRIER: FmcsaNormalizedCarrier = {
  usdot: "2481936",
  docketNumber: "999999",
  legalName: "Unrelated Motor Lines LLC",
  dbaName: "Unrelated Lines",
  allowToOperate: "N",
  outOfService: "Y",
  outOfServiceDate: "01/01/2026",
};

/**
 * Deterministic non-production fixture. Never labeled LIVE.
 */
export class FixtureFmcsaProvider implements FmcsaRegulatoryProvider {
  id = "fixture" as const;

  constructor(private readonly mode: FixtureMode = "match") {}

  async lookup(request: FmcsaLookupRequest): Promise<FmcsaProviderOutcome> {
    if (this.mode === "timeout") {
      return {
        status: "ERROR",
        provenance: "ERROR",
        retrievedAt: null,
        endpointUsed: "/carriers/fixture",
        carrier: null,
        errorCode: "TIMEOUT",
        errorMessage: "QCMobile request timed out",
      };
    }
    if (this.mode === "error") {
      return {
        status: "ERROR",
        provenance: "ERROR",
        retrievedAt: null,
        endpointUsed: "/carriers/fixture",
        carrier: null,
        errorCode: "HTTP_500",
        errorMessage: "QCMobile returned HTTP 500",
      };
    }
    if (this.mode === "malformed") {
      return {
        status: "ERROR",
        provenance: "ERROR",
        retrievedAt: new Date(),
        endpointUsed: "/carriers/fixture",
        carrier: null,
        errorCode: "MALFORMED_RESPONSE",
        errorMessage: "QCMobile JSON did not contain a carrier object",
      };
    }
    if (this.mode === "not_found") {
      return {
        status: "NOT_FOUND",
        provenance: "FIXTURE",
        retrievedAt: new Date(),
        endpointUsed: "/carriers/fixture",
        carrier: null,
      };
    }

    const identifier = request.kind === "USDOT" ? normalizeUsdot(request.value) : normalizeDocket(request.value);
    const carrier = this.mode === "mismatch" ? MISMATCH_CARRIER : MATCH_CARRIER;
    return {
      status: "FOUND",
      provenance: "FIXTURE",
      retrievedAt: new Date(),
      endpointUsed: "/carriers/fixture",
      carrier: {
        ...carrier,
        usdot: request.kind === "USDOT" ? identifier : carrier.usdot,
        docketNumber: request.kind === "DOCKET" ? identifier : carrier.docketNumber,
      },
    };
  }
}
