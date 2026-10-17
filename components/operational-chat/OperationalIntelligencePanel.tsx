"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { OperationalIntelligenceAnswer } from "@/lib/operational-intelligence/types";

type Props = {
  fleetId: string;
  recordType?: string;
  recordId?: string;
};

const STARTERS = [
  "Which settlement holds are open?",
  "Which drivers are not dispatch-ready?",
  "Which loads are at risk?",
  "What documents are missing?",
  "What exceptions remain unresolved?",
] as const;

export function OperationalIntelligencePanel({ fleetId, recordType, recordId }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<OperationalIntelligenceAnswer | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!fleetId.trim() || !question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/operational-intelligence/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fleetId,
          question,
          context: recordType && recordId ? { recordType, recordId, loadId: recordType === "LOAD" ? recordId : undefined } : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to answer question");
      setAnswer(payload as OperationalIntelligenceAnswer);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to answer question");
      setAnswer(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="bof-chat-intelligence" aria-label="Operational intelligence">
      <div className="bof-chat-intelligence__head">
        <p className="bof-home-eyebrow">Operational intelligence</p>
        <h2>Ask authorized LIVE records</h2>
        <p className="bof-chat-intelligence__lead">
          Grounded answers from Prisma fleet data—not demo JSON. When data is missing, BOF states the gap instead of inventing facts.
        </p>
      </div>
      <div className="bof-chat-intelligence__starters">
        {STARTERS.map((starter) => (
          <button key={starter} type="button" onClick={() => setQuestion(starter)}>
            {starter}
          </button>
        ))}
      </div>
      <form className="bof-chat-intelligence__form" onSubmit={submit}>
        <label>
          Question
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: Why is settlement on hold for load L001?"
            rows={3}
          />
        </label>
        <button type="submit" disabled={loading || !fleetId.trim()}>
          {loading ? "Searching records…" : "Ask BOF"}
        </button>
      </form>
      {error ? <p className="bof-chat-error" role="alert">{error}</p> : null}
      {answer ? (
        <div className="bof-chat-intelligence__answer">
          <p className="bof-chat-intelligence__meta">
            Intent: {answer.intent} · Authority: {answer.dataAuthority}
          </p>
          <pre className="bof-chat-intelligence__body">{answer.answer}</pre>
          {answer.citations.length > 0 ? (
            <ul className="bof-chat-intelligence__citations">
              {answer.citations.map((item) => (
                <li key={`${item.recordType}-${item.recordId}`}>
                  <Link href={item.route}>{item.title}</Link>
                </li>
              ))}
            </ul>
          ) : null}
          {answer.recommendations.length > 0 ? (
            <div className="bof-chat-intelligence__recs">
              {answer.recommendations.map((rec) => (
                <Link key={rec.href} href={rec.href}>
                  {rec.label}
                </Link>
              ))}
            </div>
          ) : null}
          {answer.limitations.length > 0 ? (
            <ul className="bof-chat-intelligence__limits">
              {answer.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
