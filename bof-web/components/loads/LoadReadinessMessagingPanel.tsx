"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  buildLoadReadinessSummaryModel,
  buildReadinessSummaryArtifactHtml,
  type MessageExpectedResponseType,
  type MessageRecipientType,
  type MessageType,
} from "@/lib/load-readiness-messaging";
import { useLoadReadinessMessagingStore } from "@/lib/stores/load-readiness-messaging-store";

function statusClass(state: "complete" | "incomplete" | "at_risk") {
  if (state === "complete") return "bof-status-pill bof-status-pill-ok";
  if (state === "at_risk") return "bof-status-pill bof-status-pill-warn";
  return "bof-status-pill bof-status-pill-danger";
}

const quickTemplates = [
  {
    subject: "Pre-trip requirements incomplete",
    body: "Please confirm empty trailer inspection and cargo photos before release.",
    expected: "yes_no" as MessageExpectedResponseType,
    recipient: "driver" as MessageRecipientType,
    type: "question" as MessageType,
    impact: "Blocks readiness until pre-trip confirmation is received.",
  },
  {
    subject: "Please confirm seal number",
    body: "Reply with pickup seal number to complete seal verification.",
    expected: "seal_number" as MessageExpectedResponseType,
    recipient: "driver" as MessageRecipientType,
    type: "acknowledgment" as MessageType,
    impact: "Seal acknowledgment requirement.",
  },
  {
    subject: "Pickup appointment changed",
    body: "Dispatch: please acknowledge new appointment window.",
    expected: "yes_no" as MessageExpectedResponseType,
    recipient: "dispatch" as MessageRecipientType,
    type: "question" as MessageType,
    impact: "Readiness remains at risk until dispatch confirms appointment.",
  },
  {
    subject: "Approve lumper overrun?",
    body: "Manager review required. Reply APPROVE or HOLD.",
    expected: "approve_hold" as MessageExpectedResponseType,
    recipient: "manager" as MessageRecipientType,
    type: "approval" as MessageType,
    impact: "Exception hold flow.",
  },
];

export function LoadReadinessMessagingPanel({ loadId }: { loadId: string }) {
  const { data } = useBofDemoData();
  const load = data.loads.find((l) => l.id === loadId) ?? null;
  const getMessagesForLoad = useLoadReadinessMessagingStore((s) => s.getMessagesForLoad);
  const sendMessage = useLoadReadinessMessagingStore((s) => s.sendMessage);
  const markDelivered = useLoadReadinessMessagingStore((s) => s.markDelivered);
  const recordResponse = useLoadReadinessMessagingStore((s) => s.recordResponse);
  const markExpired = useLoadReadinessMessagingStore((s) => s.markExpired);
  const saveFinalReadinessArtifact = useLoadReadinessMessagingStore((s) => s.saveFinalReadinessArtifact);
  const getFinalReadinessArtifact = useLoadReadinessMessagingStore((s) => s.getFinalReadinessArtifact);
  const messages = getMessagesForLoad(loadId);
  const summary = useMemo(
    () => buildLoadReadinessSummaryModel(data, loadId, messages),
    [data, loadId, messages]
  );

  const [recipientType, setRecipientType] = useState<MessageRecipientType>("driver");
  const [messageType, setMessageType] = useState<MessageType>("question");
  const [expectedResponseType, setExpectedResponseType] =
    useState<MessageExpectedResponseType>("yes_no");
  const [subject, setSubject] = useState("Please confirm empty trailer inspection");
  const [messageBody, setMessageBody] = useState(
    "Reply YES when empty trailer inspection is complete."
  );
  const [impact, setImpact] = useState("Readiness check stays open until confirmation.");
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});

  if (!load || !summary) return null;
  const artifact = getFinalReadinessArtifact(loadId);
  const waiting = summary.checks.filter((c) => c.state !== "complete").length;

  const sendCurrentMessage = () => {
    sendMessage({
      loadId,
      driverId: load.driverId,
      recipientType,
      recipientName:
        recipientType === "driver"
          ? data.drivers.find((d) => d.id === load.driverId)?.name ?? load.driverId
          : recipientType === "dispatch"
            ? "Dispatch Desk"
            : recipientType === "manager"
              ? "Ops Manager"
              : "Fleet Owner",
      recipientRole: recipientType,
      channelType: "sms_simulated",
      messageType,
      subject,
      messageBody,
      expectedResponseType,
      relatedWorkflowImpact: impact,
    });
  };

  return (
    <section className="bof-card" style={{ marginTop: 20 }}>
      <h2 className="bof-h2">Driver Pre-Trip Readiness Summary + Messaging</h2>
      <p className="bof-muted">
        BOF readiness status for load <code className="bof-code">{load.number}</code> ·{" "}
        <span className="bof-status-pill bof-status-pill-muted">{summary.finalStatus}</span> ·{" "}
        {waiting} checks still open
      </p>

      <div className="bof-driver-vault-detail-grid" style={{ marginTop: 12 }}>
        <article className="bof-driver-vault-panel">
          <h3 className="bof-h3">1) Readiness checks</h3>
          <table className="trip-release-table">
            <thead>
              <tr>
                <th>Check</th>
                <th>Status</th>
                <th>Waiting on</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {summary.checks.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>
                    <span className={statusClass(row.state)}>{row.state.replace(/_/g, " ")}</span>
                  </td>
                  <td>{row.waitingOn}</td>
                  <td>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.missingItems.length > 0 ? (
            <>
              <h4 className="bof-h3" style={{ marginTop: 10 }}>
                Missing / exceptions
              </h4>
              <ul className="trip-release-checklist">
                {summary.missingItems.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </>
          ) : null}
        </article>

        <article className="bof-driver-vault-panel">
          <h3 className="bof-h3">2) Messaging / request flow</h3>
          <div className="bof-driver-vault-form">
            <label>
              <span>Recipient</span>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value as MessageRecipientType)}
              >
                <option value="driver">Driver</option>
                <option value="dispatch">Dispatch</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            <label>
              <span>Message type</span>
              <select value={messageType} onChange={(e) => setMessageType(e.target.value as MessageType)}>
                <option value="info">Info</option>
                <option value="question">Question</option>
                <option value="approval">Approval</option>
                <option value="acknowledgment">Acknowledgment</option>
                <option value="alert">Alert</option>
              </select>
            </label>
            <label>
              <span>Expected response</span>
              <select
                value={expectedResponseType}
                onChange={(e) => setExpectedResponseType(e.target.value as MessageExpectedResponseType)}
              >
                <option value="yes_no">yes_no</option>
                <option value="acknowledge">acknowledge</option>
                <option value="free_text">free_text</option>
                <option value="approve_hold">approve_hold</option>
                <option value="seal_number">seal_number</option>
                <option value="none">none</option>
              </select>
            </label>
            <label>
              <span>Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label>
              <span>Message</span>
              <input value={messageBody} onChange={(e) => setMessageBody(e.target.value)} />
            </label>
            <label>
              <span>Workflow impact</span>
              <input value={impact} onChange={(e) => setImpact(e.target.value)} />
            </label>
          </div>
          <div className="bof-driver-vault-actions">
            <button type="button" className="bof-intake-engine-btn bof-intake-engine-btn--primary" onClick={sendCurrentMessage}>
              Send Message
            </button>
            <button
              type="button"
              className="bof-intake-engine-btn"
              onClick={() =>
                sendMessage({
                  loadId,
                  driverId: load.driverId,
                  recipientType: "manager",
                  recipientName: "Ops Manager",
                  recipientRole: "manager",
                  channelType: "notification",
                  messageType: "alert",
                  subject: "Escalation: blocked by missing response",
                  messageBody: "Critical readiness responses pending. Please intervene.",
                  expectedResponseType: "approve_hold",
                  relatedWorkflowImpact: "Escalation created in readiness workflow.",
                })
              }
            >
              Escalate
            </button>
          </div>
          <div className="bof-driver-vault-actions">
            {quickTemplates.map((t) => (
              <button
                key={t.subject}
                type="button"
                className="bof-intake-engine-btn"
                onClick={() => {
                  setRecipientType(t.recipient);
                  setMessageType(t.type);
                  setExpectedResponseType(t.expected);
                  setSubject(t.subject);
                  setMessageBody(t.body);
                  setImpact(t.impact);
                }}
              >
                {t.subject}
              </button>
            ))}
          </div>
        </article>

        <article className="bof-driver-vault-panel">
          <h3 className="bof-h3">3) Response history + workflow impact</h3>
          {messages.length === 0 ? (
            <p className="bof-muted">No readiness messages sent yet for this load.</p>
          ) : (
            <ul className="bof-driver-vault-upload-list">
              {messages.map((m) => (
                <li key={m.messageId}>
                  <div>
                    <strong>{m.subject}</strong>
                    <div className="bof-muted bof-small">
                      {m.recipientType} · {m.channelType} · status {m.status}
                    </div>
                    <div className="bof-small">{m.messageBody}</div>
                    <div className="bof-muted bof-small">Impact: {m.relatedWorkflowImpact}</div>
                    {m.responseValue ? (
                      <div className="bof-small">
                        Response: <strong>{m.responseValue}</strong> ·{" "}
                        {m.responseReceivedAt ? new Date(m.responseReceivedAt).toLocaleString() : "—"}
                      </div>
                    ) : null}
                  </div>
                  <div className="bof-driver-vault-actions">
                    {m.status === "pending" ? (
                      <button type="button" className="bof-intake-engine-btn" onClick={() => markDelivered(loadId, m.messageId)}>
                        Mark delivered
                      </button>
                    ) : null}
                    {m.status !== "responded" && m.expectedResponseType !== "none" ? (
                      <>
                        <input
                          value={responseDrafts[m.messageId] ?? ""}
                          placeholder={m.expectedResponseType}
                          onChange={(e) =>
                            setResponseDrafts((s) => ({ ...s, [m.messageId]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          className="bof-intake-engine-btn bof-intake-engine-btn--primary"
                          onClick={() =>
                            recordResponse(loadId, m.messageId, (responseDrafts[m.messageId] ?? "").trim() || "ACK")
                          }
                        >
                          Mark response received
                        </button>
                      </>
                    ) : null}
                    {m.status !== "expired" ? (
                      <button type="button" className="bof-intake-engine-btn" onClick={() => markExpired(loadId, m.messageId)}>
                        Expire
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="bof-driver-vault-actions">
        <button
          type="button"
          className="bof-intake-engine-btn"
          onClick={() => {
            const html = buildReadinessSummaryArtifactHtml(summary, new Date().toISOString());
            saveFinalReadinessArtifact(loadId, `${loadId}_pretrip_readiness_summary.html`, html);
          }}
        >
          Generate Readiness Summary
        </button>
        <button
          type="button"
          className="bof-intake-engine-btn bof-intake-engine-btn--primary"
          onClick={() => {
            const existing = getFinalReadinessArtifact(loadId);
            if (!existing) {
              const html = buildReadinessSummaryArtifactHtml(summary, new Date().toISOString());
              saveFinalReadinessArtifact(loadId, `${loadId}_pretrip_readiness_summary.html`, html);
            }
            window.open(`/loads/${loadId}/readiness-summary`, "_blank", "noopener,noreferrer");
          }}
        >
          Open Final Readiness Summary
        </button>
        <Link className="bof-intake-engine-btn" href={`/pretrip/${loadId}`}>
          Open Pre-Trip Tablet
        </Link>
        <Link className="bof-intake-engine-btn" href={`/trip-release/${loadId}`}>
          Open Trip Release
        </Link>
      </div>
      {artifact ? (
        <p className="bof-muted bof-small">
          Stored artifact: <code className="bof-code">{artifact.artifactFileName}</code> ·{" "}
          {new Date(artifact.artifactGeneratedAt).toLocaleString()}
        </p>
      ) : null}
    </section>
  );
}
