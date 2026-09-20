import type { FmcsaProviderOutcome, FmcsaRegulatoryProvider } from "@/lib/services/fmcsa/types";

export class UnavailableFmcsaProvider implements FmcsaRegulatoryProvider {
  id = "unavailable" as const;
  constructor(private readonly reason: string = "FMCSA_QCMOBILE_WEBKEY is not configured") {}

  async lookup(): Promise<FmcsaProviderOutcome> {
    return {
      status: "UNAVAILABLE",
      provenance: "UNAVAILABLE",
      retrievedAt: null,
      endpointUsed: null,
      carrier: null,
      errorCode: "MISSING_CREDENTIALS",
      errorMessage: this.reason,
    };
  }
}
