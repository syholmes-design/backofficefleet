"use client";

import Link from "next/link";
import type { BofData } from "@/lib/load-bof-data";
import { DriverCell } from "@/components/DriverCell";
import { Fragment, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getLoadRiskExplanation } from "@/lib/load-risk-explanation";

function loadStatusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "EN ROUTE") return "bof-status-pill bof-status-pill-info";
  if (s === "PENDING") return "bof-status-pill bof-status-pill-warn";
  if (s === "DELIVERED" || s === "CLOSED") return "bof-status-pill bof-status-pill-ok";
  return "bof-status-pill bof-status-pill-muted";
}

export function LoadsDispatchTable({
  data,
  selectedLoadId,
  onSelectLoad,
}: {
  data: BofData;
  selectedLoadId?: string;
  onSelectLoad?: (loadId: string) => void;
}) {
  const { demoRiskOverrides, resolveLoadRiskReason, resolveDriverRiskReason } = useBofDemoData();
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null);

  function signalText(status: "clean" | "at_risk" | "blocked" | "needs_review", reason: string) {
    if (status === "clean") return "Clean";
    if (status === "blocked") return `Blocked: ${reason}`;
    if (status === "at_risk") return `At Risk: ${reason}`;
    return `Review: ${reason}`;
  }

  return (
    <div className="bof-table-wrap">
      <table className="bof-table">
        <thead>
          <tr>
            <th scope="col">Load</th>
            <th scope="col">Driver</th>
            <th scope="col">Asset</th>
            <th scope="col">Route</th>
            <th scope="col">POD / seals</th>
            <th scope="col">Signal</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.loads.map((load) => {
            const driver = data.drivers.find((d) => d.id === load.driverId);
            const risk = getLoadRiskExplanation(data, load.id, demoRiskOverrides);
            const signal = signalText(risk.riskStatus, risk.primaryReasonLabel);
            const canExplain = risk.riskStatus !== "clean";
            const isExpanded = expandedLoadId === load.id;
            return (
              <Fragment key={load.id}>
                <tr
                  className="bof-load-row"
                  style={
                    selectedLoadId === load.id
                      ? { outline: "1px solid rgba(20,184,166,0.5)" }
                      : undefined
                  }
                  onClick={() => onSelectLoad?.(load.id)}
                >
                  <td>
                    <Link href={`/loads/${load.id}`} className="bof-driver-link">
                      <code className="bof-code">{load.id}</code> · {load.number}
                    </Link>
                  </td>
                  <td>
                    {driver ? (
                      <DriverCell driverId={load.driverId} name={driver.name} />
                    ) : (
                      <code className="bof-code">{load.driverId}</code>
                    )}
                  </td>
                  <td>
                    <code className="bof-code">{load.assetId}</code>
                  </td>
                  <td>
                    {load.origin} → {load.destination}
                  </td>
                  <td className="bof-small">
                    POD {load.podStatus} · Seals {load.sealStatus}
                  </td>
                  <td>
                    <span
                      className={
                        risk.riskStatus === "blocked"
                          ? "bof-status-pill bof-status-pill-danger"
                          : risk.riskStatus === "clean"
                            ? "bof-status-pill bof-status-pill-ok"
                            : risk.riskStatus === "needs_review"
                              ? "bof-status-pill bof-status-pill-warn"
                              : "bof-status-pill bof-status-pill-info"
                      }
                    >
                      {signal}
                    </span>
                    {canExplain ? (
                      <button
                        type="button"
                        className="bof-link-secondary"
                        style={{ marginLeft: 8, fontSize: 11 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLoadId(isExpanded ? null : load.id);
                        }}
                      >
                        Why at risk?
                      </button>
                    ) : null}
                  </td>
                  <td>
                    <span className={loadStatusClass(load.status)}>{load.status}</span>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr>
                    <td colSpan={7} style={{ background: "rgba(15,23,42,.45)" }}>
                      <div style={{ padding: "10px 12px" }}>
                        <p className="bof-small" style={{ margin: "0 0 6px" }}>
                          <strong>{risk.primaryReasonLabel}</strong> · {risk.recommendedNextStep}
                        </p>
                        <p className="bof-small bof-muted" style={{ margin: "0 0 8px" }}>
                          Dispatch impact: {risk.canDispatch ? "Can dispatch / needs review" : "Blocked"}
                        </p>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {risk.reasons.map((r) => (
                            <li key={r.id} className="bof-small" style={{ marginBottom: 6 }}>
                              <strong>[{r.category}] {r.title}</strong> — {r.detail}
                              <div className="bof-muted" style={{ marginTop: 2 }}>
                                Fix: {r.recommendedFix}
                                {r.actionHref ? (
                                  <>
                                    {" · "}
                                    <Link href={r.actionHref} className="bof-link-secondary">
                                      {r.actionLabel || "Open"}
                                    </Link>
                                  </>
                                ) : null}
                              </div>
                              {r.clearableInDemo ? (
                                <button
                                  type="button"
                                  className="bof-link-secondary"
                                  style={{ marginTop: 4, fontSize: 11 }}
                                  onClick={() => {
                                    if (r.id.startsWith("driver-")) {
                                      resolveDriverRiskReason(load.driverId, r.id, "Demo action");
                                    } else {
                                      resolveLoadRiskReason(load.id, r.id, "Demo action");
                                    }
                                  }}
                                >
                                  Demo action: Resolve blocker
                                </button>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
