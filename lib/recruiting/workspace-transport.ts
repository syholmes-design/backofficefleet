"use client";

import { useCallback, useEffect, useState } from "react";

import type { RecruitingWorkspaceModel } from "@/lib/recruiting/workspace-model";

/**
 * How the Recruiting & Onboarding screens reach their data. Signed in, requests go to the real
 * recruiting APIs (Postgres, tenant-scoped). In the public demonstration the same requests are
 * answered in the browser by lib/recruiting/demo-backend.ts with fictional records.
 */
export type RecruitingTransportResponse = { ok: boolean; status: number; data: Record<string, unknown> & { error?: string } };
export type RecruitingTransport = (path: string, init?: { method?: string; body?: unknown }) => Promise<RecruitingTransportResponse>;

export const httpRecruitingTransport: RecruitingTransport = async (path, init) => {
  const response = await fetch(path, {
    method: init?.method ?? (init?.body === undefined ? "GET" : "POST"),
    headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as RecruitingTransportResponse["data"];
  return { ok: response.ok, status: response.status, data };
};

/** fetch-compatible wrapper so the existing requisition screens can run on any transport unchanged. */
export function transportFetch(transport: RecruitingTransport): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = typeof input === "string" ? input : input instanceof URL ? input.pathname + input.search : input.url;
    const body = typeof init?.body === "string" && init.body ? JSON.parse(init.body) : undefined;
    const result = await transport(path, { method: init?.method ?? (body === undefined ? "GET" : "POST"), body });
    return new Response(JSON.stringify(result.data), { status: result.status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}

export function useRecruitingWorkspace(transport: RecruitingTransport) {
  const [model, setModel] = useState<RecruitingWorkspaceModel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const reload = useCallback(async () => {
    const result = await transport("/api/recruiting/workspace");
    if (result.ok) {
      setModel(result.data as unknown as RecruitingWorkspaceModel);
      setLoadError(null);
    } else {
      setLoadError(result.data.error ?? `Workspace could not be loaded (${result.status}).`);
    }
  }, [transport]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Runs one recruiting action, shows its outcome, and reloads the workspace from the source of record. */
  const run = useCallback(
    async (label: string, path: string, init: { method?: string; body?: unknown }) => {
      setBusy(true);
      try {
        const result = await transport(path, init);
        setNotice(result.ok ? { tone: "ok", text: label } : { tone: "error", text: result.data.error ?? `${label} failed (${result.status}).` });
        await reload();
        return result;
      } finally {
        setBusy(false);
      }
    },
    [transport, reload],
  );

  return { model, loadError, busy, notice, setNotice, run, reload };
}
