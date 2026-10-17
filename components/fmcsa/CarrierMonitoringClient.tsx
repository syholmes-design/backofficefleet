"use client";

import { useCallback, useEffect, useState } from "react";

import { identityFieldErrors, type IdentityField } from "@/lib/services/fmcsa/carrierIdentity";

type Status = "CLEAR" | "ATTENTION" | "CRITICAL" | "UNVERIFIED" | "NOT_CONFIGURED";
type Alert = { code: string; severity: string; message: string };

type FleetRow = {
  fleet: { id: string; name: string; status: string; usdotNumber: string | null; mcNumber: string | null; carrierIdentityUpdatedAt: string | null };
  canRun: boolean;
  canEditIdentity: boolean;
  status: Status;
  latest: null | {
    runId: string;
    status: Status;
    recordedStatus: Status;
    stale: boolean;
    reasons: string[];
    alerts: Alert[];
    changeAlerts: Alert[];
    evaluatedAt: string;
  };
};

type SchemaReport = {
  trusted: boolean;
  datasets: Record<
    string,
    {
      name: string;
      datasetId: string;
      trusted: boolean;
      issues: string[];
      fieldsSource: string;
      ageHours: number | null;
      fieldResolution?: Record<string, { column: string; verifiedBy: string; officialName: string | null }>;
      officialColumns?: Array<{ fieldName: string; name: string; description: string | null }>;
    }
  >;
};

type Overview = {
  fleets: FleetRow[];
  qcmobileConfigured: boolean;
  scheduling: { enabled: boolean; reason: string };
  lastRun: null | {
    id: string;
    trigger: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    schemaValidation: SchemaReport | null;
    sourceErrors: Array<{ dataset: string; errorCode: string; errorMessage: string }> | null;
    exceptions: Array<{ fleetId: string; fleetName: string; status: Status; reasons: string[] }>;
  };
};

const STATUS_LABEL: Record<Status, string> = {
  CLEAR: "Clear",
  ATTENTION: "Attention",
  CRITICAL: "Critical",
  UNVERIFIED: "Unverified",
  NOT_CONFIGURED: "No USDOT",
};

function when(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function CarrierMonitoringClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [usdot, setUsdot] = useState("");
  const [mc, setMc] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<IdentityField, string>>>({});

  const load = useCallback(async () => {
    const response = await fetch("/api/fmcsa/monitoring", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error ?? `Request failed (${response.status})`);
    else {
      setError(null);
      setData(body);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runNow() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/fmcsa/monitoring/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error ?? `Run failed (${response.status})`);
    await load();
    setBusy(false);
  }

  async function saveIdentity(fleetId: string) {
    setError(null);
    const local = identityFieldErrors({ usdotNumber: usdot, mcNumber: mc });
    setFieldErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    const response = await fetch("/api/fmcsa/carrier-identity", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fleetId, usdotNumber: usdot || null, mcNumber: mc || null }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Field errors go beside the field; anything else to the page banner.
      if (body.field === "usdotNumber" || body.field === "mcNumber") setFieldErrors({ [body.field as IdentityField]: body.error });
      else setError(body.error ?? `Save failed (${response.status})`);
    } else {
      setEditing(null);
      setFieldErrors({});
    }
    await load();
    setBusy(false);
  }

  const canRunAny = data?.fleets.some((row) => row.canRun) ?? false;
  const schema = data?.lastRun?.schemaValidation ?? null;

  return (
    <main className="bof-fmcsa-page">
      <div className="bof-fmcsa-shell">
        <header className="bof-fmcsa-header">
          <div>
            <p className="bof-fmcsa-eyebrow">FMCSA carrier compliance</p>
            <h1>Carrier Monitoring</h1>
            <p>
              Evidence for compliance review from FMCSA QCMobile and open data. A carrier is shown as Clear only when complete,
              current, schema-validated evidence shows no alerts; otherwise it is Unverified.
            </p>
          </div>
          <div className="bof-fmcsa-actions">
            <button type="button" className="bof-fmcsa-primary" onClick={runNow} disabled={busy || !canRunAny}>
              {busy ? "Working…" : "Run check now"}
            </button>
          </div>
        </header>

        {error ? <p className="bof-fmcsa-error" role="alert">{error}</p> : null}

        {data ? (
          <>
            <section className="bof-fmcsa-meta">
              <span>QCMobile: <strong>{data.qcmobileConfigured ? "configured" : "not configured"}</strong></span>
              <span>Scheduled runs: <strong>{data.scheduling.enabled ? "enabled" : "off"}</strong> <em>{data.scheduling.reason}</em></span>
              <span>Last run: <strong>{data.lastRun ? `${data.lastRun.status} · ${when(data.lastRun.finishedAt ?? data.lastRun.startedAt)}` : "none"}</strong></span>
            </section>

            <section className="bof-fmcsa-panel">
              <table className="bof-fmcsa-table">
                <thead>
                  <tr>
                    <th>Fleet</th>
                    <th>USDOT / MC</th>
                    <th>Status</th>
                    <th>Findings</th>
                    <th>Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fleets.map((row) => (
                    <tr key={row.fleet.id}>
                      <td>{row.fleet.name}</td>
                      <td>
                        {editing === row.fleet.id ? (
                          <form
                            className="bof-fmcsa-identity"
                            noValidate
                            onSubmit={(event) => {
                              event.preventDefault();
                              void saveIdentity(row.fleet.id);
                            }}
                          >
                            <div className="bof-fmcsa-field">
                              <label htmlFor={`usdot-${row.fleet.id}`}>USDOT number</label>
                              <input
                                id={`usdot-${row.fleet.id}`}
                                inputMode="numeric"
                                placeholder="80806"
                                value={usdot}
                                aria-invalid={Boolean(fieldErrors.usdotNumber)}
                                aria-describedby={fieldErrors.usdotNumber ? `usdot-error-${row.fleet.id}` : undefined}
                                onChange={(e) => {
                                  setUsdot(e.target.value);
                                  setFieldErrors((current) => ({ ...current, usdotNumber: undefined }));
                                }}
                              />
                              {fieldErrors.usdotNumber ? (
                                <span id={`usdot-error-${row.fleet.id}`} className="bof-fmcsa-field-error">{fieldErrors.usdotNumber}</span>
                              ) : null}
                            </div>
                            <div className="bof-fmcsa-field">
                              <label htmlFor={`mc-${row.fleet.id}`}>MC / MX / FF docket</label>
                              <input
                                id={`mc-${row.fleet.id}`}
                                placeholder="MC135797"
                                value={mc}
                                aria-invalid={Boolean(fieldErrors.mcNumber)}
                                aria-describedby={fieldErrors.mcNumber ? `mc-error-${row.fleet.id}` : undefined}
                                onChange={(e) => {
                                  setMc(e.target.value);
                                  setFieldErrors((current) => ({ ...current, mcNumber: undefined }));
                                }}
                              />
                              {fieldErrors.mcNumber ? (
                                <span id={`mc-error-${row.fleet.id}`} className="bof-fmcsa-field-error">{fieldErrors.mcNumber}</span>
                              ) : null}
                            </div>
                            <div className="bof-fmcsa-field-actions">
                              <button type="submit" disabled={busy}>Save</button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditing(null);
                                  setFieldErrors({});
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            {row.fleet.usdotNumber ? `USDOT ${row.fleet.usdotNumber}` : "—"}
                            {row.fleet.mcNumber ? ` · ${row.fleet.mcNumber}` : ""}
                            {row.canEditIdentity ? (
                              <button
                                type="button"
                                className="bof-fmcsa-link"
                                onClick={() => {
                                  setFieldErrors({});
                                  setEditing(row.fleet.id);
                                  setUsdot(row.fleet.usdotNumber ?? "");
                                  setMc(row.fleet.mcNumber ?? "");
                                }}
                              >
                                Edit
                              </button>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td>
                        <span className={`bof-fmcsa-badge is-${row.status.toLowerCase()}`}>{STATUS_LABEL[row.status]}</span>
                        {row.latest?.stale ? <small> (result stale)</small> : null}
                      </td>
                      <td>
                        {row.latest ? (
                          <ul className="bof-fmcsa-reasons">
                            {[...row.latest.alerts, ...row.latest.changeAlerts].map((alert, index) => (
                              <li key={`a${index}`}><strong>{alert.severity}</strong> {alert.message}</li>
                            ))}
                            {row.latest.reasons.map((reason, index) => (
                              <li key={`r${index}`}>{reason}</li>
                            ))}
                          </ul>
                        ) : row.status === "NOT_CONFIGURED" ? (
                          "Add the fleet's USDOT number to monitor it."
                        ) : (
                          "Not checked yet."
                        )}
                      </td>
                      <td>{when(row.latest?.evaluatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {schema ? (
              <section className="bof-fmcsa-panel">
                <h2>Dataset schema validation {schema.trusted ? "· trusted" : "· NOT trusted"}</h2>
                <ul className="bof-fmcsa-reasons">
                  {Object.values(schema.datasets).map((dataset) => (
                    <li key={dataset.datasetId}>
                      <strong>{dataset.trusted ? "OK" : "FAIL"}</strong> {dataset.name} ({dataset.datasetId}) · fields from {dataset.fieldsSource}
                      {dataset.ageHours !== null ? ` · ${dataset.ageHours} h old` : ""}
                      {dataset.issues.length ? ` — ${dataset.issues.join("; ")}` : ""}
                      {dataset.fieldResolution && Object.keys(dataset.fieldResolution).length ? (
                        <div className="bof-fmcsa-mapping">
                          Mapped:{" "}
                          {Object.entries(dataset.fieldResolution)
                            .map(([field, r]) => `${field} → ${r.column}${r.verifiedBy === "OFFICIAL_METADATA" ? ` (official: ${r.officialName})` : " (field name)"}`)
                            .join("; ")}
                        </div>
                      ) : null}
                      {!dataset.trusted && dataset.officialColumns?.length ? (
                        <details className="bof-fmcsa-mapping">
                          <summary>FMCSA official columns ({dataset.officialColumns.length})</summary>
                          <ul>
                            {dataset.officialColumns.map((column) => (
                              <li key={column.fieldName}>
                                <code>{column.name}</code> → <code>{column.fieldName}</code>
                                {column.description ? ` — ${column.description.slice(0, 160)}` : ""}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {data.lastRun?.sourceErrors?.length ? (
              <section className="bof-fmcsa-panel">
                <h2>Source errors</h2>
                <ul className="bof-fmcsa-reasons">
                  {data.lastRun.sourceErrors.map((item, index) => (
                    <li key={index}>{item.dataset}: {item.errorCode} {item.errorMessage}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : !error ? (
          <p>Loading…</p>
        ) : null}
      </div>
    </main>
  );
}
