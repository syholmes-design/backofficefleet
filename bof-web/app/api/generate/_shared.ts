import type { BofData } from "@/lib/load-bof-data";
import type { EngineDocument } from "@/lib/document-engine";

export type GenerateSuccess = {
  ok: true;
  type: string;
  generatedUrl: string;
  publicUrl: string;
  filename: string;
  metadata: Record<string, unknown>;
};

export type GenerateFailure = {
  ok: false;
  type: string;
  error: string;
};

export function getBodyString(
  body: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const raw = body[k];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  }
  return undefined;
}

export function getBodyNumber(
  body: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const k of keys) {
    const raw = body[k];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim()) {
      const n = Number(raw.trim());
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

export function getBodyStringArray(
  body: Record<string, unknown>,
  ...keys: string[]
): string[] {
  for (const k of keys) {
    const raw = body[k];
    if (!Array.isArray(raw)) continue;
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter((x) => x.length > 0);
  }
  return [];
}

export function resolveLoad(
  data: BofData,
  body: Record<string, unknown>
): BofData["loads"][number] | null {
  const loadId = getBodyString(body, "loadId", "load_id");
  if (loadId) {
    const byId = data.loads.find((l) => l.id === loadId);
    if (byId) return byId;
  }

  const loadNumber = getBodyString(body, "load_number", "loadNumber");
  if (loadNumber) {
    const byNumber = data.loads.find((l) => String(l.number) === loadNumber);
    if (byNumber) return byNumber;
  }

  return null;
}

export function resolveSettlement(
  data: BofData,
  body: Record<string, unknown>
): NonNullable<BofData["settlements"]>[number] | null {
  const settlementId = getBodyString(body, "settlementId", "settlement_id");
  if (settlementId && Array.isArray(data.settlements)) {
    const direct = data.settlements.find((s) => s.settlementId === settlementId);
    if (direct) return direct;
  }

  if (!Array.isArray(data.settlements)) return null;
  const load = resolveLoad(data, body);
  if (!load) return null;
  return data.settlements.find((s) => s.driverId === load.driverId) ?? null;
}

export function resolveIncident(
  data: BofData,
  body: Record<string, unknown>
): BofData["complianceIncidents"][number] | null {
  const incidentId = getBodyString(body, "incidentId", "incident_id", "claim_number");
  if (incidentId) {
    const direct = data.complianceIncidents.find((c) => c.incidentId === incidentId);
    if (direct) return direct;
  }

  const load = resolveLoad(data, body);
  if (!load) return null;
  const open = data.complianceIncidents.find(
    (c) => c.driverId === load.driverId && c.status === "OPEN"
  );
  return open ?? data.complianceIncidents.find((c) => c.driverId === load.driverId) ?? null;
}

export function formatDocSuccess(
  type: string,
  doc: EngineDocument,
  metadata: Record<string, unknown>
): GenerateSuccess {
  const filename = doc.fileUrl.split("/").filter(Boolean).slice(-1)[0] ?? "document.svg";
  return {
    ok: true,
    type,
    generatedUrl: doc.fileUrl,
    publicUrl: doc.previewUrl,
    filename,
    metadata: {
      ...metadata,
      status: doc.status,
      blocksPayment: doc.blocksPayment,
      generatedAt: doc.generatedAt,
      links: doc.links,
      sourceDataSummary: doc.sourceDataSummary,
    },
  };
}

export function formatError(type: string, error: string): GenerateFailure {
  return { ok: false, type, error };
}
